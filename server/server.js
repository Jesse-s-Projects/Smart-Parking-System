import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import Stripe from "stripe";
import crypto from "node:crypto";

dotenv.config();
const { Pool } = pg;
const app = express();
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432),
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
});
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const PORT = Number(process.env.PORT || 5000);
const HOLD_MINUTES = Number(process.env.RESERVATION_HOLD_MINUTES || 15);
const HOURLY_RATE_CENTS = Number(process.env.HOURLY_RATE_CENTS || 250);

app.use(cors({ origin: (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174").split(",") }));
// Stripe webhook needs the raw body, so register it before express.json().
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).send("Payments are not configured");
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const payment = await client.query(
          `UPDATE payments SET status = 'paid', stripe_payment_intent_id = $1, paid_at = NOW()
           WHERE stripe_checkout_session_id = $2 RETURNING reservation_id`,
          [session.payment_intent || null, session.id]
        );
        if (payment.rowCount) {
          await client.query(
            `UPDATE reservations SET payment_status = 'paid', updated_at = NOW()
             WHERE id = $1 AND status = 'reserved'`,
            [payment.rows[0].reservation_id]
          );
          await logEvent(client, "payment_completed", payment.rows[0].reservation_id, null, {
            stripe_session_id: session.id, amount_total: session.amount_total, currency: session.currency
          });
        }
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally { client.release(); }
    } else if (event.type === "checkout.session.expired") {
      await pool.query(
        `UPDATE payments SET status = 'expired' WHERE stripe_checkout_session_id = $1`,
        [event.data.object.id]
      );
    }
    res.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook processing failed:", err);
    res.status(500).send("Webhook processing failed");
  }
});
app.use(express.json());

async function logEvent(db, eventType, reservationId = null, spotId = null, details = {}) {
  await db.query(
    `INSERT INTO parking_events (event_type, reservation_id, spot_id, details)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [eventType, reservationId, spotId == null ? null : String(spotId), JSON.stringify(details)]
  );
}
function normalizePhone(value) {
  return String(value || "").replace(/[^\d+]/g, "").trim();
}
function validPhone(value) {
  return /^\+?[1-9]\d{7,14}$/.test(value);
}
function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

app.get("/", (_req, res) => res.json({ message: "ParkSmart API is running" }));
app.get("/api/health", asyncRoute(async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok", database: "connected", payments: Boolean(stripe) });
}));

app.get("/api/parking-spots", asyncRoute(async (_req, res) => {
  const result = await pool.query("SELECT * FROM parking_spots ORDER BY id");
  res.json(result.rows);
}));

// Reserve a spot and create a customer/reservation record atomically.
app.post("/api/reservations", asyncRoute(async (req, res) => {
  const spotId = String(req.body.spotId || "").trim();
  const phone = normalizePhone(req.body.phone);
  const email = String(req.body.email || "").trim() || null;
  const name = String(req.body.name || "").trim() || null;
  if (!spotId || !validPhone(phone)) return res.status(400).json({ error: "A spot and valid phone number are required (include country code)." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const spot = await client.query(
      `UPDATE parking_spots SET status = 'reserved' WHERE id::text = $1 AND status = 'available' RETURNING *`,
      [spotId]
    );
    if (!spot.rowCount) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "That parking spot is no longer available." });
    }
    const customer = await client.query(
      `INSERT INTO customers (phone, name, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (phone) DO UPDATE SET
         name = COALESCE(EXCLUDED.name, customers.name),
         email = COALESCE(EXCLUDED.email, customers.email),
         updated_at = NOW()
       RETURNING id, phone, name, email`,
      [phone, name, email]
    );
    const reservation = await client.query(
      `INSERT INTO reservations (spot_id, customer_id, phone, status, payment_status, expires_at)
       VALUES ($1, $2, $3, 'reserved', 'unpaid', NOW() + ($4 || ' minutes')::interval)
       RETURNING *`,
      [spotId, customer.rows[0].id, phone, HOLD_MINUTES]
    );
    await logEvent(client, "reservation_created", reservation.rows[0].id, spotId, { phone, expires_at: reservation.rows[0].expires_at });
    await client.query("COMMIT");
    res.status(201).json({ spot: spot.rows[0], customer: customer.rows[0], reservation: reservation.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally { client.release(); }
}));

// Look up active reservations by phone for the garage kiosk.
app.get("/api/kiosk/reservations", asyncRoute(async (req, res) => {
  const phone = normalizePhone(req.query.phone);
  if (!validPhone(phone)) return res.status(400).json({ error: "Enter a valid phone number including country code." });
  const result = await pool.query(
    `SELECT r.id, r.spot_id, r.status, r.payment_status, r.created_at, r.expires_at,
            c.name, c.phone, p.type AS spot_type
     FROM reservations r
     JOIN customers c ON c.id = r.customer_id
     JOIN parking_spots p ON p.id::text = r.spot_id
     WHERE r.phone = $1 AND r.status = 'reserved' AND r.expires_at > NOW()
     ORDER BY r.created_at DESC`,
    [phone]
  );
  res.json(result.rows);
}));

app.post("/api/kiosk/check-in", asyncRoute(async (req, res) => {
  const reservationId = String(req.body.reservationId || "");
  const phone = normalizePhone(req.body.phone);
  if (!reservationId || !validPhone(phone)) return res.status(400).json({ error: "Reservation and valid phone number are required." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT r.*, p.status AS spot_status FROM reservations r
       JOIN parking_spots p ON p.id::text = r.spot_id
       WHERE r.id = $1 AND r.phone = $2 FOR UPDATE OF r`,
      [reservationId, phone]
    );
    if (!result.rowCount || result.rows[0].status !== "reserved" || new Date(result.rows[0].expires_at) <= new Date()) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Reservation not found, expired, or already checked in." });
    }
    const reservation = result.rows[0];
    if (reservation.payment_status !== "paid" && process.env.REQUIRE_PAYMENT_BEFORE_CHECKIN === "true") {
      await client.query("ROLLBACK");
      return res.status(402).json({ error: "Payment is required before check-in." });
    }
    const spot = await client.query(
      `UPDATE parking_spots SET status = 'occupied' WHERE id::text = $1 AND status = 'reserved' RETURNING *`,
      [reservation.spot_id]
    );
    if (!spot.rowCount) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "This parking spot cannot be checked in right now." });
    }
    const updated = await client.query(
      `UPDATE reservations SET status = 'checked_in', checked_in_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [reservationId]
    );
    await logEvent(client, "customer_checked_in", reservationId, reservation.spot_id, { phone });
    await client.query("COMMIT");
    res.json({ reservation: updated.rows[0], spot: spot.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally { client.release(); }
}));

// Record that a vehicle has left; this makes the space available again.
app.post("/api/parking-spots/:id/clear", asyncRoute(async (req, res) => {
  const spotId = String(req.params.id);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const active = await client.query(
      `SELECT id FROM reservations WHERE spot_id = $1 AND status = 'checked_in' ORDER BY checked_in_at DESC LIMIT 1 FOR UPDATE`,
      [spotId]
    );
    const spot = await client.query(
      `UPDATE parking_spots SET status = 'available' WHERE id::text = $1 AND status = 'occupied' RETURNING *`,
      [spotId]
    );
    if (!spot.rowCount) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Spot is not currently occupied." });
    }
    if (active.rowCount) {
      await client.query(
        `UPDATE reservations SET status = 'completed', cleared_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [active.rows[0].id]
      );
      await logEvent(client, "parking_spot_cleared", active.rows[0].id, spotId, {});
    } else {
      await logEvent(client, "parking_spot_cleared", null, spotId, {});
    }
    await client.query("COMMIT");
    res.json(spot.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally { client.release(); }
}));

// Create Stripe Checkout session. The server, not the browser, sets the amount.
app.post("/api/reservations/:id/checkout", asyncRoute(async (req, res) => {
  if (!stripe) return res.status(503).json({ error: "Stripe is not configured on the server." });
  const reservationId = req.params.id;
  const result = await pool.query(
    `SELECT r.id, r.spot_id, r.status, r.payment_status, r.expires_at, c.phone
     FROM reservations r JOIN customers c ON c.id = r.customer_id WHERE r.id = $1`,
    [reservationId]
  );
  if (!result.rowCount || result.rows[0].status !== "reserved" || result.rows[0].payment_status === "paid") {
    return res.status(409).json({ error: "Reservation is unavailable for payment." });
  }
  if (new Date(result.rows[0].expires_at) <= new Date()) return res.status(409).json({ error: "Reservation has expired." });
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    phone_number_collection: { enabled: true },
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: `ParkSmart reservation - spot ${result.rows[0].spot_id}` },
        unit_amount: HOURLY_RATE_CENTS,
      },
      quantity: 1,
    }],
    metadata: { reservation_id: reservationId },
    success_url: `${process.env.WEBSITE_URL || "http://localhost:5173"}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.WEBSITE_URL || "http://localhost:5173"}?payment=cancelled`,
  });
  await pool.query(
    `INSERT INTO payments (reservation_id, amount_cents, currency, status, stripe_checkout_session_id)
     VALUES ($1, $2, 'usd', 'pending', $3)
     ON CONFLICT (stripe_checkout_session_id) DO NOTHING`,
    [reservationId, HOURLY_RATE_CENTS, session.id]
  );
  await pool.query(`UPDATE reservations SET payment_status = 'pending', updated_at = NOW() WHERE id = $1`, [reservationId]);
  await pool.query(
    `INSERT INTO parking_events (event_type, reservation_id, spot_id, details)
     VALUES ('payment_started', $1, $2, $3::jsonb)`,
    [reservationId, result.rows[0].spot_id, JSON.stringify({ checkout_session_id: session.id })]
  );
  res.json({ checkoutUrl: session.url });
}));

app.get("/api/history", asyncRoute(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
  const result = await pool.query(
    `SELECT e.id, e.event_type, e.reservation_id, e.spot_id, e.details, e.created_at,
            c.phone
     FROM parking_events e
     LEFT JOIN reservations r ON r.id = e.reservation_id
     LEFT JOIN customers c ON c.id = r.customer_id
     ORDER BY e.created_at DESC LIMIT $1`,
    [limit]
  );
  res.json(result.rows);
}));

app.get("/api/reservations", asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `SELECT r.*, c.phone, c.name FROM reservations r
     JOIN customers c ON c.id = r.customer_id ORDER BY r.created_at DESC LIMIT 250`
  );
  res.json(result.rows);
}));

// Expire no-shows, release their spots, and record the event. Also callable manually.
async function expireNoShows() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const expired = await client.query(
      `SELECT id, spot_id FROM reservations
       WHERE status = 'reserved' AND expires_at <= NOW() FOR UPDATE`
    );
    for (const row of expired.rows) {
      await client.query(`UPDATE reservations SET status = 'expired', updated_at = NOW() WHERE id = $1`, [row.id]);
      await client.query(
        `UPDATE parking_spots SET status = 'available' WHERE id::text = $1 AND status = 'reserved'`,
        [row.spot_id]
      );
      await logEvent(client, "reservation_expired_no_show", row.id, row.spot_id, {});
    }
    await client.query("COMMIT");
    return expired.rowCount;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("No-show expiration failed:", err);
    return 0;
  } finally { client.release(); }
}
app.post("/api/admin/expire-no-shows", asyncRoute(async (_req, res) => {
  // Protect this route with a secret when exposed beyond a trusted local network.
  if (process.env.ADMIN_API_KEY && reqHeaderKey(_req) !== process.env.ADMIN_API_KEY) return res.status(401).json({ error: "Unauthorized" });
  res.json({ expired: await expireNoShows() });
}));
function reqHeaderKey(req) { return req.headers["x-admin-key"]; }
setInterval(expireNoShows, 60_000).unref();

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "An unexpected server error occurred." });
});
app.listen(PORT, () => console.log(`ParkSmart API running on port ${PORT}`));

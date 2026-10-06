import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "ParkSmart API is running",
  });
});

// Get all parking spots
app.get("/api/parking-spots", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM parking_spots ORDER BY id"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      error: "Failed to fetch parking spots",
    });
  }
});

// Reserve a parking spot
app.put("/api/parking-spots/:id/reserve", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      UPDATE parking_spots
      SET status = 'reserved'
      WHERE id = $1
        AND status = 'available'
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: "Parking spot is not available",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      error: "Failed to reserve parking spot",
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`ParkSmart API running on http://localhost:${PORT}`);
});

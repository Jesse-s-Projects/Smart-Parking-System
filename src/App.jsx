// Replace your existing App.jsx with this version to add phone-based reservations,
// live status refresh, database-backed activity history, and Stripe Checkout.
import { useEffect, useState } from "react";
import "./App.css";
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [spots, setSpots] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [reservation, setReservation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadData() {
    try {
      const [spotsResponse, historyResponse] = await Promise.all([
        fetch(`${API}/api/parking-spots`), fetch(`${API}/api/history?limit=12`)
      ]);
      if (!spotsResponse.ok || !historyResponse.ok) throw new Error("API request failed");
      const [spotData, historyData] = await Promise.all([spotsResponse.json(), historyResponse.json()]);
      setSpots(spotData); setHistory(historyData);
      setSelectedSpot(current => current ? spotData.find(s => String(s.id) === String(current.id)) || current : null);
    } catch (error) { console.error("Unable to load ParkSmart data:", error); }
  }
  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, []);

  const available = spots.filter(s => s.status === "available").length;
  const occupied = spots.filter(s => s.status === "occupied").length;
  const reserved = spots.filter(s => s.status === "reserved").length;
  const filteredSpots = spots.filter(s => String(s.id).toLowerCase().includes(search.toLowerCase()));

  async function reserveSpot() {
    if (!selectedSpot) return;
    if (!/^\+?[1-9]\d{7,14}$/.test(phone.replace(/[^\d+]/g, ""))) {
      setNotice("Enter a valid phone number including country code, e.g. +15551234567."); return;
    }
    setBusy(true); setNotice("");
    try {
      const response = await fetch(`${API}/api/reservations`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId: selectedSpot.id, phone, name: customerName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Reservation failed");
      setReservation(data.reservation); setSelectedSpot(data.spot);
      setNotice(`Spot ${data.spot.id} reserved. Complete payment to secure your booking.`);
      await loadData();
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }
  async function payForReservation() {
    if (!reservation) return;
    setBusy(true);
    try {
      const response = await fetch(`${API}/api/reservations/${reservation.id}/checkout`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not start checkout");
      window.location.assign(data.checkoutUrl);
    } catch (error) { setNotice(error.message); setBusy(false); }
  }
  const eventLabel = e => ({
    reservation_created: "Reservation created",
    payment_started: "Payment checkout started",
    payment_completed: "Payment completed",
    customer_checked_in: "Customer checked in",
    parking_spot_cleared: "Parking spot cleared",
    reservation_expired_no_show: "Reservation expired (no-show)"
  }[e] || e.replaceAll("_", " "));
  return <div className="app">
    <aside className="sidebar">
      <div className="logo"><div className="logo-icon">P</div><div><h2>ParkSmart</h2><span>Smart Parking</span></div></div>
      <nav>{["Dashboard","Parking Map","Reservations","History"].map((page,i)=><button key={page} className={activePage===page?"nav-item active":"nav-item"} onClick={()=>setActivePage(page)}><span>{["⌂","▦","◷","↺"][i]}</span>{page}</button>)}</nav>
      <div className="sidebar-bottom"><div className="user-card"><div className="avatar">PS</div><div><strong>ParkSmart Admin</strong><small>Facility manager</small></div></div></div>
    </aside>
    <main className="main">
      <header className="header"><div><div className="breadcrumb">Home / {activePage}</div><h1>{activePage}</h1></div><div className="header-actions"><div className="search"><span>⌕</span><input placeholder="Search parking spot..." value={search} onChange={e=>setSearch(e.target.value)}/></div><button className="notification" onClick={loadData}>↻</button></div></header>
      <section className="content">
        <div className="welcome"><div><h2>Parking facility overview</h2><p>Live parking and reservation activity.</p></div><div className="live"><span className="live-dot"></span>Auto-refreshing</div></div>
        <div className="stats">
          {[["Total Spaces",spots.length,"blue","P"],["Available",available,"green","✓"],["Occupied",occupied,"red","●"],["Reserved",reserved,"yellow","◷"]].map(([label,value,color,icon])=><div className="stat-card" key={label}><div className={`stat-icon ${color}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>)}
        </div>
        {notice && <div className="notice">{notice}</div>}
        {activePage !== "History" ? <div className="dashboard-grid">
          <section className="panel parking-panel"><div className="panel-header"><div><h3>Parking Facility</h3><p>Select an available parking space</p></div><button className="refresh" onClick={loadData}>Refresh</button></div>
            <div className="legend"><div><span className="legend-dot available-dot"/>Available</div><div><span className="legend-dot occupied-dot"/>Occupied</div><div><span className="legend-dot reserved-dot"/>Reserved</div></div>
            <div className="parking-map"><div className="entrance">↓ ENTRANCE</div><div className="parking-grid">{filteredSpots.map(spot=><button key={spot.id} className={`parking-spot ${spot.status} ${selectedSpot?.id===spot.id?"selected":""}`} onClick={()=>{setSelectedSpot(spot);setReservation(null);setNotice("");}}><strong>{spot.id}</strong><span>{spot.type==="EV Charging"?"⚡":spot.type==="Accessible"?"♿":"P"}</span></button>)}</div><div className="road">DRIVEWAY</div></div>
          </section>
          <section className="panel details-panel">{selectedSpot ? <><div className="details-top"><div><span className="small-label">SELECTED SPACE</span><h2>{selectedSpot.id}</h2></div><div className={`status-badge ${selectedSpot.status}`}>{selectedSpot.status}</div></div><div className="spot-preview"><div className="big-parking-icon">P</div><strong>{selectedSpot.type}</strong><span>Parking facility</span></div><div className="details-list"><div><span>Hourly rate</span><strong>$2.50 / hr</strong></div><div><span>Spot status</span><strong>{selectedSpot.status}</strong></div></div>
            {selectedSpot.status==="available" && !reservation && <div className="booking-fields"><label>Phone number (include country code)</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+15551234567"/><label>Name (optional)</label><input value={customerName} onChange={e=>setCustomerName(e.target.value)} placeholder="Customer name"/><button className="reserve-button" disabled={busy} onClick={reserveSpot}>{busy?"Processing…":"Reserve Space"}</button></div>}
            {reservation && <><p className="payment-note">Reservation created. Complete payment through secure Stripe Checkout.</p><button className="reserve-button" disabled={busy} onClick={payForReservation}>Continue to payment</button></>}
            {selectedSpot.status!=="available" && <button className="reserve-button disabled" disabled>{selectedSpot.status==="occupied"?"Currently Occupied":"Already Reserved"}</button>}
          </> : <div className="empty-selection"><div className="empty-icon">P</div><h3>Select a parking space</h3><p>Click a space on the map to view its details and reserve it.</p></div>}</section>
        </div> : <section className="panel activity-panel"><h3>Event history</h3><p>Recorded events from the ParkSmart database.</p><EventList history={history}/></section>}
        {activePage !== "History" && <section className="panel activity-panel"><div className="panel-header"><div><h3>Recent Activity</h3><p>Latest recorded facility events</p></div><button className="view-all" onClick={()=>setActivePage("History")}>View all</button></div><EventList history={history.slice(0,6)}/></section>}
      </section>
    </main>
  </div>;
}
function EventList({history}) {
  if (!history.length) return <p className="empty-events">No events recorded yet.</p>;
  const label = e => ({reservation_created:"Reservation created",payment_started:"Payment started",payment_completed:"Payment completed",customer_checked_in:"Customer checked in",parking_spot_cleared:"Parking spot cleared",reservation_expired_no_show:"Reservation expired (no-show)"}[e] || e.replaceAll("_"," "));
  return <div className="activity-list">{history.map(e=><div className="activity" key={e.id}><div className="activity-icon blue">•</div><div><strong>{label(e.event_type)}{e.spot_id?` · ${e.spot_id}`:""}</strong><span>{new Date(e.created_at).toLocaleString()} {e.phone?` · ${e.phone}`:""}</span></div></div>)}</div>;
}
export default App;

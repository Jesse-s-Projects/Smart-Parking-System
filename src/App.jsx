import { useState } from "react";
import "./App.css";

const initialSpots = [
  { id: "A01", status: "available", type: "Regular" },
  { id: "A02", status: "occupied", type: "Regular" },
  { id: "A03", status: "available", type: "EV Charging" },
  { id: "A04", status: "reserved", type: "Regular" },

  { id: "B01", status: "available", type: "Accessible" },
  { id: "B02", status: "occupied", type: "Regular" },
  { id: "B03", status: "available", type: "Regular" },
  { id: "B04", status: "available", type: "EV Charging" },

  { id: "C01", status: "occupied", type: "Regular" },
  { id: "C02", status: "available", type: "Regular" },
  { id: "C03", status: "reserved", type: "Regular" },
  { id: "C04", status: "available", type: "Accessible" },

  { id: "D01", status: "available", type: "Regular" },
  { id: "D02", status: "occupied", type: "Regular" },
  { id: "D03", status: "available", type: "Regular" },
  { id: "D04", status: "available", type: "EV Charging" },
];

function App() {
  const [spots, setSpots] = useState(initialSpots);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");

  const available = spots.filter(
    (spot) => spot.status === "available"
  ).length;

  const occupied = spots.filter(
    (spot) => spot.status === "occupied"
  ).length;

  const reserved = spots.filter(
    (spot) => spot.status === "reserved"
  ).length;

  const filteredSpots = spots.filter((spot) =>
    spot.id.toLowerCase().includes(search.toLowerCase())
  );

  const reserveSpot = () => {
    if (!selectedSpot) return;

    setSpots((current) =>
      current.map((spot) =>
        spot.id === selectedSpot.id
          ? { ...spot, status: "reserved" }
          : spot
      )
    );

    setSelectedSpot({
      ...selectedSpot,
      status: "reserved",
    });
  };

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="logo">
          <div className="logo-icon">P</div>
          <div>
            <h2>ParkSmart</h2>
            <span>Smart Parking</span>
          </div>
        </div>

        <nav>
          <button
            className={activePage === "Dashboard" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("Dashboard")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={activePage === "Parking Map" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("Parking Map")}
          >
            <span>▦</span>
            Parking Map
          </button>

          <button
            className={activePage === "Reservations" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("Reservations")}
          >
            <span>◷</span>
            Reservations
          </button>

          <button
            className={activePage === "History" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("History")}
          >
            <span>↺</span>
            History
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item">
            <span>⚙</span>
            Settings
          </button>

          <div className="user-card">
            <div className="avatar">JD</div>
            <div>
              <strong>John Doe</strong>
              <small>Driver</small>
            </div>
          </div>
        </div>

      </aside>

      {/* MAIN */}
      <main className="main">

        {/* HEADER */}
        <header className="header">

          <div>
            <div className="breadcrumb">
              Home / {activePage}
            </div>
            <h1>{activePage}</h1>
          </div>

          <div className="header-actions">

            <div className="search">
              <span>⌕</span>
              <input
                placeholder="Search parking spot..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="notification">
              ♢
              <span></span>
            </button>

          </div>

        </header>

        {/* DASHBOARD */}
        <section className="content">

          <div className="welcome">
            <div>
              <h2>Good evening, John 👋</h2>
              <p>
                Here's the current status of the parking facility.
              </p>
            </div>

            <div className="live">
              <span className="live-dot"></span>
              Live updates
            </div>
          </div>

          {/* STAT CARDS */}
          <div className="stats">

            <div className="stat-card">
              <div className="stat-icon blue">P</div>
              <div>
                <span>Total Spaces</span>
                <strong>{spots.length}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">✓</div>
              <div>
                <span>Available</span>
                <strong>{available}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon red">●</div>
              <div>
                <span>Occupied</span>
                <strong>{occupied}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon yellow">◷</div>
              <div>
                <span>Reserved</span>
                <strong>{reserved}</strong>
              </div>
            </div>

          </div>

          {/* PARKING MAP */}
          <div className="dashboard-grid">

            <section className="panel parking-panel">

              <div className="panel-header">
                <div>
                  <h3>Parking Facility</h3>
                  <p>Select an available parking space</p>
                </div>

                <select>
                  <option>Floor 1</option>
                  <option>Floor 2</option>
                  <option>Floor 3</option>
                </select>
              </div>

              <div className="legend">
                <div>
                  <span className="legend-dot available-dot"></span>
                  Available
                </div>

                <div>
                  <span className="legend-dot occupied-dot"></span>
                  Occupied
                </div>

                <div>
                  <span className="legend-dot reserved-dot"></span>
                  Reserved
                </div>
              </div>

              <div className="parking-map">

                <div className="entrance">
                  ↓ ENTRANCE
                </div>

                <div className="parking-grid">

                  {filteredSpots.map((spot) => (

                    <button
                      key={spot.id}
                      className={`parking-spot ${spot.status} ${
                        selectedSpot?.id === spot.id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => setSelectedSpot(spot)}
                    >

                      <strong>{spot.id}</strong>

                      <span>
                        {spot.type === "EV Charging"
                          ? "⚡"
                          : spot.type === "Accessible"
                          ? "♿"
                          : "P"}
                      </span>

                    </button>

                  ))}

                </div>

                <div className="road">
                  DRIVEWAY
                </div>

              </div>

            </section>

            {/* SELECTED SPOT */}
            <section className="panel details-panel">

              {selectedSpot ? (

                <>
                  <div className="details-top">

                    <div>
                      <span className="small-label">
                        SELECTED SPACE
                      </span>

                      <h2>{selectedSpot.id}</h2>
                    </div>

                    <div
                      className={`status-badge ${selectedSpot.status}`}
                    >
                      {selectedSpot.status}
                    </div>

                  </div>

                  <div className="spot-preview">
                    <div className="big-parking-icon">
                      P
                    </div>
                    <strong>{selectedSpot.type}</strong>
                    <span>Floor 1</span>
                  </div>

                  <div className="details-list">

                    <div>
                      <span>Hourly rate</span>
                      <strong>$2.50 / hr</strong>
                    </div>

                    <div>
                      <span>Distance to entrance</span>
                      <strong>42 m</strong>
                    </div>

                    <div>
                      <span>Security</span>
                      <strong>24/7 monitored</strong>
                    </div>

                  </div>

                  {selectedSpot.status === "available" ? (

                    <button
                      className="reserve-button"
                      onClick={reserveSpot}
                    >
                      Reserve Space
                    </button>

                  ) : (

                    <button
                      className="reserve-button disabled"
                      disabled
                    >
                      {selectedSpot.status === "occupied"
                        ? "Currently Occupied"
                        : "Already Reserved"}
                    </button>

                  )}

                </>

              ) : (

                <div className="empty-selection">
                  <div className="empty-icon">P</div>
                  <h3>Select a parking space</h3>
                  <p>
                    Click a space on the map to view
                    its details and reserve it.
                  </p>
                </div>

              )}

            </section>

          </div>

          {/* ACTIVITY */}
          <section className="panel activity-panel">

            <div className="panel-header">
              <div>
                <h3>Recent Activity</h3>
                <p>Latest parking facility events</p>
              </div>

              <button className="view-all">
                View all
              </button>
            </div>

            <div className="activity-list">

              <div className="activity">
                <div className="activity-icon green">
                  ✓
                </div>

                <div>
                  <strong>Space A03 became available</strong>
                  <span>2 minutes ago</span>
                </div>
              </div>

              <div className="activity">
                <div className="activity-icon red">
                  P
                </div>

                <div>
                  <strong>Vehicle parked at B02</strong>
                  <span>7 minutes ago</span>
                </div>
              </div>

              <div className="activity">
                <div className="activity-icon yellow">
                  ◷
                </div>

                <div>
                  <strong>Space C03 reserved</strong>
                  <span>14 minutes ago</span>
                </div>
              </div>

            </div>

          </section>

        </section>

      </main>

    </div>
  );
}

export default App;

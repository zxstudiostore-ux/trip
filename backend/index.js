const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const colors = require("colors");
const bodyParser = require("body-parser");

const { app, server } = require("./socket/socket");

const authRoutes = require('./routes/authRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes');
const chatRoutes = require('./routes/chatRoutes');

dotenv.config();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());

// Dynamically allow any origin that requests it (fixes trailing slash/mismatch issues)
const allowedOrigins = function (origin, callback) {
  callback(null, origin || true);
};

app.use(
  cors({
    credentials: true,
    origin: allowedOrigins,
    methods: ["POST", "PUT", "GET", "DELETE"],
  }),
);

mongoose
  .connect(process.env.MONGODB_URI_KEY, {
    dbName: "TripTogether",
  })
  .then(() => {
    console.log("Database connected".yellow.bold);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const PORT = process.env.PORT || 5000;

const startTime = Date.now();

app.get("/api/health", (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const dbState = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.status(200).json({
    status: "OK",
    message: "Backend is running",
    uptime: uptimeSeconds,
    database: dbState,
    environment: process.env.NODE_ENV || "development",
  });
});

// Root status page
app.get("/", (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;
  const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  const dbState = mongoose.connection.readyState === 1;
  const env = process.env.NODE_ENV || "development";

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TripTogether API — Status</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .blob {
      position: fixed;
      border-radius: 50%;
      filter: blur(120px);
      pointer-events: none;
      z-index: 0;
    }
    .blob-1 { width: 500px; height: 500px; background: rgba(244,63,94,.15); top: -100px; left: -100px; }
    .blob-2 { width: 600px; height: 600px; background: rgba(59,130,246,.10); bottom: -100px; right: -100px; }
    .card {
      position: relative;
      z-index: 1;
      background: rgba(255,255,255,.05);
      backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,.10);
      border-radius: 24px;
      padding: 48px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 25px 50px rgba(0,0,0,.4);
    }
    .logo { font-size: 28px; font-weight: 800; margin-bottom: 6px; }
    .logo span { color: #f43f5e; }
    .tagline { font-size: 13px; color: #64748b; margin-bottom: 36px; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16,185,129,.15);
      border: 1px solid rgba(16,185,129,.3);
      border-radius: 999px;
      padding: 6px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #10b981;
      margin-bottom: 32px;
    }
    .dot {
      width: 8px; height: 8px;
      background: #10b981;
      border-radius: 50%;
      animation: pulse 1.8s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: .5; transform: scale(.7); }
    }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
    .stat {
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 14px;
      padding: 16px 18px;
    }
    .stat-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
    .stat-value { font-size: 15px; font-weight: 700; color: #f1f5f9; }
    .stat-value.green { color: #10b981; }
    .stat-value.yellow { color: #f59e0b; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,.08); margin: 24px 0; }
    .endpoints { font-size: 12px; color: #475569; line-height: 1.9; }
    .endpoints code {
      background: rgba(255,255,255,.06);
      border-radius: 4px;
      padding: 1px 6px;
      color: #f43f5e;
      font-family: monospace;
    }
    .footer { margin-top: 28px; font-size: 11px; color: #334155; text-align: center; }
  </style>
</head>
<body>
  <div class="blob blob-1"></div>
  <div class="blob blob-2"></div>
  <div class="card">
    <div class="logo">✈️ Trip<span>Together</span></div>
    <div class="tagline">REST API &amp; WebSocket Server</div>

    <div class="status-badge">
      <div class="dot"></div>
      All systems operational
    </div>

    <div class="stats">
      <div class="stat">
        <div class="stat-label">Server Status</div>
        <div class="stat-value green">● Online</div>
      </div>
      <div class="stat">
        <div class="stat-label">Database</div>
        <div class="stat-value ${dbState ? 'green' : 'yellow'}">${dbState ? '● Connected' : '○ Disconnected'}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Uptime</div>
        <div class="stat-value">${uptimeStr}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Environment</div>
        <div class="stat-value">${env.charAt(0).toUpperCase() + env.slice(1)}</div>
      </div>
    </div>

    <hr class="divider" />

    <div class="endpoints">
      <div><code>GET</code> /api/health — JSON health check</div>
      <div><code>POST</code> /api/auth/login — Login</div>
      <div><code>POST</code> /api/auth/signup — Register</div>
      <div><code>GET</code> /api/user-profile — Profile endpoints</div>
      <div><code>WS</code> Socket.IO — Real-time events</div>
    </div>

    <div class="footer">TripTogether Backend · Node.js + Express · Socket.IO</div>
  </div>
  <script>
    // Auto-refresh uptime every second
    let s = ${uptimeSeconds};
    const val = document.querySelectorAll('.stat-value')[2];
    setInterval(() => {
      s++;
      const d = Math.floor(s/86400), h = Math.floor((s%86400)/3600);
      const m = Math.floor((s%3600)/60), sec = s%60;
      val.textContent = d+'d '+h+'h '+m+'m '+sec+'s';
    }, 1000);
  </script>
</body>
</html>`);
});

app.use('/api/auth', authRoutes);
app.use('/api/user-profile', userProfileRoutes);
app.use('/api/chat', chatRoutes);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`.blue);
});

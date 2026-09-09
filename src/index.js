require("dotenv").config();

const express = require("express");
const db = require("./db");
const { startPolling } = require("./poller");

const app = express();
const PORT = Number(process.env.PORT || 3001);
const CHECK_INTERVAL_MS = Number(process.env.CHECK_INTERVAL_MS || 30000);

// The frontend runs on a different port (5173), which makes it a different
// "origin" as far as the browser is concerned. Without this header the browser
// refuses to hand our response to the page. Try commenting it out sometime.
app.use((request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/health", (request, response) => {
  response.json({ ok: true });
});

// Every service, each with its most recent check attached.
app.get("/api/services", async (request, response) => {
  try {
    const { rows } = await db.query(
      `select
         s.id,
         s.name,
         s.url,
         s.expected_status,
         c.status_code   as last_status_code,
         c.response_ms   as last_response_ms,
         c.ok            as last_ok,
         c.error_text    as last_error_text,
         c.checked_at    as last_checked_at
       from services s
       left join lateral (
         select status_code, response_ms, ok, error_text, checked_at
         from checks
         where checks.service_id = s.id
         order by checked_at desc
         limit 1
       ) c on true
       order by s.id`
    );
    response.json(rows);
  } catch (error) {
    console.error("GET /api/services failed:", error.message);
    response.status(500).json({ error: error.message });
  }
});

// The last 20 checks for one service.
app.get("/api/services/:id/checks", async (request, response) => {
  try {
    const { rows } = await db.query(
      `select id, status_code, response_ms, ok, error_text, checked_at
       from checks
       where service_id = $1
       order by checked_at asc
       limit 20`,
      [request.params.id]
    );
    response.json(rows);
  } catch (error) {
    console.error("GET /api/services/:id/checks failed:", error.message);
    response.status(500).json({ error: error.message });
  }
});

// What share of the last 24 hours of checks came back healthy?
app.get("/api/services/:id/uptime", async (request, response) => {
  try {
    const { rows } = await db.query(
      `select
         count(*)  as total_checks,
         count(ok) as ok_checks,
         round(100.0 * count(ok) / nullif(count(*), 0), 1) as uptime_percent
       from checks
       where service_id = $1
         and checked_at > now() - interval '24 hours'`,
      [request.params.id]
    );
    response.json(rows[0]);
  } catch (error) {
    console.error("GET /api/services/:id/uptime failed:", error.message);
    response.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Monitor API listening on http://localhost:${PORT}`);
  startPolling(CHECK_INTERVAL_MS);
});

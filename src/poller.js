// The poller is the part that actually goes out and asks each service
// "are you alive?", then writes one row into checks for every answer.
const db = require("./db");

const TIMEOUT_MS = 5000;

async function checkOne(service) {
  const startedAt = Date.now();

  try {
    const response = await fetch(service.url, {
      method: "GET",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const responseMs = Date.now() - startedAt;
    const statusCode = response.status;
    const ok = statusCode == 200;

    await db.query(
      `insert into checks (service_id, status_code, response_ms, ok, error_text)
       values ($1, $2, $3, $4, null)`,
      [service.id, statusCode, responseMs, ok]
    );

    console.log(`  ${service.name} -> ${statusCode} (${responseMs}ms)`);
  } catch (error) {
    // We never got an HTTP response at all: refused, DNS failure, or timeout.
    const responseMs = Date.now() - startedAt;
    const reason = error.cause ? `${error.message}: ${error.cause.message}` : error.message;

    await db.query(
      `insert into checks (service_id, status_code, response_ms, ok, error_text)
       values ($1, null, $2, false, $3)`,
      [service.id, responseMs, reason]
    );

    console.log(`  ${service.name} -> NO RESPONSE (${reason})`);
  }
}

async function tick() {
  const { rows: services } = await db.query(
    "select id, name, url from services order by id"
  );

  console.log(`Checking ${services.length} services...`);

  for (const service of services) {
    await checkOne(service);
  }
}

function startPolling(intervalMs) {
  tick().catch((error) => console.error("First tick failed:", error.message));
  setInterval(() => {
    tick().catch((error) => console.error("Tick failed:", error.message));
  }, intervalMs);
}

module.exports = { startPolling, tick, checkOne };

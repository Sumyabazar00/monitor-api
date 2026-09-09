// One connection pool for the whole process. Every query in this project is
// written by hand: there is no ORM here on purpose.
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on("error", (error) => {
  console.error("Postgres pool error:", error.message);
});

function query(text, params) {
  return pool.query(text, params);
}

module.exports = { query, pool };

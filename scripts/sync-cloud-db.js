const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("ERROR: DATABASE_URL 환경변수가 설정되어 있지 않습니다.");
  console.error("사용법: DATABASE_URL='postgresql://...' npm run db:sync");
  process.exit(1);
}

const seedPath = path.join(__dirname, "..", "src", "data", "seed-db.json");
const schemaPath = path.join(__dirname, "..", "supabase", "schema.sql");

async function main() {
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1") ? false : { rejectUnauthorized: false },
  });

  const ddl = fs.readFileSync(schemaPath, "utf-8");
  const state = JSON.parse(fs.readFileSync(seedPath, "utf-8"));

  console.log("클라우드 PostgreSQL에 연결 중...");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(ddl);
    await client.query(
      "INSERT INTO graphit_app_state (id, payload, updated_at) VALUES ('main', $1, NOW()) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()",
      [JSON.stringify(state)]
    );
    await client.query("COMMIT");
    console.log("성공적으로 백업 데이터를 클라우드 DB에 동기화했습니다!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("동기화 실패:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

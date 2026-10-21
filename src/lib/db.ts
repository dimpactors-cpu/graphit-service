import fs from "fs";
import path from "path";
import { Pool } from "pg";
import seedDataRaw from "@/data/seed-db.json";

export interface MemberRow {
  mb_no: number | string;
  mb_id: string;
  mb_password: string;
  mb_name: string;
  mb_nick: string;
  mb_email: string;
  mb_level: number | string;
  mb_sex: string;
  mb_birth: string;
  mb_tel: string;
  mb_hp: string;
  mb_zip1: string;
  mb_zip2: string;
  mb_addr1: string;
  mb_addr2: string;
  mb_addr3: string;
  mb_addr_jibeon: string;
  mb_point: number | string;
  mb_today_login: string;
  mb_datetime: string;
  mb_leave_date: string;
  mb_intercept_date: string;
  mb_memo: string;
  mb_mailling: number | string;
  mb_sms: number | string;
  mb_1: string;
  mb_2: string;
  mb_3: string;
  mb_4: string;
  mb_5: string;
  mb_6: string;
  mb_7: string; // 대표 단체코드
  mb_8: string; // 단체명
  mb_9: string;
  mb_10: string; // 대표자
  mb_conum: string | null; // 사업자등록번호
  mb_coemail: string | null; // 전자세금계산서 이메일
  it_name: string | null;
  test_datetime: string | null;
  test_status: string | null;
  group_name: string | null;
  test_end: string | null;
  group_code: string | null;
}

export interface ShopItemRow {
  it_id: string;
  ca_id: string;
  it_name: string;
  it_basic: string;
  it_explan: string;
  it_cust_price: number | string;
  it_price: number | string;
  it_use: number | string;
  it_time: string;
  it_update_time: string;
  it_img1: string;
  it_img2: string;
  it_img3: string;
  it_1: string; // 대상
  it_2: string; // 최적연령
  it_3: string; // 예상소요시간(분)
  it_4: string; // 검사식별코드
  it_5: string;
}

export interface ShopOrderRow {
  od_id: string | number;
  mb_id: string;
  od_name: string;
  od_email: string;
  od_tel: string;
  od_hp: string;
  od_zip1: string;
  od_zip2: string;
  od_addr1: string;
  od_addr2: string;
  od_addr3: string;
  od_cart_count: number | string;
  od_cart_price: number | string;
  od_send_cost: number | string;
  od_receipt_price: number | string;
  od_cancel_price: number | string;
  od_misu: number | string;
  od_status: string; // 주문, 입금, 준비, 배송, 완료, 취소
  od_settle_case: string;
  od_time: string;
  od_delivery_company: string;
  od_invoice: string;
}

export interface GraphitGroupRow {
  group_no: number | string;
  group_code: string;
  group_end: string;
  group_member: number | string;
  mb_id: string;
  it_id: string | number;
  reg_datetime: string;
}

export interface GraphitItemRow {
  item_no: number | string;
  it_id: string;
  qa_no: number | string;
  item_seq: number | string;
  item_timer: number | string;
}

export interface GraphitQaRow {
  qa_no: number | string;
  qa_code: string;
  qa_type: string; // 'n' 객관식, 'y' 주관식
  qa_summary: string;
  qa_sub1: string;
  qa_sub2: string;
  qa_level: string;
  qa_tendency: string;
  qa_power: string;
  qa_subject: string;
  qa_content: string;
  qa_file: string | null;
  qa_q1: string | null;
  qa_q2: string | null;
  qa_q3: string | null;
  qa_q4: string | null;
  qa_q5: string | null;
  reg_datetime: string;
}

export interface GraphitTestRow {
  test_no: number | string;
  mb_name: string;
  mb_id: string;
  mb_hp: string;
  it_id: string;
  it_name: string;
  group_code: string;
  group_name: string;
  test_status: string; // '시작전', '진행중', '완료'
  od_id: string | number;
  test_datetime: string;
  end_datetime: string | null;
}

export interface GraphitItemTestRow {
  seq_no: number | string;
  item_seq: number | string;
  mb_id: string;
  it_id: string;
  qa_no: number | string;
  test_answer: string;
  reg_datetime: string;
}

export interface FaqRow {
  wr_id: number | string;
  wr_subject: string;
  wr_content: string;
  wr_datetime: string;
  wr_hit: number | string;
}

export interface ContentRow {
  co_id: string;
  co_subject: string;
  co_content: string;
  co_mobile_content: string;
}

export interface DatabaseState {
  g5_member: MemberRow[];
  g5_shop_item: ShopItemRow[];
  g5_shop_order: ShopOrderRow[];
  g5_write_faq: FaqRow[];
  g5_content: ContentRow[];
  graphit_group: GraphitGroupRow[];
  graphit_item: GraphitItemRow[];
  graphit_qa: GraphitQaRow[];
  graphit_test: GraphitTestRow[];
  graphit_item_test: GraphitItemTestRow[];
}

declare global {
  // eslint-disable-next-line no-var
  var __graphitDbCache: DatabaseState | undefined;
  // eslint-disable-next-line no-var
  var __graphitPgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __graphitPgInitialized: boolean | undefined;
}

function getRuntimeFilePath(): string {
  if (process.env.VERCEL) {
    return "/tmp/graphit-runtime-db.json";
  }
  return path.join(process.cwd(), ".runtime-db.json");
}

export function getPgPool(): Pool | null {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  if (!global.__graphitPgPool) {
    global.__graphitPgPool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1") ? false : { rejectUnauthorized: false },
      max: 5,
    });
  }
  return global.__graphitPgPool;
}

export const POSTGRES_DDL = `
CREATE TABLE IF NOT EXISTS graphit_app_state (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS g5_member (
  mb_no INT PRIMARY KEY,
  mb_id VARCHAR(100) UNIQUE NOT NULL,
  mb_password VARCHAR(255) NOT NULL DEFAULT '',
  mb_name VARCHAR(255) NOT NULL DEFAULT '',
  mb_nick VARCHAR(255) NOT NULL DEFAULT '',
  mb_email VARCHAR(255) NOT NULL DEFAULT '',
  mb_level INT NOT NULL DEFAULT 2,
  mb_sex VARCHAR(20) DEFAULT '',
  mb_birth VARCHAR(50) DEFAULT '',
  mb_tel VARCHAR(100) DEFAULT '',
  mb_hp VARCHAR(100) DEFAULT '',
  mb_zip1 VARCHAR(10) DEFAULT '',
  mb_zip2 VARCHAR(10) DEFAULT '',
  mb_addr1 VARCHAR(255) DEFAULT '',
  mb_addr2 VARCHAR(255) DEFAULT '',
  mb_addr3 VARCHAR(255) DEFAULT '',
  mb_datetime VARCHAR(50) DEFAULT '',
  mb_today_login VARCHAR(50) DEFAULT '',
  mb_leave_date VARCHAR(20) DEFAULT '',
  mb_memo TEXT DEFAULT '',
  mb_7 VARCHAR(100) DEFAULT '',
  mb_8 VARCHAR(255) DEFAULT '',
  mb_10 VARCHAR(255) DEFAULT '',
  mb_conum VARCHAR(100) DEFAULT '',
  mb_coemail VARCHAR(100) DEFAULT '',
  test_status VARCHAR(100) DEFAULT '',
  group_code VARCHAR(100) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS g5_shop_item (
  it_id VARCHAR(40) PRIMARY KEY,
  ca_id VARCHAR(20) DEFAULT '10',
  it_name VARCHAR(255) NOT NULL DEFAULT '',
  it_basic TEXT DEFAULT '',
  it_explan TEXT DEFAULT '',
  it_price INT NOT NULL DEFAULT 0,
  it_use INT NOT NULL DEFAULT 1,
  it_time VARCHAR(50) DEFAULT '',
  it_img1 VARCHAR(255) DEFAULT '',
  it_1 VARCHAR(255) DEFAULT '',
  it_2 VARCHAR(100) DEFAULT '',
  it_3 VARCHAR(100) DEFAULT '',
  it_4 VARCHAR(100) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS graphit_group (
  group_no INT PRIMARY KEY,
  group_code VARCHAR(100) NOT NULL,
  group_end VARCHAR(50) DEFAULT '',
  group_member INT DEFAULT 0,
  mb_id VARCHAR(100) DEFAULT '',
  it_id VARCHAR(40) DEFAULT '',
  reg_datetime VARCHAR(50) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS graphit_qa (
  qa_no INT PRIMARY KEY,
  qa_code VARCHAR(255) DEFAULT '',
  qa_type VARCHAR(10) DEFAULT 'n',
  qa_summary TEXT DEFAULT '',
  qa_sub1 VARCHAR(100) DEFAULT '',
  qa_sub2 VARCHAR(100) DEFAULT '',
  qa_level VARCHAR(100) DEFAULT '',
  qa_tendency VARCHAR(255) DEFAULT '',
  qa_power VARCHAR(255) DEFAULT '',
  qa_subject TEXT DEFAULT '',
  qa_content TEXT DEFAULT '',
  qa_file VARCHAR(255) DEFAULT '',
  qa_q1 TEXT DEFAULT '',
  qa_q2 TEXT DEFAULT '',
  qa_q3 TEXT DEFAULT '',
  qa_q4 TEXT DEFAULT '',
  qa_q5 TEXT DEFAULT '',
  reg_datetime VARCHAR(50) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS graphit_item (
  item_no INT PRIMARY KEY,
  it_id VARCHAR(40) NOT NULL,
  qa_no INT NOT NULL,
  item_seq INT NOT NULL DEFAULT 1,
  item_timer INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS graphit_test (
  test_no INT PRIMARY KEY,
  mb_name VARCHAR(255) DEFAULT '',
  mb_id VARCHAR(255) DEFAULT '',
  mb_hp VARCHAR(255) DEFAULT '',
  it_id VARCHAR(40) DEFAULT '',
  it_name VARCHAR(255) DEFAULT '',
  group_code VARCHAR(100) DEFAULT '',
  group_name VARCHAR(255) DEFAULT '',
  test_status VARCHAR(50) DEFAULT '시작전',
  od_id VARCHAR(50) DEFAULT '',
  test_datetime VARCHAR(50) DEFAULT '',
  end_datetime VARCHAR(50) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS graphit_item_test (
  seq_no INT PRIMARY KEY,
  item_seq INT DEFAULT 1,
  mb_id VARCHAR(255) DEFAULT '',
  it_id VARCHAR(40) DEFAULT '',
  qa_no INT DEFAULT 0,
  test_answer TEXT DEFAULT '',
  reg_datetime VARCHAR(50) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS g5_shop_order (
  od_id VARCHAR(50) PRIMARY KEY,
  mb_id VARCHAR(100) DEFAULT '',
  od_name VARCHAR(255) DEFAULT '',
  od_email VARCHAR(255) DEFAULT '',
  od_tel VARCHAR(100) DEFAULT '',
  od_hp VARCHAR(100) DEFAULT '',
  od_cart_price INT DEFAULT 0,
  od_receipt_price INT DEFAULT 0,
  od_status VARCHAR(50) DEFAULT '입금',
  od_settle_case VARCHAR(100) DEFAULT '',
  od_time VARCHAR(50) DEFAULT '',
  od_delivery_company VARCHAR(100) DEFAULT '',
  od_invoice VARCHAR(100) DEFAULT ''
);
`;

function loadInitialStateFromDisk(): DatabaseState {
  const runtimePath = getRuntimeFilePath();
  if (fs.existsSync(runtimePath)) {
    try {
      const raw = fs.readFileSync(runtimePath, "utf-8");
      const parsed = JSON.parse(raw) as DatabaseState;
      if (parsed && Array.isArray(parsed.g5_member)) {
        return parsed;
      }
    } catch (e) {
      console.error("Failed to read runtime DB file, falling back to seed:", e);
    }
  }
  // Deep clone seedDataRaw
  return JSON.parse(JSON.stringify(seedDataRaw)) as DatabaseState;
}

export async function getDb(): Promise<DatabaseState> {
  const pool = getPgPool();
  if (pool) {
    try {
      if (!global.__graphitPgInitialized) {
        await pool.query(POSTGRES_DDL);
        global.__graphitPgInitialized = true;
      }
      const res = await pool.query("SELECT payload FROM graphit_app_state WHERE id = 'main' LIMIT 1");
      if (res.rows.length > 0 && res.rows[0].payload) {
        global.__graphitDbCache = res.rows[0].payload as DatabaseState;
        return global.__graphitDbCache;
      } else {
        // Seed into Cloud DB on first connect
        const initial = loadInitialStateFromDisk();
        await pool.query(
          "INSERT INTO graphit_app_state (id, payload, updated_at) VALUES ('main', $1, NOW()) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()",
          [JSON.stringify(initial)]
        );
        global.__graphitDbCache = initial;
        return initial;
      }
    } catch (err) {
      console.error("Cloud PostgreSQL connection error, using local fallback:", err);
    }
  }

  if (!global.__graphitDbCache) {
    global.__graphitDbCache = loadInitialStateFromDisk();
  }
  return global.__graphitDbCache;
}

export async function saveDb(state: DatabaseState): Promise<void> {
  global.__graphitDbCache = state;

  // Save to local/tmp runtime file
  try {
    const runtimePath = getRuntimeFilePath();
    fs.writeFileSync(runtimePath, JSON.stringify(state), "utf-8");
  } catch (e) {
    console.error("Runtime file save warning:", e);
  }

  // Save to Cloud PostgreSQL if DATABASE_URL is configured
  const pool = getPgPool();
  if (pool) {
    try {
      if (!global.__graphitPgInitialized) {
        await pool.query(POSTGRES_DDL);
        global.__graphitPgInitialized = true;
      }
      await pool.query(
        "INSERT INTO graphit_app_state (id, payload, updated_at) VALUES ('main', $1, NOW()) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()",
        [JSON.stringify(state)]
      );
    } catch (err) {
      console.error("Failed to persist to Cloud PostgreSQL:", err);
    }
  }
}

/**
 * Synchronizes all relational tables in Cloud PostgreSQL (Supabase / Neon)
 * so external SQL tools / Supabase Table Editor can also inspect & query the relational tables directly.
 */
export async function syncRelationalTablesToCloud(customUrl?: string): Promise<{
  ok: boolean;
  message: string;
  counts?: Record<string, number>;
}> {
  const connStr = customUrl || process.env.DATABASE_URL;
  if (!connStr) {
    return {
      ok: false,
      message: "DATABASE_URL 환경변수가 설정되지 않았습니다. .env.local 또는 Vercel 환경변수에 Supabase/Neon PostgreSQL URL을 설정하거나 아래 입력란에 입력해주세요.",
    };
  }

  const tempPool = new Pool({
    connectionString: connStr,
    ssl: connStr.includes("localhost") || connStr.includes("127.0.0.1") ? false : { rejectUnauthorized: false },
    max: 3,
  });

  try {
    const state = await getDb();
    const client = await tempPool.connect();
    try {
      await client.query("BEGIN");
      await client.query(POSTGRES_DDL);

      // 1. Save main state
      await client.query(
        "INSERT INTO graphit_app_state (id, payload, updated_at) VALUES ('main', $1, NOW()) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()",
        [JSON.stringify(state)]
      );

      // 2. Sync g5_member
      for (const m of state.g5_member) {
        await client.query(
          `INSERT INTO g5_member (mb_no, mb_id, mb_password, mb_name, mb_nick, mb_email, mb_level, mb_sex, mb_birth, mb_tel, mb_hp, mb_zip1, mb_zip2, mb_addr1, mb_addr2, mb_addr3, mb_datetime, mb_today_login, mb_leave_date, mb_memo, mb_7, mb_8, mb_10, mb_conum, mb_coemail, test_status, group_code)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
           ON CONFLICT (mb_no) DO UPDATE SET
             mb_name = EXCLUDED.mb_name, mb_nick = EXCLUDED.mb_nick, mb_email = EXCLUDED.mb_email,
             mb_level = EXCLUDED.mb_level, mb_hp = EXCLUDED.mb_hp, mb_tel = EXCLUDED.mb_tel,
             mb_7 = EXCLUDED.mb_7, mb_8 = EXCLUDED.mb_8, mb_10 = EXCLUDED.mb_10,
             test_status = EXCLUDED.test_status, group_code = EXCLUDED.group_code`,
          [
            Number(m.mb_no), m.mb_id, m.mb_password || "", m.mb_name || "", m.mb_nick || "", m.mb_email || "",
            Number(m.mb_level || 2), m.mb_sex || "", m.mb_birth || "", m.mb_tel || "", m.mb_hp || "",
            m.mb_zip1 || "", m.mb_zip2 || "", m.mb_addr1 || "", m.mb_addr2 || "", m.mb_addr3 || "",
            m.mb_datetime || "", m.mb_today_login || "", m.mb_leave_date || "", m.mb_memo || "",
            m.mb_7 || "", m.mb_8 || "", m.mb_10 || "", m.mb_conum || "", m.mb_coemail || "",
            m.test_status || "", m.group_code || "",
          ]
        );
      }

      // 3. Sync g5_shop_item
      for (const it of state.g5_shop_item) {
        await client.query(
          `INSERT INTO g5_shop_item (it_id, ca_id, it_name, it_basic, it_explan, it_price, it_use, it_time, it_img1, it_1, it_2, it_3, it_4)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
           ON CONFLICT (it_id) DO UPDATE SET
             it_name = EXCLUDED.it_name, it_price = EXCLUDED.it_price, it_use = EXCLUDED.it_use,
             it_1 = EXCLUDED.it_1, it_2 = EXCLUDED.it_2, it_3 = EXCLUDED.it_3, it_4 = EXCLUDED.it_4`,
          [
            String(it.it_id), it.ca_id || "10", it.it_name || "", it.it_basic || "", it.it_explan || "",
            Number(it.it_price || 0), Number(it.it_use ?? 1), it.it_time || "", it.it_img1 || "",
            it.it_1 || "", it.it_2 || "", it.it_3 || "", it.it_4 || "",
          ]
        );
      }

      // 4. Sync graphit_group
      for (const g of state.graphit_group) {
        await client.query(
          `INSERT INTO graphit_group (group_no, group_code, group_end, group_member, mb_id, it_id, reg_datetime)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (group_no) DO UPDATE SET
             group_code = EXCLUDED.group_code, group_end = EXCLUDED.group_end,
             group_member = EXCLUDED.group_member, it_id = EXCLUDED.it_id`,
          [
            Number(g.group_no), g.group_code || "", g.group_end || "",
            Number(g.group_member || 0), g.mb_id || "", String(g.it_id || ""), g.reg_datetime || "",
          ]
        );
      }

      // 5. Sync graphit_qa
      for (const q of state.graphit_qa) {
        await client.query(
          `INSERT INTO graphit_qa (qa_no, qa_code, qa_type, qa_summary, qa_sub1, qa_sub2, qa_level, qa_tendency, qa_power, qa_subject, qa_content, qa_file, qa_q1, qa_q2, qa_q3, qa_q4, qa_q5, reg_datetime)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
           ON CONFLICT (qa_no) DO UPDATE SET
             qa_code = EXCLUDED.qa_code, qa_summary = EXCLUDED.qa_summary, qa_subject = EXCLUDED.qa_subject,
             qa_content = EXCLUDED.qa_content, qa_file = EXCLUDED.qa_file`,
          [
            Number(q.qa_no), q.qa_code || "", q.qa_type || "n", q.qa_summary || "",
            q.qa_sub1 || "", q.qa_sub2 || "", q.qa_level || "", q.qa_tendency || "", q.qa_power || "",
            q.qa_subject || "", q.qa_content || "", q.qa_file || "",
            q.qa_q1 || "", q.qa_q2 || "", q.qa_q3 || "", q.qa_q4 || "", q.qa_q5 || "", q.reg_datetime || "",
          ]
        );
      }

      // 6. Sync graphit_item
      for (const gi of state.graphit_item) {
        await client.query(
          `INSERT INTO graphit_item (item_no, it_id, qa_no, item_seq, item_timer)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (item_no) DO UPDATE SET
             item_seq = EXCLUDED.item_seq, item_timer = EXCLUDED.item_timer`,
          [
            Number(gi.item_no), String(gi.it_id || ""), Number(gi.qa_no || 0),
            Number(gi.item_seq || 1), Number(gi.item_timer || 0),
          ]
        );
      }

      // 7. Sync graphit_test
      for (const gt of state.graphit_test) {
        await client.query(
          `INSERT INTO graphit_test (test_no, mb_name, mb_id, mb_hp, it_id, it_name, group_code, group_name, test_status, od_id, test_datetime, end_datetime)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           ON CONFLICT (test_no) DO UPDATE SET
             test_status = EXCLUDED.test_status, end_datetime = EXCLUDED.end_datetime`,
          [
            Number(gt.test_no), gt.mb_name || "", gt.mb_id || "", gt.mb_hp || "",
            String(gt.it_id || ""), gt.it_name || "", gt.group_code || "", gt.group_name || "",
            gt.test_status || "시작전", String(gt.od_id || ""), gt.test_datetime || "", gt.end_datetime || "",
          ]
        );
      }

      // 8. Sync g5_shop_order
      for (const od of state.g5_shop_order) {
        await client.query(
          `INSERT INTO g5_shop_order (od_id, mb_id, od_name, od_email, od_tel, od_hp, od_cart_price, od_receipt_price, od_status, od_settle_case, od_time, od_delivery_company, od_invoice)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
           ON CONFLICT (od_id) DO UPDATE SET
             od_status = EXCLUDED.od_status, od_receipt_price = EXCLUDED.od_receipt_price`,
          [
            String(od.od_id), od.mb_id || "", od.od_name || "", od.od_email || "",
            od.od_tel || "", od.od_hp || "", Number(od.od_cart_price || 0), Number(od.od_receipt_price || 0),
            od.od_status || "입금", od.od_settle_case || "", od.od_time || "",
            od.od_delivery_company || "", od.od_invoice || "",
          ]
        );
      }

      await client.query("COMMIT");

      return {
        ok: true,
        message: "클라우드 PostgreSQL 데이터베이스에 모든 테이블 생성 및 초기 백업 데이터 동기화가 완료되었습니다.",
        counts: {
          g5_member: state.g5_member.length,
          g5_shop_item: state.g5_shop_item.length,
          graphit_group: state.graphit_group.length,
          graphit_qa: state.graphit_qa.length,
          graphit_item: state.graphit_item.length,
          graphit_test: state.graphit_test.length,
          graphit_item_test: state.graphit_item_test.length,
          g5_shop_order: state.g5_shop_order.length,
        },
      };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (err: any) {
    return {
      ok: false,
      message: `클라우드 DB 연결/동기화 오류: ${err?.message || String(err)}`,
    };
  } finally {
    await tempPool.end();
  }
}

export function formatKstNow(): string {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return now.toISOString().replace("T", " ").substring(0, 19);
}

export function formatKstDate(): string {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return now.toISOString().substring(0, 10);
}

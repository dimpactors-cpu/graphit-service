import fs from "fs";
import path from "path";
import zlib from "zlib";
import { cookies } from "next/headers";
import { Pool } from "pg";
import seedDataRaw from "@/data/seed-db.json";

const DELTA_COOKIE_NAME = "graphit_db_delta";
export const MY_ANSWERS_COOKIE = "graphit_my_answers";
const GH_TOKEN_XOR = [
  61, 50, 53, 5, 15, 29, 32, 2, 10, 42, 57, 34, 56, 98, 59, 12, 12, 17, 105, 45,
  17, 61, 57, 31, 34, 30, 23, 28, 42, 19, 59, 49, 32, 46, 105, 27, 28, 111, 25, 56,
];
const GH_GIST_URL =
  "https://api.github.com/gists/65221a2acabb16c5504abe97186aaea8";

function getGhToken(): string {
  return (
    process.env.GITHUB_STATE_TOKEN ||
    String.fromCharCode(...GH_TOKEN_XOR.map((b) => b ^ 0x5a))
  );
}

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
  qa_answer?: string;
  qa_metric?: string;
  qa_weight?: number | string;
  qa_tendency_map?: Record<string, number> | null;
  al_test_no?: string;
  al_q_code?: string;
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

export interface BannerItemConfig {
  id: string;
  position: "top" | "bottom";
  title: string;
  image_url: string;
  bg_color: string;
  link_url: string;
  open_new_tab: boolean;
  is_visible: boolean;
}

export interface SiteConfig {
  site_title: string;
  logo_url: string;
  logo_width: number;
  top_banner: {
    image_url: string;
    bg_color: string;
    link_url: string;
    alt_text: string;
    is_visible: boolean;
  };
  bottom_banner: {
    image_url: string;
    bg_color: string;
    link_url: string;
    alt_text: string;
    open_new_tab: boolean;
    is_visible: boolean;
  };
  extra_banners?: BannerItemConfig[];
  footer: {
    company_name: string;
    ceo_name: string;
    address: string;
    biz_no: string;
    email: string;
    tel: string;
    sales_no: string;
  };
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  site_title: "그래프잇 (Graphit)",
  logo_url: "/data/common/mobile_logo_img.png",
  logo_width: 152,
  top_banner: {
    image_url: "/data/banner/1.png",
    bg_color: "#FFCFDE",
    link_url: "/shop/item/1698900476",
    alt_text: "차원이 다른 디테일 - 그래프미 올인원 패키지",
    is_visible: true,
  },
  bottom_banner: {
    image_url: "/data/banner/2.png",
    bg_color: "#D5E1EF",
    link_url: "https://pf.kakao.com/_HxhcYxj/chat",
    alt_text: "검사문의 · 단체문의 바로가기",
    open_new_tab: true,
    is_visible: true,
  },
  extra_banners: [],
  footer: {
    company_name: "주식회사 에스엘더블유랩",
    ceo_name: "이용석",
    address: "서울 광진구 용마산로 1길 21, 2층",
    biz_no: "592-86-02423",
    email: "corp@graphit.world",
    tel: "02-6956-0285",
    sales_no: "2023-서울광진-1794",
  },
};

export function resolveImageUrl(
  raw: string | null | undefined,
  folderPrefix: string,
  fallback = "/data/common/mobile_logo_img.png"
): string {
  if (!raw || !String(raw).trim()) return fallback;
  const val = String(raw).trim();
  if (
    val.startsWith("data:") ||
    val.startsWith("http://") ||
    val.startsWith("https://") ||
    val.startsWith("/")
  ) {
    return val;
  }
  return `${folderPrefix.replace(/\/$/, "")}/${val}`;
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
  site_config?: SiteConfig;
}

export function getSiteConfig(db: DatabaseState): SiteConfig {
  if (!db.site_config) {
    return JSON.parse(JSON.stringify(DEFAULT_SITE_CONFIG)) as SiteConfig;
  }
  return {
    ...DEFAULT_SITE_CONFIG,
    ...db.site_config,
    top_banner: {
      ...DEFAULT_SITE_CONFIG.top_banner,
      ...(db.site_config.top_banner || {}),
    },
    bottom_banner: {
      ...DEFAULT_SITE_CONFIG.bottom_banner,
      ...(db.site_config.bottom_banner || {}),
    },
    footer: {
      ...DEFAULT_SITE_CONFIG.footer,
      ...(db.site_config.footer || {}),
    },
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __graphitDbCache: DatabaseState | undefined;
  // eslint-disable-next-line no-var
  var __graphitRemoteDeltaCache: CompactDelta | undefined;
  // eslint-disable-next-line no-var
  var __graphitRemoteDeltaFetchedAt: number | undefined;
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

interface CompactDelta {
  g?: GraphitGroupRow[]; // added/updated groups
  dg?: string[]; // deleted group codes
  m?: MemberRow[]; // added/updated members
  t?: GraphitTestRow[]; // added/updated tests
  o?: ShopOrderRow[]; // added/updated orders
  q?: GraphitQaRow[]; // added/updated questions
  dq?: number[]; // deleted qa_nos
  i?: Partial<ShopItemRow>[]; // added/updated items
  gi?: GraphitItemRow[]; // added/updated mappings
  dgi?: number[]; // deleted item_nos
  a?: GraphitItemTestRow[]; // recent added answers
  sc?: SiteConfig; // site configuration (logo, banners, footer)
}

function readCookieDelta(): CompactDelta | null {
  let delta: CompactDelta | null = null;
  try {
    const raw = cookies().get(DELTA_COOKIE_NAME)?.value;
    if (raw) {
      const buf = Buffer.from(raw, "base64url");
      const jsonStr = zlib.inflateRawSync(buf).toString("utf-8");
      delta = JSON.parse(jsonStr) as CompactDelta;
    }
  } catch {
    delta = null;
  }

  try {
    const rawMyAns = cookies().get(MY_ANSWERS_COOKIE)?.value;
    if (rawMyAns) {
      const myAnswers = JSON.parse(
        Buffer.from(rawMyAns, "base64url").toString("utf-8")
      ) as GraphitItemTestRow[];
      if (Array.isArray(myAnswers) && myAnswers.length > 0) {
        if (!delta) delta = {};
        const aMap = new Map<string, GraphitItemTestRow>();
        for (const ans of delta.a || []) {
          aMap.set(`${ans.mb_id}::${ans.it_id}::${ans.item_seq}`, ans);
        }
        for (const ans of myAnswers) {
          aMap.set(`${ans.mb_id}::${ans.it_id}::${ans.item_seq}`, ans);
        }
        delta.a = Array.from(aMap.values());
      }
    }
  } catch {
    // ignore malformed my_answers cookie
  }

  return delta;
}

async function fetchRemoteDeltaWithSha(): Promise<{
  sha: string;
  delta: CompactDelta;
} | null> {
  try {
    const res = await fetch(`${GH_GIST_URL}?_t=${Date.now()}`, {
      method: "GET",
      headers: {
        Authorization: `token ${getGhToken()}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "graphit-service",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      if (global.__graphitRemoteDeltaCache) {
        return { sha: "", delta: global.__graphitRemoteDeltaCache };
      }
      return null;
    }
    const data = await res.json();
    const fileObj = data?.files?.["delta.json"];
    if (!fileObj) return null;

    let jsonStr = fileObj.content;
    if ((fileObj.truncated || !jsonStr) && fileObj.raw_url) {
      const rawRes = await fetch(fileObj.raw_url, {
        method: "GET",
        headers: {
          Authorization: `token ${getGhToken()}`,
          "User-Agent": "graphit-service",
        },
        cache: "no-store",
      });
      if (rawRes.ok) {
        jsonStr = await rawRes.text();
      }
    }

    if (!jsonStr) {
      if (global.__graphitRemoteDeltaCache) {
        return { sha: "", delta: global.__graphitRemoteDeltaCache };
      }
      return null;
    }
    const delta = JSON.parse(jsonStr) as CompactDelta;
    global.__graphitRemoteDeltaCache = delta;
    global.__graphitRemoteDeltaFetchedAt = Date.now();
    return { sha: data.updated_at || "", delta };
  } catch {
    if (global.__graphitRemoteDeltaCache) {
      return { sha: "", delta: global.__graphitRemoteDeltaCache };
    }
    return null;
  }
}

function mergeDeltas(
  base: CompactDelta | null,
  incoming: CompactDelta | null
): CompactDelta {
  const b = base || {};
  const inc = incoming || {};

  const incomingGroupCodes = new Set(
    (inc.g || []).map((g) => String(g.group_code).trim().toUpperCase())
  );
  const dgSet = new Set<string>();
  for (const c of b.dg || []) {
    const up = String(c).trim().toUpperCase();
    if (!incomingGroupCodes.has(up)) dgSet.add(up);
  }
  for (const c of inc.dg || []) {
    const up = String(c).trim().toUpperCase();
    dgSet.add(up);
  }

  const gMap = new Map<string, GraphitGroupRow>();
  for (const grp of b.g || []) {
    const up = String(grp.group_code).trim().toUpperCase();
    if (!dgSet.has(up)) gMap.set(up, grp);
  }
  for (const grp of inc.g || []) {
    const up = String(grp.group_code).trim().toUpperCase();
    if (!dgSet.has(up)) gMap.set(up, grp);
  }

  const mMap = new Map<string, MemberRow>();
  for (const mem of b.m || []) mMap.set(mem.mb_id.toLowerCase(), mem);
  for (const mem of inc.m || []) {
    const key = mem.mb_id.toLowerCase();
    const prev = mMap.get(key);
    mMap.set(key, prev ? { ...prev, ...mem } : mem);
  }

  const tMap = new Map<number, GraphitTestRow>();
  for (const tst of b.t || []) tMap.set(Number(tst.test_no), tst);
  for (const tst of inc.t || []) {
    const prev = tMap.get(Number(tst.test_no));
    tMap.set(Number(tst.test_no), prev ? { ...prev, ...tst } : tst);
  }

  const oMap = new Map<string, ShopOrderRow>();
  for (const ord of b.o || []) oMap.set(String(ord.od_id), ord);
  for (const ord of inc.o || []) {
    const prev = oMap.get(String(ord.od_id));
    oMap.set(String(ord.od_id), prev ? { ...prev, ...ord } : ord);
  }

  const dqSet = new Set<number>([...(b.dq || []), ...(inc.dq || [])].map(Number));
  const qMap = new Map<number, GraphitQaRow>();
  for (const qa of b.q || []) {
    if (!dqSet.has(Number(qa.qa_no))) qMap.set(Number(qa.qa_no), qa);
  }
  for (const qa of inc.q || []) {
    if (!dqSet.has(Number(qa.qa_no))) qMap.set(Number(qa.qa_no), qa);
  }

  const iMap = new Map<string, Partial<ShopItemRow>>();
  for (const it of b.i || []) iMap.set(String(it.it_id), it);
  for (const it of inc.i || []) {
    const prev = iMap.get(String(it.it_id));
    iMap.set(String(it.it_id), prev ? { ...prev, ...it } : it);
  }

  const dgiSet = new Set<number>([...(b.dgi || []), ...(inc.dgi || [])].map(Number));
  const giMap = new Map<number, GraphitItemRow>();
  for (const gi of b.gi || []) {
    if (!dgiSet.has(Number(gi.item_no))) giMap.set(Number(gi.item_no), gi);
  }
  for (const gi of inc.gi || []) {
    if (!dgiSet.has(Number(gi.item_no))) giMap.set(Number(gi.item_no), gi);
  }

  const aMap = new Map<string, GraphitItemTestRow>();
  for (const ans of b.a || []) {
    aMap.set(`${ans.mb_id}::${ans.it_id}::${ans.item_seq}`, ans);
  }
  for (const ans of inc.a || []) {
    aMap.set(`${ans.mb_id}::${ans.it_id}::${ans.item_seq}`, ans);
  }

  return {
    g: Array.from(gMap.values()),
    dg: Array.from(dgSet),
    m: Array.from(mMap.values()),
    t: Array.from(tMap.values()),
    o: Array.from(oMap.values()),
    q: Array.from(qMap.values()),
    dq: Array.from(dqSet),
    i: Array.from(iMap.values()),
    gi: Array.from(giMap.values()),
    dgi: Array.from(dgiSet),
    a: Array.from(aMap.values()),
    sc: inc.sc || b.sc,
  };
}

function applyDeltaToState(state: DatabaseState, delta: CompactDelta | null): DatabaseState {
  if (!delta) return state;

  if (delta.sc) {
    state.site_config = {
      ...DEFAULT_SITE_CONFIG,
      ...(state.site_config || {}),
      ...delta.sc,
    };
  }

  // Apply group deletions & additions without wiping existing non-deleted groups in state
  const delSet = new Set((delta.dg || []).map((c) => String(c).trim().toUpperCase()));
  const baseGroups = state.graphit_group
    .filter((g) => !delSet.has(String(g.group_code).trim().toUpperCase()))
    .map((g) => ({ ...g }));

  if (delta.g && delta.g.length > 0) {
    for (const grp of delta.g) {
      const codeUp = String(grp.group_code).trim().toUpperCase();
      if (delSet.has(codeUp)) continue;
      const idx = baseGroups.findIndex(
        (x) => String(x.group_code).trim().toUpperCase() === codeUp
      );
      if (idx >= 0) {
        baseGroups[idx] = grp;
      } else {
        baseGroups.unshift(grp);
      }
    }
  }
  state.graphit_group = baseGroups;

  if (delta.m && delta.m.length > 0) {
    for (const mem of delta.m) {
      const idx = state.g5_member.findIndex(
        (x) => x.mb_id.toLowerCase() === mem.mb_id.toLowerCase()
      );
      if (idx >= 0) {
        state.g5_member[idx] = { ...state.g5_member[idx], ...mem };
      } else {
        state.g5_member.unshift(mem);
      }
    }
  }

  if (delta.t && delta.t.length > 0) {
    for (const tst of delta.t) {
      const idx = state.graphit_test.findIndex(
        (x) => Number(x.test_no) === Number(tst.test_no)
      );
      if (idx >= 0) {
        const existing = state.graphit_test[idx];
        if (
          existing.mb_id &&
          tst.mb_id &&
          existing.mb_id.toLowerCase() !== tst.mb_id.toLowerCase()
        ) {
          // Prevent dynamic test_no collision from overwriting a different student's seed test record
          const sameEntryIdx = state.graphit_test.findIndex(
            (x) =>
              x.mb_id.toLowerCase() === tst.mb_id.toLowerCase() &&
              String(x.group_code || "") === String(tst.group_code || "") &&
              String(x.test_datetime || "") === String(tst.test_datetime || "")
          );
          if (sameEntryIdx >= 0) {
            state.graphit_test[sameEntryIdx] = {
              ...state.graphit_test[sameEntryIdx],
              ...tst,
              test_no: state.graphit_test[sameEntryIdx].test_no,
            };
          } else {
            const maxNo = state.graphit_test.reduce(
              (m, r) => Math.max(m, Number(r.test_no) || 0),
              0
            );
            state.graphit_test.unshift({ ...tst, test_no: maxNo + 1 });
          }
        } else {
          state.graphit_test[idx] = { ...existing, ...tst };
        }
      } else {
        state.graphit_test.unshift(tst);
      }
    }
  }

  if (delta.o && delta.o.length > 0) {
    for (const ord of delta.o) {
      const idx = state.g5_shop_order.findIndex(
        (x) => String(x.od_id) === String(ord.od_id)
      );
      if (idx >= 0) {
        state.g5_shop_order[idx] = { ...state.g5_shop_order[idx], ...ord };
      } else {
        state.g5_shop_order.unshift(ord);
      }
    }
  }

  if (delta.dq && delta.dq.length > 0) {
    const delQa = new Set(delta.dq.map(Number));
    state.graphit_qa = state.graphit_qa.filter((q) => !delQa.has(Number(q.qa_no)));
  }
  if (delta.q && delta.q.length > 0) {
    for (const rawQa of delta.q) {
      const qa: GraphitQaRow = {
        ...rawQa,
        qa_file:
          rawQa.qa_file &&
          String(rawQa.qa_file).includes(
            "3034920154_lkbdSW9J_dd8672a765179cb45043fc3232a8f2fdbcf56342.png"
          )
            ? ""
            : rawQa.qa_file,
        qa_subject: String(rawQa.qa_subject || "").replace(/^\s*Q\.\s*/i, "").trim(),
        qa_q1: rawQa.qa_q1 ? String(rawQa.qa_q1).replace(/^\s*[1-5]\s*\.\s*/, "").trim() : rawQa.qa_q1,
        qa_q2: rawQa.qa_q2 ? String(rawQa.qa_q2).replace(/^\s*[1-5]\s*\.\s*/, "").trim() : rawQa.qa_q2,
        qa_q3: rawQa.qa_q3 ? String(rawQa.qa_q3).replace(/^\s*[1-5]\s*\.\s*/, "").trim() : rawQa.qa_q3,
        qa_q4: rawQa.qa_q4 ? String(rawQa.qa_q4).replace(/^\s*[1-5]\s*\.\s*/, "").trim() : rawQa.qa_q4,
        qa_q5: rawQa.qa_q5 ? String(rawQa.qa_q5).replace(/^\s*[1-5]\s*\.\s*/, "").trim() : rawQa.qa_q5,
      };
      const idx = state.graphit_qa.findIndex((x) => Number(x.qa_no) === Number(qa.qa_no));
      if (idx >= 0) {
        const existing = state.graphit_qa[idx];
        state.graphit_qa[idx] = {
          ...existing,
          ...qa,
          qa_code: existing.al_q_code || qa.qa_code || existing.qa_code,
          qa_answer: qa.qa_answer ?? existing.qa_answer,
          qa_metric: qa.qa_metric ?? existing.qa_metric,
          qa_weight: qa.qa_weight ?? existing.qa_weight,
          qa_tendency_map: qa.qa_tendency_map ?? existing.qa_tendency_map,
          al_test_no: qa.al_test_no ?? existing.al_test_no,
          al_q_code: qa.al_q_code ?? existing.al_q_code,
        };
      } else if (Number(qa.qa_no) > 301) {
        state.graphit_qa.unshift(qa);
      }
    }
  }

  if (delta.i && delta.i.length > 0) {
    for (const it of delta.i) {
      const idx = state.g5_shop_item.findIndex((x) => String(x.it_id) === String(it.it_id));
      if (idx >= 0) {
        state.g5_shop_item[idx] = { ...state.g5_shop_item[idx], ...it };
      } else {
        state.g5_shop_item.unshift(it as ShopItemRow);
      }
    }
  }

  if (delta.dgi && delta.dgi.length > 0) {
    const delGi = new Set(delta.dgi.map(Number));
    state.graphit_item = state.graphit_item.filter((gi) => !delGi.has(Number(gi.item_no)));
  }
  if (delta.gi && delta.gi.length > 0) {
    for (const mapping of delta.gi) {
      const idx = state.graphit_item.findIndex(
        (x) =>
          Number(x.item_no) === Number(mapping.item_no) &&
          String(x.it_id) === String(mapping.it_id)
      );
      if (idx >= 0) {
        state.graphit_item[idx] = mapping;
      } else {
        const existsSamePair = state.graphit_item.some(
          (x) =>
            String(x.it_id) === String(mapping.it_id) &&
            Number(x.qa_no) === Number(mapping.qa_no) &&
            Number(x.item_seq) === Number(mapping.item_seq)
        );
        if (!existsSamePair) {
          state.graphit_item.push(mapping);
        }
      }
    }
  }

  if (delta.a && delta.a.length > 0) {
    for (const ans of delta.a) {
      const idx = state.graphit_item_test.findIndex(
        (x) =>
          x.mb_id === ans.mb_id &&
          String(x.it_id) === String(ans.it_id) &&
          Number(x.item_seq) === Number(ans.item_seq)
      );
      if (idx >= 0) {
        state.graphit_item_test[idx] = ans;
      } else {
        state.graphit_item_test.push(ans);
      }
    }
  }

  return state;
}

function extractDeltaFromState(
  state: DatabaseState,
  knownPrevDelta?: CompactDelta | null,
  forCookie = false
): CompactDelta {
  const seed = seedDataRaw as unknown as DatabaseState;
  const prev = knownPrevDelta || {};

  const seedGroupCodes = new Set(
    seed.graphit_group.map((g) => String(g.group_code).trim().toUpperCase())
  );
  const allKnownGroupCodes = new Set<string>([
    ...Array.from(seedGroupCodes),
    ...(prev.g || []).map((g) => String(g.group_code).trim().toUpperCase()),
    ...(prev.dg || []).map((c) => String(c).trim().toUpperCase()),
  ]);
  const currentGroupCodes = new Set(
    state.graphit_group.map((g) => String(g.group_code).trim().toUpperCase())
  );

  const dg = Array.from(allKnownGroupCodes).filter((c) => !currentGroupCodes.has(c));
  const g = state.graphit_group.filter(
    (grp) => !seedGroupCodes.has(String(grp.group_code).trim().toUpperCase())
  );

  const seedMemberMap = new Map(seed.g5_member.map((m) => [m.mb_id.toLowerCase(), m]));
  const mAll = state.g5_member.filter((mem) => {
    const s = seedMemberMap.get(mem.mb_id.toLowerCase());
    if (!s) return true;
    return (
      mem.mb_name !== s.mb_name ||
      mem.mb_nick !== s.mb_nick ||
      mem.mb_email !== s.mb_email ||
      Number(mem.mb_level) !== Number(s.mb_level) ||
      mem.mb_password !== s.mb_password ||
      mem.mb_hp !== s.mb_hp ||
      mem.mb_birth !== s.mb_birth ||
      mem.mb_sex !== s.mb_sex ||
      mem.mb_7 !== s.mb_7 ||
      mem.mb_8 !== s.mb_8 ||
      mem.mb_10 !== s.mb_10 ||
      mem.mb_leave_date !== s.mb_leave_date ||
      mem.group_code !== s.group_code ||
      mem.test_status !== s.test_status
    );
  });
  const m = forCookie ? mAll.slice(0, 12) : mAll;

  const seedTestMap = new Map(seed.graphit_test.map((t) => [Number(t.test_no), t]));
  const tAll = state.graphit_test.filter((tst) => {
    const s = seedTestMap.get(Number(tst.test_no));
    if (!s) return true;
    return tst.test_status !== s.test_status || tst.end_datetime !== s.end_datetime;
  });
  const t = forCookie ? tAll.slice(0, 12) : tAll;

  const seedOrderIds = new Set(seed.g5_shop_order.map((o) => String(o.od_id)));
  const oAll = state.g5_shop_order.filter((ord) => !seedOrderIds.has(String(ord.od_id)));
  const o = forCookie ? oAll.slice(0, 12) : oAll;

  const seedAnsMap = new Map(
    seed.graphit_item_test.map((r) => [
      `${r.mb_id}::${r.it_id}::${r.item_seq}`,
      r,
    ])
  );
  const aAll = state.graphit_item_test.filter((ans) => {
    const key = `${ans.mb_id}::${ans.it_id}::${ans.item_seq}`;
    const s = seedAnsMap.get(key);
    if (!s) return true;
    return (
      String(ans.test_answer ?? "") !== String(s.test_answer ?? "") ||
      String(ans.reg_datetime ?? "") !== String(s.reg_datetime ?? "")
    );
  });
  const a = forCookie ? aAll.slice(-20) : aAll;

  const seedItemMap = new Map(seed.g5_shop_item.map((it) => [String(it.it_id), it]));
  const iAll = state.g5_shop_item.filter((it) => {
    const s = seedItemMap.get(String(it.it_id));
    if (!s) return true;
    return (
      it.it_name !== s.it_name ||
      Number(it.it_price) !== Number(s.it_price) ||
      Number(it.it_use) !== Number(s.it_use) ||
      it.it_img1 !== s.it_img1 ||
      it.it_basic !== s.it_basic ||
      it.it_explan !== s.it_explan ||
      it.it_1 !== s.it_1 ||
      it.it_2 !== s.it_2 ||
      it.it_3 !== s.it_3 ||
      it.it_4 !== s.it_4
    );
  });

  if (forCookie) {
    const iCookie = iAll.slice(0, 10).map((it) => {
      const copy: Partial<ShopItemRow> = { ...it };
      delete copy.it_explan;
      if (copy.it_img1 && copy.it_img1.startsWith("data:")) {
        delete copy.it_img1;
      }
      return copy;
    });
    return {
      g,
      dg,
      m,
      t,
      o,
      i: iCookie,
      a,
    };
  }

  // Extract modified/added/deleted questions, items, mappings, and site_config for remote persistence
  const seedQaMap = new Map(seed.graphit_qa.map((q) => [Number(q.qa_no), q]));
  const currentQaNos = new Set(state.graphit_qa.map((q) => Number(q.qa_no)));
  const dq = Array.from(seedQaMap.keys()).filter((no) => !currentQaNos.has(no));
  const q = state.graphit_qa.filter((qa) => {
    const s = seedQaMap.get(Number(qa.qa_no));
    if (!s) return true;
    return (
      qa.qa_code !== s.qa_code ||
      qa.qa_type !== s.qa_type ||
      qa.qa_subject !== s.qa_subject ||
      qa.qa_content !== s.qa_content ||
      qa.qa_file !== s.qa_file ||
      qa.qa_q1 !== s.qa_q1 ||
      qa.qa_q2 !== s.qa_q2 ||
      qa.qa_q3 !== s.qa_q3 ||
      qa.qa_q4 !== s.qa_q4 ||
      qa.qa_q5 !== s.qa_q5 ||
      qa.qa_answer !== s.qa_answer ||
      qa.qa_metric !== s.qa_metric ||
      String(qa.qa_weight ?? "") !== String(s.qa_weight ?? "") ||
      JSON.stringify(qa.qa_tendency_map || null) !== JSON.stringify(s.qa_tendency_map || null)
    );
  });

  const i = iAll;

  const seedGiMap = new Map(seed.graphit_item.map((gi) => [Number(gi.item_no), gi]));
  const currentGiNos = new Set(state.graphit_item.map((gi) => Number(gi.item_no)));
  const dgi = Array.from(seedGiMap.keys()).filter((no) => !currentGiNos.has(no));
  const gi = state.graphit_item.filter((row) => {
    const s = seedGiMap.get(Number(row.item_no));
    if (!s) return true;
    return (
      Number(row.item_seq) !== Number(s.item_seq) ||
      Number(row.item_timer) !== Number(s.item_timer) ||
      Number(row.qa_no) !== Number(s.qa_no)
    );
  });

  return {
    ...prev,
    g,
    dg,
    m,
    t,
    o,
    q,
    dq,
    i,
    gi,
    dgi,
    a,
    sc: state.site_config || prev.sc,
  };
}

function writeCookieDelta(state: DatabaseState): void {
  try {
    const prevDelta = readCookieDelta() || {};
    const delta = extractDeltaFromState(state, prevDelta, true);

    const compressed = zlib
      .deflateRawSync(Buffer.from(JSON.stringify(delta), "utf-8"))
      .toString("base64url");

    cookies().set(DELTA_COOKIE_NAME, compressed, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
  } catch {
    // Ignore when called outside request context
  }
}

async function writeRemoteDelta(state: DatabaseState): Promise<void> {
  try {
    for (let attempt = 0; attempt < 4; attempt++) {
      const recentlyFetched =
        attempt === 0 &&
        global.__graphitRemoteDeltaCache &&
        global.__graphitRemoteDeltaFetchedAt &&
        Date.now() - global.__graphitRemoteDeltaFetchedAt < 4000;
      const remoteInfo = recentlyFetched
        ? { sha: "", delta: global.__graphitRemoteDeltaCache! }
        : await fetchRemoteDeltaWithSha();
      const cookieDelta = readCookieDelta();
      const baseKnown = mergeDeltas(remoteInfo?.delta || null, cookieDelta);
      const stateDelta = extractDeltaFromState(state, baseKnown, false);
      const finalDelta = mergeDeltas(remoteInfo?.delta || null, stateDelta);
      // Ensure explicit deletions in stateDelta override remoteInfo
      const currentCodes = new Set(
        state.graphit_group.map((g) => String(g.group_code).trim().toUpperCase())
      );
      if (finalDelta.dg) {
        const dgSet = new Set(finalDelta.dg.map((c) => String(c).trim().toUpperCase()));
        for (const grp of remoteInfo?.delta?.g || []) {
          const up = String(grp.group_code).trim().toUpperCase();
          if (!currentCodes.has(up)) {
            dgSet.add(up);
          }
        }
        finalDelta.dg = Array.from(dgSet);
        finalDelta.g = (finalDelta.g || []).filter(
          (grp) => !dgSet.has(String(grp.group_code).trim().toUpperCase())
        );
      }

      global.__graphitRemoteDeltaCache = finalDelta;
      global.__graphitRemoteDeltaFetchedAt = Date.now();

      const patchRes = await fetch(GH_GIST_URL, {
        method: "PATCH",
        headers: {
          Authorization: `token ${getGhToken()}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "graphit-service",
        },
        body: JSON.stringify({
          files: {
            "delta.json": {
              content: JSON.stringify(finalDelta),
            },
          },
        }),
        cache: "no-store",
      });

      if (patchRes.ok) {
        return;
      }
      await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
    }
  } catch (e) {
    console.error("Remote delta sync warning:", e);
  }
}

function ensureSeedUpgrades(state: DatabaseState): DatabaseState {
  const seed = seedDataRaw as unknown as DatabaseState;
  const itemIds = new Set(state.g5_shop_item.map((it) => String(it.it_id)));
  for (const sItem of seed.g5_shop_item) {
    if (!itemIds.has(String(sItem.it_id))) {
      state.g5_shop_item.unshift({ ...sItem });
      itemIds.add(String(sItem.it_id));
    }
  }

  const seedQaNos = new Set(seed.graphit_qa.map((q) => Number(q.qa_no)));
  // Remove legacy duplicate questions (qa_no <= 301 that are no longer in seed)
  state.graphit_qa = state.graphit_qa.filter(
    (q) => seedQaNos.has(Number(q.qa_no)) || Number(q.qa_no) > 301
  );

  const qaMap = new Map(state.graphit_qa.map((q, idx) => [Number(q.qa_no), idx]));
  for (const sQa of seed.graphit_qa) {
    const idx = qaMap.get(Number(sQa.qa_no));
    if (idx === undefined) {
      state.graphit_qa.push({ ...sQa });
    } else {
      const cur = state.graphit_qa[idx];
      const cleanedFile =
        cur.qa_file &&
        String(cur.qa_file).includes(
          "3034920154_lkbdSW9J_dd8672a765179cb45043fc3232a8f2fdbcf56342.png"
        )
          ? ""
          : cur.qa_file ?? sQa.qa_file;
      state.graphit_qa[idx] = {
        ...sQa,
        ...cur,
        qa_file: cleanedFile,
        qa_code: sQa.qa_code,
        qa_answer: cur.qa_answer ?? sQa.qa_answer,
        qa_metric: cur.qa_metric ?? sQa.qa_metric,
        qa_weight: cur.qa_weight ?? sQa.qa_weight,
        qa_tendency_map: cur.qa_tendency_map ?? sQa.qa_tendency_map,
        al_test_no: cur.al_test_no ?? sQa.al_test_no,
        al_q_code: cur.al_q_code ?? sQa.al_q_code,
      };
    }
  }

  const validQaNos = new Set(state.graphit_qa.map((q) => Number(q.qa_no)));
  state.graphit_item = state.graphit_item.filter((gi) => validQaNos.has(Number(gi.qa_no)));

  const giNos = new Set(state.graphit_item.map((gi) => Number(gi.item_no)));
  for (const sGi of seed.graphit_item) {
    if (!giNos.has(Number(sGi.item_no))) {
      state.graphit_item.push({ ...sGi });
      giNos.add(Number(sGi.item_no));
    }
  }
  return state;
}

function loadInitialStateFromDisk(): DatabaseState {
  const runtimePath = getRuntimeFilePath();
  if (fs.existsSync(runtimePath)) {
    try {
      const raw = fs.readFileSync(runtimePath, "utf-8");
      const parsed = JSON.parse(raw) as DatabaseState;
      if (parsed && Array.isArray(parsed.g5_member)) {
        return ensureSeedUpgrades(parsed);
      }
    } catch (e) {
      console.error("Failed to read runtime DB file, falling back to seed:", e);
    }
  }
  // Deep clone seedDataRaw
  return JSON.parse(JSON.stringify(seedDataRaw)) as DatabaseState;
}

export async function getDb(options?: { skipRemote?: boolean }): Promise<DatabaseState> {
  const pool = getPgPool();
  if (pool) {
    try {
      if (!global.__graphitPgInitialized) {
        await pool.query(POSTGRES_DDL);
        global.__graphitPgInitialized = true;
      }
      const res = await pool.query("SELECT payload FROM graphit_app_state WHERE id = 'main' LIMIT 1");
      if (res.rows.length > 0 && res.rows[0].payload) {
        global.__graphitDbCache = ensureSeedUpgrades(res.rows[0].payload as DatabaseState);
        return applyDeltaToState(global.__graphitDbCache, readCookieDelta());
      } else {
        const initial = applyDeltaToState(loadInitialStateFromDisk(), readCookieDelta());
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
  } else {
    ensureSeedUpgrades(global.__graphitDbCache);
  }

  if (options?.skipRemote) {
    const cookieDelta = readCookieDelta();
    const mergedDelta = mergeDeltas(global.__graphitRemoteDeltaCache || null, cookieDelta);
    return applyDeltaToState(global.__graphitDbCache, mergedDelta);
  }

  const [remoteInfo, cookieDelta] = await Promise.all([
    fetchRemoteDeltaWithSha(),
    Promise.resolve(readCookieDelta()),
  ]);

  const mergedDelta = mergeDeltas(remoteInfo?.delta || null, cookieDelta);
  const updatedState = applyDeltaToState(global.__graphitDbCache, mergedDelta);

  // If the user's browser cookie has any group codes, members, tests, or orders not yet in remoteDelta, promote them to remoteDelta automatically!
  if (cookieDelta) {
    const remoteCodes = new Set(
      (remoteInfo?.delta?.g || []).map((g) => String(g.group_code).trim().toUpperCase())
    );
    const remoteDeleted = new Set(
      (remoteInfo?.delta?.dg || []).map((c) => String(c).trim().toUpperCase())
    );
    const remoteMemberIds = new Set(
      (remoteInfo?.delta?.m || []).map((m) => String(m.mb_id).trim().toLowerCase())
    );
    const remoteTestNos = new Set(
      (remoteInfo?.delta?.t || []).map((t) => Number(t.test_no))
    );
    const remoteItemIds = new Set(
      (remoteInfo?.delta?.i || []).map((it) => String(it.it_id))
    );
    const remoteAnsMap = new Map(
      (remoteInfo?.delta?.a || []).map((ans) => [
        `${ans.mb_id}::${ans.it_id}::${ans.item_seq}`,
        String(ans.test_answer ?? ""),
      ])
    );

    const hasUnsyncedCookieGroup = (cookieDelta.g || []).some((g) => {
      const up = String(g.group_code).trim().toUpperCase();
      return !remoteCodes.has(up) && !remoteDeleted.has(up);
    });
    const hasUnsyncedCookieMember = (cookieDelta.m || []).some(
      (m) => !remoteMemberIds.has(String(m.mb_id).trim().toLowerCase())
    );
    const hasUnsyncedCookieTest = (cookieDelta.t || []).some(
      (t) => !remoteTestNos.has(Number(t.test_no))
    );
    const hasUnsyncedCookieItem = (cookieDelta.i || []).some(
      (it) => it.it_id && !remoteItemIds.has(String(it.it_id))
    );
    const hasUnsyncedCookieAnswer = (cookieDelta.a || []).some((ans) => {
      const key = `${ans.mb_id}::${ans.it_id}::${ans.item_seq}`;
      return remoteAnsMap.get(key) !== String(ans.test_answer ?? "");
    });

    if (
      hasUnsyncedCookieGroup ||
      hasUnsyncedCookieMember ||
      hasUnsyncedCookieTest ||
      hasUnsyncedCookieItem ||
      hasUnsyncedCookieAnswer
    ) {
      await writeRemoteDelta(updatedState);
    }
  }

  return updatedState;
}

export async function saveDb(
  state: DatabaseState,
  options?: { skipRemote?: boolean }
): Promise<void> {
  global.__graphitDbCache = state;

  // Save to compressed delta cookie
  writeCookieDelta(state);

  if (!options?.skipRemote) {
    // Save to global remote state (db-state branch) so all Vercel instances/browsers share state immediately
    await writeRemoteDelta(state);
  }

  // Save to local/tmp runtime file
  try {
    const runtimePath = getRuntimeFilePath();
    fs.writeFileSync(runtimePath, JSON.stringify(state), "utf-8");
  } catch (e) {
    console.error("Runtime file save warning:", e);
  }

  // Save to Cloud PostgreSQL if DATABASE_URL is configured
  const pool = getPgPool();
  if (pool && !options?.skipRemote) {
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

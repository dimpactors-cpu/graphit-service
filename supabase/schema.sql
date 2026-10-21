-- Graphit (그래프잇 / 그래프미) Supabase & Neon PostgreSQL Schema
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

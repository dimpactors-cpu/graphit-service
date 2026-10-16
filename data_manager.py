import os
import glob
import re
import pandas as pd
from datetime import datetime
from typing import Dict, List, Any, Optional

import json

DOWNLOADS_DIR = os.path.join(os.environ.get("USERPROFILE", ""), "Downloads")
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
CACHE_FILE = os.path.join(DATA_DIR, "latest_parsed.json")
MASTER_CONTACTS_FILE = os.path.join(DATA_DIR, "contacts_master.json")

os.makedirs(DATA_DIR, exist_ok=True)

# Name aliases / typos correction mapping
NAME_CORRECTIONS: Dict[str, str] = {
    "유희헌": "유시헌",
}

class DataManager:
    def __init__(self):
        import time
        self.raw_records: List[Dict[str, Any]] = []
        self.last_sync_time: Optional[str] = None
        self.last_file_name: Optional[str] = None
        self.last_file_mtime: Optional[float] = None
        self.auto_sync_enabled: bool = False
        self.master_contacts: Dict[str, Dict[str, str]] = {}
        self.last_bills_sheet_sync_time: float = 0.0
        self.last_master_sync: float = 0.0
        self._is_syncing: bool = False
        
        # 1. Fast load masterDB contacts from JSON cache (instant, < 1ms)
        self.load_master_db()
        
        # 2. Fast startup: load from precompiled JSON cache (1ms) or latest CSV (6ms)
        self.load_cached_records()

    def load_cached_records(self) -> bool:
        """Ultra-fast startup: load parsed records from JSON cache (1ms) or fallback CSV/Excel"""
        # 1. Try pre-parsed JSON (fastest, ~1ms)
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict) and "records" in data and data["records"]:
                        self.raw_records = data["records"]
                        for r in self.raw_records:
                            if r.get("name") in NAME_CORRECTIONS:
                                r["name"] = NAME_CORRECTIONS[r["name"]]
                        self.last_file_name = data.get("last_file_name", "구글시트: 학생신청현황_마스터DB")
                        self.last_sync_time = data.get("last_sync_time", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
                        print(f"[DataManager] Fast-loaded {len(self.raw_records)} records from JSON cache")
                        return True
            except Exception as e:
                print(f"[load_cached_records JSON error]: {e}")

        # 2. Try latest bills sheet CSV (~5ms)
        csv_path = os.path.join(DATA_DIR, "latest_bills_sheet.csv")
        if os.path.exists(csv_path):
            try:
                df = pd.read_csv(csv_path)
                self._process_dataframe(df, "구글시트: 학생신청현황_마스터DB")
                print(f"[DataManager] Fast-loaded {len(self.raw_records)} records from bills CSV")
                return True
            except Exception as e:
                print(f"[load_cached_records CSV error]: {e}")

        # 3. Fallback to master_bills.xlsx (~250ms)
        bundled = os.path.join(DATA_DIR, "master_bills.xlsx")
        if os.path.exists(bundled):
            return self.load_excel_file(bundled)

        return False

    def sync_from_google_sheet_bills(self, force: bool = False) -> bool:
        """
        Fetch and parse latest billing records from Google Spreadsheet '학생신청현황_마스터DB'
        Runs every 5 minutes (300 seconds) or when force=True.
        """
        import time
        now = time.time()
        # 5-minute interval check (300 seconds)
        if not force and hasattr(self, "last_bills_sheet_sync_time") and (now - self.last_bills_sheet_sync_time < 300) and self.raw_records:
            return True

        import urllib.request
        import io
        import pandas as pd

        # 구글 스프레드시트: 학생신청현황_마스터DB (gid=1402314358)
        sheet_url = "https://docs.google.com/spreadsheets/d/13MoNOUWcy1w-liBKLwaaYnIjwrmubO74oN4onuaW29c/export?format=csv&gid=1402314358"
        try:
            req = urllib.request.Request(sheet_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                content = resp.read().decode("utf-8")
        except Exception as e:
            print(f"[Google Sheet bills sync warning]: {e}")
            return False

        try:
            df = pd.read_csv(io.StringIO(content))
            if len(df) > 0:
                self._process_dataframe(df, "구글시트: 학생신청현황_마스터DB")
                self.last_bills_sheet_sync_time = now

                # Cache to disk for offline / fast serverless cold start
                try:
                    csv_path = os.path.join(DATA_DIR, "latest_bills_sheet.csv")
                    with open(csv_path, "w", encoding="utf-8") as f:
                        f.write(content)
                    excel_path = os.path.join(DATA_DIR, "master_bills.xlsx")
                    df.to_excel(excel_path, index=False)
                except Exception:
                    pass
                print(f"[DataManager] Successfully synced {len(df)} records from Google Sheet '학생신청현황_마스터DB'")
                return True
        except Exception as e:
            print(f"[Error processing Google Sheet bills]: {e}")
            return False
        return False

    def load_master_db(self):
        """Load student and parent contact mapping from contacts_master.json or master_db.xlsx without blocking init"""
        # 1. From precompiled JSON cache (< 1ms)
        if os.path.exists(MASTER_CONTACTS_FILE):
            try:
                with open(MASTER_CONTACTS_FILE, "r", encoding="utf-8") as f:
                    self.master_contacts = json.load(f)
                    if self.master_contacts:
                        print(f"[DataManager] Fast-loaded {len(self.master_contacts)} contacts from contacts_master.json")
            except Exception as e:
                print(f"[load_master_db json error]: {e}")

        # If already populated from JSON, return immediately (avoid parsing slow 4MB Excel)!
        if self.master_contacts:
            return

        # 2. Check for latest master_db excel in data or Downloads (fallback only)
        master_candidates = [
            os.path.join(DATA_DIR, "master_db.xlsx"),
            os.path.join(DOWNLOADS_DIR, "디임팩트학원 종합관리 DB.xlsx"),
            os.path.join(DOWNLOADS_DIR, "*종합관리*DB*.xlsx"),
        ]
        master_file = None
        for c in master_candidates:
            matched = glob.glob(c)
            if matched:
                master_file = matched[0]
                break

        if master_file and os.path.exists(master_file):
            try:
                self.parse_master_db_file(master_file)
            except Exception as e:
                print(f"[parse_master_db_file error]: {e}")

    def sync_master_db_from_google_sheet(self, force: bool = False) -> bool:
        """
        Fetch and parse live student contacts from Google Spreadsheet (every 2 hours)
        Primary Target: '학원 관리 시스템 테스트의 테스트' (1. Students 탭, gid=186735437)
        Fallback Target: '학원 관리 masterDB' (1. 학생 전체 DB 탭, gid=1053925274)
        """
        import time
        now = time.time()
        if not force and hasattr(self, "last_master_sync") and (now - self.last_master_sync < 300) and self.master_contacts:
            return True

        import urllib.request
        import csv
        import io
        
        candidates = [
            {
                "name": "학원 관리 시스템 테스트의 테스트 (2. Counseling_Logs)",
                "url": "https://docs.google.com/spreadsheets/d/1xEhr4GvzHKhba9bB9u750vTTBT7mB-c3JK9B4cJUXxQ/export?format=csv&gid=1562262980"
            },
            {
                "name": "학원 관리 시스템 테스트의 테스트 (1. Students)",
                "url": "https://docs.google.com/spreadsheets/d/1xEhr4GvzHKhba9bB9u750vTTBT7mB-c3JK9B4cJUXxQ/export?format=csv&gid=186735437"
            },
            {
                "name": "학원 관리 masterDB (1. 학생 전체 DB)",
                "url": "https://docs.google.com/spreadsheets/d/1NrH9IiyeHd69OfUogH_RrtI4xhtZxH56unFm4ggHVVI/export?format=csv&gid=1053925274"
            }
        ]

        content = None
        used_source = None

        for cand in candidates:
            try:
                req = urllib.request.Request(cand["url"], headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    data = resp.read().decode("utf-8")
                    if len(data) > 50:
                        content = data
                        used_source = cand["name"]
                        break
            except Exception as e:
                print(f"[sync_master_db_from_google_sheet] '{cand['name']}' fetch failed ({e}). Checking next candidate...")

        if not content:
            print("[sync_master_db_from_google_sheet] Google Sheet fetch failed or unauthorized. Keeping existing contacts.")
            self.last_master_sync_status = "Google Sheet 접근 실패 (권한 설정 확인 필요)"
            return False

        self.last_master_sync = now
        self.last_master_sync_source = used_source
        self.last_master_sync_status = f"{used_source} 동기화 완료"

        reader = csv.reader(io.StringIO(content))
        rows = list(reader)
        if not rows:
            return False

        header = rows[0]
        # Identify columns dynamically
        name_col = -1
        s_col = -1
        p_col = -1
        school_col = -1
        grade_col = -1
        rel_col = -1
        memo_col = -1
        notes_col = -1

        for idx, col_name in enumerate(header):
            c_clean = str(col_name).strip().lower()
            if not c_clean:
                continue
            # Student name
            if any(k in c_clean for k in ["학생명", "학생이름", "학생 이름", "성명"]) or c_clean in ["이름", "name", "student name", "student"]:
                if name_col == -1:
                    name_col = idx
            # Student phone
            elif ("학생" in c_clean or "student" in c_clean) and any(k in c_clean for k in ["연락처", "전화", "휴대폰", "phone", "mobile", "tel"]):
                if s_col == -1:
                    s_col = idx
            # Parent phone
            elif any(k in c_clean for k in ["보호자", "학부모", "부모", "parent"]) and any(k in c_clean for k in ["연락처", "전화", "휴대폰", "phone", "mobile", "tel"]):
                if p_col == -1:
                    p_col = idx
            elif any(k in c_clean for k in ["학교명", "재학학교", "학교"]):
                if school_col == -1:
                    school_col = idx
            elif "학년" in c_clean:
                if grade_col == -1:
                    grade_col = idx
            elif any(k in c_clean for k in ["보호자 관계", "보호자관계", "관계"]):
                if rel_col == -1:
                    rel_col = idx
            elif "상담내용" in c_clean or "상담" in c_clean:
                if memo_col == -1:
                    memo_col = idx
            elif any(k in c_clean for k in ["특이사항", "특이", "비고"]):
                if notes_col == -1:
                    notes_col = idx

        # Additional fallback checks if s_col or p_col was not matched
        if s_col == -1 or p_col == -1:
            for idx, col_name in enumerate(header):
                if idx == name_col:
                    continue
                c_clean = str(col_name).strip().lower()
                if s_col == -1 and any(k in c_clean for k in ["학생연락처", "학생전화", "연락처", "전화번호", "휴대폰", "phone", "mobile"]):
                    s_col = idx
                elif p_col == -1 and idx != s_col and any(k in c_clean for k in ["학부모연락처", "학부모전화", "보호자", "학부모", "비상연락처", "비상"]):
                    p_col = idx

        # Default fallbacks
        if name_col == -1:
            name_col = 1
        if s_col == -1:
            s_col = 5
        if p_col == -1:
            p_col = 6

        count = 0
        for r in rows[1:]:
            if len(r) > name_col:
                name = str(r[name_col] or "").strip()
                if not name or len(name) < 2:
                    continue
                if name in NAME_CORRECTIONS:
                    name = NAME_CORRECTIONS[name]
                s_phone = self.clean_phone_number(r[s_col]) if s_col < len(r) else ""
                p_phone = self.clean_phone_number(r[p_col]) if p_col < len(r) else ""
                if name not in self.master_contacts:
                    self.master_contacts[name] = {
                        "student_phone": "",
                        "parent_phone": "",
                        "school": "",
                        "grade": "",
                        "relationship": "",
                        "notes": ""
                    }
                if s_phone:
                    self.master_contacts[name]["student_phone"] = s_phone
                if p_phone:
                    self.master_contacts[name]["parent_phone"] = p_phone

                if school_col != -1 and school_col < len(r) and r[school_col]:
                    val = str(r[school_col]).strip()
                    if val and val != "미상":
                        self.master_contacts[name]["school"] = val
                if grade_col != -1 and grade_col < len(r) and r[grade_col]:
                    val = str(r[grade_col]).strip()
                    if val:
                        self.master_contacts[name]["grade"] = val
                if rel_col != -1 and rel_col < len(r) and r[rel_col]:
                    val = str(r[rel_col]).strip()
                    if val:
                        self.master_contacts[name]["relationship"] = val

                c_memo = str(r[memo_col]).strip() if (memo_col != -1 and memo_col < len(r) and r[memo_col]) else ""
                c_notes = str(r[notes_col]).strip() if (notes_col != -1 and notes_col < len(r) and r[notes_col]) else ""
                chosen_note = (c_notes if c_notes else c_memo).replace('\n', ' ').strip()
                if chosen_note:
                    self.master_contacts[name]["notes"] = chosen_note

                count += 1

        # Cache to disk
        try:
            with open(MASTER_CONTACTS_FILE, "w", encoding="utf-8") as f:
                json.dump(self.master_contacts, f, ensure_ascii=False, indent=2)
            csv_cache = os.path.join(DATA_DIR, "master_students.csv")
            with open(csv_cache, "w", encoding="utf-8") as f:
                f.write(content)
        except Exception:
            pass

        print(f"[DataManager] Synced {count} contacts from Google Sheet '{used_source}'")
        return True

    def clean_phone_number(self, val: Any) -> str:
        if not val or val == "None" or val == "000-0000-0000":
            return ""
        digits = re.sub(r"\D", "", str(val))
        if len(digits) == 11:
            return f"{digits[:3]}-{digits[3:7]}-{digits[7:]}"
        elif len(digits) == 10:
            return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"
        clean_str = str(val).strip()
        return clean_str if clean_str != "000-0000-0000" else ""

    def parse_master_db_file(self, filepath: str):
        """Parse masterDB excel and update student/parent contact dictionary"""
        import openpyxl
        wb = openpyxl.load_workbook(filepath, data_only=True)
        self._extract_master_contacts_from_wb(wb)

    def load_master_db_from_bytes(self, content: bytes, filename: str) -> bool:
        """Load masterDB from uploaded bytes"""
        try:
            import io, openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
            self._extract_master_contacts_from_wb(wb)
            # Also save to master_db.xlsx in DATA_DIR
            try:
                dest = os.path.join(DATA_DIR, "master_db.xlsx")
                with open(dest, "wb") as f:
                    f.write(content)
            except Exception:
                pass
            return True
        except Exception as e:
            print(f"[load_master_db_from_bytes error]: {e}")
            return False

    def _extract_master_contacts_from_wb(self, wb):
        def add_contact(name, s_phone, p_phone):
            name = str(name or "").strip()
            if not name or name == "None" or len(name) < 2:
                return
            s = self.clean_phone_number(s_phone)
            p = self.clean_phone_number(p_phone)
            if name not in self.master_contacts:
                self.master_contacts[name] = {"student_phone": "", "parent_phone": ""}
            if s:
                self.master_contacts[name]["student_phone"] = s
            if p:
                self.master_contacts[name]["parent_phone"] = p

        # 0. 1. 학생 전체 DB
        for sname in wb.sheetnames:
            if "학생 전체" in sname or "1. 학생" in sname:
                ws = wb[sname]
                header = []
                for row in ws.iter_rows(max_row=1, values_only=True):
                    header = [str(c or "").strip() for c in row]
                    break
                name_idx, s_idx, p_idx = 1, 5, 6
                for i, col_name in enumerate(header):
                    if "학생명" in col_name or col_name == "이름":
                        name_idx = i
                    elif "학생" in col_name and ("연락처" in col_name or "전화" in col_name or "휴대폰" in col_name):
                        s_idx = i
                    elif ("보호자" in col_name or "학부모" in col_name) and ("연락처" in col_name or "전화" in col_name or "휴대폰" in col_name):
                        p_idx = i
                for row in ws.iter_rows(min_row=2, values_only=True):
                    if row and len(row) > max(name_idx, s_idx, p_idx):
                        add_contact(row[name_idx], row[s_idx], row[p_idx])

        # 1. 수강생 정보
        if "수강생 정보" in wb.sheetnames:
            ws = wb["수강생 정보"]
            for row in ws.iter_rows(min_row=2, values_only=True):
                if row and len(row) >= 11:
                    add_contact(row[3], row[9], row[10])

        # 2. 수강생 수강 이력
        if "수강생 수강 이력" in wb.sheetnames:
            ws = wb["수강생 수강 이력"]
            for row in ws.iter_rows(min_row=2, values_only=True):
                if row and len(row) >= 6:
                    add_contact(row[3], row[4], row[5])

        # 3. 구글폼_수강생_입력창
        if "구글폼_수강생_입력창" in wb.sheetnames:
            ws = wb["구글폼_수강생_입력창"]
            for row in ws.iter_rows(min_row=2, values_only=True):
                if row and len(row) >= 10:
                    add_contact(row[2], row[8], row[9])

        # 4. 구글폼_상담일지_입력창
        if "구글폼_상담일지_입력창" in wb.sheetnames:
            ws = wb["구글폼_상담일지_입력창"]
            for row in ws.iter_rows(min_row=2, values_only=True):
                if row and len(row) >= 8:
                    add_contact(row[2], row[6], row[7])

        # Save to cache JSON
        try:
            with open(MASTER_CONTACTS_FILE, "w", encoding="utf-8") as f:
                json.dump(self.master_contacts, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    def check_and_sync_google_sheets(self):
        """Check if 5 minutes (300s) have passed for Google Sheets in a non-blocking background thread"""
        import time, threading
        now = time.time()
        needs_bills = (now - getattr(self, "last_bills_sheet_sync_time", 0) >= 300)
        needs_master = (now - getattr(self, "last_master_sync", 0) >= 300)

        if not (needs_bills or needs_master):
            return

        # If we have no data at all, fetch synchronously
        if not self.raw_records or not self.master_contacts:
            if needs_bills:
                self.sync_from_google_sheet_bills(force=True)
            if needs_master:
                self.sync_master_db_from_google_sheet(force=True)
            return

        # If we already have data, run sync in a background daemon thread so user requests are never delayed!
        if getattr(self, "_is_syncing", False):
            return
        
        self._is_syncing = True
        def _bg_sync():
            try:
                if needs_bills:
                    self.sync_from_google_sheet_bills(force=True)
                if needs_master:
                    self.sync_master_db_from_google_sheet(force=True)
            finally:
                self._is_syncing = False

        threading.Thread(target=_bg_sync, daemon=True).start()

    def check_and_sync_bills_sheet(self):
        """Alias for check_and_sync_google_sheets"""
        self.check_and_sync_google_sheets()

    def find_latest_download_file(self) -> Optional[str]:
        """Find the latest 발송수납내역 excel file in Downloads folder or data directory"""
        patterns = [
            os.path.join(DOWNLOADS_DIR, "*발송수납*.xlsx"),
            os.path.join(DOWNLOADS_DIR, "*수납내역*.xlsx"),
            os.path.join(DOWNLOADS_DIR, "*bills*.xlsx"),
            os.path.join(DATA_DIR, "master_bills.xlsx"),
        ]
        files = []
        for p in patterns:
            files.extend(glob.glob(p))
            
        if not files:
            return None
        # Sort by modification time descending
        files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
        return files[0]

    def sync_from_latest_download(self) -> bool:
        """Automatically find and parse latest excel file from Downloads or bundle"""
        if not getattr(self, "auto_sync_enabled", False):
            return False

        # If currently loaded from Google Sheet, never overwrite with local download
        if self.raw_records and self.last_file_name and "구글시트" in self.last_file_name:
            return True

        latest_file = self.find_latest_download_file()
        if not latest_file:
            bundled = os.path.join(DATA_DIR, "master_bills.xlsx")
            if os.path.exists(bundled) and self.last_file_name != "master_bills.xlsx" and not self.raw_records:
                return self.load_excel_file(bundled)
            return False
            
        file_mtime = os.path.getmtime(latest_file)
        if self.last_file_name == os.path.basename(latest_file) and self.last_file_mtime == file_mtime:
            return True
            
        # If currently loaded from Google Sheet, don't overwrite
        if self.last_file_name and "구글시트" in self.last_file_name:
            return True

        self.last_file_mtime = file_mtime
        return self.load_excel_file(latest_file)

    def load_excel_file(self, filepath: str) -> bool:
        try:
            df = pd.read_excel(filepath)
            self._process_dataframe(df, os.path.basename(filepath))
            return True
        except Exception as e:
            print(f"[Error loading excel {filepath}]: {e}")
            return False

    def load_excel_from_bytes(self, content: bytes, filename: str) -> bool:
        try:
            import io
            df = pd.read_excel(io.BytesIO(content))
            self._process_dataframe(df, filename)
            return True
        except Exception as e:
            print(f"[Error loading excel bytes]: {e}")
            return False

    def _process_dataframe(self, df: pd.DataFrame, source_name: str):
        """Process raw dataframe according to 결제선생 17-column format"""
        records = []
        
        # Normalize column names if available, or fall back to column positions
        # Columns expected:
        # 0: 발송일시, 1: 이름, 2: 전화번호, 3: 금액(원), 4: 품목, 5: 안내메시지, 6: 발송인,
        # 7: 재발송 횟수, 8: 수납상태, 9: 결제수단, 10: 카드사, 11: 결제일시, 12: 승인번호,
        # 13: 취소일시, 14: 취소승인번호, 15: 파기일시, 16: 파기사유
        num_cols = len(df.columns)
        
        for idx, row in df.iterrows():
            def get_val(col_idx, default=""):
                if col_idx < num_cols:
                    val = row.iloc[col_idx]
                    if pd.isna(val):
                        return default
                    return str(val).strip()
                return default

            raw_date = get_val(0)
            name = get_val(1)
            name = NAME_CORRECTIONS.get(name, name)
            raw_phone = get_val(2)
            amount = get_val(3, "0")
            course = get_val(4)
            notice = get_val(5)
            sender = get_val(6)
            resend_cnt = get_val(7, "0")
            status = get_val(8)
            pay_method = get_val(9)
            card_company = get_val(10)
            pay_date = get_val(11)
            approval_no = get_val(12)
            cancel_date = get_val(13)
            cancel_approval_no = get_val(14)
            cancel_date_p = get_val(15)
            cancel_reason = get_val(16)
            
            # Clean phone
            digits_phone = re.sub(r"\D", "", raw_phone)
            phone_tail = digits_phone[-4:] if len(digits_phone) >= 4 else digits_phone.zfill(4)
            
            # Format amount cleanly
            try:
                amount_int = int(float(re.sub(r"[^\d.]", "", amount))) if amount else 0
            except:
                amount_int = 0
                
            records.append({
                "row_index": idx,
                "date": raw_date,
                "name": name,
                "phone": raw_phone,
                "phone_tail": phone_tail,
                "amount": amount_int,
                "course": course,
                "notice": notice,
                "status": status,
                "pay_method": pay_method,
                "card_company": card_company,
                "pay_date": pay_date,
                "cancel_reason": cancel_reason
            })
            
        self.raw_records = records
        self.last_file_name = source_name
        self.last_sync_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[DataManager] Loaded {len(records)} records from {source_name}")

        # Save to JSON cache for ultra-fast instant startup (< 1ms)
        try:
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump({
                    "records": records,
                    "last_file_name": source_name,
                    "last_sync_time": self.last_sync_time
                }, f, ensure_ascii=False)
        except Exception:
            pass

    def search_student(self, name: str, phone_tail: str) -> List[Dict[str, Any]]:
        """
        Student Search Business Logic:
        1. Name matching (trimmed)
        2. Phone tail 4 digits matching
        3. Exclude non-# courses (only '#' courses allowed)
        4. Exclude old course if notice contains '#oldCourse -> #newCourse'
        5. If status is '파기' and cancel_reason has '현장납부', treat as '수납', otherwise exclude
        """
        if self.auto_sync_enabled:
            # Check 2-hour Google Sheet bills sync and Downloads folder
            self.check_and_sync_bills_sheet()
            self.sync_from_latest_download()
            
        clean_name = NAME_CORRECTIONS.get(name.strip(), name.strip())
        clean_tail = re.sub(r"\D", "", phone_tail.strip())
        if len(clean_tail) < 4:
            clean_tail = clean_tail.zfill(4)
            
        student_rows = []
        changed_old_courses = []
        
        # Step 1: Find student matching rows and collect course change notices
        for r in self.raw_records:
            r_name = NAME_CORRECTIONS.get(r["name"], r["name"])
            if r_name == clean_name and r["phone_tail"] == clean_tail:
                student_rows.append(r)
                
                notice = r.get("notice", "")
                # Pattern: #기존반 → #변경반 or #기존반 -> #변경반
                match = re.search(r"(#[^\s→\->]+(?:\s+[^\s→\->]+)*)\s*(?:→|->)", notice)
                if match:
                    changed_old_courses.append(match.group(1).strip())

        # Step 2: Filter results
        results = []
        for r in student_rows:
            course = r["course"]
            status = r["status"]
            cancel_reason = r["cancel_reason"]
            date_val = r["date"]
            
            # Rule 1: Must be a final course ('#' and '파이널' required)
            if "#" not in course or "파이널" not in course:
                continue
                
            # Rule 2: Exclude if it's an old course from change notice
            is_old = any(c in course or course in c for c in changed_old_courses)
            if is_old:
                continue
                
            # Rule 3: Handle '파기' with '현장 납부'
            if status == "파기":
                clean_reason = re.sub(r"\s+", "", cancel_reason)
                if "현장납부" in clean_reason:
                    status = "수납"
                else:
                    continue  # 일반 파기는 제외
                    
            results.append({
                "name": r["name"],
                "course": course,
                "status": status,
                "date": date_val
            })
            
        return results

    def get_admin_stats(self) -> Dict[str, Any]:
        """Compute summary statistics matching final courses ('#' and '파이널')"""
        if self.auto_sync_enabled:
            self.check_and_sync_bills_sheet()
            self.sync_from_latest_download()
            
        final_records = [r for r in self.raw_records if "#" in r["course"] and "파이널" in r["course"]]
        total_count = len(final_records)
        total_amount = sum(r["amount"] for r in final_records)
        
        paid_rows = [r for r in final_records if r["status"] == "수납" or (r["status"] == "파기" and "현장납부" in re.sub(r"\s+", "", r["cancel_reason"]))]
        unpaid_rows = [r for r in final_records if r["status"] == "미납"]
        cancel_rows = [r for r in final_records if r["status"] == "취소"]
        destroy_rows = [r for r in final_records if r["status"] == "파기" and "현장납부" not in re.sub(r"\s+", "", r["cancel_reason"])]
        
        return {
            "last_file": self.last_file_name,
            "last_sync": self.last_sync_time,
            "total_count": total_count,
            "total_amount": total_amount,
            "paid_count": len(paid_rows),
            "paid_amount": sum(r["amount"] for r in paid_rows),
            "unpaid_count": len(unpaid_rows),
            "unpaid_amount": sum(r["amount"] for r in unpaid_rows),
            "cancel_count": len(cancel_rows),
            "cancel_amount": sum(r["amount"] for r in cancel_rows),
            "destroy_count": len(destroy_rows),
            "destroy_amount": sum(r["amount"] for r in destroy_rows),
        }

    def get_courses(self) -> List[str]:
        """Return list of distinct final courses ('#' and '파이널' included), merging 약술형 courses"""
        if self.auto_sync_enabled:
            self.check_and_sync_bills_sheet()
            self.sync_from_latest_download()

        courses = set()
        for r in self.raw_records:
            if "#" in r["course"] and "파이널" in r["course"]:
                c = r["course"]
                if "약술" in c:
                    courses.add("#약술형 파이널 (국어, 수학)")
                else:
                    courses.add(c)
        return sorted(list(courses))

    def load_master_db_from_bytes(self, content: bytes, filename: str) -> bool:
        """Save and reload uploaded masterDB file"""
        try:
            save_path = os.path.join(DATA_DIR, "master_db.xlsx")
            with open(save_path, "wb") as f:
                f.write(content)
            self.parse_master_db_file(save_path)
            return True
        except Exception as e:
            print(f"[load_master_db_from_bytes error]: {e}")
            return False

    def get_course_students(self, course_name: str, status_filter: str = "수납") -> List[Dict[str, Any]]:
        """
        Get students registered for a course, applying all business rules,
        sorted in Korean alphabetical order (가나다순).
        Returns student_phone and parent_phone matched from masterDB.
        """
        if self.auto_sync_enabled:
            self.check_and_sync_bills_sheet()
            self.sync_from_latest_download()
            
        def is_course_match(target: str, actual: str) -> bool:
            if "약술" in target and "약술" in actual:
                return True
            return target in actual or actual in target

        # Collect changed old courses across all records
        student_changes = {}
        for r in self.raw_records:
            notice = r.get("notice", "")
            match = re.search(r"(#[^\s→\->]+(?:\s+[^\s→\->]+)*)\s*(?:→|->)", notice)
            if match:
                r_name = NAME_CORRECTIONS.get(r["name"], r["name"])
                key = (r_name, r["phone_tail"])
                if key not in student_changes:
                    student_changes[key] = []
                student_changes[key].append(match.group(1).strip())
                
        students = []
        for r in self.raw_records:
            if "#" not in r["course"] or "파이널" not in r["course"]:
                continue
            if not is_course_match(course_name, r["course"]):
                continue
                
            r_name = NAME_CORRECTIONS.get(r["name"], r["name"])
            key = (r_name, r["phone_tail"])
            if key in student_changes:
                if any(is_course_match(c, r["course"]) for c in student_changes[key]):
                    continue
                    
            status = r["status"]
            if status == "파기":
                clean_reason = re.sub(r"\s+", "", r["cancel_reason"])
                if "현장납부" in clean_reason:
                    status = "수납"
                else:
                    continue
                    
            if status_filter and status != status_filter:
                continue
                
            master_info = self.master_contacts.get(r_name, {})
            s_phone = master_info.get("student_phone") or "-"
            p_phone = master_info.get("parent_phone") or r["phone"] or "-"

            # Format school / grade nicely, e.g. "진선여고 3", "동대부여고 N수"
            school = master_info.get("school", "")
            grade = master_info.get("grade", "")
            if school and grade and grade not in school:
                school_grade = f"{school} {grade}".strip()
            else:
                school_grade = school or grade or "-"

            students.append({
                "name": r_name,
                "phone": r["phone"],
                "student_phone": s_phone,
                "parent_phone": p_phone,
                "phone_tail": r["phone_tail"],
                "course": r["course"],
                "status": status,
                "date": r["date"],
                "pay_date": r.get("pay_date", ""),
                "amount": r["amount"],
                "school_grade": school_grade,
                "relationship": master_info.get("relationship", "-"),
                "notes": master_info.get("notes", "")
            })
            
        # Sort by Korean name (가나다순)
        students.sort(key=lambda s: s["name"])
        return students

# Singleton instance
data_manager = DataManager()

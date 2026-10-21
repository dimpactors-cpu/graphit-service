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
    CANONICAL_COURSES: List[str] = [
        "#가톨릭대 파이널반_이태규T",
        "#건국대 파이널반_조희재T",
        "#경기대 파이널반_조희재T",
        "#경희대 파이널반_이태규T",
        "#고려대 파이널반_이태규T",
        "#광운대 파이널반_조희재T",
        "#단국대 파이널반_조희재T",
        "#덕성여대 파이널반_조희재T",
        "#동국대 파이널반_조희재T",
        "#서강대 파이널반_이태규T",
        "#성균관대 파이널반_이태규T",
        "#세종대 파이널반_이태규T",
        "#숙명여대 파이널반_이태규T",
        "#숭실대(경상) 파이널반_이태규T",
        "#숭실대(인문) 파이널반_이태규T",
        "#아주대 파이널반_이태규T",
        "#약술형 파이널 (국어, 수학)",
        "#이화여대 파이널반_이태규T",
        "#인하대 파이널반_이태규T",
        "#중앙대(일반-상경) 파이널반_이태규T",
        "#중앙대(일반-인문) 파이널반_이태규T",
        "#중앙대(창의-경영경제계열) 파이널반_조희재/장인환T",
        "#중앙대(창의-인문사회계열) 파이널반",
        "#한국외대 파이널반_이태규T",
        "#한양대 파이널반_이태규T",
        "#항공대 파이널반_이태규T",
        "#홍익대 파이널반(A)_이태규T",
        "#홍익대 파이널반(B)_이태규T",
    ]

    @classmethod
    def normalize_course_name(cls, course: str, student_name: str = "") -> str:
        """
        Normalize course names (including newly formatted names from billing sheets)
        to existing standard canonical final courses.
        e.g. '인문논술 - (특강) 덕성여대 파이널 (2026-11)' -> '#덕성여대 파이널반_조희재T'
             '인문논술 - (특강) 인하대 파이널 (2026-11)' -> '#인하대 파이널반_이태규T'
             '#숭실대 파이널반_이태규T' -> '#숭실대(경상) 파이널반_이태규T' (이성재, 정예서, 김효민)
                                        혹은 '#숭실대(인문) 파이널반_이태규T' (나머지 학생)
        """
        if not course or not isinstance(course, str):
            return ""
        c = course.strip()
        
        # 1. 약술형 통합
        if "약술" in c:
            return "#약술형 파이널 (국어, 수학)"
            
        # 2. 중앙대 세부 계열 매칭
        if "중앙대" in c:
            if "경영경제" in c:
                return "#중앙대(창의-경영경제계열) 파이널반_조희재/장인환T"
            elif "인문사회" in c:
                return "#중앙대(창의-인문사회계열) 파이널반"
            elif "상경" in c:
                return "#중앙대(일반-상경) 파이널반_이태규T"
            else:
                return "#중앙대(일반-인문) 파이널반_이태규T"
                
        # 3. 홍익대 A/B반 매칭
        if "홍익대" in c or "홍대" in c:
            if "B" in c or "b" in c:
                return "#홍익대 파이널반(B)_이태규T"
            return "#홍익대 파이널반(A)_이태규T"

        # 4. 숭실대 인문/경상 분리 매칭
        if "숭실대" in c or "숭실" in c:
            if "경상" in c or "상경" in c:
                return "#숭실대(경상) 파이널반_이태규T"
            elif "인문" in c:
                return "#숭실대(인문) 파이널반_이태규T"
            clean_student = (student_name or "").strip()
            if clean_student in ("이성재", "정예서", "김효민"):
                return "#숭실대(경상) 파이널반_이태규T"
            elif clean_student:
                return "#숭실대(인문) 파이널반_이태규T"
            return c

        # 5. 대학명 추출 및 기존 강좌 매칭 (예: "인문논술 - (특강) 덕성여대 파이널 (2026-11)" -> "#덕성여대 파이널반_조희재T")
        m = re.search(r'([가-힣]+대)', c)
        if m:
            univ = m.group(1)
            for canon in cls.CANONICAL_COURSES:
                if univ in canon:
                    return canon

        return c

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
                            if "course" in r:
                                r["course"] = self.normalize_course_name(r["course"], student_name=r.get("name", ""))
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
        Runs every 1 minute (60 seconds) or when force=True.
        """
        import time
        now = time.time()
        # 1-minute interval check (60 seconds)
        if not force and hasattr(self, "last_bills_sheet_sync_time") and (now - self.last_bills_sheet_sync_time < 60) and self.raw_records:
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
        if not force and hasattr(self, "last_master_sync") and (now - self.last_master_sync < 60) and self.master_contacts:
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
        """Check if 1 minute (60s) has passed for Google Sheets in a non-blocking background thread"""
        import time, threading
        now = time.time()
        needs_bills = (now - getattr(self, "last_bills_sheet_sync_time", 0) >= 60)
        needs_master = (now - getattr(self, "last_master_sync", 0) >= 60)

        if not (needs_bills or needs_master):
            return

        # If we have no data at all OR this process has never synced yet (last_bills_sheet_sync_time == 0.0),
        # sync synchronously so the first request always has real-time, up-to-date payment status!
        if not self.raw_records or not self.master_contacts or getattr(self, "last_bills_sheet_sync_time", 0.0) == 0.0:
            if needs_bills:
                self.sync_from_google_sheet_bills(force=True)
            if needs_master:
                self.sync_master_db_from_google_sheet(force=True)
            return

        # If we already have fresh data, run sync in a background daemon thread so user requests are never delayed!
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

    @staticmethod
    def is_final_course(course: str) -> bool:
        if not course or not isinstance(course, str):
            return False
        c = course.strip()
        if "파이널" not in c:
            return False
        # Exclude regular CSAT classes like "수능국어 파이널반" or "10월 수능국어 파이널반"
        if "수능국어" in c or "수능" in c:
            return False
        # Match '#' or essay/special keywords
        if "#" in c or "논술" in c or "특강" in c or "패키지" in c or "반" in c:
            return True
        return False

    def _process_dataframe(self, df: pd.DataFrame, source_name: str):
        """Process raw dataframe dynamically supporting both 17-col and 19-col 결제선생/Google Sheets formats"""
        records = []
        num_cols = len(df.columns)
        
        # Build dynamic column mapping from headers
        col_map = {}
        for col_idx, col_name in enumerate(df.columns):
            c_clean = str(col_name).strip().replace(" ", "").lower()
            if not c_clean:
                continue
            if any(k in c_clean for k in ["발송일시", "발송시간", "발송일"]):
                col_map.setdefault("date", col_idx)
            elif any(k in c_clean for k in ["이름", "수강생", "성명", "학생명"]):
                col_map.setdefault("name", col_idx)
            elif any(k in c_clean for k in ["전화번호", "휴대폰", "연락처", "핸드폰"]):
                col_map.setdefault("phone", col_idx)
            elif "청구금액" in c_clean:
                col_map.setdefault("bill_amount", col_idx)
            elif "결제금액" in c_clean:
                col_map.setdefault("paid_amount", col_idx)
            elif any(k in c_clean for k in ["금액", "수납액", "수강료"]):
                col_map.setdefault("amount", col_idx)
            elif any(k in c_clean for k in ["품목", "강좌명", "강좌", "수업명", "수업"]):
                col_map.setdefault("course", col_idx)
            elif any(k in c_clean for k in ["안내메시지", "안내문구", "메시지"]):
                col_map.setdefault("notice", col_idx)
            elif any(k in c_clean for k in ["발송인", "담당자"]):
                col_map.setdefault("sender", col_idx)
            elif "재발송" in c_clean:
                col_map.setdefault("resend_cnt", col_idx)
            elif any(k in c_clean for k in ["수납상태", "상태", "결제상태"]):
                col_map.setdefault("status", col_idx)
            elif any(k in c_clean for k in ["수납방법", "결제수단"]):
                col_map.setdefault("pay_method", col_idx)
            elif any(k in c_clean for k in ["카드사", "카드"]):
                col_map.setdefault("card_company", col_idx)
            elif any(k in c_clean for k in ["결제일시", "수납일시", "결제일"]):
                col_map.setdefault("pay_date", col_idx)
            elif "승인번호" in c_clean and "취소" not in c_clean:
                col_map.setdefault("approval_no", col_idx)
            elif "취소일시" in c_clean or "취소일" in c_clean:
                col_map.setdefault("cancel_date", col_idx)
            elif "취소승인" in c_clean:
                col_map.setdefault("cancel_approval_no", col_idx)
            elif "파기일시" in c_clean or "파기일" in c_clean:
                col_map.setdefault("cancel_date_p", col_idx)
            elif any(k in c_clean for k in ["파기사유", "취소사유", "환불사유"]):
                col_map.setdefault("cancel_reason", col_idx)

        is_19_col = (num_cols >= 19)
        def idx_or_default(key: str, default_pos: int) -> int:
            return col_map.get(key, default_pos)

        idx_date = idx_or_default("date", 0)
        idx_name = idx_or_default("name", 1)
        idx_phone = idx_or_default("phone", 2)
        idx_bill = idx_or_default("bill_amount", 3 if is_19_col else -1)
        idx_paid = idx_or_default("paid_amount", 4 if is_19_col else -1)
        idx_amt = idx_or_default("amount", -1 if is_19_col else 3)
        idx_course = idx_or_default("course", 5 if is_19_col else 4)
        idx_notice = idx_or_default("notice", 6 if is_19_col else 5)
        idx_sender = idx_or_default("sender", 7 if is_19_col else 6)
        idx_resend = idx_or_default("resend_cnt", 8 if is_19_col else 7)
        idx_status = idx_or_default("status", 9 if is_19_col else 8)
        idx_method = idx_or_default("pay_method", 10 if is_19_col else 9)
        idx_card = idx_or_default("card_company", 12 if is_19_col else 10)
        idx_paydate = idx_or_default("pay_date", 13 if is_19_col else 11)
        idx_appno = idx_or_default("approval_no", 14 if is_19_col else 12)
        idx_cdate = idx_or_default("cancel_date", 15 if is_19_col else 13)
        idx_cappno = idx_or_default("cancel_approval_no", 16 if is_19_col else 14)
        idx_pdate = idx_or_default("cancel_date_p", 17 if is_19_col else 15)
        idx_creason = idx_or_default("cancel_reason", 18 if is_19_col else 16)

        def parse_amt_val(val: Any) -> int:
            if not val or pd.isna(val):
                return 0
            try:
                clean = re.sub(r"[^\d.]", "", str(val))
                return int(float(clean)) if clean else 0
            except:
                return 0

        for idx, row in df.iterrows():
            def get_val(col_idx, default=""):
                if 0 <= col_idx < num_cols:
                    val = row.iloc[col_idx]
                    if pd.isna(val):
                        return default
                    return str(val).strip()
                return default

            raw_date = get_val(idx_date)
            name = get_val(idx_name)
            name = NAME_CORRECTIONS.get(name, name)
            raw_phone = get_val(idx_phone)

            b_amt = parse_amt_val(get_val(idx_bill)) if idx_bill >= 0 else 0
            p_amt = parse_amt_val(get_val(idx_paid)) if idx_paid >= 0 else 0
            a_amt = parse_amt_val(get_val(idx_amt)) if idx_amt >= 0 else 0
            amount_int = b_amt or a_amt or p_amt

            raw_course = get_val(idx_course)
            course = self.normalize_course_name(raw_course, student_name=name)
            notice = get_val(idx_notice)
            sender = get_val(idx_sender)
            resend_cnt = get_val(idx_resend, "0")
            status = get_val(idx_status)
            pay_method = get_val(idx_method)
            card_company = get_val(idx_card)
            pay_date = get_val(idx_paydate)
            approval_no = get_val(idx_appno)
            cancel_date = get_val(idx_cdate)
            cancel_approval_no = get_val(idx_cappno)
            cancel_date_p = get_val(idx_pdate)
            cancel_reason = get_val(idx_creason)

            # Auto infer status if missing
            if not status or status.lower() in ("nan", "none", ""):
                if pay_date or p_amt > 0:
                    status = "수납"
                else:
                    status = "미납"
            
            # Clean phone
            digits_phone = re.sub(r"\D", "", raw_phone)
            phone_tail = digits_phone[-4:] if len(digits_phone) >= 4 else digits_phone.zfill(4)
                
            records.append({
                "row_index": idx,
                "date": raw_date,
                "name": name,
                "phone": raw_phone,
                "phone_tail": phone_tail,
                "amount": amount_int,
                "course": course,
                "raw_course": raw_course,
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
                    changed_old_courses.append(self.normalize_course_name(match.group(1).strip(), student_name=clean_name))

        # Step 2: Filter results
        results = []
        for r in student_rows:
            course = r["course"]
            status = r["status"]
            cancel_reason = r["cancel_reason"]
            date_val = r["date"]
            
            # Rule 1: Must be a final course
            if not self.is_final_course(course):
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
            
        final_records = [r for r in self.raw_records if self.is_final_course(r["course"])]
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
        """Return list of distinct final courses, merging 약술형 courses"""
        if self.auto_sync_enabled:
            self.check_and_sync_bills_sheet()
            self.sync_from_latest_download()

        courses = set()
        for r in self.raw_records:
            if self.is_final_course(r["course"]):
                courses.add(self.normalize_course_name(r["course"], student_name=r.get("name", "")))
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
            
        def is_course_match(target: str, actual: str, s_name: str = "") -> bool:
            if not target or not actual:
                return False
            norm_target = self.normalize_course_name(target, student_name=s_name)
            norm_actual = self.normalize_course_name(actual, student_name=s_name)
            if "약술" in norm_target and "약술" in norm_actual:
                return True
            if "숭실대" in norm_target or "숭실대" in norm_actual:
                if "숭실대" not in norm_target or "숭실대" not in norm_actual:
                    return False
                if "경상" in norm_target or "상경" in norm_target:
                    return ("경상" in norm_actual or "상경" in norm_actual)
                if "인문" in norm_target:
                    return ("인문" in norm_actual)
            if "중앙대" in norm_target or "중앙대" in norm_actual:
                if "중앙대" not in norm_target or "중앙대" not in norm_actual:
                    return False
                return norm_target == norm_actual
            if "홍익대" in norm_target or "홍익대" in norm_actual or "홍대" in norm_target or "홍대" in norm_actual:
                if not (("홍익대" in norm_target or "홍대" in norm_target) and ("홍익대" in norm_actual or "홍대" in norm_actual)):
                    return False
                return norm_target == norm_actual
            return norm_target == norm_actual or norm_target in norm_actual or norm_actual in norm_target

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
                student_changes[key].append(self.normalize_course_name(match.group(1).strip(), student_name=r_name))
                
        students = []
        for r in self.raw_records:
            if not self.is_final_course(r["course"]):
                continue
            r_name = NAME_CORRECTIONS.get(r["name"], r["name"])
            if not is_course_match(course_name, r["course"], s_name=r_name):
                continue
                
            key = (r_name, r["phone_tail"])
            if key in student_changes:
                if any(is_course_match(c, r["course"], s_name=r_name) for c in student_changes[key]):
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

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

class DataManager:
    def __init__(self):
        self.raw_records: List[Dict[str, Any]] = []
        self.last_sync_time: Optional[str] = None
        self.last_file_name: Optional[str] = None
        self.last_file_mtime: Optional[float] = None
        self.auto_sync_enabled: bool = True
        self.master_contacts: Dict[str, Dict[str, str]] = {}
        
        # Load masterDB contacts
        self.load_master_db()
        
        # Load initially from downloads or bundled data
        self.sync_from_latest_download()
        if not self.raw_records:
            bundled = os.path.join(DATA_DIR, "master_bills.xlsx")
            if os.path.exists(bundled):
                self.load_excel_file(bundled)

    def load_master_db(self):
        """Load student and parent contact mapping from contacts_master.json or master_db.xlsx"""
        # 1. From precompiled JSON
        if os.path.exists(MASTER_CONTACTS_FILE):
            try:
                with open(MASTER_CONTACTS_FILE, "r", encoding="utf-8") as f:
                    self.master_contacts = json.load(f)
            except Exception as e:
                print(f"[load_master_db error]: {e}")

        # 2. Check for latest master_db excel in data or Downloads
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
        def clean_phone(val):
            if not val or val == "None" or val == "000-0000-0000":
                return ""
            digits = re.sub(r"\D", "", str(val))
            if len(digits) == 11:
                return f"{digits[:3]}-{digits[3:7]}-{digits[7:]}"
            elif len(digits) == 10:
                return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"
            return str(val).strip()

        def add_contact(name, s_phone, p_phone):
            name = str(name or "").strip()
            if not name or name == "None" or len(name) < 2:
                return
            s = clean_phone(s_phone)
            p = clean_phone(p_phone)
            if name not in self.master_contacts:
                self.master_contacts[name] = {"student_phone": "", "parent_phone": ""}
            if s:
                self.master_contacts[name]["student_phone"] = s
            if p:
                self.master_contacts[name]["parent_phone"] = p

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
        """Automatically find and parse latest excel file"""
        latest_file = self.find_latest_download_file()
        if not latest_file:
            bundled = os.path.join(DATA_DIR, "master_bills.xlsx")
            if os.path.exists(bundled) and self.last_file_name != "master_bills.xlsx":
                return self.load_excel_file(bundled)
            return False
            
        # Check if already loaded and file not modified
        file_mtime = os.path.getmtime(latest_file)
        if self.last_file_name == os.path.basename(latest_file) and self.last_file_mtime == file_mtime:
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
            # Check if there is a newer file
            self.sync_from_latest_download()
            
        clean_name = name.strip()
        clean_tail = re.sub(r"\D", "", phone_tail.strip())
        if len(clean_tail) < 4:
            clean_tail = clean_tail.zfill(4)
            
        student_rows = []
        changed_old_courses = []
        
        # Step 1: Find student matching rows and collect course change notices
        for r in self.raw_records:
            if r["name"] == clean_name and r["phone_tail"] == clean_tail:
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
            
            # Rule 1: Must include '#'
            if "#" not in course:
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
        """Compute summary statistics matching Payssam manager site"""
        if self.auto_sync_enabled:
            self.sync_from_latest_download()
            
        total_count = len(self.raw_records)
        total_amount = sum(r["amount"] for r in self.raw_records)
        
        paid_rows = [r for r in self.raw_records if r["status"] == "수납" or (r["status"] == "파기" and "현장납부" in re.sub(r"\s+", "", r["cancel_reason"]))]
        unpaid_rows = [r for r in self.raw_records if r["status"] == "미납"]
        cancel_rows = [r for r in self.raw_records if r["status"] == "취소"]
        destroy_rows = [r for r in self.raw_records if r["status"] == "파기" and "현장납부" not in re.sub(r"\s+", "", r["cancel_reason"])]
        
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
        """Return list of distinct final courses (# included)"""
        courses = set()
        for r in self.raw_records:
            if "#" in r["course"]:
                courses.add(r["course"])
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
            self.sync_from_latest_download()
            
        # Collect changed old courses across all records
        student_changes = {}
        for r in self.raw_records:
            notice = r.get("notice", "")
            match = re.search(r"(#[^\s→\->]+(?:\s+[^\s→\->]+)*)\s*(?:→|->)", notice)
            if match:
                key = (r["name"], r["phone_tail"])
                if key not in student_changes:
                    student_changes[key] = []
                student_changes[key].append(match.group(1).strip())
                
        students = []
        for r in self.raw_records:
            if course_name not in r["course"] and r["course"] not in course_name:
                continue
                
            key = (r["name"], r["phone_tail"])
            if key in student_changes:
                if any(c in r["course"] or r["course"] in c for c in student_changes[key]):
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
                
            master_info = self.master_contacts.get(r["name"], {})
            s_phone = master_info.get("student_phone") or "-"
            p_phone = master_info.get("parent_phone") or r["phone"] or "-"

            students.append({
                "name": r["name"],
                "phone": r["phone"],
                "student_phone": s_phone,
                "parent_phone": p_phone,
                "phone_tail": r["phone_tail"],
                "course": r["course"],
                "status": status,
                "date": r["date"],
                "amount": r["amount"]
            })
            
        # Sort by Korean name (가나다순)
        students.sort(key=lambda s: s["name"])
        return students

# Singleton instance
data_manager = DataManager()

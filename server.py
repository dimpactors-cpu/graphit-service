import os
import threading
import time
import hmac
import hashlib
import json
import re
import csv
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime
import uvicorn
from fastapi import FastAPI, UploadFile, File, Request, Query
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional

from data_manager import data_manager

# Security & Authentication Settings
ADMIN_SECRET_KEY = os.environ.get("ADMIN_SECRET_KEY", "dimpact-daechi-secret-key-2026")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "dimpact1234!")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "1058171620857-e9280pb9lvqr6bjhnmrhbtmsfq8s8uuc.apps.googleusercontent.com")
ADMIN_GOOGLE_EMAILS = [e.strip().lower() for e in os.environ.get("ADMIN_GOOGLE_EMAILS", "d.impactors@gmail.com").split(",") if e.strip()]

def create_session_token(identity: str) -> str:
    timestamp = str(int(time.time()))
    payload = f"{identity}:{timestamp}"
    sig = hmac.new(ADMIN_SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}:{sig}"

def verify_session_token(token: Optional[str]) -> Optional[str]:
    if not token:
        return None
    try:
        parts = token.split(":")
        if len(parts) != 3:
            return None
        identity, ts_str, sig = parts
        expected_sig = hmac.new(ADMIN_SECRET_KEY.encode(), f"{identity}:{ts_str}".encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        # Valid for 14 days
        if time.time() - int(ts_str) > 14 * 86400:
            return None
        return identity
    except Exception:
        return None

def get_current_user(request: Request) -> Optional[str]:
    token = request.cookies.get("dimpact_admin_session")
    return verify_session_token(token)

def find_dir(name):
    candidates = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), name),
        os.path.join(os.getcwd(), name),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), name),
    ]
    for c in candidates:
        if os.path.isdir(c):
            return c
    return candidates[0]

TEMPLATES_DIR = find_dir("templates")
STATIC_DIR = find_dir("static")

app = FastAPI(title="디임팩트학원 수강생 신청이력 조회 서비스", redirect_slashes=False)

# Normalize Vercel serverless request paths
@app.middleware("http")
async def fix_vercel_path(request: Request, call_next):
    # Check if Vercel passed the matched path via query parameter
    route_path = request.query_params.get("__route_path")
    if route_path:
        clean_path = route_path.split("?")[0]
        if not clean_path.startswith("/"):
            clean_path = "/" + clean_path
        # Clean trailing slash if not root
        if len(clean_path) > 1 and clean_path.endswith("/"):
            clean_path = clean_path[:-1]
        request.scope["path"] = clean_path
    else:
        path = request.scope.get("path", "")
        for prefix in ("/api/index.py", "/api/index"):
            if path == prefix:
                request.scope["path"] = "/"
                break
            elif path.startswith(prefix + "/"):
                request.scope["path"] = path[len(prefix):]
                break
    return await call_next(request)

# Mount static files
if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

class SearchRequest(BaseModel):
    name: str
    phone_tail: str

class GoogleLoginRequest(BaseModel):
    credential: str

class PasswordLoginRequest(BaseModel):
    password: str

# Background Watcher for Google Sheets ('학생신청현황_마스터DB' & '학원 관리 시스템 테스트의 테스트') - runs immediately and every 5 minutes
def background_sheets_sync_watcher():
    print("[BackgroundWatcher] Started Google Sheets real-time sync worker (interval: 5 min)...")
    while True:
        try:
            print("[BackgroundWatcher] Real-time sync for 학생신청현황_마스터DB and 2. Counseling_Logs...")
            data_manager.sync_from_google_sheet_bills(force=True)
            data_manager.sync_master_db_from_google_sheet(force=True)
        except Exception as e:
            print(f"[Background Sheet Sync Error]: {e}")
        time.sleep(300) # every 5 minutes

sheets_sync_thread = threading.Thread(target=background_sheets_sync_watcher, daemon=True)
sheets_sync_thread.start()

# --- Page Routes ---

@app.get("/", response_class=HTMLResponse)
@app.get("/api/index", response_class=HTMLResponse)
@app.get("/api/index.py", response_class=HTMLResponse)
async def read_index():
    index_path = os.path.join(TEMPLATES_DIR, "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        return f.read()

@app.get("/admin/login", response_class=HTMLResponse)
@app.get("/api/index/admin/login", response_class=HTMLResponse)
async def read_admin_login(request: Request):
    user = get_current_user(request)
    if user:
        return RedirectResponse(url="/admin", status_code=303)
    login_path = os.path.join(TEMPLATES_DIR, "admin_login.html")
    with open(login_path, "r", encoding="utf-8") as f:
        html = f.read()
    html = html.replace("{{ google_client_id }}", GOOGLE_CLIENT_ID)
    return HTMLResponse(content=html)

@app.get("/admin", response_class=HTMLResponse)
@app.get("/api/index/admin", response_class=HTMLResponse)
async def read_admin(request: Request):
    user = get_current_user(request)
    if not user:
        return RedirectResponse(url="/admin/login", status_code=303)
    admin_path = os.path.join(TEMPLATES_DIR, "admin.html")
    with open(admin_path, "r", encoding="utf-8") as f:
        html = f.read()
    user_str = str(user or "관리자")
    html = html.replace('id="adminUserTag">관리자</span>', f'id="adminUserTag">{user_str}</span>')
    return HTMLResponse(content=html)

# --- API Endpoints ---

@app.post("/api/search")
async def api_search(req: SearchRequest):
    try:
        data_manager.check_and_sync_google_sheets()
        results = data_manager.search_student(req.name, req.phone_tail)
        return {"success": True, "data": results}
    except Exception as e:
        return {"success": False, "message": str(e), "data": []}

# --- Auth Endpoints ---

@app.get("/api/auth/me")
async def api_auth_me(request: Request):
    user = get_current_user(request)
    if not user:
        return JSONResponse(status_code=401, content={"authenticated": False, "message": "로그인이 필요합니다."})
    return {"authenticated": True, "user": user}

@app.post("/api/auth/google")
async def api_auth_google(req: GoogleLoginRequest):
    try:
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={req.credential}"
        req_obj = urllib.request.Request(url, headers={"User-Agent": "dimpact-bills-auth"})
        with urllib.request.urlopen(req_obj, timeout=5) as response:
            data = json.loads(response.read().decode())
        
        email = data.get("email", "").strip().lower()
        email_verified = data.get("email_verified")
        if str(email_verified).lower() not in ("true", "1"):
            return JSONResponse(status_code=403, content={"success": False, "message": "이메일 인증이 완료되지 않은 구글 계정입니다."})
        
        # Check whitelist if configured
        if ADMIN_GOOGLE_EMAILS and email not in ADMIN_GOOGLE_EMAILS:
            return JSONResponse(
                status_code=403, 
                content={
                    "success": False, 
                    "message": f"승인되지 않은 구글 계정입니다 ({email}). 학원 관리자 계정으로 로그인해주세요."
                }
            )
        
        token = create_session_token(email)
        res = JSONResponse(content={"success": True, "email": email})
        res.set_cookie(
            key="dimpact_admin_session",
            value=token,
            max_age=14 * 86400,
            httponly=True,
            samesite="lax",
            path="/"
        )
        return res
    except urllib.error.HTTPError:
        return JSONResponse(status_code=400, content={"success": False, "message": "유효하지 않거나 만료된 구글 인증 정보입니다."})
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"구글 로그인 처리 오류: {str(e)}"})

@app.post("/api/auth/password")
async def api_auth_password(req: PasswordLoginRequest):
    if req.password == ADMIN_PASSWORD:
        token = create_session_token("admin")
        res = JSONResponse(content={"success": True, "email": "admin"})
        res.set_cookie(
            key="dimpact_admin_session",
            value=token,
            max_age=14 * 86400,
            httponly=True,
            samesite="lax",
            path="/"
        )
        return res
    return JSONResponse(status_code=401, content={"success": False, "message": "관리자 암호가 일치하지 않습니다."})

@app.post("/api/auth/logout")
async def api_auth_logout():
    res = JSONResponse(content={"success": True})
    res.delete_cookie(key="dimpact_admin_session", path="/")
    return res

# --- Admin API Endpoints ---

@app.get("/api/admin/stats")
async def api_stats(request: Request):
    if not get_current_user(request):
        return JSONResponse(status_code=401, content={"success": False, "message": "관리자 로그인이 필요합니다."})
    try:
        data_manager.check_and_sync_google_sheets()
        stats = data_manager.get_admin_stats()
        return {"success": True, "stats": stats}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.get("/api/admin/courses")
async def api_courses(request: Request):
    if not get_current_user(request):
        return JSONResponse(status_code=401, content={"success": False, "message": "관리자 로그인이 필요합니다."})
    try:
        data_manager.check_and_sync_google_sheets()
        courses = data_manager.get_courses()
        return {"success": True, "courses": courses}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.get("/api/admin/course-students")
async def api_course_students(
    request: Request,
    course: str = Query(...),
    status: Optional[str] = Query(None)
):
    if not get_current_user(request):
        return JSONResponse(status_code=401, content={"success": False, "message": "관리자 로그인이 필요합니다."})
    try:
        data_manager.check_and_sync_google_sheets()
        students = data_manager.get_course_students(course, status_filter=status if status else "")
        return {"success": True, "students": students}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.post("/api/admin/sync-master-db")
async def api_sync_master_db(request: Request):
    if not get_current_user(request):
        return JSONResponse(status_code=401, content={"success": False, "message": "관리자 로그인이 필요합니다."})
    try:
        ok = data_manager.sync_master_db_from_google_sheet(force=True)
        return {
            "success": ok, 
            "count": len(data_manager.master_contacts),
            "source": getattr(data_manager, "last_master_sync_source", "Google Sheets"),
            "status_msg": getattr(data_manager, "last_master_sync_status", "")
        }
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.post("/api/admin/upload")
async def api_upload(request: Request, file: UploadFile = File(...)):
    if not get_current_user(request):
        return JSONResponse(status_code=401, content={"success": False, "message": "관리자 로그인이 필요합니다."})
    try:
        content = await file.read()
        success = data_manager.load_excel_from_bytes(content, file.filename)
        if success:
            return {
                "success": True,
                "message": f"Successfully loaded {file.filename}",
                "count": len(data_manager.raw_records)
            }
        else:
            return {"success": False, "message": "Failed to parse excel file"}
    except Exception as e:
        return {"success": False, "message": str(e)}

DATA_DIR = find_dir("data")
GOOGLE_SHEET_SCHEDULE_CSV_URL = "https://docs.google.com/spreadsheets/d/1OCiAw0U8j7fbD8Epbi5vpd1LtQpVG_rLl-kDbbWcW08/export?format=csv&gid=0"
GOOGLE_SHEET_YAKSUL_CSV_URL = "https://docs.google.com/spreadsheets/d/1OCiAw0U8j7fbD8Epbi5vpd1LtQpVG_rLl-kDbbWcW08/export?format=csv&gid=1001"
schedule_cache = {"time": 0, "rows": [], "yaksul_rows": []}

def _init_schedule_cache():
    import csv
    local_cache_path = os.path.join(DATA_DIR, "final_schedule.csv")
    if os.path.exists(local_cache_path):
        try:
            with open(local_cache_path, "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                rows = []
                for r in reader:
                    if len(r) >= 6 and r[0] and r[0] != "대학/강의명" and "일정표" not in r[0] and not r[0].startswith("*"):
                        rows.append({
                            "name": r[0].strip(),
                            "instructor": r[1].strip(),
                            "session1": r[2].strip(),
                            "session2": r[3].strip(),
                            "session3": r[4].strip(),
                            "exam_date": r[5].strip(),
                        })
                if rows:
                    schedule_cache["rows"] = rows
        except Exception:
            pass

    yaksul_cache_path = os.path.join(DATA_DIR, "yaksul_schedule.csv")
    if os.path.exists(yaksul_cache_path):
        try:
            with open(yaksul_cache_path, "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                y_rows = []
                for r in reader:
                    if len(r) >= 7 and r[1] and "강좌" not in r[1] and "일정표" not in r[0] and not r[0].startswith("*"):
                        y_rows.append({
                            "subject": r[0].strip(),
                            "class_name": r[1].strip(),
                            "instructor": r[2].strip(),
                            "session1": r[3].strip(),
                            "session2": r[4].strip(),
                            "session3": r[5].strip(),
                            "session4": r[6].strip(),
                            "target_univ": r[7].strip() if len(r) > 7 else ""
                        })
                if y_rows:
                    schedule_cache["yaksul_rows"] = y_rows
        except Exception:
            pass

    if schedule_cache["rows"]:
        schedule_cache["time"] = time.time()

_init_schedule_cache()

def get_final_schedules_from_sheet():
    now = time.time()
    # If cache is valid (2 hours), return immediately
    if now - schedule_cache["time"] < 7200 and schedule_cache["rows"] and schedule_cache.get("yaksul_rows"):
        return schedule_cache["rows"], schedule_cache["yaksul_rows"]
    
    # If cache exists but is older than 2 hours, try fetching live Google Sheet with fast timeout
    import csv, io
    try:
        # gid=0 (대학별 파이널)
        req = urllib.request.Request(GOOGLE_SHEET_SCHEDULE_CSV_URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            content = resp.read().decode("utf-8")
        reader = csv.reader(io.StringIO(content))
        rows = []
        for r in reader:
            if len(r) >= 6 and r[0] and r[0] != "대학/강의명" and "일정표" not in r[0] and not r[0].startswith("*"):
                rows.append({
                    "name": r[0].strip(),
                    "instructor": r[1].strip(),
                    "session1": r[2].strip(),
                    "session2": r[3].strip(),
                    "session3": r[4].strip(),
                    "exam_date": r[5].strip(),
                })
        if rows:
            # Merge with local final_schedule.csv to ensure 11.23~12.05 post-CSAT universities are never lost
            existing_names = {r["name"] for r in rows}
            local_cache_path = os.path.join(DATA_DIR, "final_schedule.csv")
            if os.path.exists(local_cache_path):
                try:
                    with open(local_cache_path, "r", encoding="utf-8") as f:
                        for lr in csv.reader(f):
                            if len(lr) >= 6 and lr[0] and lr[0] != "대학/강의명" and "일정표" not in lr[0] and not lr[0].startswith("*"):
                                if lr[0].strip() not in existing_names:
                                    rows.append({
                                        "name": lr[0].strip(),
                                        "instructor": lr[1].strip(),
                                        "session1": lr[2].strip(),
                                        "session2": lr[3].strip(),
                                        "session3": lr[4].strip(),
                                        "exam_date": lr[5].strip(),
                                    })
                                    existing_names.add(lr[0].strip())
                except Exception:
                    pass
            schedule_cache["rows"] = rows

        schedule_cache["time"] = now
    except Exception as e:
        print(f"[Google Sheet Fetch Warning]: {e}")
        
    return schedule_cache.get("rows", []), schedule_cache.get("yaksul_rows", [])

@app.get("/api/admin/schedule")
async def api_schedule(request: Request, course: str = Query("")):
    if not get_current_user(request):
        return JSONResponse(status_code=401, content={"success": False, "message": "관리자 로그인이 필요합니다."})
    
    try:
        sheet_schedules, yaksul_schedules = get_final_schedules_from_sheet()
        
        # 1. 약술형 강좌 처리
        if "약술" in course:
            schedule_header = "■ 강의 일정: 총 4회 완성"
            korean_block = (
                "[국어 - 조희재T (토/일 13:00~16:00)]\n"
                "- 1회차: 10/17(토) 13:00~16:00\n"
                "- 2회차: 10/18(일) 13:00~16:00\n"
                "- 3회차: 10/24(토) 13:00~16:00\n"
                "- 4회차: 10/25(일) 13:00~16:00"
            )
            math_block = (
                "[수학 - 장인환T (금/일 18:00~21:00)]\n"
                "- 1회차: 10/16(금) 18:00~21:00\n"
                "- 2회차: 10/18(일) 18:00~21:00\n"
                "- 3회차: 10/23(금) 18:00~21:00\n"
                "- 4회차: 10/25(일) 18:00~21:00"
            )

            if "국어" in course and "수학" not in course:
                instructor = "조희재T(국어)"
                lecture_schedule = korean_block
            elif "수학" in course and "국어" not in course:
                instructor = "장인환T(수학)"
                lecture_schedule = math_block
            else:
                instructor = "조희재T(국어), 장인환T(수학)"
                lecture_schedule = f"{korean_block}\n\n{math_block}"

            matched = {
                "name": "약술형 파이널",
                "instructor": instructor,
                "classes": yaksul_schedules
            }

            return {
                "success": True,
                "course": course,
                "matched": matched,
                "instructor": instructor,
                "schedule_header": schedule_header,
                "exam_date": "",
                "lecture_schedule": lecture_schedule,
                "all_schedules": sheet_schedules,
                "yaksul_schedules": yaksul_schedules
            }

        # 2. 대학별 파이널 강좌 매칭
        matched = None
        for row in sheet_schedules:
            s_name = row["name"]
            univ_m = re.search(r'([가-힣]+대)', s_name)
            if not univ_m:
                continue
            univ = univ_m.group(1)
            if univ not in course:
                continue
                
            if "홍익대" in course or "홍대" in course:
                if ("A" in s_name and ("(A)" in course or "A반" in course)) or \
                   ("B" in s_name and ("(B)" in course or "B반" in course)):
                    matched = row
                    break
                continue
                
            if "중앙대" in course:
                if "경영경제" in s_name and "경영경제" in course:
                    matched = row
                    break
                if "인문사회" in s_name and "인문사회" in course:
                    matched = row
                    break
                if ("일반" in s_name or "일반-인문" in s_name) and ("일반" in course or "일반-인문" in course):
                    matched = row
                    break
                continue
                
            matched = row
            break

        schedule_header = "■ 강의 일정: 총 3회 완성"
        if matched:
            lecture_schedule = f"- 1회차: {matched['session1']}\n\n- 2회차: {matched['session2']}\n\n- 3회차: {matched['session3']}"
            instructor = matched["instructor"]
            exam_date = matched["exam_date"]
        else:
            lecture_schedule = "- 1회차: 00월 00일(요일) 00:00 ~ 00:00\n\n- 2회차: 00월 00일(요일) 00:00 ~ 00:00\n\n- 3회차: 00월 00일(요일) 00:00 ~ 00:00"
            instructor = ""
            exam_date = ""

        return {
            "success": True,
            "course": course,
            "matched": matched,
            "instructor": instructor,
            "schedule_header": schedule_header,
            "exam_date": exam_date,
            "lecture_schedule": lecture_schedule,
            "all_schedules": sheet_schedules
        }
    except Exception as e:
        print(f"[Error in api_schedule]: {e}")
        return {
            "success": True,
            "course": course,
            "matched": None,
            "instructor": "",
            "exam_date": "",
            "lecture_schedule": "- 1회차: 00월 00일(요일) 00:00 ~ 00:00\n\n- 2회차: 00월 00일(요일) 00:00 ~ 00:00\n\n- 3회차: 00월 00일(요일) 00:00 ~ 00:00",
            "all_schedules": []
        }

@app.post("/api/admin/upload-master-db")
async def api_upload_master_db(request: Request, file: UploadFile = File(...)):
    if not get_current_user(request):
        return JSONResponse(status_code=401, content={"success": False, "message": "관리자 로그인이 필요합니다."})
    try:
        content = await file.read()
        success = data_manager.load_master_db_from_bytes(content, file.filename)
        if success:
            return {
                "success": True,
                "message": f"성공적으로 학원 관리 masterDB ({file.filename})를 반영했습니다.",
                "contacts_count": len(data_manager.master_contacts)
            }
        else:
            return {"success": False, "message": "masterDB 파일 파싱에 실패했습니다."}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.post("/api/admin/sync")
async def api_sync(request: Request):
    if not get_current_user(request):
        return JSONResponse(status_code=401, content={"success": False, "message": "관리자 로그인이 필요합니다."})
    try:
        # 1. Force sync latest Google Sheet bills ('학생신청현황_마스터DB')
        data_manager.sync_from_google_sheet_bills(force=True)
        # 2. Force sync latest Google Sheet contacts ('학원 관리 시스템 테스트의 테스트' / '학원 관리 masterDB')
        data_manager.sync_master_db_from_google_sheet(force=True)
        # 3. Check Downloads folder if newer
        data_manager.sync_from_latest_download()
        return {
            "success": True,
            "message": "구글 스프레드시트(수납내역 & 학생 연락처DB) 및 최신 데이터 동기화 완료",
            "file": data_manager.last_file_name,
            "last_sync": data_manager.last_sync_time,
            "count": len(data_manager.raw_records),
            "contacts_count": len(data_manager.master_contacts),
            "contacts_source": getattr(data_manager, "last_master_sync_source", "")
        }
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.get("/api/admin/attendance-sheet")
async def api_attendance_sheet(
    request: Request,
    course: str = Query(""),
    all_courses: bool = Query(False)
):
    if not get_current_user(request):
        return JSONResponse(status_code=401, content={"success": False, "message": "관리자 로그인이 필요합니다."})
    
    try:
        from attendance_generator import generate_single_course_attendance_excel, generate_all_courses_attendance_excel
        data_manager.check_and_sync_google_sheets()
        
        if all_courses or not course:
            excel_buffer = generate_all_courses_attendance_excel()
            today_str = datetime.now().strftime("%Y%m%d")
            filename = f"디임팩트학원_파이널_종합출석부_{today_str}.xlsx"
        else:
            excel_buffer = generate_single_course_attendance_excel(course)
            clean_name = course.replace('#', '').strip()
            filename = f"디임팩트학원_[{clean_name}]_출석부.xlsx"
            
        encoded_filename = urllib.parse.quote(filename)
        headers = {
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }
        return Response(
            content=excel_buffer.getvalue(),
            headers=headers,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        print(f"[Error generating attendance sheet]: {e}")
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})

if __name__ == "__main__":
    print("=" * 60)
    print("  디임팩트학원 수강생 신청이력 조회 서비스 서버 시작")
    print("  - 학생 조회 페이지: http://localhost:8000")
    print("  - 관리자 대시보드:  http://localhost:8000/admin")
    print("=" * 60)
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)

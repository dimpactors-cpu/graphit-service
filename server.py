import os
import threading
import time
import hmac
import hashlib
import json
import urllib.request
import urllib.error
import uvicorn
from fastapi import FastAPI, UploadFile, File, Request, Query
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional

from data_manager import data_manager

# Security & Authentication Settings
ADMIN_SECRET_KEY = os.environ.get("ADMIN_SECRET_KEY", "dimpact-daechi-secret-key-2026")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "dimpact1234!")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
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

# Background Watcher for Downloads folder (runs only in local mode)
def background_download_watcher():
    if not os.path.exists(os.path.join(os.environ.get("USERPROFILE", ""), "Downloads")):
        return
    print("[BackgroundWatcher] Started monitoring Downloads folder...")
    while True:
        try:
            if data_manager.auto_sync_enabled:
                data_manager.sync_from_latest_download()
        except Exception as e:
            print(f"[BackgroundWatcher Error]: {e}")
        time.sleep(3)

# Start watcher thread
watcher_thread = threading.Thread(target=background_download_watcher, daemon=True)
watcher_thread.start()

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
        return f.read()

# --- API Endpoints ---

@app.post("/api/search")
async def api_search(req: SearchRequest):
    try:
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
            samesite="lax"
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
            samesite="lax"
        )
        return res
    return JSONResponse(status_code=401, content={"success": False, "message": "관리자 암호가 일치하지 않습니다."})

@app.post("/api/auth/logout")
async def api_auth_logout():
    res = JSONResponse(content={"success": True})
    res.delete_cookie(key="dimpact_admin_session")
    return res

# --- Admin API Endpoints ---

@app.get("/api/admin/stats")
async def api_stats(request: Request):
    if not get_current_user(request):
        return JSONResponse(status_code=401, content={"success": False, "message": "관리자 로그인이 필요합니다."})
    try:
        stats = data_manager.get_admin_stats()
        return {"success": True, "stats": stats}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.get("/api/admin/courses")
async def api_courses(request: Request):
    if not get_current_user(request):
        return JSONResponse(status_code=401, content={"success": False, "message": "관리자 로그인이 필요합니다."})
    try:
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
        students = data_manager.get_course_students(course, status_filter=status if status else "")
        return {"success": True, "students": students}
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

@app.post("/api/admin/sync")
async def api_sync(request: Request):
    if not get_current_user(request):
        return JSONResponse(status_code=401, content={"success": False, "message": "관리자 로그인이 필요합니다."})
    try:
        success = data_manager.sync_from_latest_download()
        if success:
            return {
                "success": True,
                "message": "Synchronized with latest file",
                "file": data_manager.last_file_name,
                "count": len(data_manager.raw_records)
            }
        else:
            return {"success": False, "message": "No excel file found in Downloads folder"}
    except Exception as e:
        return {"success": False, "message": str(e)}

if __name__ == "__main__":
    print("=" * 60)
    print("  디임팩트학원 수강생 신청이력 조회 서비스 서버 시작")
    print("  - 학생 조회 페이지: http://localhost:8000")
    print("  - 관리자 대시보드:  http://localhost:8000/admin")
    print("=" * 60)
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)

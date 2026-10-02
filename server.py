import os
import threading
import time
import uvicorn
from fastapi import FastAPI, UploadFile, File, Request, Query
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional

from data_manager import data_manager

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

@app.get("/admin", response_class=HTMLResponse)
@app.get("/api/index/admin", response_class=HTMLResponse)
async def read_admin():
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

@app.get("/api/admin/stats")
async def api_stats():
    try:
        stats = data_manager.get_admin_stats()
        return {"success": True, "stats": stats}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.get("/api/admin/courses")
async def api_courses():
    try:
        courses = data_manager.get_courses()
        return {"success": True, "courses": courses}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.get("/api/admin/course-students")
async def api_course_students(
    course: str = Query(...),
    status: Optional[str] = Query(None)
):
    try:
        students = data_manager.get_course_students(course, status_filter=status if status else "")
        return {"success": True, "students": students}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.post("/api/admin/upload")
async def api_upload(file: UploadFile = File(...)):
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
async def api_sync():
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

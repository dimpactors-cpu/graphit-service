import os
import re
import io
from datetime import datetime
from typing import Dict, List, Any, Optional

import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

from data_manager import data_manager


def sanitize_sheet_name(name: str) -> str:
    """Excel sheet name must be <= 31 chars and cannot contain: \\ / ? * [ ] :"""
    clean = re.sub(r'[\\/*?\[\]:]', '', name)
    clean = clean.replace('#', '').strip()
    # Keep it readable and concise
    if len(clean) > 31:
        clean = clean[:31]
    return clean or "출석부"


def format_phone(val: Any) -> str:
    if not val or val == "None" or val == "000-0000-0000":
        return "-"
    digits = re.sub(r"\D", "", str(val))
    if len(digits) == 11:
        return f"{digits[:3]}-{digits[3:7]}-{digits[7:]}"
    elif len(digits) == 10:
        return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"
    return str(val).strip() or "-"


def build_attendance_sheet(ws, course_name: str, students: List[Dict[str, Any]], schedule_info: Dict[str, Any]):
    """
    Builds a beautifully formatted attendance sheet matching the academy's official standard.
    """
    # 1. Colors & Styles
    COLOR_PRIMARY = "800020"    # Deep Burgundy
    COLOR_SUBTITLE = "FDF5F2"   # Soft warm pastel
    COLOR_WHITE = "FFFFFF"
    COLOR_SUMMARY_1 = "F4F5F7"  # Light gray
    COLOR_SUMMARY_2 = "E5E7EB"  # Mid gray
    COLOR_BORDER = "CBD5E1"     # Slate 300
    COLOR_BORDER_THICK = "475569"

    thin_border = Border(
        left=Side(style='thin', color=COLOR_BORDER),
        right=Side(style='thin', color=COLOR_BORDER),
        top=Side(style='thin', color=COLOR_BORDER),
        bottom=Side(style='thin', color=COLOR_BORDER)
    )

    header_border = Border(
        left=Side(style='thin', color="94A3B8"),
        right=Side(style='thin', color="94A3B8"),
        top=Side(style='thin', color="94A3B8"),
        bottom=Side(style='thin', color="94A3B8")
    )

    # 2. Extract Course Meta Info
    instructor = schedule_info.get("instructor") or ""
    if not instructor:
        ins_m = re.search(r'([가-힣]{2,4}T)', course_name)
        instructor = ins_m.group(1) if ins_m else "디임팩트 강사진"

    exam_date = schedule_info.get("exam_date") or ""
    if not exam_date:
        exam_date = "2026학년도 대입 수시 논술고사"

    room = schedule_info.get("room") or "5층 강의실"

    # Sessions
    sessions = schedule_info.get("sessions", [])
    if not sessions:
        # Default fallback: 3 sessions
        sessions = [
            {"num": 1, "label": "1회차"},
            {"num": 2, "label": "2회차"},
            {"num": 3, "label": "3회차"}
        ]
    num_sessions = len(sessions)

    # Total columns:
    # 1: No, 2: 학생 성명, 3: 학교 / 학년, 4: 학생 연락처, 5: 학부모 연락처, 6: 관계, 7: 수납 상태, 8: 수납일자
    # 9 .. 8 + num_sessions: 회차별 출결 현황
    # +1: 과제 및 대면첨삭, +2: 복습영상 발송, +3: 학생별 상담 메모 및 특이사항
    col_session_start = 9
    col_session_end = 8 + num_sessions
    col_task = col_session_end + 1
    col_video = col_session_end + 2
    col_notes = col_session_end + 3
    total_cols = col_notes

    # Session info string for Row 2
    sess_summary_parts = []
    for s in sessions:
        sess_summary_parts.append(s.get("label", ""))
    sessions_str = ", ".join([p for p in sess_summary_parts if p]) or f"총 {num_sessions}회 완성"

    # 3. Row 1: Title
    clean_title = course_name.replace('#', '').strip()
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=total_cols)
    cell_a1 = ws.cell(1, 1)
    cell_a1.value = f"[2026 대입] {clean_title} 출석부"
    cell_a1.font = Font(name="맑은 고딕", size=15, bold=True, color=COLOR_WHITE)
    cell_a1.alignment = Alignment(horizontal="center", vertical="center")
    cell_a1.fill = PatternFill(start_color=COLOR_PRIMARY, end_color=COLOR_PRIMARY, fill_type="solid")
    ws.row_dimensions[1].height = 38

    # Fill rest of row 1 merged cells for solid color
    for c in range(2, total_cols + 1):
        ws.cell(1, c).fill = PatternFill(start_color=COLOR_PRIMARY, end_color=COLOR_PRIMARY, fill_type="solid")

    # 4. Row 2: Subtitle Course Details
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=total_cols)
    cell_a2 = ws.cell(2, 1)
    cell_a2.value = f"■ 담당강사: {instructor}  |  ■ 수업: {sessions_str} (총{num_sessions}회)  |  ■ 시험일: {exam_date}  |  ■ 강의실: {room}"
    cell_a2.font = Font(name="맑은 고딕", size=9.5, bold=True, color=COLOR_PRIMARY)
    cell_a2.alignment = Alignment(horizontal="center", vertical="center")
    cell_a2.fill = PatternFill(start_color=COLOR_SUBTITLE, end_color=COLOR_SUBTITLE, fill_type="solid")
    ws.row_dimensions[2].height = 24

    for c in range(2, total_cols + 1):
        ws.cell(2, c).fill = PatternFill(start_color=COLOR_SUBTITLE, end_color=COLOR_SUBTITLE, fill_type="solid")

    # Row 3: Blank spacing
    ws.row_dimensions[3].height = 8

    # 5. Row 4 & 5: Header Table
    headers_fixed = [
        (1, "No."),
        (2, "학생 성명"),
        (3, "학교 / 학년"),
        (4, "학생 연락처"),
        (5, "학부모 연락처"),
        (6, "관계"),
        (7, "수납 상태"),
        (8, "수납일자"),
    ]

    for col_idx, label in headers_fixed:
        ws.merge_cells(start_row=4, start_column=col_idx, end_row=5, end_column=col_idx)
        cell = ws.cell(4, col_idx)
        cell.value = label
        cell.font = Font(name="맑은 고딕", size=9, bold=True, color=COLOR_WHITE)
        cell.fill = PatternFill(start_color=COLOR_PRIMARY, end_color=COLOR_PRIMARY, fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = header_border
        ws.cell(5, col_idx).border = header_border
        ws.cell(5, col_idx).fill = PatternFill(start_color=COLOR_PRIMARY, end_color=COLOR_PRIMARY, fill_type="solid")

    # Merge session group header (Row 4)
    ws.merge_cells(start_row=4, start_column=col_session_start, end_row=4, end_column=col_session_end)
    sess_head = ws.cell(4, col_session_start)
    sess_head.value = "회차별 출결 현황 (출석:○ / 지각:△ / 결석:X / 영상:V)"
    sess_head.font = Font(name="맑은 고딕", size=9, bold=True, color=COLOR_WHITE)
    sess_head.fill = PatternFill(start_color=COLOR_PRIMARY, end_color=COLOR_PRIMARY, fill_type="solid")
    sess_head.alignment = Alignment(horizontal="center", vertical="center")
    for c in range(col_session_start, col_session_end + 1):
        ws.cell(4, c).border = header_border
        ws.cell(4, c).fill = PatternFill(start_color=COLOR_PRIMARY, end_color=COLOR_PRIMARY, fill_type="solid")

    # Session individual headers (Row 5)
    for idx, s in enumerate(sessions):
        c_idx = col_session_start + idx
        s_cell = ws.cell(5, c_idx)
        s_cell.value = s.get("label", f"{idx + 1}회차")
        s_cell.font = Font(name="맑은 고딕", size=8.5, bold=True, color=COLOR_WHITE)
        s_cell.fill = PatternFill(start_color=COLOR_PRIMARY, end_color=COLOR_PRIMARY, fill_type="solid")
        s_cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        s_cell.border = header_border

    # Headers after sessions
    headers_post = [
        (col_task, "과제 및\n대면첨삭"),
        (col_video, "복습영상\n발송"),
        (col_notes, "학생별 상담 메모 및 특이사항")
    ]

    for col_idx, label in headers_post:
        ws.merge_cells(start_row=4, start_column=col_idx, end_row=5, end_column=col_idx)
        cell = ws.cell(4, col_idx)
        cell.value = label
        cell.font = Font(name="맑은 고딕", size=9, bold=True, color=COLOR_WHITE)
        cell.fill = PatternFill(start_color=COLOR_PRIMARY, end_color=COLOR_PRIMARY, fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = header_border
        ws.cell(5, col_idx).border = header_border
        ws.cell(5, col_idx).fill = PatternFill(start_color=COLOR_PRIMARY, end_color=COLOR_PRIMARY, fill_type="solid")

    ws.row_dimensions[4].height = 22
    ws.row_dimensions[5].height = 22

    # 6. Student Rows
    current_row = 6
    paid_count = 0
    unpaid_count = 0
    fee_amount = 540000

    for s_idx, s in enumerate(students):
        ws.row_dimensions[current_row].height = 25
        status = s.get("status", "")
        if status == "수납":
            paid_count += 1
            status_text = "수납완료"
            status_color = "059669" # Green
        elif status == "미납":
            unpaid_count += 1
            status_text = "미납(신청)"
            status_color = "DC2626" # Red
        else:
            status_text = status or "-"
            status_color = "475569"

        if s.get("amount") and s["amount"] > 0:
            fee_amount = s["amount"]

        # Date formatting
        raw_date = s.get("pay_date") or s.get("date") or ""
        if status == "미납" and raw_date:
            date_display = f"{raw_date[:10]}(발송)"
        elif raw_date:
            date_display = raw_date[:10]
        else:
            date_display = "-"

        # School & Grade
        school_grade = s.get("school_grade") or "-"

        # Row Data
        row_data = [
            (1, s_idx + 1, "center", False, "000000"),
            (2, s.get("name", "-"), "center", True, "000000"),
            (3, school_grade, "center", False, "000000"),
            (4, format_phone(s.get("student_phone")), "center", False, "000000"),
            (5, format_phone(s.get("parent_phone")), "center", False, "000000"),
            (6, s.get("relationship", "-"), "center", False, "000000"),
            (7, status_text, "center", True, status_color),
            (8, date_display, "center", False, "000000"),
        ]

        # Add empty session cols
        for c in range(col_session_start, col_session_end + 1):
            row_data.append((c, "", "center", False, "000000"))

        # Task, Video, Notes
        row_data.append((col_task, "", "center", False, "000000"))
        row_data.append((col_video, "", "center", False, "000000"))
        row_data.append((col_notes, s.get("notes", ""), "left", False, "334155"))

        # Alternate row background
        row_fill = PatternFill(start_color="F8FAFC" if s_idx % 2 == 1 else "FFFFFF", fill_type="solid")

        for col_idx, val, align_h, is_bold, text_color in row_data:
            c = ws.cell(current_row, col_idx)
            c.value = val
            c.font = Font(name="맑은 고딕", size=9, bold=is_bold, color=text_color)
            c.alignment = Alignment(horizontal=align_h, vertical="center", wrap_text=(col_idx == col_notes))
            c.border = thin_border
            c.fill = row_fill

        current_row += 1

    # 7. Blank Buffer Rows for manual entries (3 extra rows)
    buffer_count = max(3, 10 - len(students))
    for b_idx in range(buffer_count):
        ws.row_dimensions[current_row].height = 25
        num_val = len(students) + b_idx + 1
        for col_idx in range(1, total_cols + 1):
            c = ws.cell(current_row, col_idx)
            c.value = num_val if col_idx == 1 else ""
            c.font = Font(name="맑은 고딕", size=9, color="94A3B8")
            c.alignment = Alignment(horizontal="center", vertical="center")
            c.border = thin_border
            c.fill = PatternFill(start_color="FFFFFF", fill_type="solid")
        current_row += 1

    last_student_row = current_row - 1

    # 8. Summary Row 1: Attendance COUNTIF
    ws.row_dimensions[current_row].height = 25
    ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=8)
    sum_cell = ws.cell(current_row, 1)
    sum_cell.value = "출석 합계 (○ 출석 / △ 지각 / X 결석 / V 영상)"
    sum_cell.font = Font(name="맑은 고딕", size=9, bold=True, color="1E293B")
    sum_cell.alignment = Alignment(horizontal="center", vertical="center")
    sum_cell.fill = PatternFill(start_color=COLOR_SUMMARY_1, fill_type="solid")

    for col_idx in range(1, 9):
        ws.cell(current_row, col_idx).border = thin_border
        ws.cell(current_row, col_idx).fill = PatternFill(start_color=COLOR_SUMMARY_1, fill_type="solid")

    for c_idx in range(col_session_start, col_session_end + 1):
        col_letter = get_column_letter(c_idx)
        c = ws.cell(current_row, c_idx)
        c.value = f'=COUNTIF({col_letter}6:{col_letter}{last_student_row}, "○")'
        c.font = Font(name="맑은 고딕", size=9, bold=True, color="1E293B")
        c.alignment = Alignment(horizontal="center", vertical="center")
        c.border = thin_border
        c.fill = PatternFill(start_color=COLOR_SUMMARY_1, fill_type="solid")

    for c_idx in range(col_session_end + 1, total_cols + 1):
        c = ws.cell(current_row, c_idx)
        c.border = thin_border
        c.fill = PatternFill(start_color=COLOR_SUMMARY_1, fill_type="solid")

    current_row += 1

    # 9. Summary Row 2: Totals, Fee, Signature
    ws.row_dimensions[current_row].height = 26
    # Left: Total students
    ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=4)
    tot_cell = ws.cell(current_row, 1)
    tot_cell.value = f"총 등록 학생: {len(students)}명 (수납완료: {paid_count}명, 미납: {unpaid_count}명)"
    tot_cell.font = Font(name="맑은 고딕", size=9, bold=True, color="1E293B")
    tot_cell.alignment = Alignment(horizontal="center", vertical="center")

    # Mid: Fee
    ws.merge_cells(start_row=current_row, start_column=5, end_row=current_row, end_column=8)
    fee_cell = ws.cell(current_row, 5)
    per_sess = int(fee_amount / num_sessions) if num_sessions > 0 else 0
    fee_cell.value = f"수강료: {fee_amount:,}원 (회당 {per_sess:,}원)"
    fee_cell.font = Font(name="맑은 고딕", size=9, bold=True, color="1E293B")
    fee_cell.alignment = Alignment(horizontal="center", vertical="center")

    # Right: Teacher signature
    ws.merge_cells(start_row=current_row, start_column=9, end_row=current_row, end_column=total_cols)
    sig_cell = ws.cell(current_row, 9)
    sig_cell.value = "강사 확인 서명:                         (인)"
    sig_cell.font = Font(name="맑은 고딕", size=9, bold=True, color="1E293B")
    sig_cell.alignment = Alignment(horizontal="center", vertical="center")

    for col_idx in range(1, total_cols + 1):
        ws.cell(current_row, col_idx).border = thin_border
        ws.cell(current_row, col_idx).fill = PatternFill(start_color=COLOR_SUMMARY_2, fill_type="solid")

    # 10. Column Widths
    ws.column_dimensions['A'].width = 6.0
    ws.column_dimensions['B'].width = 11.0
    ws.column_dimensions['C'].width = 16.0
    ws.column_dimensions['D'].width = 15.0
    ws.column_dimensions['E'].width = 15.0
    ws.column_dimensions['F'].width = 8.0
    ws.column_dimensions['G'].width = 11.0
    ws.column_dimensions['H'].width = 14.0

    for c_idx in range(col_session_start, col_session_end + 1):
        col_letter = get_column_letter(c_idx)
        ws.column_dimensions[col_letter].width = 15.0

    ws.column_dimensions[get_column_letter(col_task)].width = 11.0
    ws.column_dimensions[get_column_letter(col_video)].width = 11.0
    ws.column_dimensions[get_column_letter(col_notes)].width = 42.0

    # 11. Print Options (Fit to 1 page wide on Landscape)
    ws.page_setup.orientation = ws.ORIENTATION_LANDSCAPE
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0


def build_overview_sheet(ws, all_courses_data: List[Dict[str, Any]]):
    """
    Builds Sheet 1: 종합일정_및_수강현황
    """
    COLOR_PRIMARY = "800020"
    COLOR_HEADER = "1E3A8A"
    COLOR_BORDER = "CBD5E1"
    thin_border = Border(
        left=Side(style='thin', color=COLOR_BORDER),
        right=Side(style='thin', color=COLOR_BORDER),
        top=Side(style='thin', color=COLOR_BORDER),
        bottom=Side(style='thin', color=COLOR_BORDER)
    )

    # Title
    ws.merge_cells("A1:G1")
    t = ws["A1"]
    t.value = "디임팩트학원 2026 논술 파이널 출석부 및 시간표 종합 안내"
    t.font = Font(name="맑은 고딕", size=15, bold=True, color="FFFFFF")
    t.alignment = Alignment(horizontal="center", vertical="center")
    t.fill = PatternFill(start_color=COLOR_PRIMARY, fill_type="solid")
    ws.row_dimensions[1].height = 38
    for c in range(2, 8):
        ws.cell(1, c).fill = PatternFill(start_color=COLOR_PRIMARY, fill_type="solid")

    # Subtitle
    now_str = datetime.now().strftime("%Y년 %m월 %d일")
    ws.merge_cells("A2:G2")
    s = ws["A2"]
    s.value = f"작성일시: {now_str} 기준  |  대치동 디임팩트학원 (서울시 강남구 삼성로81길 35, 5층)"
    s.font = Font(name="맑은 고딕", size=9.5, bold=True, color=COLOR_PRIMARY)
    s.alignment = Alignment(horizontal="center", vertical="center")
    s.fill = PatternFill(start_color="FDF5F2", fill_type="solid")
    ws.row_dimensions[2].height = 24
    for c in range(2, 8):
        ws.cell(2, c).fill = PatternFill(start_color="FDF5F2", fill_type="solid")

    ws.row_dimensions[3].height = 10

    # Section 1 Header
    ws.merge_cells("A4:G4")
    sec = ws["A4"]
    sec.value = "■ 2026학년도 파이널 개설 강좌 일정 및 수강생 등록 현황표"
    sec.font = Font(name="맑은 고딕", size=10.5, bold=True, color="1E293B")
    sec.alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[4].height = 22

    # Table Header
    headers = ["구분", "강좌명", "담당 강사진", "회차별 강의 시간표", "시험일자", "수강료", "수강현황"]
    for idx, h in enumerate(headers, 1):
        cell = ws.cell(5, idx)
        cell.value = h
        cell.font = Font(name="맑은 고딕", size=9, bold=True, color="FFFFFF")
        cell.fill = PatternFill(start_color=COLOR_HEADER, fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border
    ws.row_dimensions[5].height = 24

    # Rows
    current_row = 6
    total_all_students = 0
    total_all_paid = 0

    for idx, c_data in enumerate(all_courses_data):
        ws.row_dimensions[current_row].height = 36
        c_name = c_data["course"]
        sched = c_data["schedule"]
        students = c_data["students"]

        paid_cnt = sum(1 for st in students if st.get("status") == "수납")
        unpaid_cnt = sum(1 for st in students if st.get("status") == "미납")
        total_cnt = len(students)
        total_all_students += total_cnt
        total_all_paid += paid_cnt

        # Univ / Category
        univ_m = re.search(r'([가-힣]+대|약술형)', c_name)
        category = univ_m.group(1) if univ_m else "파이널"

        # Sessions format
        sessions = sched.get("sessions", [])
        sess_lines = [f"- {s.get('label', '')}" for s in sessions if s.get('label')]
        sess_text = f"총 {len(sessions)}회 완성\n" + "\n".join(sess_lines[:4])

        fee_val = c_data.get("fee", 540000)
        status_text = f"총 {total_cnt}명 등록\n(수납 {paid_cnt}명 / 미납 {unpaid_cnt}명)"

        row_vals = [
            (1, category, "center", True),
            (2, c_name, "center", False),
            (3, sched.get("instructor", "-"), "center", False),
            (4, sess_text, "left", False),
            (5, sched.get("exam_date", "-"), "center", False),
            (6, f"{fee_val:,}원", "center", False),
            (7, status_text, "center", True)
        ]

        row_fill = PatternFill(start_color="F8FAFC" if idx % 2 == 1 else "FFFFFF", fill_type="solid")

        for col_idx, val, align_h, is_bold in row_vals:
            cell = ws.cell(current_row, col_idx)
            cell.value = val
            cell.font = Font(name="맑은 고딕", size=9, bold=is_bold, color="000000")
            cell.alignment = Alignment(horizontal=align_h, vertical="center", wrap_text=True)
            cell.border = thin_border
            cell.fill = row_fill

        current_row += 1

    # Totals Row
    ws.row_dimensions[current_row].height = 26
    ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=6)
    tot_c = ws.cell(current_row, 1)
    tot_c.value = f"전체 {len(all_courses_data)}개 강좌 종합 합계"
    tot_c.font = Font(name="맑은 고딕", size=9.5, bold=True, color="1E293B")
    tot_c.alignment = Alignment(horizontal="center", vertical="center")

    stat_c = ws.cell(current_row, 7)
    stat_c.value = f"총 {total_all_students}명\n(수납 {total_all_paid}명)"
    stat_c.font = Font(name="맑은 고딕", size=9.5, bold=True, color="059669")
    stat_c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    for col_idx in range(1, 8):
        ws.cell(current_row, col_idx).border = thin_border
        ws.cell(current_row, col_idx).fill = PatternFill(start_color="E2E8F0", fill_type="solid")

    current_row += 2

    # Section 2: Operation Guidelines
    ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=7)
    guide_title = ws.cell(current_row, 1)
    guide_title.value = "■ 학원 운영 및 출결 관리 원칙"
    guide_title.font = Font(name="맑은 고딕", size=10.5, bold=True, color="1E293B")
    current_row += 1

    guidelines = [
        ("1. 출석 체크 기준", "수업 시작 10분 전까지 강의실 입실 확인. 지각/결석 시 즉시 학부모 비상연락."),
        ("2. 영상 제공 안내", "결석자 및 복습용 강의 영상은 수업 익일 인코딩 완료 후 개별 문자로 링크 전송."),
        ("3. 결제선생 수납 관리", "미납 학생(청구서 발송 상태)은 1회차 등원 시 데스크에서 현장 결제 또는 온라인 수납 완료 확인."),
        ("4. 원고지 및 수업자료", "선생님께서 현장에서 직접 배부 (인문 논술용 원고지 및 수리논술 풀이 노트 완비)."),
        ("5. 학원 위치 & 시설", "서울시 강남구 삼성로81길 35, 5층 (공동현관 비밀번호: #0809 / 네이버지도 https://naver.me/xOdYehVS)")
    ]

    for title, desc in guidelines:
        ws.row_dimensions[current_row].height = 20
        c1 = ws.cell(current_row, 1)
        c1.value = title
        c1.font = Font(name="맑은 고딕", size=9, bold=True, color="334155")
        c1.alignment = Alignment(horizontal="left", vertical="center")
        
        ws.merge_cells(start_row=current_row, start_column=2, end_row=current_row, end_column=7)
        c2 = ws.cell(current_row, 2)
        c2.value = desc
        c2.font = Font(name="맑은 고딕", size=9, color="475569")
        c2.alignment = Alignment(horizontal="left", vertical="center")
        current_row += 1

    # Column widths
    ws.column_dimensions['A'].width = 14.0
    ws.column_dimensions['B'].width = 28.0
    ws.column_dimensions['C'].width = 22.0
    ws.column_dimensions['D'].width = 30.0
    ws.column_dimensions['E'].width = 18.0
    ws.column_dimensions['F'].width = 14.0
    ws.column_dimensions['G'].width = 18.0


def extract_schedule_info_for_course(course: str, sheet_schedules: List[Dict[str, Any]], yaksul_schedules: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Extracts sessions, instructor, exam date, room from matched sheet schedules.
    """
    course = data_manager.normalize_course_name(course)
    # 1. 약술형
    if "약술" in course:
        instructor = "조희재T(국어), 장인환T(수학)"
        if "국어" in course and "수학" not in course:
            instructor = "조희재T(국어)"
            sessions = [
                {"num": 1, "label": "1회차 (10/17 토 13:00~16:00)"},
                {"num": 2, "label": "2회차 (10/18 일 13:00~16:00)"},
                {"num": 3, "label": "3회차 (10/24 토 13:00~16:00)"},
                {"num": 4, "label": "4회차 (10/25 일 13:00~16:00)"}
            ]
        elif "수학" in course and "국어" not in course:
            instructor = "장인환T(수학)"
            sessions = [
                {"num": 1, "label": "1회차 (10/16 금 18:00~21:00)"},
                {"num": 2, "label": "2회차 (10/18 일 18:00~21:00)"},
                {"num": 3, "label": "3회차 (10/23 금 18:00~21:00)"},
                {"num": 4, "label": "4회차 (10/25 일 18:00~21:00)"}
            ]
        else:
            sessions = [
                {"num": 1, "label": "1회차 (10/16~17)"},
                {"num": 2, "label": "2회차 (10/18 일)"},
                {"num": 3, "label": "3회차 (10/23~24)"},
                {"num": 4, "label": "4회차 (10/25 일)"}
            ]

        return {
            "instructor": instructor,
            "sessions": sessions,
            "exam_date": "약술형 논술고사",
            "room": "5층 대강의실",
            "fee": 800000 if "패키지" in course else 540000
        }

    # 2. General university finals
    matched = None
    for row in sheet_schedules:
        s_name = row.get("name", "")
        univ_m = re.search(r'([가-힣]+대)', s_name)
        if not univ_m or univ_m.group(1) not in course:
            continue
        if ("홍익대" in course or "홍대" in course) and (("A" in s_name and "A" not in course) or ("B" in s_name and "B" not in course)):
            continue
        if "중앙대" in course:
            if "경영경제" in s_name and "경영경제" not in course: continue
            if "인문사회" in s_name and "인문사회" not in course: continue
            if "일반" in s_name and "일반" not in course: continue
        matched = row
        break

    sessions = []
    if matched:
        s1 = matched.get("session1", "")
        s2 = matched.get("session2", "")
        s3 = matched.get("session3", "")
        if s1: sessions.append({"num": 1, "label": f"1회차 ({s1})"})
        if s2: sessions.append({"num": 2, "label": f"2회차 ({s2})"})
        if s3: sessions.append({"num": 3, "label": f"3회차 ({s3})"})

        instructor = matched.get("instructor", "")
        exam_date = matched.get("exam_date", "")
        room = matched.get("room", "5층 강의실")
    else:
        instructor = ""
        exam_date = "논술고사"
        room = "5층 강의실"
        sessions = [
            {"num": 1, "label": "1회차"},
            {"num": 2, "label": "2회차"},
            {"num": 3, "label": "3회차"}
        ]

    if not instructor:
        ins_m = re.search(r'([가-힣]{2,4}T)', course)
        instructor = ins_m.group(1) if ins_m else "디임팩트 강사진"

    return {
        "instructor": instructor,
        "sessions": sessions,
        "exam_date": exam_date,
        "room": room,
        "fee": 540000
    }


def generate_single_course_attendance_excel(course_name: str) -> io.BytesIO:
    """
    Generates attendance workbook for a single course and returns BytesIO buffer.
    """
    from server import get_final_schedules_from_sheet
    sheet_schedules, yaksul = get_final_schedules_from_sheet()
    schedule_info = extract_schedule_info_for_course(course_name, sheet_schedules, yaksul)

    students = data_manager.get_course_students(course_name)

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = sanitize_sheet_name(course_name)

    build_attendance_sheet(ws, course_name, students, schedule_info)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer


def generate_all_courses_attendance_excel() -> io.BytesIO:
    """
    Generates a multi-sheet workbook containing the Overview Sheet plus every course sheet.
    """
    from server import get_final_schedules_from_sheet
    sheet_schedules, yaksul = get_final_schedules_from_sheet()
    courses = data_manager.get_courses()

    wb = openpyxl.Workbook()
    # Sheet 1: Overview
    ws_overview = wb.active
    ws_overview.title = "종합일정_및_수강현황"

    all_courses_data = []
    used_titles = set(["종합일정_및_수강현황"])

    for c in courses:
        students = data_manager.get_course_students(c)
        sched = extract_schedule_info_for_course(c, sheet_schedules, yaksul)
        all_courses_data.append({
            "course": c,
            "students": students,
            "schedule": sched,
            "fee": sched.get("fee", 540000)
        })

        # Add course sheet
        base_title = sanitize_sheet_name(c)
        sheet_title = base_title
        counter = 2
        while sheet_title in used_titles:
            sheet_title = f"{base_title[:28]}_{counter}"
            counter += 1
        used_titles.add(sheet_title)

        ws_course = wb.create_sheet(title=sheet_title)
        build_attendance_sheet(ws_course, c, students, sched)

    build_overview_sheet(ws_overview, all_courses_data)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer

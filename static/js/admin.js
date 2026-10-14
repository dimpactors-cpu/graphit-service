let currentCourseStudents = [];
let currentCourseName = "";

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadStats();
  loadCourses();
  setupDropzone();
});

async function checkAuth() {
  const tag = document.getElementById("adminUserTag");
  if (tag && tag.textContent && tag.textContent.trim() !== "관리자") {
    return; // Already pre-rendered by server session check!
  }
  try {
    const res = await fetch("/api/auth/me");
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    if (data.authenticated) {
      const tag = document.getElementById("adminUserTag");
      if (tag && data.user) {
        tag.textContent = data.user;
      }
    } else {
      window.location.href = "/admin/login";
    }
  } catch (err) {
    console.error("Auth check failed", err);
  }
}

async function handleLogout() {
  if (confirm("관리자 로그아웃 하시겠습니까?")) {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/admin/login";
    } catch (e) {
      window.location.href = "/admin/login";
    }
  }
}

async function loadStats() {
  try {
    const res = await fetch("/api/admin/stats");
    const data = await res.json();
    if (data.success && data.stats) {
      const s = data.stats;
      document.getElementById("lastFileName").textContent = s.last_file || "없음";
      document.getElementById("lastSyncTime").textContent = s.last_sync || "-";
      document.getElementById("statTotalCount").textContent = s.total_count.toLocaleString();
      document.getElementById("statTotalAmount").textContent = s.total_amount.toLocaleString() + "원";
      document.getElementById("statPaidCount").textContent = s.paid_count.toLocaleString();
      document.getElementById("statPaidAmount").textContent = s.paid_amount.toLocaleString() + "원";
      document.getElementById("statUnpaidCount").textContent = s.unpaid_count.toLocaleString();
      document.getElementById("statUnpaidAmount").textContent = s.unpaid_amount.toLocaleString() + "원";
      document.getElementById("statCancelCount").textContent = (s.cancel_count + s.destroy_count).toLocaleString();
      document.getElementById("statCancelAmount").textContent = (s.cancel_amount + s.destroy_amount).toLocaleString() + "원";
    }
  } catch (err) {
    console.error("Failed to load stats", err);
  }
}

async function loadCourses() {
  try {
    const res = await fetch("/api/admin/courses");
    const data = await res.json();
    const select = document.getElementById("courseSelect");
    const prevVal = select.value || currentCourseName;
    select.innerHTML = '<option value="">강좌를 선택하세요...</option>';
    if (data.success && data.courses) {
      data.courses.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
      });
      if (prevVal && data.courses.includes(prevVal)) {
        select.value = prevVal;
        currentCourseName = prevVal;
      }
    }
  } catch (err) {
    console.error("Failed to load courses", err);
  }
}

async function loadCourseStudents() {
  const course = document.getElementById("courseSelect").value;
  const status = document.getElementById("statusFilter").value;
  const tbody = document.getElementById("studentTableBody");

  if (!course) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--gray-400); padding: 30px;">강좌를 선택해 주세요.</td></tr>';
    currentCourseStudents = [];
    currentCourseName = "";
    document.getElementById("messageTemplate").value = "";
    return;
  }
  currentCourseName = course;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--gray-500); padding: 20px;">명단을 불러오는 중...</td></tr>';

  try {
    const res = await fetch(`/api/admin/course-students?course=${encodeURIComponent(course)}&status=${encodeURIComponent(status)}`);
    const data = await res.json();

    if (data.success && data.students) {
      currentCourseStudents = data.students;

      if (currentCourseStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--gray-400); padding: 30px;">해당 조건의 학생이 없습니다.</td></tr>';
      } else {
        let html = "";
        currentCourseStudents.forEach((s, idx) => {
          const badgeClass = "status-" + (s.status || "미납");
          const sPhone = (s.student_phone && s.student_phone !== "-") ? escapeHtml(s.student_phone) : '<span style="color: var(--gray-400);">-</span>';
          const pPhone = (s.parent_phone && s.parent_phone !== "-") ? escapeHtml(s.parent_phone) : (s.phone ? escapeHtml(s.phone) : '<span style="color: var(--gray-400);">-</span>');
          html += `
            <tr>
              <td>${idx + 1}</td>
              <td><strong>${escapeHtml(s.name)}</strong></td>
              <td>${sPhone}</td>
              <td>${pPhone}</td>
              <td style="font-size: 13px; color: var(--gray-600);">${escapeHtml(s.date || "-")}</td>
              <td><span class="status-badge ${badgeClass}">${escapeHtml(s.status)}</span></td>
            </tr>
          `;
        });
        tbody.innerHTML = html;
      }

      await generateMessageTemplate(course, currentCourseStudents);
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 20px;">불러오기 오류 발생</td></tr>';
  }
}

function getCleanClassTitle(courseName) {
  let name = (courseName || "").replace(/^#/, "").trim();
  if (name.includes("_")) {
    name = name.split("_")[0].trim();
  }
  if (name.includes("홍익대") || name.includes("홍대")) {
    if (name.includes("(A)") || name.includes("A반") || name.includes("A")) {
      return "홍익대 파이널 A반";
    }
    if (name.includes("(B)") || name.includes("B반") || name.includes("B")) {
      return "홍익대 파이널 B반";
    }
  }
  if (name.includes("약술형") || name.includes("약술")) {
    return "약술형 파이널반";
  }
  if (!name.endsWith("반") && !name.includes("패키지")) {
    name += "반";
  }
  return name;
}

async function generateMessageTemplate(courseName, students) {
  const classTitle = getCleanClassTitle(courseName);
  let instructor = "";
  let scheduleHeader = "■ 강의 일정: 총 3회 완성";
  let lectureSchedule = "- 1회차: 00월 00일(요일) 00:00 ~ 00:00\n\n- 2회차: 00월 00일(요일) 00:00 ~ 00:00\n\n- 3회차: 00월 00일(요일) 00:00 ~ 00:00";

  try {
    const res = await fetch(`/api/admin/schedule?course=${encodeURIComponent(courseName)}`);
    const data = await res.json();
    if (data.success) {
      if (data.instructor) {
        instructor = data.instructor;
      }
      if (data.schedule_header) {
        scheduleHeader = data.schedule_header;
      }
      if (data.lecture_schedule) {
        lectureSchedule = data.lecture_schedule;
      }
    }
  } catch (err) {
    console.error("Failed to fetch schedule info:", err);
  }

  const parts = [];

  // 1. 제목: ~~반 개강 안내
  parts.push(`[${classTitle} 개강 안내]`);

  // 2. 인사말
  parts.push("안녕하세요. 디임팩트학원입니다.");

  // 3. 안내 도입
  parts.push(`${classTitle} 강의 일정을 안내드립니다.`);

  // 섹션 구분 빈 줄
  parts.push("");

  // 4. 강좌명
  parts.push(`■ 강좌명: ${courseName}`);

  // 5. 담당 강사 (있을 경우)
  if (instructor) {
    parts.push(`■ 담당 강사: ${instructor}`);
  }

  // 6. 강의 일정 헤더
  parts.push(scheduleHeader);

  // 7. 각 회차별 일정 (각 회차 및 블록마다 빈 줄 간격)
  const sessionBlocks = lectureSchedule.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  sessionBlocks.forEach(b => parts.push(b));

  // 섹션 구분 빈 줄
  parts.push("");

  // 8. 안내 사항 및 유의사항
  parts.push("■ 안내 사항 및 유의사항:");
  parts.push("- 수업 시작 10분 전까지 강의실에 입실해 주시기 바랍니다.");
  parts.push("- 영상 제공: 수업 다음날 개별 문자를 통해 링크로 전달 드릴 예정입니다.");

  // 섹션 구분 빈 줄
  parts.push("");

  // 9. 오시는 길 및 공동현관 비밀번호
  parts.push("□ 오시는길 : 서울시 강남구 삼성로81길 35, 5층 (https://naver.me/xOdYehVS)");
  parts.push("□ 1층 공동현관 비밀번호 : #0809");

  // 10. 맺음말
  parts.push("궁금하신 사항은 언제든 편하게 연락주세요.");
  parts.push("감사합니다.");

  // 각 문장마다 한줄씩 간격 주기 (\n\n)
  document.getElementById("messageTemplate").value = parts.join("\n\n");
}

function copyNamesOnly() {
  if (currentCourseStudents.length === 0) {
    showToast("복사할 학생 명단이 없습니다.");
    return;
  }
  const text = currentCourseStudents.map(s => s.name).join(", ");
  navigator.clipboard.writeText(text).then(() => {
    showToast(`학생 ${currentCourseStudents.length}명의 이름이 복사되었습니다.`);
  });
}

function copyStudentPhones() {
  if (currentCourseStudents.length === 0) {
    showToast("복사할 학생 명단이 없습니다.");
    return;
  }
  const numbers = currentCourseStudents
    .map(s => (s.student_phone || '').trim())
    .filter(p => p && p !== '-');

  if (numbers.length === 0) {
    showToast("복사할 학생 연락처가 없습니다.");
    return;
  }
  const text = numbers.join("\n");
  navigator.clipboard.writeText(text).then(() => {
    showToast(`학생 연락처 ${numbers.length}개가 번호만 복사되었습니다.`);
  });
}

function copyParentPhones() {
  if (currentCourseStudents.length === 0) {
    showToast("복사할 학생 명단이 없습니다.");
    return;
  }
  const numbers = currentCourseStudents
    .map(s => (s.parent_phone || s.phone || '').trim())
    .filter(p => p && p !== '-');

  if (numbers.length === 0) {
    showToast("복사할 학부모 연락처가 없습니다.");
    return;
  }
  const text = numbers.join("\n");
  navigator.clipboard.writeText(text).then(() => {
    showToast(`학부모 연락처 ${numbers.length}개가 번호만 복사되었습니다.`);
  });
}

function copyBothPhones() {
  if (currentCourseStudents.length === 0) {
    showToast("복사할 학생 명단이 없습니다.");
    return;
  }
  const list = [];
  const seen = new Set();
  currentCourseStudents.forEach(s => {
    const sPhone = (s.student_phone || '').trim();
    const pPhone = (s.parent_phone || s.phone || '').trim();
    if (sPhone && sPhone !== '-' && !seen.has(sPhone)) {
      seen.add(sPhone);
      list.push(sPhone);
    }
    if (pPhone && pPhone !== '-' && !seen.has(pPhone)) {
      seen.add(pPhone);
      list.push(pPhone);
    }
  });

  if (list.length === 0) {
    showToast("복사할 학생 및 학부모 연락처가 없습니다.");
    return;
  }
  const text = list.join("\n");
  navigator.clipboard.writeText(text).then(() => {
    showToast(`학생+학부모 연락처 총 ${list.length}개가 번호만 복사되었습니다.`);
  });
}

function copyFullTable() {
  if (currentCourseStudents.length === 0) {
    showToast("복사할 학생 명단이 없습니다.");
    return;
  }
  let course = (document.getElementById("courseSelect").value || currentCourseName || "").trim();
  if (!course && currentCourseStudents.length > 0) {
    course = (currentCourseStudents[0].course || "").trim();
  }
  if (!course) {
    const sel = document.getElementById("courseSelect");
    if (sel && sel.selectedIndex >= 0 && sel.options[sel.selectedIndex]?.value) {
      course = sel.options[sel.selectedIndex].value.trim();
    }
  }
  const blocks = [];
  blocks.push(`[${course}]`);
  blocks.push("");

  currentCourseStudents.forEach((s, idx) => {
    const sPhone = (s.student_phone && s.student_phone.trim() !== "-" && s.student_phone.trim() !== "") 
      ? s.student_phone.trim() 
      : "-";
    const pPhone = (s.parent_phone && s.parent_phone.trim() !== "-" && s.parent_phone.trim() !== "") 
      ? s.parent_phone.trim() 
      : ((s.phone && s.phone.trim() !== "-" && s.phone.trim() !== "") ? s.phone.trim() : "-");
    const namePart = s.name ? ` ${s.name}` : "";

    blocks.push(`수강생${idx + 1}.${namePart}`);
    blocks.push(`학생 ${sPhone}`);
    blocks.push(`학부모 ${pPhone}`);
    blocks.push("");
  });

  const text = blocks.join("\n").trim();
  navigator.clipboard.writeText(text).then(() => {
    showToast(`수강생 ${currentCourseStudents.length}명의 명단이 양식에 맞춰 복사되었습니다.`);
  });
}

function copyMessageTemplate() {
  const text = document.getElementById("messageTemplate").value;
  if (!text) {
    showToast("복사할 안내문자 내용이 없습니다.");
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    showToast("안내문자 전체 내용이 복사되었습니다.");
  });
}


async function triggerSync() {
  try {
    const res = await fetch("/api/admin/sync", { method: "POST" });
    const data = await res.json();
    if (data.success) {
      showToast("최신 엑셀 데이터를 성공적으로 불러왔습니다.");
      loadStats();
      loadCourses();
      loadCourseStudents();
    } else {
      showToast("동기화 실패: " + data.message);
    }
  } catch (err) {
    console.error(err);
    showToast("동기화 중 오류가 발생했습니다.");
  }
}

function setupDropzone() {
  const dropzone = document.getElementById("dropzone");
  if (dropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        uploadFile(files[0]);
      }
    }, false);
  }

  // Allow dragging & dropping Excel files anywhere on the admin page
  window.addEventListener('dragover', (e) => e.preventDefault(), false);
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        uploadFile(file);
      }
    }
  }, false);
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    uploadFile(file);
  }
}

async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  showToast("파일을 업로드 및 분석 중입니다...");

  try {
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      showToast(`${file.name} 업로드 완료! (${data.count}건 로드)`);
      loadStats();
      loadCourses();
      loadCourseStudents();
    } else {
      showToast("업로드 실패: " + (data.message || "파일 형식을 확인하세요"));
    }
  } catch (err) {
    console.error(err);
    showToast("업로드 중 네트워크 오류가 발생했습니다.");
  }
}

async function handleMasterDbUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append("file", file);

  showToast("학원 관리 masterDB 파일을 반영 중입니다...");

  try {
    const res = await fetch("/api/admin/upload-master-db", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || "masterDB가 성공적으로 반영되었습니다.");
      loadCourseStudents();
    } else {
      showToast("masterDB 반영 실패: " + (data.message || ""));
    }
  } catch (err) {
    console.error(err);
    showToast("masterDB 업로드 중 오류가 발생했습니다.");
  } finally {
    event.target.value = "";
  }
}

async function handleAdminSearch() {
  const name = document.getElementById("adminSearchName").value.trim();
  const phoneTail = document.getElementById("adminSearchPhone").value.trim();
  const resultDiv = document.getElementById("adminSearchResult");

  if (!name || phoneTail.length !== 4) {
    alert("학생 이름과 연락처 뒤 4자리를 정확히 입력해주세요.");
    return;
  }

  resultDiv.innerHTML = "<p style='color: var(--gray-500);'>조회 중...</p>";

  try {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, phone_tail: phoneTail })
    });
    const data = await res.json();

    if (!data.success || !data.data || data.data.length === 0) {
      resultDiv.innerHTML = "<p style='color: var(--danger); font-weight: 600;'>❌ 일치하는 신청 내역이 없습니다.</p>";
    } else {
      let html = `<p style='color: var(--success); font-weight: 700; margin-bottom: 8px;'>✅ ${name} 학생 (${data.data.length}건 검색됨):</p><ul style='padding-left: 20px;'>`;
      data.data.forEach(item => {
        html += `<li><strong>${escapeHtml(item.course)}</strong> - [${item.status}] (신청: ${item.date})</li>`;
      });
      html += "</ul>";
      resultDiv.innerHTML = html;
    }
  } catch (err) {
    resultDiv.innerHTML = "<p style='color: var(--danger);'>조회 오류</p>";
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

let currentCourseStudents = [];

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadStats();
  loadCourses();
  setupDropzone();
});

async function checkAuth() {
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
    select.innerHTML = '<option value="">강좌를 선택하세요...</option>';
    if (data.success && data.courses) {
      data.courses.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
      });
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
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--gray-400); padding: 30px;">강좌를 선택해 주세요.</td></tr>';
    currentCourseStudents = [];
    document.getElementById("messageTemplate").value = "";
    return;
  }

  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--gray-500); padding: 20px;">명단을 불러오는 중...</td></tr>';

  try {
    const res = await fetch(`/api/admin/course-students?course=${encodeURIComponent(course)}&status=${encodeURIComponent(status)}`);
    const data = await res.json();

    if (data.success && data.students) {
      currentCourseStudents = data.students;

      if (currentCourseStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--gray-400); padding: 30px;">해당 조건의 학생이 없습니다.</td></tr>';
      } else {
        let html = "";
        currentCourseStudents.forEach((s, idx) => {
          const badgeClass = "status-" + (s.status || "미납");
          html += `
            <tr>
              <td>${idx + 1}</td>
              <td><strong>${escapeHtml(s.name)}</strong></td>
              <td>${escapeHtml(s.phone)}</td>
              <td>${escapeHtml(s.date || "-")}</td>
              <td><span class="status-badge ${badgeClass}">${escapeHtml(s.status)}</span></td>
            </tr>
          `;
        });
        tbody.innerHTML = html;
      }

      generateMessageTemplate(course, currentCourseStudents);
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 20px;">불러오기 오류 발생</td></tr>';
  }
}

function generateMessageTemplate(courseName, students) {
  const studentNames = students.map(s => s.name).join(", ");
  const count = students.length;

  let scheduleText = "1회차: 00월 00일(요일) 00:00 ~ 00:00\n2회차: 00월 00일(요일) 00:00 ~ 00:00\n3회차: 00월 00일(요일) 00:00 ~ 00:00";
  
  if (courseName.includes("홍익대") && courseName.includes("A반")) {
    scheduleText = "1회차: 9월 29일(화) 14:00 ~ 17:00\n2회차: 10월 1일(목) 14:00 ~ 17:00\n3회차: 10월 3일(토) 14:00 ~ 17:00";
  } else if (courseName.includes("홍익대") && courseName.includes("B반")) {
    scheduleText = "1회차: 9월 29일(화) 18:00 ~ 21:00\n2회차: 10월 1일(목) 18:00 ~ 21:00\n3회차: 10월 3일(토) 18:00 ~ 21:00";
  }

  const template = `[${courseName} 개강]

안녕하세요, 디임팩트학원입니다.

${courseName} 등록이 정상적으로 완료되어 강의 일정 및 등원 안내드립니다.

■ 강좌명: ${courseName}
■ 강의 일정: 총 3회 완성
${scheduleText}

■ 영상 제공: 현강을 녹화하여 제공하므로 다소 시간이 걸릴 수 있습니다. 링크로 전달드릴 예정이며, 최대한 빠르게 편집하여 전달 드리겠습니다.

감사합니다.

■ 수강 명단 (${count}명 - 가나다순)
${studentNames || "등록된 학생 없음"}`;

  document.getElementById("messageTemplate").value = template;
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

function copyNamesAndPhones() {
  if (currentCourseStudents.length === 0) {
    showToast("복사할 학생 명단이 없습니다.");
    return;
  }
  const text = currentCourseStudents.map((s, i) => `${i + 1}. ${s.name} (${s.phone})`).join("\n");
  navigator.clipboard.writeText(text).then(() => {
    showToast(`학생 ${currentCourseStudents.length}명의 연락처 명단이 복사되었습니다.`);
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

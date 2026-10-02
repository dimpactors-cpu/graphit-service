async function handleSearch(event) {
  event.preventDefault();

  const nameInput = document.getElementById("studentName");
  const phoneInput = document.getElementById("phoneTail");
  const searchBtn = document.getElementById("searchBtn");
  const btnText = document.getElementById("btnText");
  const btnSpinner = document.getElementById("btnSpinner");
  const resultSection = document.getElementById("resultSection");
  const courseList = document.getElementById("courseList");
  const resultCount = document.getElementById("resultCount");
  const studentGreeting = document.getElementById("studentGreeting");

  const name = nameInput.value.trim();
  const phoneTail = phoneInput.value.trim();

  if (!name || phoneTail.length !== 4) {
    alert("이름과 연락처 뒷자리 4자리를 정확히 입력해주세요.");
    return;
  }

  // Loading UI
  searchBtn.disabled = true;
  btnText.style.display = "none";
  btnSpinner.style.display = "inline";
  resultSection.classList.remove("active");

  try {
    const response = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, phone_tail: phoneTail })
    });

    const res = await response.json();
    resultSection.classList.add("active");

    if (!res.success || !res.data || res.data.length === 0) {
      resultCount.textContent = "0";
      studentGreeting.textContent = "";
      courseList.innerHTML = `
        <div class="empty-state">
          <div class="empty-title">일치하는 신청 내역이 없습니다</div>
          <div class="empty-desc">
            입력하신 이름(<strong>${escapeHtml(name)}</strong>)과 번호 뒷자리(<strong>${escapeHtml(phoneTail)}</strong>)를 다시 확인해 주세요.<br>
            결제선생 링크를 학생 번호가 아닌 학부모님 번호로 받으셨을 수도 있습니다.
          </div>
        </div>
      `;
    } else {
      resultCount.textContent = res.data.length;
      studentGreeting.textContent = `${name} 학생`;
      
      let html = "";
      res.data.forEach(item => {
        const status = item.status || "미납";
        const badgeClass = "status-" + status;
        html += `
          <div class="course-card">
            <div class="card-top">
              <div class="course-title">${escapeHtml(item.course)}</div>
              <span class="status-badge ${badgeClass}">${escapeHtml(status)}</span>
            </div>
            <div class="card-meta">
              <span>신청일시: ${escapeHtml(item.date || "-")}</span>
            </div>
          </div>
        `;
      });
      courseList.innerHTML = html;
    }
  } catch (err) {
    console.error(err);
    resultSection.classList.add("active");
    courseList.innerHTML = `
      <div class="empty-state">
        <div class="empty-title">조회 중 일시적인 오류가 발생했습니다</div>
        <div class="empty-desc">네트워크 상태를 확인하신 후 잠시 뒤 다시 시도해 주세요.</div>
      </div>
    `;
  } finally {
    searchBtn.disabled = false;
    btnText.style.display = "inline";
    btnSpinner.style.display = "none";
  }
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

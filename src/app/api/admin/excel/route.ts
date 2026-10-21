import { NextRequest, NextResponse } from "next/server";
import { getDb, formatKstDate } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function esc(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function GET(req: NextRequest) {
  const user = getSessionUser();
  if (!user || user.mb_level < 3) {
    return NextResponse.json({ ok: false, message: "권한이 없습니다." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "test";
  const fr_date = searchParams.get("fr_date") || "";
  const to_date = searchParams.get("to_date") || "";
  const sfl = searchParams.get("sfl") || "";
  const stx = (searchParams.get("stx") || "").trim().toLowerCase();

  const db = await getDb();
  const ymd = formatKstDate();
  let filename = `${type}_${ymd}.xls`;
  let htmlBody = "";

  const inDateRange = (dtStr: string | null | undefined) => {
    if (!fr_date || !to_date) return true;
    if (!dtStr) return false;
    const d = String(dtStr).substring(0, 10);
    return d >= fr_date && d <= to_date;
  };

  if (type === "test") {
    // Replicates exceldown_test.php
    const itemMap = new Map(db.g5_shop_item.map((it) => [String(it.it_id), it]));
    const qaMap = new Map(db.graphit_qa.map((q) => [Number(q.qa_no), q]));

    // Index answers by `${mb_id}__${it_id}`
    const ansByMemberItem = new Map<string, typeof db.graphit_item_test>();
    for (const ans of db.graphit_item_test) {
      const key = `${ans.mb_id}__${ans.it_id}`;
      let list = ansByMemberItem.get(key);
      if (!list) {
        list = [];
        ansByMemberItem.set(key, list);
      }
      list.push(ans);
    }

    let rows = [...db.graphit_test].sort((a, b) => Number(b.test_no) - Number(a.test_no));
    if (fr_date && to_date) {
      rows = rows.filter((r) => inDateRange(r.test_datetime));
    }
    if (stx) {
      rows = rows.filter((r) => {
        if (sfl === "test_id") {
          const it = itemMap.get(String(r.it_id));
          return String(it?.it_4 || "").toLowerCase().includes(stx) || String(r.it_id || "").toLowerCase().includes(stx);
        }
        if (sfl && (r as any)[sfl] !== undefined) {
          return String((r as any)[sfl] || "").toLowerCase().includes(stx);
        }
        return (
          String(r.mb_name || "").toLowerCase().includes(stx) ||
          String(r.mb_id || "").toLowerCase().includes(stx) ||
          String(r.group_code || "").toLowerCase().includes(stx) ||
          String(r.group_name || "").toLowerCase().includes(stx)
        );
      });
    }

    let trs = `
      <tr>
        <td style="background-color:#ffff00;font-weight:bold">주문번호</td>
        <td style="background-color:#ffff00;font-weight:bold">단체명</td>
        <td style="background-color:#ffff00;font-weight:bold">단체코드</td>
        <td style="background-color:#ffff00;font-weight:bold">아이디</td>
        <td style="background-color:#ffff00;font-weight:bold">이름</td>
        <td style="background-color:#ffff00;font-weight:bold">연락처</td>
        <td style="background-color:#ffff00;font-weight:bold">검사명</td>
        <td style="background-color:#ffff00;font-weight:bold">검사식별코드</td>
        <td style="background-color:#ffff00;font-weight:bold">검사시작일</td>
        <td style="background-color:#ffff00;font-weight:bold">검사종료일</td>
        <td style="background-color:#ffff00;font-weight:bold">이용상태</td>
        <td style="background-color:#ffff00;font-weight:bold">답변</td>
      </tr>
    `;

    for (const r of rows) {
      const item = itemMap.get(String(r.it_id));
      let answerCells = "";
      if (r.test_status === "완료") {
        const rawAns = ansByMemberItem.get(`${r.mb_id}__${r.it_id}`) || [];
        const sortedAns = [...rawAns].sort((a, b) => Number(a.item_seq) - Number(b.item_seq));
        answerCells = sortedAns
          .map((a) => {
            const qa = qaMap.get(Number(a.qa_no));
            let text = String(a.test_answer ?? "");
            if (qa && qa.qa_type === "n") {
              if (text === "1") text = qa.qa_q1 || "1";
              else if (text === "2") text = qa.qa_q2 || "2";
              else if (text === "3") text = qa.qa_q3 || "3";
              else if (text === "4") text = qa.qa_q4 || "4";
              else if (text === "5") text = qa.qa_q5 || "5";
            }
            if (!text) return `<td style="color:red">답변없음</td>`;
            return `<td>${esc(text)}</td>`;
          })
          .join("");
      }
      trs += `
        <tr>
          <td style="mso-number-format:'\\@'">${esc(r.od_id)}</td>
          <td>${esc(r.group_name)}</td>
          <td>${esc(r.group_code)}</td>
          <td>${esc(r.mb_id)}</td>
          <td>${esc(r.mb_name)}</td>
          <td>${esc(r.mb_hp)}</td>
          <td>${esc(r.it_name)}</td>
          <td>${esc(item?.it_4 || "")}</td>
          <td>${esc(r.test_datetime)}</td>
          <td>${esc(r.end_datetime)}</td>
          <td>${esc(r.test_status)}</td>
          <td>${answerCells ? `<table border="1"><tr>${answerCells}</tr></table>` : ""}</td>
        </tr>
      `;
    }
    htmlBody = `<table border="1" style="table-layout:fixed">${trs}</table>`;
  } else if (type === "member") {
    // Replicates exceldown_member.php
    let rows = db.g5_member
      .filter((m) => Number(m.mb_level) === 2 && (!m.mb_7 || m.mb_7 === ""))
      .sort((a, b) => Number(b.mb_no) - Number(a.mb_no));

    if (fr_date && to_date) {
      rows = rows.filter((m) => inDateRange(m.mb_datetime));
    }
    if (stx) {
      rows = rows.filter((m) =>
        String((m as any)[sfl] || m.mb_name || "").toLowerCase().includes(stx)
      );
    }

    let trs = `
      <tr>
        <td style="background-color:#ffff00;font-weight:bold">아이디</td>
        <td style="background-color:#ffff00;font-weight:bold">이름</td>
        <td style="background-color:#ffff00;font-weight:bold">연락처</td>
        <td style="background-color:#ffff00;font-weight:bold">주소</td>
        <td style="background-color:#ffff00;font-weight:bold">성별</td>
        <td style="background-color:#ffff00;font-weight:bold">생년월일</td>
        <td style="background-color:#ffff00;font-weight:bold">가입일</td>
        <td style="background-color:#ffff00;font-weight:bold">이메일수신동의</td>
        <td style="background-color:#ffff00;font-weight:bold">SMS수신동의</td>
        <td style="background-color:#ffff00;font-weight:bold">주문번호</td>
      </tr>
    `;

    for (const m of rows) {
      const orders = db.g5_shop_order
        .filter((o) => o.mb_id === m.mb_id && ["입금", "배송", "완료"].includes(o.od_status))
        .map((o) => o.od_id)
        .join(", ");
      const addr = `${m.mb_zip1 || ""}${m.mb_zip2 || ""} ${m.mb_addr1 || ""} ${m.mb_addr2 || ""} ${m.mb_addr3 || ""}`.trim();
      trs += `
        <tr>
          <td>${esc(m.mb_id)}</td>
          <td>${esc(m.mb_name)}</td>
          <td>${esc(m.mb_hp)}</td>
          <td>${esc(addr)}</td>
          <td>${esc(m.mb_sex)}</td>
          <td>${esc(m.mb_birth)}</td>
          <td>${esc(m.mb_datetime)}</td>
          <td>${String(m.mb_mailling) === "1" ? "동의" : ""}</td>
          <td>${String(m.mb_sms) === "1" ? "동의" : ""}</td>
          <td style="mso-number-format:'\\@'">${esc(orders)}</td>
        </tr>
      `;
    }
    htmlBody = `<table border="1" style="table-layout:fixed">${trs}</table>`;
  } else if (type === "group") {
    // Replicates exceldown_group.php
    const memberMap = new Map(db.g5_member.map((m) => [m.mb_id, m]));
    const groupMap = new Map(db.graphit_group.map((g) => [g.group_code, g]));

    let rows = db.graphit_test
      .filter((t) => t.group_code && String(t.group_code).trim() !== "")
      .sort((a, b) => Number(b.test_no) - Number(a.test_no));

    if (fr_date && to_date) {
      rows = rows.filter((r) => inDateRange(r.test_datetime));
    }
    if (stx) {
      rows = rows.filter((r) =>
        String((r as any)[sfl] || r.group_code || r.group_name || "").toLowerCase().includes(stx)
      );
    }

    let trs = `
      <tr>
        <td style="background-color:#ffff00;font-weight:bold">단체명</td>
        <td style="background-color:#ffff00;font-weight:bold">단체코드</td>
        <td style="background-color:#ffff00;font-weight:bold">아이디</td>
        <td style="background-color:#ffff00;font-weight:bold">이름</td>
        <td style="background-color:#ffff00;font-weight:bold">연락처</td>
        <td style="background-color:#ffff00;font-weight:bold">주소</td>
        <td style="background-color:#ffff00;font-weight:bold">성별</td>
        <td style="background-color:#ffff00;font-weight:bold">사업자등록번호</td>
        <td style="background-color:#ffff00;font-weight:bold">생년월일</td>
        <td style="background-color:#ffff00;font-weight:bold">가입일</td>
      </tr>
    `;

    for (const r of rows) {
      const mb = memberMap.get(r.mb_id);
      const grp = groupMap.get(r.group_code);
      const grpOwner = grp ? memberMap.get(grp.mb_id) : undefined;
      const addr = mb
        ? `${mb.mb_zip1 || ""}${mb.mb_zip2 || ""} ${mb.mb_addr1 || ""} ${mb.mb_addr2 || ""} ${mb.mb_addr3 || ""}`.trim()
        : "";
      trs += `
        <tr>
          <td>${esc(r.group_name || grpOwner?.mb_8 || "")}</td>
          <td>${esc(r.group_code)}</td>
          <td>${esc(r.mb_id)}</td>
          <td>${esc(mb?.mb_name || r.mb_name)}</td>
          <td>${esc(mb?.mb_hp || r.mb_hp)}</td>
          <td>${esc(addr)}</td>
          <td>${esc(mb?.mb_sex || "")}</td>
          <td style="mso-number-format:'\\@'">${esc(grpOwner?.mb_conum || "")}</td>
          <td>${esc(mb?.mb_birth || "")}</td>
          <td>${esc(mb?.mb_datetime || "")}</td>
        </tr>
      `;
    }
    htmlBody = `<table border="1" style="table-layout:fixed">${trs}</table>`;
  } else if (type === "exam") {
    // Replicates exceldown_exam.php
    let rows = [...db.graphit_qa].sort((a, b) => Number(b.qa_no) - Number(a.qa_no));
    if (fr_date && to_date) {
      rows = rows.filter((q) => inDateRange(q.reg_datetime));
    }

    let trs = `
      <tr>
        <td style="background-color:#ffff00;font-weight:bold">문항식별코드</td>
        <td style="background-color:#ffff00;font-weight:bold">유형</td>
        <td style="background-color:#ffff00;font-weight:bold">요약</td>
        <td style="background-color:#ffff00;font-weight:bold">주제 1분류</td>
        <td style="background-color:#ffff00;font-weight:bold">주제 2분류</td>
        <td style="background-color:#ffff00;font-weight:bold">난이도</td>
        <td style="background-color:#ffff00;font-weight:bold">성향</td>
        <td style="background-color:#ffff00;font-weight:bold">역량</td>
        <td style="background-color:#ffff00;font-weight:bold">질문</td>
        <td style="background-color:#ffff00;font-weight:bold">지문</td>
        <td style="background-color:#ffff00;font-weight:bold">선택지1</td>
        <td style="background-color:#ffff00;font-weight:bold">선택지2</td>
        <td style="background-color:#ffff00;font-weight:bold">선택지3</td>
        <td style="background-color:#ffff00;font-weight:bold">선택지4</td>
        <td style="background-color:#ffff00;font-weight:bold">선택지5</td>
        <td style="background-color:#ffff00;font-weight:bold">등록일자</td>
      </tr>
    `;

    for (const q of rows) {
      trs += `
        <tr>
          <td>${esc(q.qa_code)}</td>
          <td>${q.qa_type === "n" ? "객관식" : "주관식"}</td>
          <td>${esc(q.qa_summary)}</td>
          <td>${esc(q.qa_sub1)}</td>
          <td>${esc(q.qa_sub2)}</td>
          <td>${esc(q.qa_level)}</td>
          <td>${esc(q.qa_tendency)}</td>
          <td>${esc(q.qa_power)}</td>
          <td>${esc(q.qa_subject)}</td>
          <td>${esc(q.qa_content)}</td>
          <td>${esc(q.qa_q1)}</td>
          <td>${esc(q.qa_q2)}</td>
          <td>${esc(q.qa_q3)}</td>
          <td>${esc(q.qa_q4)}</td>
          <td>${esc(q.qa_q5)}</td>
          <td>${esc(q.reg_datetime)}</td>
        </tr>
      `;
    }
    htmlBody = `<table border="1" style="table-layout:fixed">${trs}</table>`;
  } else if (type === "item") {
    // Replicates exceldown_item.php
    filename = `item_questions_${ymd}.xls`;
    const qaMap = new Map(db.graphit_qa.map((q) => [Number(q.qa_no), q]));
    const items = db.g5_shop_item.filter((it) => it.ca_id === "10" && it.it_4);

    let trs = `
      <tr>
        <td style="background-color:#ffff00;font-weight:bold">검사식별코드</td>
        <td style="background-color:#ffff00;font-weight:bold" colspan="10">검사명</td>
        <td style="background-color:#ffff00;font-weight:bold">대상</td>
        <td style="background-color:#ffff00;font-weight:bold">최적연령</td>
        <td style="background-color:#ffff00;font-weight:bold">예상소요시간(분)</td>
        <td style="background-color:#ffff00;font-weight:bold">금액 (VAT포함)</td>
        <td style="background-color:#ffff00;font-weight:bold">등록일</td>
      </tr>
      <tr>
        <td style="background-color:#ffff00;font-weight:bold">문항식별코드</td>
        <td style="background-color:#ffff00;font-weight:bold">유형</td>
        <td style="background-color:#ffff00;font-weight:bold">요약</td>
        <td style="background-color:#ffff00;font-weight:bold">주제 1분류</td>
        <td style="background-color:#ffff00;font-weight:bold">주제 2분류</td>
        <td style="background-color:#ffff00;font-weight:bold">난이도</td>
        <td style="background-color:#ffff00;font-weight:bold">성향</td>
        <td style="background-color:#ffff00;font-weight:bold">역량</td>
        <td style="background-color:#ffff00;font-weight:bold">질문</td>
        <td style="background-color:#ffff00;font-weight:bold">지문</td>
        <td style="background-color:#ffff00;font-weight:bold">선택지1</td>
        <td style="background-color:#ffff00;font-weight:bold">선택지2</td>
        <td style="background-color:#ffff00;font-weight:bold">선택지3</td>
        <td style="background-color:#ffff00;font-weight:bold">선택지4</td>
        <td style="background-color:#ffff00;font-weight:bold">선택지5</td>
        <td style="background-color:#ffff00;font-weight:bold">등록일자</td>
      </tr>
    `;

    for (const it of items) {
      trs += `
        <tr style="background-color:#ffebe3;font-weight:bold">
          <td>${esc(it.it_4)}</td>
          <td colspan="10">${esc(it.it_name)}</td>
          <td>${esc(it.it_1)}</td>
          <td>${esc(it.it_2)}</td>
          <td>${esc(it.it_3)}</td>
          <td>${Number(it.it_price || 0).toLocaleString()}</td>
          <td>${esc(it.it_time)}</td>
        </tr>
      `;
      const mappings = db.graphit_item
        .filter((gi) => String(gi.it_id) === String(it.it_id))
        .sort((a, b) => Number(a.item_seq) - Number(b.item_seq));

      for (const m of mappings) {
        const q = qaMap.get(Number(m.qa_no));
        if (!q) continue;
        trs += `
          <tr>
            <td>${esc(q.qa_code)}</td>
            <td>${q.qa_type === "n" ? "객관식" : "주관식"}</td>
            <td>${esc(q.qa_summary)}</td>
            <td>${esc(q.qa_sub1)}</td>
            <td>${esc(q.qa_sub2)}</td>
            <td>${esc(q.qa_level)}</td>
            <td>${esc(q.qa_tendency)}</td>
            <td>${esc(q.qa_power)}</td>
            <td>${esc(q.qa_subject)}</td>
            <td>${esc(q.qa_content)}</td>
            <td>${esc(q.qa_q1)}</td>
            <td>${esc(q.qa_q2)}</td>
            <td>${esc(q.qa_q3)}</td>
            <td>${esc(q.qa_q4)}</td>
            <td>${esc(q.qa_q5)}</td>
            <td>${esc(q.reg_datetime)}</td>
          </tr>
        `;
      }
    }
    htmlBody = `<table border="1" style="table-layout:fixed">${trs}</table>`;
  }

  const fullHtml = `\uFEFF<html><head><meta charset="utf-8"></head><body bgcolor="#FFFFFF">${htmlBody}</body></html>`;

  return new NextResponse(fullHtml, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

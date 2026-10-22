import { NextRequest, NextResponse } from "next/server";
import { getDb, formatKstDate } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import {
  buildNoAnswersMap,
  computeResultBaseRow,
  ABILITY_INDICATORS,
  EXTRA_INDICATORS,
  HABIT_INDICATORS,
} from "@/lib/reportEngine";

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
        if (rawAns.length > 0) {
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
        } else if (Array.isArray((r as any).no_answers)) {
          answerCells = ((r as any).no_answers as string[])
            .map((text) => {
              if (!text) return `<td style="color:red">답변없음</td>`;
              return `<td>${esc(text)}</td>`;
            })
            .join("");
        }
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
  } else if (type === "result_db") {
    const groupFilter = (searchParams.get("group_code") || "").trim();
    const itemFilter = (searchParams.get("it_id") || "").trim();
    const itemMap = new Map(db.g5_shop_item.map((it) => [String(it.it_id), it]));
    const qaMap = new Map(db.graphit_qa.map((q) => [Number(q.qa_no), q]));

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

    let rows = [...db.graphit_test]
      .filter((r) => r.test_status === "완료")
      .sort((a, b) => Number(b.test_no) - Number(a.test_no));

    if (groupFilter) {
      rows = rows.filter((r) => String(r.group_code) === groupFilter);
    }
    if (itemFilter) {
      rows = rows.filter((r) => String(r.it_id) === itemFilter);
    }
    if (fr_date && to_date) {
      rows = rows.filter((r) => inDateRange(r.test_datetime));
    }
    if (stx) {
      rows = rows.filter(
        (r) =>
          String(r.mb_name || "").toLowerCase().includes(stx) ||
          String(r.mb_id || "").toLowerCase().includes(stx) ||
          String(r.group_code || "").toLowerCase().includes(stx) ||
          String(r.group_name || "").toLowerCase().includes(stx) ||
          String(r.od_id || "").toLowerCase().includes(stx)
      );
    }

    const noCols = Array.from({ length: 208 }, (_, i) => `No_${i + 1}`);
    const derivedCols = [
      ...HABIT_INDICATORS,
      ...HABIT_INDICATORS.map((c) => `surv_${c}`),
      ...HABIT_INDICATORS.map((c) => `total_${c}`),
      ...HABIT_INDICATORS.map((c) => `diff_${c}`),
      ...ABILITY_INDICATORS,
      ...ABILITY_INDICATORS.map((c) => `${c}_pct`),
      ...ABILITY_INDICATORS.map((c) => `surv_${c}`),
      ...ABILITY_INDICATORS.map((c) => `total_${c}`),
      ...ABILITY_INDICATORS.map((c) => `diff_${c}`),
      ...EXTRA_INDICATORS,
      "HAB_TOP1", "HAB_TOP1_score",
      "ABY_TOP1", "ABY_TOP1_score", "ABY_TOP2", "ABY_TOP2_score", "ABY_TOP3", "ABY_TOP3_score", "ABY_TOP4", "ABY_TOP4_score",
      "HAB_bot1", "HAB_bot1_score",
      "ABY_bot1", "ABY_bot1_score", "ABY_bot2", "ABY_bot2_score", "ABY_bot3", "ABY_bot3_score", "ABY_bot4", "ABY_bot4_score",
      "surv_HAB_TOP1", "surv_HAB_TOP1_score",
      "surv_ABY_TOP1", "surv_ABY_TOP1_score", "surv_ABY_TOP2", "surv_ABY_TOP2_score", "surv_ABY_TOP3", "surv_ABY_TOP3_score", "surv_ABY_TOP4", "surv_ABY_TOP4_score",
      "surv_HAB_bot1", "surv_HAB_bot1_score",
      "surv_ABY_bot1", "surv_ABY_bot1_score", "surv_ABY_bot2", "surv_ABY_bot2_score", "surv_ABY_bot3", "surv_ABY_bot3_score", "surv_ABY_bot4", "surv_ABY_bot4_score",
      "total_HAB_TOP1", "total_HAB_TOP1_score",
      "total_ABY_TOP1", "total_ABY_TOP1_score", "total_ABY_TOP2", "total_ABY_TOP2_score", "total_ABY_TOP3", "total_ABY_TOP3_score", "total_ABY_TOP4", "total_ABY_TOP4_score",
      "total_HAB_bot1", "total_HAB_bot1_score",
      "total_ABY_bot1", "total_ABY_bot1_score", "total_ABY_bot2", "total_ABY_bot2_score", "total_ABY_bot3", "total_ABY_bot3_score", "total_ABY_bot4", "total_ABY_bot4_score",
      "ability_sub_1", "ability_sub_2", "ability_sub_3", "ability_sub_4", "ability_sub_5", "ability_sub_6", "ability_sub_7", "ability_sub_8", "ability_total_score",
      "habit_A", "habit_B", "habit_C", "habit_A_pct", "habit_B_pct", "habit_C_pct",
      "ability_A", "ability_B", "ability_C", "ability_D", "ability_A_pct", "ability_B_pct", "ability_C_pct", "ability_D_pct",
      "surv_ability_sub_1", "surv_ability_sub_2", "surv_ability_sub_3", "surv_ability_sub_4", "surv_ability_sub_5", "surv_ability_sub_6", "surv_ability_sub_7", "surv_ability_sub_8", "surv_ability_total_score",
      "surv_habit_A", "surv_habit_B", "surv_habit_C", "surv_habit_A_pct", "surv_habit_B_pct", "surv_habit_C_pct",
      "surv_ability_A", "surv_ability_B", "surv_ability_C", "surv_ability_D", "surv_ability_A_pct", "surv_ability_B_pct", "surv_ability_C_pct", "surv_ability_D_pct",
      "total_ability_sub_1", "total_ability_sub_2", "total_ability_sub_3", "total_ability_sub_4", "total_ability_sub_5", "total_ability_sub_6", "total_ability_sub_7", "total_ability_sub_8", "total_ability_total_score",
      "total_habit_A", "total_habit_B", "total_habit_C", "total_habit_A_pct", "total_habit_B_pct", "total_habit_C_pct",
      "total_ability_A", "total_ability_B", "total_ability_C", "total_ability_D", "total_ability_A_pct", "total_ability_B_pct", "total_ability_C_pct", "total_ability_D_pct",
      "MAX_habit_type", "min_habit_type", "MAX_ability_sub_type", "min_ability_sub_type", "MAX_ability_type", "min_ability_type",
      "surv_MAX_habit_type", "surv_min_habit_type", "surv_MAX_ability_sub_type", "surv_min_ability_sub_type", "surv_MAX_ability_type", "surv_min_ability_type",
      "total_MAX_habit_type", "total_min_habit_type", "total_MAX_ability_sub_type", "total_min_ability_sub_type", "total_MAX_ability_type", "total_min_ability_type",
      "lit_type", "surv_lit_type", "total_lit_type",
      "ENT", "MJR", "BEL", "CPR", "REC",
      "정보처리", "전제추론", "성장추구", "목적이해", "맥락파악", "동시처리", "위험관리", "변화관리", "과정관리", "수용능력", "비판능력", "활용능력", "타인이해", "자기성찰", "관계대응",
      "관계", "관계점수", "에너지", "에너지점수", "시간", "시간점수", "전략", "전략점수", "갈등", "갈등점수",
      "자아일치도", "자기평가정도",
      "진로_취업", "진로_창업", "진로_연구",
    ];

    const headerRow = [
      "연번", "주문번호", "단체명", "단체코드", "아이디", "이름", "연락처", "검사명", "검사식별코드", "날짜",
      ...noCols,
      ...derivedCols,
    ];

    const csvEscape = (val: any) => {
      if (val === null || val === undefined) return "";
      const s = typeof val === "number" ? (Number.isInteger(val) ? String(val) : String(Math.round(val * 1e8) / 1e8)) : String(val);
      if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const csvLines = [headerRow.map(csvEscape).join(",")];
    rows.forEach((r, idx) => {
      const itId = String(r.it_id || "");
      const shopItem = itemMap.get(itId);
      const rawAns = ansByMemberItem.get(`${r.mb_id}__${itId}`) || [];
      const noMap = buildNoAnswersMap(r, rawAns, qaMap);
      const resRow = computeResultBaseRow(
        {
          seq: idx + 1,
          test_no: Number(r.test_no) || idx + 1,
          od_id: String(r.od_id || ""),
          group_name: String(r.group_name || ""),
          group_code: String(r.group_code || ""),
          mb_id: String(r.mb_id || ""),
          mb_name: String(r.mb_name || ""),
          mb_hp: String(r.mb_hp || ""),
          it_id: itId,
          it_name: String(shopItem?.it_name || r.it_name || ""),
          it_code: String(shopItem?.it_4 || ""),
          test_date: String(
            r.end_datetime && !String(r.end_datetime).startsWith("0000")
              ? r.end_datetime
              : r.test_datetime || ""
          ).slice(0, 10),
        },
        noMap,
        db.graphit_qa
      );

      const lineVals = [
        resRow.seq,
        resRow.od_id,
        resRow.group_name,
        resRow.group_code,
        resRow.mb_id,
        resRow.mb_name,
        resRow.mb_hp,
        resRow.it_name,
        resRow.it_code,
        resRow.test_date,
        ...noCols.map((k) => resRow.scored_no[k] ?? ""),
        ...derivedCols.map((k) => (resRow as any)[k]),
      ];
      csvLines.push(lineVals.map(csvEscape).join(","));
    });

    const csvContent = "\uFEFF" + csvLines.join("\r\n");
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="result_base_set_${ymd}.csv"`,
      },
    });
  }

  const fullHtml = `\uFEFF<html><head><meta charset="utf-8"></head><body bgcolor="#FFFFFF">${htmlBody}</body></html>`;

  return new NextResponse(fullHtml, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

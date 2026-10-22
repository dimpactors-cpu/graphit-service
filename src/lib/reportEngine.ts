import corpusData from '@/data/report-corpus.json';

export type LitTypeName =
  | '조감형'
  | '가치형'
  | '사색형'
  | '설득형'
  | '감각형'
  | '체계형'
  | '참고형'
  | '목적형'
  | '현실형'
  | '수용형'
  | '판단형'
  | '실천형';

export interface TypeCorpus {
  type: LitTypeName;
  principle: string;
  mbti: string;
  selfRealization: {
    potentialOrg: string;
    tolerableEnv: string;
    stressfulEnv: string;
    suitableJob: string;
  };
  habit: {
    hashtags: string;
    relationshipAttitude: string;
    workAttitude: string;
    lifeHabit: string;
  };
  career: {
    values: string[];
  };
  study: {
    personality1: string;
    personality2: string;
    environment: string;
    suitableSubject: string;
    obstacle1: string;
    obstacle2: string;
    alternative1: string;
    alternative2: string;
    prepRatio: number;
    reviewRatio: number;
    conceptRatio: number;
    problemRatio: number;
    selfStudyRatio: number;
    tutoring1on1Ratio: number;
    groupTutoringRatio: number;
    academyRatio: number;
    independentSpaceRatio: number;
    openSpaceRatio: number;
  };
}

export const REPORT_CORPUS = corpusData as Record<LitTypeName, TypeCorpus>;

export const HABIT_INDICATORS = ['seL', 'foC', 'skI', 'reL', 'obJ'] as const;
export const ABILITY_INDICATORS = [
  'kwD', 'suM', 'coL', 'jdG',
  'cpR', 'apP', 'frM', 'prM',
  'stU', 'seT', 'cpS', 'erR',
  'inF', 'rbD', 'mmM', 'dcS',
] as const;
export const EXTRA_INDICATORS = [
  'slD', 'prP', 'enP', 'flX', 'rsP',
  'udT', 'prR', 'adT', 'inT',
  'cmA', 'inR', 'spT', 'rnE', 'stB', 'raG',
  'slC', 'caE', 'caD',
  'scR', 'exP', 'laN', 'qlF', 'awD',
] as const;

export const COMPETENCY_NAMES = [
  '정보처리', '전제추론', '성장추구',
  '목적이해', '맥락파악', '동시처리',
  '위험관리', '변화관리', '과정관리',
  '수용능력', '비판능력', '활용능력',
  '타인이해', '자기성찰', '관계대응',
] as const;

export interface ResultBaseRow {
  // Basic info
  seq: number;
  test_no: number;
  od_id: string;
  group_name: string;
  group_code: string;
  mb_id: string;
  mb_name: string;
  mb_hp: string;
  it_id: string;
  it_name: string;
  it_code: string;
  test_date: string;
  // Scored No_1..No_208
  scored_no: Record<string, string>;
  // Habit scores
  seL: number; foC: number; skI: number; reL: number; obJ: number;
  surv_seL: number; surv_foC: number; surv_skI: number; surv_reL: number; surv_obJ: number;
  total_seL: number; total_foC: number; total_skI: number; total_reL: number; total_obJ: number;
  diff_seL: number; diff_foC: number; diff_skI: number; diff_reL: number; diff_obJ: number;
  // Ability scores
  kwD: number; suM: number; coL: number; jdG: number;
  cpR: number; apP: number; frM: number; prM: number;
  stU: number; seT: number; cpS: number; erR: number;
  inF: number; rbD: number; mmM: number; dcS: number;
  kwD_pct: number; suM_pct: number; coL_pct: number; jdG_pct: number;
  cpR_pct: number; apP_pct: number; frM_pct: number; prM_pct: number;
  stU_pct: number; seT_pct: number; cpS_pct: number; erR_pct: number;
  inF_pct: number; rbD_pct: number; mmM_pct: number; dcS_pct: number;
  surv_kwD: number; surv_suM: number; surv_coL: number; surv_jdG: number;
  surv_cpR: number; surv_apP: number; surv_frM: number; surv_prM: number;
  surv_stU: number; surv_seT: number; surv_cpS: number; surv_erR: number;
  surv_inF: number; surv_rbD: number; surv_mmM: number; surv_dcS: number;
  total_kwD: number; total_suM: number; total_coL: number; total_jdG: number;
  total_cpR: number; total_apP: number; total_frM: number; total_prM: number;
  total_stU: number; total_seT: number; total_cpS: number; total_erR: number;
  total_inF: number; total_rbD: number; total_mmM: number; total_dcS: number;
  diff_kwD: number; diff_suM: number; diff_coL: number; diff_jdG: number;
  diff_cpR: number; diff_apP: number; diff_frM: number; diff_prM: number;
  diff_stU: number; diff_seT: number; diff_cpS: number; diff_erR: number;
  diff_inF: number; diff_rbD: number; diff_mmM: number; diff_dcS: number;
  // Extra indicators
  slD: number; prP: number; enP: number; flX: number; rsP: number;
  udT: number; prR: number; adT: number; inT: number;
  cmA: number; inR: number; spT: number; rnE: number; stB: number; raG: number;
  slC: number; caE: number; caD: number;
  scR: number; exP: number; laN: number; qlF: number; awD: number;
  // Top & Bottom rankings
  HAB_TOP1: string; HAB_TOP1_score: number;
  ABY_TOP1: string; ABY_TOP1_score: number;
  ABY_TOP2: string; ABY_TOP2_score: number;
  ABY_TOP3: string; ABY_TOP3_score: number;
  ABY_TOP4: string; ABY_TOP4_score: number;
  HAB_bot1: string; HAB_bot1_score: number;
  ABY_bot1: string; ABY_bot1_score: number;
  ABY_bot2: string; ABY_bot2_score: number;
  ABY_bot3: string; ABY_bot3_score: number;
  ABY_bot4: string; ABY_bot4_score: number;
  surv_HAB_TOP1: string; surv_HAB_TOP1_score: number;
  surv_ABY_TOP1: string; surv_ABY_TOP1_score: number;
  surv_ABY_TOP2: string; surv_ABY_TOP2_score: number;
  surv_ABY_TOP3: string; surv_ABY_TOP3_score: number;
  surv_ABY_TOP4: string; surv_ABY_TOP4_score: number;
  surv_HAB_bot1: string; surv_HAB_bot1_score: number;
  surv_ABY_bot1: string; surv_ABY_bot1_score: number;
  surv_ABY_bot2: string; surv_ABY_bot2_score: number;
  surv_ABY_bot3: string; surv_ABY_bot3_score: number;
  surv_ABY_bot4: string; surv_ABY_bot4_score: number;
  total_HAB_TOP1: string; total_HAB_TOP1_score: number;
  total_ABY_TOP1: string; total_ABY_TOP1_score: number;
  total_ABY_TOP2: string; total_ABY_TOP2_score: number;
  total_ABY_TOP3: string; total_ABY_TOP3_score: number;
  total_ABY_TOP4: string; total_ABY_TOP4_score: number;
  total_HAB_bot1: string; total_HAB_bot1_score: number;
  total_ABY_bot1: string; total_ABY_bot1_score: number;
  total_ABY_bot2: string; total_ABY_bot2_score: number;
  total_ABY_bot3: string; total_ABY_bot3_score: number;
  total_ABY_bot4: string; total_ABY_bot4_score: number;
  // Sub & Group scores
  ability_sub_1: number; ability_sub_2: number; ability_sub_3: number; ability_sub_4: number;
  ability_sub_5: number; ability_sub_6: number; ability_sub_7: number; ability_sub_8: number;
  ability_total_score: number;
  habit_A: number; habit_B: number; habit_C: number;
  habit_A_pct: number; habit_B_pct: number; habit_C_pct: number;
  ability_A: number; ability_B: number; ability_C: number; ability_D: number;
  ability_A_pct: number; ability_B_pct: number; ability_C_pct: number; ability_D_pct: number;
  surv_ability_sub_1: number; surv_ability_sub_2: number; surv_ability_sub_3: number; surv_ability_sub_4: number;
  surv_ability_sub_5: number; surv_ability_sub_6: number; surv_ability_sub_7: number; surv_ability_sub_8: number;
  surv_ability_total_score: number;
  surv_habit_A: number; surv_habit_B: number; surv_habit_C: number;
  surv_habit_A_pct: number; surv_habit_B_pct: number; surv_habit_C_pct: number;
  surv_ability_A: number; surv_ability_B: number; surv_ability_C: number; surv_ability_D: number;
  surv_ability_A_pct: number; surv_ability_B_pct: number; surv_ability_C_pct: number; surv_ability_D_pct: number;
  total_ability_sub_1: number; total_ability_sub_2: number; total_ability_sub_3: number; total_ability_sub_4: number;
  total_ability_sub_5: number; total_ability_sub_6: number; total_ability_sub_7: number; total_ability_sub_8: number;
  total_ability_total_score: number;
  total_habit_A: number; total_habit_B: number; total_habit_C: number;
  total_habit_A_pct: number; total_habit_B_pct: number; total_habit_C_pct: number;
  total_ability_A: number; total_ability_B: number; total_ability_C: number; total_ability_D: number;
  total_ability_A_pct: number; total_ability_B_pct: number; total_ability_C_pct: number; total_ability_D_pct: number;
  // Max/Min types
  MAX_habit_type: string; min_habit_type: string;
  MAX_ability_sub_type: string; min_ability_sub_type: string;
  MAX_ability_type: string; min_ability_type: string;
  surv_MAX_habit_type: string; surv_min_habit_type: string;
  surv_MAX_ability_sub_type: string; surv_min_ability_sub_type: string;
  surv_MAX_ability_type: string; surv_min_ability_type: string;
  total_MAX_habit_type: string; total_min_habit_type: string;
  total_MAX_ability_sub_type: string; total_min_ability_sub_type: string;
  total_MAX_ability_type: string; total_min_ability_type: string;
  // 12 Types
  lit_type: LitTypeName;
  surv_lit_type: LitTypeName;
  total_lit_type: LitTypeName;
  // Composite indices
  ENT: number; MJR: number; BEL: number; CPR: number; REC: number;
  // 15 Competencies
  정보처리: number; 전제추론: number; 성장추구: number;
  목적이해: number; 맥락파악: number; 동시처리: number;
  위험관리: number; 변화관리: number; 과정관리: number;
  수용능력: number; 비판능력: number; 활용능력: number;
  타인이해: number; 자기성찰: number; 관계대응: number;
  // 5 Directions
  관계: string; 관계점수: number;
  에너지: string; 에너지점수: number;
  시간: string; 시간점수: number;
  전략: string; 전략점수: number;
  갈등: string; 갈등점수: number;
  // Self congruence & evaluation
  자아일치도: number;
  자기평가정도: number;
  // 3 Career Fit Scores
  진로_취업: number;
  진로_창업: number;
  진로_연구: number;
}

export interface StudentReportData {
  // Basic info
  id: string;
  name: string;
  groupName: string;
  serialNo: string;
  testName: string;
  testDate: string;
  litType: LitTypeName;
  survLitType: LitTypeName;
  totalLitType: LitTypeName;
  mbti: string;
  principle: string;
  // Page 1: 자아실현 로드맵
  directions: {
    relationship: { score: number; leftLabel: string; rightLabel: string; dominant: string };
    energy: { score: number; leftLabel: string; rightLabel: string; dominant: string };
    time: { score: number; leftLabel: string; rightLabel: string; dominant: string };
    strategy: { score: number; leftLabel: string; rightLabel: string; dominant: string };
    conflict: { score: number; leftLabel: string; rightLabel: string; dominant: string };
  };
  selfCongruenceRate: number; // 1 - 자기평가정도/100 (0..1)
  selfEvaluationGap: number;  // 자기평가정도
  coreValues: string[];       // 6 values
  // Page 2: 습관 로드맵
  hashtags: string[];
  hashtagsRaw: string;
  relationshipAttitude: string;
  workAttitude: string;
  lifeHabitAdvice: string;
  habitDistribution: {
    selfPct: number;   // 자기화 (total_habit_A_pct)
    focusSkillPct: number; // 몰입+기술 (total_habit_B_pct)
    relObjPct: number; // 관계+객관 (total_habit_C_pct)
  };
  // Page 3: 진로 로드맵
  maiAverage: number;
  competencies: {
    category: string;
    items: { name: string; label: string; score: number }[];
  }[];
  careerFit: {
    employment: number;       // 취업
    entrepreneurship: number; // 창업
    research: number;         // 연구
  };
  orgFit: {
    potentialOrg: string;
    tolerableEnv: string;
    stressfulEnv: string;
    suitableJob: string;
    fullNarrative: string;
  };
  // Page 4: 학습 로드맵
  studyStrength: {
    personality1: string;
    personality2: string;
    environment: string;
    suitableSubject: string;
    paragraph1: string;
    paragraph2: string;
  };
  studyWeakness: {
    obstacle1: string;
    obstacle2: string;
    alternative1: string;
    alternative2: string;
    paragraph1: string;
    paragraph2: string;
  };
  studyPlanRatios: {
    prep: number; review: number;
    concept: number; problem: number;
    selfStudy: number; tutoring1on1: number;
    groupTutoring: number; academy: number;
    independentSpace: number; openSpace: number;
  };
}

const LIT_TYPE_MATRIX: Record<string, LitTypeName> = {
  'A*A': '조감형',
  'A*B': '가치형',
  'A*C': '사색형',
  'A*D': '설득형',
  'B*A': '감각형',
  'B*B': '체계형',
  'B*C': '참고형',
  'B*D': '목적형',
  'C*A': '현실형',
  'C*B': '수용형',
  'C*C': '판단형',
  'C*D': '실천형',
};

const SR_SCORE_MAP: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0.5,
  4: 1.0,
  5: 0,
};

function scoreSubjectiveAnswer(rawText: string, ansKey: string, qCode: string): boolean {
  const txt = String(rawText || '').trim();
  if (!txt) return false;
  if (txt.toUpperCase() === 'TRUE') return true;
  if (txt.toUpperCase() === 'FALSE') return false;

  if (qCode && qCode.startsWith('ti')) {
    const tokens = String(ansKey || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const reqs: string[] = [];
    const opts: string[] = [];
    for (const t of tokens) {
      const m = t.match(/^\{(.+)\}$/);
      if (m) reqs.push(m[1].trim());
      else opts.push(t);
    }
    const reqOk = reqs.every((r) => txt.includes(r));
    const optOk = opts.length === 0 || opts.some((o) => txt.includes(o));
    return reqOk && optOk;
  }

  const cleanAns = String(ansKey || '').replace(/[\s,.\-_/]/g, '');
  if (!cleanAns) return false;

  if (qCode && qCode.includes('inF')) {
    if (cleanAns === '1' && txt.trim() === '11') return false;
    return [...cleanAns].every((ch) => txt.includes(ch));
  }
  if (qCode && qCode.includes('mmM')) {
    const cleanTxt = txt.replace(/[,.\s]/g, '');
    return cleanTxt.startsWith(cleanAns) || cleanTxt === cleanAns;
  }
  const cleanTxt = txt.replace(/[\s,.\-_/]/g, '');
  return cleanTxt === cleanAns;
}

export function computeResultBaseRow(
  meta: {
    seq: number;
    test_no: number;
    od_id: string;
    group_name: string;
    group_code: string;
    mb_id: string;
    mb_name: string;
    mb_hp: string;
    it_id: string;
    it_name: string;
    it_code: string;
    test_date: string;
  },
  /** Map of "No_1".."No_208" -> student answer or scored value */
  noAnswersMap: Record<string, string>,
  qaList: any[]
): ResultBaseRow {
  const qaByTestNo = new Map<string, any>();
  for (const q of qaList) {
    if (q.al_test_no) {
      qaByTestNo.set(String(q.al_test_no), q);
    } else if (Number(q.qa_no) >= 1001 && Number(q.qa_no) <= 1208) {
      qaByTestNo.set(`No_${Number(q.qa_no) - 1000}`, q);
    }
  }

  const scored_no: Record<string, string> = {};
  const habCounts: Record<string, number> = { seL: 0, foC: 0, skI: 0, reL: 0, obJ: 0 };
  const survHabPts: Record<string, number> = { seL: 0, foC: 0, skI: 0, reL: 0, obJ: 0 };
  const abyEarned: Record<string, number> = {};
  const abyMax: Record<string, number> = {};
  const survAbyPts: Record<string, number> = {};
  const extraPts: Record<string, number> = {};

  for (const c of ABILITY_INDICATORS) {
    abyEarned[c] = 0;
    abyMax[c] = 0;
    survAbyPts[c] = 0;
  }
  for (const c of EXTRA_INDICATORS) {
    extraPts[c] = 0;
  }

  let slcSlashCount = 0;

  for (let i = 1; i <= 208; i++) {
    const key = `No_${i}`;
    const rawInput = String(noAnswersMap[key] ?? '').trim();
    const qa = qaByTestNo.get(key);
    if (!qa) {
      scored_no[key] = rawInput;
      continue;
    }

    const qCode = String(qa.qa_code || '');
    const ansKey = String(qa.qa_answer || '').trim();
    const weights: Record<string, number> = qa.qa_weights || {};

    // 1. rfHAB: tendency choice mapping (seL, foC, skI, reL, obJ -> 1..5)
    if (qCode.startsWith('rfHAB')) {
      let chosenInd = '';
      if ((HABIT_INDICATORS as readonly string[]).includes(rawInput)) {
        chosenInd = rawInput;
      } else {
        const numChoice = parseInt(rawInput, 10);
        if (!isNaN(numChoice)) {
          for (const h of HABIT_INDICATORS) {
            if (Number(weights[h]) === numChoice) {
              chosenInd = h;
              break;
            }
          }
        }
      }
      scored_no[key] = chosenInd || rawInput;
      if (chosenInd && habCounts[chosenInd] !== undefined) {
        habCounts[chosenInd] += 1;
      }
      continue;
    }

    // 2. coHAB: objective habit question (ans = 1)
    if (qCode.startsWith('coHAB')) {
      const isOk =
        rawInput.toUpperCase() === 'TRUE' ||
        (rawInput !== '' && rawInput.toUpperCase() !== 'FALSE' && String(parseInt(rawInput, 10)) === ansKey);
      scored_no[key] = rawInput === '' ? '' : isOk ? 'TRUE' : 'FALSE';
      if (isOk) {
        for (const h of HABIT_INDICATORS) {
          if (Number(weights[h]) > 0) {
            habCounts[h] += Number(weights[h]);
          }
        }
      }
      continue;
    }

    // 3. srHAB: self-report habit
    if (qCode.startsWith('srHAB')) {
      const choiceNum = parseInt(rawInput, 10);
      scored_no[key] = !isNaN(choiceNum) ? String(choiceNum) : rawInput;
      const pt = !isNaN(choiceNum) ? (SR_SCORE_MAP[choiceNum] ?? 0) : 0;
      for (const h of HABIT_INDICATORS) {
        if (Number(weights[h]) > 0) {
          survHabPts[h] += pt * Number(weights[h]);
        }
      }
      continue;
    }

    // 4. srABY: self-report ability
    if (qCode.startsWith('srABY')) {
      const choiceNum = parseInt(rawInput, 10);
      scored_no[key] = !isNaN(choiceNum) ? String(choiceNum) : rawInput;
      const pt = !isNaN(choiceNum) ? (SR_SCORE_MAP[choiceNum] ?? 0) : 0;
      for (const c of ABILITY_INDICATORS) {
        if (Number(weights[c]) > 0) {
          survAbyPts[c] += pt * Number(weights[c]);
        }
      }
      continue;
    }

    // 5. coABY, tiABY, toABY: cognitive/test ability
    if (qCode.startsWith('coABY') || qCode.startsWith('tiABY') || qCode.startsWith('toABY')) {
      let isOk = false;
      if (qCode.startsWith('coABY')) {
        isOk =
          rawInput.toUpperCase() === 'TRUE' ||
          (rawInput !== '' && rawInput.toUpperCase() !== 'FALSE' && String(parseInt(rawInput, 10)) === ansKey);
        scored_no[key] = rawInput === '' ? '' : isOk ? 'TRUE' : 'FALSE';
      } else {
        isOk = scoreSubjectiveAnswer(rawInput, ansKey, qCode);
        scored_no[key] = rawInput;
      }

      for (const c of ABILITY_INDICATORS) {
        const w = Number(weights[c] || 0);
        if (w > 0) {
          abyMax[c] += w;
          if (isOk) abyEarned[c] += w;
        }
      }
      continue;
    }

    // 6. tsCPR (slC subjective items)
    if (qCode.startsWith('tsCPR')) {
      scored_no[key] = rawInput;
      const slashes = (rawInput.match(/\//g) || []).length;
      slcSlashCount += slashes;
      continue;
    }

    // 7. srENT, srMJR, srBEL, srCPR, srREC
    if (qCode.startsWith('sr')) {
      const choiceNum = parseInt(rawInput, 10);
      scored_no[key] = !isNaN(choiceNum) ? String(choiceNum) : rawInput;
      const pt = !isNaN(choiceNum) ? (SR_SCORE_MAP[choiceNum] ?? 0) : 0;
      for (const c of EXTRA_INDICATORS) {
        if (Number(weights[c]) > 0) {
          extraPts[c] += pt * Number(weights[c]);
        }
      }
      continue;
    }

    // 8. Default / intro items (ooo...)
    scored_no[key] = rawInput;
  }

  extraPts.slC = Math.round((3 + 0.1 * slcSlashCount) * 10) / 10;

  // Habit percentages
  const habSum = Object.values(habCounts).reduce((a, b) => a + b, 0) || 1;
  const seL = (habCounts.seL / habSum) * 100;
  const foC = (habCounts.foC / habSum) * 100;
  const skI = (habCounts.skI / habSum) * 100;
  const reL = (habCounts.reL / habSum) * 100;
  const obJ = (habCounts.obJ / habSum) * 100;

  const survHabSum = Object.values(survHabPts).reduce((a, b) => a + b, 0) || 1;
  const surv_seL = (survHabPts.seL / survHabSum) * 100;
  const surv_foC = (survHabPts.foC / survHabSum) * 100;
  const surv_skI = (survHabPts.skI / survHabSum) * 100;
  const surv_reL = (survHabPts.reL / survHabSum) * 100;
  const surv_obJ = (survHabPts.obJ / survHabSum) * 100;

  const total_seL = (2 / 3) * seL + (1 / 3) * surv_seL;
  const total_foC = (2 / 3) * foC + (1 / 3) * surv_foC;
  const total_skI = (2 / 3) * skI + (1 / 3) * surv_skI;
  const total_reL = (2 / 3) * reL + (1 / 3) * surv_reL;
  const total_obJ = (2 / 3) * obJ + (1 / 3) * surv_obJ;

  const diff_seL = seL - surv_seL;
  const diff_foC = foC - surv_foC;
  const diff_skI = skI - surv_skI;
  const diff_reL = reL - surv_reL;
  const diff_obJ = obJ - surv_obJ;

  // Ability scores (scaled by totalMaxWeight / 4 = 15.9, pct = earned / max * 100, surv = pts / 7.5 * 100)
  const totalAbyMax = Object.values(abyMax).reduce((a, b) => a + b, 0) || 63.6;
  const abyScaleDenom = totalAbyMax / 4; // 15.9

  const abyScores: Record<string, number> = {};
  const abyPcts: Record<string, number> = {};
  const survAbyScores: Record<string, number> = {};
  const totalAbyScores: Record<string, number> = {};
  const diffAbyScores: Record<string, number> = {};

  for (const c of ABILITY_INDICATORS) {
    const v = (abyEarned[c] / abyScaleDenom) * 100;
    const pct = abyMax[c] > 0 ? (abyEarned[c] / abyMax[c]) * 100 : 0;
    const sv = (survAbyPts[c] / 7.5) * 100;
    const tv = (2 / 3) * v + (1 / 3) * sv;
    const dv = v - sv;
    abyScores[c] = v;
    abyPcts[c] = pct;
    survAbyScores[c] = sv;
    totalAbyScores[c] = tv;
    diffAbyScores[c] = dv;
  }

  // Helper for top/bottom rankings
  function rankEntries(entries: [string, number][]) {
    const desc = [...entries].sort((a, b) => b[1] - a[1]);
    const asc = [...entries].sort((a, b) => a[1] - b[1]);
    return { desc, asc };
  }

  const habRank = rankEntries([
    ['seL', seL], ['foC', foC], ['skI', skI], ['reL', reL], ['obJ', obJ],
  ]);
  const survHabRank = rankEntries([
    ['surv_seL', surv_seL], ['surv_foC', surv_foC], ['surv_skI', surv_skI], ['surv_reL', surv_reL], ['surv_obJ', surv_obJ],
  ]);
  const totalHabRank = rankEntries([
    ['total_seL', total_seL], ['total_foC', total_foC], ['total_skI', total_skI], ['total_reL', total_reL], ['total_obJ', total_obJ],
  ]);

  const abyRank = rankEntries(ABILITY_INDICATORS.map((c) => [c, abyScores[c]]));
  const survAbyRank = rankEntries(ABILITY_INDICATORS.map((c) => [`surv_${c}`, survAbyScores[c]]));
  const totalAbyRank = rankEntries(ABILITY_INDICATORS.map((c) => [`total_${c}`, totalAbyScores[c]]));

  // Sub-scores 1..8
  const ability_sub_1 = abyScores.kwD + abyScores.suM;
  const ability_sub_2 = abyScores.coL + abyScores.jdG;
  const ability_sub_3 = abyScores.cpR + abyScores.apP;
  const ability_sub_4 = abyScores.frM + abyScores.prM;
  const ability_sub_5 = abyScores.stU + abyScores.seT;
  const ability_sub_6 = abyScores.cpS + abyScores.erR;
  const ability_sub_7 = abyScores.inF + abyScores.rbD;
  const ability_sub_8 = abyScores.mmM + abyScores.dcS;
  const ability_total_score =
    ability_sub_1 + ability_sub_2 + ability_sub_3 + ability_sub_4 +
    ability_sub_5 + ability_sub_6 + ability_sub_7 + ability_sub_8;

  const surv_ability_sub_1 = survAbyScores.kwD + survAbyScores.suM;
  const surv_ability_sub_2 = survAbyScores.coL + survAbyScores.jdG;
  const surv_ability_sub_3 = survAbyScores.cpR + survAbyScores.apP;
  const surv_ability_sub_4 = survAbyScores.frM + survAbyScores.prM;
  const surv_ability_sub_5 = survAbyScores.stU + survAbyScores.seT;
  const surv_ability_sub_6 = survAbyScores.cpS + survAbyScores.erR;
  const surv_ability_sub_7 = survAbyScores.inF + survAbyScores.rbD;
  const surv_ability_sub_8 = survAbyScores.mmM + survAbyScores.dcS;
  const surv_ability_total_score =
    surv_ability_sub_1 + surv_ability_sub_2 + surv_ability_sub_3 + surv_ability_sub_4 +
    surv_ability_sub_5 + surv_ability_sub_6 + surv_ability_sub_7 + surv_ability_sub_8;

  const total_ability_sub_1 = totalAbyScores.kwD + totalAbyScores.suM;
  const total_ability_sub_2 = totalAbyScores.coL + totalAbyScores.jdG;
  const total_ability_sub_3 = totalAbyScores.cpR + totalAbyScores.apP;
  const total_ability_sub_4 = totalAbyScores.frM + totalAbyScores.prM;
  const total_ability_sub_5 = totalAbyScores.stU + totalAbyScores.seT;
  const total_ability_sub_6 = totalAbyScores.cpS + totalAbyScores.erR;
  const total_ability_sub_7 = totalAbyScores.inF + totalAbyScores.rbD;
  const total_ability_sub_8 = totalAbyScores.mmM + totalAbyScores.dcS;
  const total_ability_total_score =
    total_ability_sub_1 + total_ability_sub_2 + total_ability_sub_3 + total_ability_sub_4 +
    total_ability_sub_5 + total_ability_sub_6 + total_ability_sub_7 + total_ability_sub_8;

  // Habit A, B, C & Ability A, B, C, D
  const habit_A = seL;
  const habit_B = (foC + skI) / 2;
  const habit_C = (reL + obJ) / 2;
  const habAbcSum = habit_A + habit_B + habit_C || 1;
  const habit_A_pct = (habit_A / habAbcSum) * 100;
  const habit_B_pct = (habit_B / habAbcSum) * 100;
  const habit_C_pct = (habit_C / habAbcSum) * 100;

  const ability_A = ability_sub_1 + ability_sub_2;
  const ability_B = ability_sub_3 + ability_sub_4;
  const ability_C = ability_sub_5 + ability_sub_6;
  const ability_D = ability_sub_7 + ability_sub_8;
  const abyAbcdSum = ability_total_score || 1;
  const ability_A_pct = (ability_A / abyAbcdSum) * 100;
  const ability_B_pct = (ability_B / abyAbcdSum) * 100;
  const ability_C_pct = (ability_C / abyAbcdSum) * 100;
  const ability_D_pct = (ability_D / abyAbcdSum) * 100;

  const surv_habit_A = surv_seL;
  const surv_habit_B = (surv_foC + surv_skI) / 2;
  const surv_habit_C = (surv_reL + surv_obJ) / 2;
  const survHabAbcSum = surv_habit_A + surv_habit_B + surv_habit_C || 1;
  const surv_habit_A_pct = (surv_habit_A / survHabAbcSum) * 100;
  const surv_habit_B_pct = (surv_habit_B / survHabAbcSum) * 100;
  const surv_habit_C_pct = (surv_habit_C / survHabAbcSum) * 100;

  const surv_ability_A = surv_ability_sub_1 + surv_ability_sub_2;
  const surv_ability_B = surv_ability_sub_3 + surv_ability_sub_4;
  const surv_ability_C = surv_ability_sub_5 + surv_ability_sub_6;
  const surv_ability_D = surv_ability_sub_7 + surv_ability_sub_8;
  const survAbyAbcdSum = surv_ability_total_score || 1;
  const surv_ability_A_pct = (surv_ability_A / survAbyAbcdSum) * 100;
  const surv_ability_B_pct = (surv_ability_B / survAbyAbcdSum) * 100;
  const surv_ability_C_pct = (surv_ability_C / survAbyAbcdSum) * 100;
  const surv_ability_D_pct = (surv_ability_D / survAbyAbcdSum) * 100;

  const total_habit_A = total_seL;
  const total_habit_B = (total_foC + total_skI) / 2;
  const total_habit_C = (total_reL + total_obJ) / 2;
  const totalHabAbcSum = total_habit_A + total_habit_B + total_habit_C || 1;
  const total_habit_A_pct = (total_habit_A / totalHabAbcSum) * 100;
  const total_habit_B_pct = (total_habit_B / totalHabAbcSum) * 100;
  const total_habit_C_pct = (total_habit_C / totalHabAbcSum) * 100;

  const total_ability_A = total_ability_sub_1 + total_ability_sub_2;
  const total_ability_B = total_ability_sub_3 + total_ability_sub_4;
  const total_ability_C = total_ability_sub_5 + total_ability_sub_6;
  const total_ability_D = total_ability_sub_7 + total_ability_sub_8;
  const totalAbyAbcdSum = total_ability_total_score || 1;
  const total_ability_A_pct = (total_ability_A / totalAbyAbcdSum) * 100;
  const total_ability_B_pct = (total_ability_B / totalAbyAbcdSum) * 100;
  const total_ability_C_pct = (total_ability_C / totalAbyAbcdSum) * 100;
  const total_ability_D_pct = (total_ability_D / totalAbyAbcdSum) * 100;

  // Max/Min types
  const habTypeRank = rankEntries([['habit_A', habit_A], ['habit_B', habit_B], ['habit_C', habit_C]]);
  const subTypeRank = rankEntries([
    ['ability_sub_1', ability_sub_1], ['ability_sub_2', ability_sub_2],
    ['ability_sub_3', ability_sub_3], ['ability_sub_4', ability_sub_4],
    ['ability_sub_5', ability_sub_5], ['ability_sub_6', ability_sub_6],
    ['ability_sub_7', ability_sub_7], ['ability_sub_8', ability_sub_8],
  ]);
  const abyTypeRank = rankEntries([
    ['ability_A', ability_A], ['ability_B', ability_B], ['ability_C', ability_C], ['ability_D', ability_D],
  ]);

  const survHabTypeRank = rankEntries([['surv_habit_A', surv_habit_A], ['surv_habit_B', surv_habit_B], ['surv_habit_C', surv_habit_C]]);
  const survSubTypeRank = rankEntries([
    ['surv_ability_sub_1', surv_ability_sub_1], ['surv_ability_sub_2', surv_ability_sub_2],
    ['surv_ability_sub_3', surv_ability_sub_3], ['surv_ability_sub_4', surv_ability_sub_4],
    ['surv_ability_sub_5', surv_ability_sub_5], ['surv_ability_sub_6', surv_ability_sub_6],
    ['surv_ability_sub_7', surv_ability_sub_7], ['surv_ability_sub_8', surv_ability_sub_8],
  ]);
  const survAbyTypeRank = rankEntries([
    ['surv_ability_A', surv_ability_A], ['surv_ability_B', surv_ability_B], ['surv_ability_C', surv_ability_C], ['surv_ability_D', surv_ability_D],
  ]);

  const totalHabTypeRank = rankEntries([['total_habit_A', total_habit_A], ['total_habit_B', total_habit_B], ['total_habit_C', total_habit_C]]);
  const totalSubTypeRank = rankEntries([
    ['ability_sub_1', total_ability_sub_1], ['ability_sub_2', total_ability_sub_2],
    ['ability_sub_3', total_ability_sub_3], ['ability_sub_4', total_ability_sub_4],
    ['ability_sub_5', total_ability_sub_5], ['ability_sub_6', total_ability_sub_6],
    ['ability_sub_7', total_ability_sub_7], ['ability_sub_8', total_ability_sub_8],
  ]);
  const totalAbyTypeRank = rankEntries([
    ['total_ability_A', total_ability_A], ['total_ability_B', total_ability_B], ['total_ability_C', total_ability_C], ['total_ability_D', total_ability_D],
  ]);

  const MAX_habit_type = habTypeRank.desc[0][0];
  const min_habit_type = habTypeRank.asc[0][0];
  const MAX_ability_sub_type = subTypeRank.desc[0][0];
  const min_ability_sub_type = subTypeRank.asc[0][0];
  const MAX_ability_type = abyTypeRank.desc[0][0];
  const min_ability_type = abyTypeRank.asc[0][0];

  const surv_MAX_habit_type = survHabTypeRank.desc[0][0];
  const surv_min_habit_type = survHabTypeRank.asc[0][0];
  const surv_MAX_ability_sub_type = survSubTypeRank.desc[0][0];
  const surv_min_ability_sub_type = survSubTypeRank.asc[0][0];
  const surv_MAX_ability_type = survAbyTypeRank.desc[0][0];
  const surv_min_ability_type = survAbyTypeRank.asc[0][0];

  const total_MAX_habit_type = totalHabTypeRank.desc[0][0];
  const total_min_habit_type = totalHabTypeRank.asc[0][0];
  const total_MAX_ability_sub_type = totalSubTypeRank.desc[0][0];
  const total_min_ability_sub_type = totalSubTypeRank.asc[0][0];
  const total_MAX_ability_type = totalAbyTypeRank.desc[0][0];
  const total_min_ability_type = totalAbyTypeRank.asc[0][0];

  const lit_type = LIT_TYPE_MATRIX[`${MAX_habit_type.slice(-1)}*${MAX_ability_type.slice(-1)}`] || '참고형';
  const surv_lit_type = LIT_TYPE_MATRIX[`${surv_MAX_habit_type.slice(-1)}*${surv_MAX_ability_type.slice(-1)}`] || '참고형';
  const total_lit_type = LIT_TYPE_MATRIX[`${total_MAX_habit_type.slice(-1)}*${total_MAX_ability_type.slice(-1)}`] || '참고형';

  // ENT, MJR, BEL, CPR, REC
  const ENT = (extraPts.slD + extraPts.prP + extraPts.enP + extraPts.flX + extraPts.rsP) / 5;
  const MJR = (extraPts.udT + extraPts.prR + extraPts.adT + extraPts.inT) / 4;
  const BEL = (extraPts.cmA + extraPts.inR + extraPts.spT + extraPts.rnE + extraPts.stB + extraPts.raG) / 6;
  const CPR = (extraPts.slC + extraPts.caE + extraPts.caD) / 3;
  const REC = (extraPts.scR + extraPts.exP + extraPts.laN + extraPts.qlF + extraPts.awD) / 5;

  // 15 Competencies (exact rational formulas verified with err < 1e-8)
  const 정보처리 = (1 / 10) * seL + (1 / 15) * skI + (1 / 30) * obJ + 0.4 * abyPcts.kwD + 0.2 * abyPcts.suM + 0.2 * abyPcts.frM;
  const 전제추론 = (1 / 10) * total_foC + (1 / 30) * total_reL + (1 / 15) * total_obJ + 0.2 * abyPcts.cpR + 0.2 * abyPcts.frM + 0.4 * abyPcts.prM;
  const 성장추구 = (1 / 10) * total_seL + (1 / 15) * total_foC + (1 / 30) * total_obJ + 0.16 * abyPcts.prM + 0.32 * abyPcts.rbD + 0.32 * abyPcts.dcS;
  const 목적이해 = (1 / 15) * total_foC + (1 / 10) * total_skI + (1 / 30) * total_obJ + 0.16 * abyPcts.kwD + 0.32 * abyPcts.cpR + 0.32 * abyPcts.stU;
  const 맥락파악 = (1 / 10) * foC + (1 / 15) * skI + (1 / 30) * obJ + (2 / 15) * abyPcts.suM + (2 / 15) * abyPcts.stU + (4 / 15) * abyPcts.seT + (4 / 15) * abyPcts.dcS;
  const 동시처리 = (1 / 15) * total_foC + (1 / 30) * total_skI + (1 / 10) * total_obJ + (4 / 15) * abyPcts.suM + (4 / 15) * abyPcts.frM + (2 / 15) * abyPcts.prM + (2 / 15) * abyPcts.seT;
  const 위험관리 = (1 / 30) * total_foC + (1 / 10) * total_skI + (1 / 15) * total_obJ + (2 / 15) * abyPcts.cpS + (2 / 15) * abyPcts.erR + (4 / 15) * abyPcts.inF + (4 / 15) * abyPcts.mmM;
  const 변화관리 = (1 / 30) * seL + (1 / 10) * skI + (1 / 15) * reL + (2 / 15) * abyPcts.coL + (2 / 15) * abyPcts.cpR + (4 / 15) * abyPcts.apP + (4 / 15) * abyPcts.stU;
  const 과정관리 = (1 / 15) * total_foC + (1 / 10) * total_skI + (1 / 30) * total_reL + (4 / 15) * abyPcts.frM + (2 / 15) * abyPcts.stU + (4 / 15) * abyPcts.cpS + (2 / 15) * abyPcts.mmM;
  const 수용능력 = (1 / 30) * seL + (1 / 10) * skI + (1 / 15) * obJ + (2 / 15) * abyPcts.suM + (4 / 15) * abyPcts.coL + (2 / 15) * abyPcts.cpR + (4 / 15) * abyPcts.apP;
  const 비판능력 = (1 / 15) * total_seL + (1 / 10) * total_foC + (1 / 30) * total_skI + (2 / 15) * abyPcts.jdG + (4 / 15) * abyPcts.seT + (2 / 15) * abyPcts.cpS + (4 / 15) * abyPcts.erR;
  const 활용능력 = (1 / 15) * total_seL + (1 / 30) * total_foC + (1 / 10) * total_obJ + (2 / 15) * abyPcts.coL + (2 / 15) * abyPcts.inF + (4 / 15) * abyPcts.rbD + (4 / 15) * abyPcts.mmM;
  const 타인이해 = (1 / 15) * seL + (1 / 10) * reL + (1 / 30) * obJ + 0.2 * abyPcts.kwD + 0.2 * abyPcts.jdG + 0.4 * abyPcts.prM;
  const 자기성찰 = (1 / 30) * total_seL + (1 / 15) * total_reL + (1 / 10) * total_obJ + 0.32 * abyPcts.cpS + 0.32 * abyPcts.erR + 0.16 * abyPcts.inF;
  const 관계대응 = (1 / 30) * total_seL + (1 / 15) * total_skI + (1 / 10) * total_obJ + 0.4 * abyPcts.jdG + 0.2 * abyPcts.cpR + 0.2 * abyPcts.dcS;

  // 5 Directions (exact rational formulas verified with err < 1e-8)
  const 관계점수 = 0.6 * (-total_foC - total_skI + total_reL + total_obJ) + 0.4 * (-total_ability_A + total_ability_B);
  const 관계 = 관계점수 < 0 ? '개인' : '집단';

  const 에너지점수 = 0.6 * (-total_seL - total_foC + total_reL + total_obJ) + 0.4 * (-total_ability_C + total_ability_D);
  const 에너지 = 에너지점수 < 0 ? '생각' : '활동';

  const 시간점수 = 0.6 * (total_seL - total_skI) + 0.4 * (-total_ability_B + total_ability_C);
  const 시간 = 시간점수 < 0 ? '미래' : '현재/과거';

  const 전략점수 = -1.2 * seL + 0.6 * (reL + obJ) + 0.4 * ability_A - 0.4 * total_ability_B;
  const 전략 = 전략점수 < 0 ? '발산' : '수렴';

  const 갈등점수 = -1.2 * total_seL + 0.6 * (total_reL + total_obJ) + 0.4 * (-total_ability_A + total_ability_C);
  const 갈등 = 갈등점수 < 0 ? '직면' : '타협';

  // Self congruence & evaluation
  const 자아일치도 = ability_total_score - surv_ability_total_score;
  const absHabSum =
    Math.abs(diff_seL) + Math.abs(diff_foC) + Math.abs(diff_skI) + Math.abs(diff_reL) + Math.abs(diff_obJ);
  const absAbySum = ABILITY_INDICATORS.reduce((s, c) => s + Math.abs(diffAbyScores[c]), 0);
  const 자기평가정도 = 0.14 * absHabSum + 0.04375 * absAbySum;

  // 3 Career Fit Scores
  const 진로_취업 =
    0.05 * (정보처리 + 맥락파악 + 동시처리 + 수용능력 + 비판능력 + 활용능력) +
    (0.7 / 3) * (과정관리 + 타인이해 + 관계대응) +
    0.5 * (관계점수 + 시간점수 + 갈등점수);

  const 진로_창업 =
    0.05 * (목적이해 + 맥락파악 + 동시처리 + 수용능력 + 비판능력 + 활용능력) +
    (0.7 / 3) * (전제추론 + 성장추구 + 변화관리) -
    0.5 * (관계점수 + 시간점수 + 갈등점수);

  const 진로_연구 =
    0.05 * (정보처리 + 목적이해 + 맥락파악 + 동시처리 + 비판능력 + 활용능력) +
    0.35 * (위험관리 + 자기성찰) +
    0.5 * (-관계점수 - 에너지점수 + 전략점수);

  return {
    ...meta,
    scored_no,
    seL, foC, skI, reL, obJ,
    surv_seL, surv_foC, surv_skI, surv_reL, surv_obJ,
    total_seL, total_foC, total_skI, total_reL, total_obJ,
    diff_seL, diff_foC, diff_skI, diff_reL, diff_obJ,
    kwD: abyScores.kwD, suM: abyScores.suM, coL: abyScores.coL, jdG: abyScores.jdG,
    cpR: abyScores.cpR, apP: abyScores.apP, frM: abyScores.frM, prM: abyScores.prM,
    stU: abyScores.stU, seT: abyScores.seT, cpS: abyScores.cpS, erR: abyScores.erR,
    inF: abyScores.inF, rbD: abyScores.rbD, mmM: abyScores.mmM, dcS: abyScores.dcS,
    kwD_pct: abyPcts.kwD, suM_pct: abyPcts.suM, coL_pct: abyPcts.coL, jdG_pct: abyPcts.jdG,
    cpR_pct: abyPcts.cpR, apP_pct: abyPcts.apP, frM_pct: abyPcts.frM, prM_pct: abyPcts.prM,
    stU_pct: abyPcts.stU, seT_pct: abyPcts.seT, cpS_pct: abyPcts.cpS, erR_pct: abyPcts.erR,
    inF_pct: abyPcts.inF, rbD_pct: abyPcts.rbD, mmM_pct: abyPcts.mmM, dcS_pct: abyPcts.dcS,
    surv_kwD: survAbyScores.kwD, surv_suM: survAbyScores.suM, surv_coL: survAbyScores.coL, surv_jdG: survAbyScores.jdG,
    surv_cpR: survAbyScores.cpR, surv_apP: survAbyScores.apP, surv_frM: survAbyScores.frM, surv_prM: survAbyScores.prM,
    surv_stU: survAbyScores.stU, surv_seT: survAbyScores.seT, surv_cpS: survAbyScores.cpS, surv_erR: survAbyScores.erR,
    surv_inF: survAbyScores.inF, surv_rbD: survAbyScores.rbD, surv_mmM: survAbyScores.mmM, surv_dcS: survAbyScores.dcS,
    total_kwD: totalAbyScores.kwD, total_suM: totalAbyScores.suM, total_coL: totalAbyScores.coL, total_jdG: totalAbyScores.jdG,
    total_cpR: totalAbyScores.cpR, total_apP: totalAbyScores.apP, total_frM: totalAbyScores.frM, total_prM: totalAbyScores.prM,
    total_stU: totalAbyScores.stU, total_seT: totalAbyScores.seT, total_cpS: totalAbyScores.cpS, total_erR: totalAbyScores.erR,
    total_inF: totalAbyScores.inF, total_rbD: totalAbyScores.rbD, total_mmM: totalAbyScores.mmM, total_dcS: totalAbyScores.dcS,
    diff_kwD: diffAbyScores.kwD, diff_suM: diffAbyScores.suM, diff_coL: diffAbyScores.coL, diff_jdG: diffAbyScores.jdG,
    diff_cpR: diffAbyScores.cpR, diff_apP: diffAbyScores.apP, diff_frM: diffAbyScores.frM, diff_prM: diffAbyScores.prM,
    diff_stU: diffAbyScores.stU, diff_seT: diffAbyScores.seT, diff_cpS: diffAbyScores.cpS, diff_erR: diffAbyScores.erR,
    diff_inF: diffAbyScores.inF, diff_rbD: diffAbyScores.rbD, diff_mmM: diffAbyScores.mmM, diff_dcS: diffAbyScores.dcS,
    slD: extraPts.slD, prP: extraPts.prP, enP: extraPts.enP, flX: extraPts.flX, rsP: extraPts.rsP,
    udT: extraPts.udT, prR: extraPts.prR, adT: extraPts.adT, inT: extraPts.inT,
    cmA: extraPts.cmA, inR: extraPts.inR, spT: extraPts.spT, rnE: extraPts.rnE, stB: extraPts.stB, raG: extraPts.raG,
    slC: extraPts.slC, caE: extraPts.caE, caD: extraPts.caD,
    scR: extraPts.scR, exP: extraPts.exP, laN: extraPts.laN, qlF: extraPts.qlF, awD: extraPts.awD,
    HAB_TOP1: habRank.desc[0][0], HAB_TOP1_score: habRank.desc[0][1],
    ABY_TOP1: abyRank.desc[0][0], ABY_TOP1_score: abyRank.desc[0][1],
    ABY_TOP2: abyRank.desc[1][0], ABY_TOP2_score: abyRank.desc[1][1],
    ABY_TOP3: abyRank.desc[2][0], ABY_TOP3_score: abyRank.desc[2][1],
    ABY_TOP4: abyRank.desc[3][0], ABY_TOP4_score: abyRank.desc[3][1],
    HAB_bot1: habRank.asc[0][0], HAB_bot1_score: habRank.asc[0][1],
    ABY_bot1: abyRank.asc[0][0], ABY_bot1_score: abyRank.asc[0][1],
    ABY_bot2: abyRank.asc[1][0], ABY_bot2_score: abyRank.asc[1][1],
    ABY_bot3: abyRank.asc[2][0], ABY_bot3_score: abyRank.asc[2][1],
    ABY_bot4: abyRank.asc[3][0], ABY_bot4_score: abyRank.asc[3][1],
    surv_HAB_TOP1: survHabRank.desc[0][0], surv_HAB_TOP1_score: survHabRank.desc[0][1],
    surv_ABY_TOP1: survAbyRank.desc[0][0], surv_ABY_TOP1_score: survAbyRank.desc[0][1],
    surv_ABY_TOP2: survAbyRank.desc[1][0], surv_ABY_TOP2_score: survAbyRank.desc[1][1],
    surv_ABY_TOP3: survAbyRank.desc[2][0], surv_ABY_TOP3_score: survAbyRank.desc[2][1],
    surv_ABY_TOP4: survAbyRank.desc[3][0], surv_ABY_TOP4_score: survAbyRank.desc[3][1],
    surv_HAB_bot1: survHabRank.asc[0][0], surv_HAB_bot1_score: survHabRank.asc[0][1],
    surv_ABY_bot1: survAbyRank.asc[0][0], surv_ABY_bot1_score: survAbyRank.asc[0][1],
    surv_ABY_bot2: survAbyRank.asc[1][0], surv_ABY_bot2_score: survAbyRank.asc[1][1],
    surv_ABY_bot3: survAbyRank.asc[2][0], surv_ABY_bot3_score: survAbyRank.asc[2][1],
    surv_ABY_bot4: survAbyRank.asc[3][0], surv_ABY_bot4_score: survAbyRank.asc[3][1],
    total_HAB_TOP1: totalHabRank.desc[0][0], total_HAB_TOP1_score: totalHabRank.desc[0][1],
    total_ABY_TOP1: totalAbyRank.desc[0][0], total_ABY_TOP1_score: totalAbyRank.desc[0][1],
    total_ABY_TOP2: totalAbyRank.desc[1][0], total_ABY_TOP2_score: totalAbyRank.desc[1][1],
    total_ABY_TOP3: totalAbyRank.desc[2][0], total_ABY_TOP3_score: totalAbyRank.desc[2][1],
    total_ABY_TOP4: totalAbyRank.desc[3][0], total_ABY_TOP4_score: totalAbyRank.desc[3][1],
    total_HAB_bot1: totalHabRank.asc[0][0], total_HAB_bot1_score: totalHabRank.asc[0][1],
    total_ABY_bot1: totalAbyRank.asc[0][0], total_ABY_bot1_score: totalAbyRank.asc[0][1],
    total_ABY_bot2: totalAbyRank.asc[1][0], total_ABY_bot2_score: totalAbyRank.asc[1][1],
    total_ABY_bot3: totalAbyRank.asc[2][0], total_ABY_bot3_score: totalAbyRank.asc[2][1],
    total_ABY_bot4: totalAbyRank.asc[3][0], total_ABY_bot4_score: totalAbyRank.asc[3][1],
    ability_sub_1, ability_sub_2, ability_sub_3, ability_sub_4,
    ability_sub_5, ability_sub_6, ability_sub_7, ability_sub_8,
    ability_total_score,
    habit_A, habit_B, habit_C,
    habit_A_pct, habit_B_pct, habit_C_pct,
    ability_A, ability_B, ability_C, ability_D,
    ability_A_pct, ability_B_pct, ability_C_pct, ability_D_pct,
    surv_ability_sub_1, surv_ability_sub_2, surv_ability_sub_3, surv_ability_sub_4,
    surv_ability_sub_5, surv_ability_sub_6, surv_ability_sub_7, surv_ability_sub_8,
    surv_ability_total_score,
    surv_habit_A, surv_habit_B, surv_habit_C,
    surv_habit_A_pct, surv_habit_B_pct, surv_habit_C_pct,
    surv_ability_A, surv_ability_B, surv_ability_C, surv_ability_D,
    surv_ability_A_pct, surv_ability_B_pct, surv_ability_C_pct, surv_ability_D_pct,
    total_ability_sub_1, total_ability_sub_2, total_ability_sub_3, total_ability_sub_4,
    total_ability_sub_5, total_ability_sub_6, total_ability_sub_7, total_ability_sub_8,
    total_ability_total_score,
    total_habit_A, total_habit_B, total_habit_C,
    total_habit_A_pct, total_habit_B_pct, total_habit_C_pct,
    total_ability_A, total_ability_B, total_ability_C, total_ability_D,
    total_ability_A_pct, total_ability_B_pct, total_ability_C_pct, total_ability_D_pct,
    MAX_habit_type, min_habit_type,
    MAX_ability_sub_type, min_ability_sub_type,
    MAX_ability_type, min_ability_type,
    surv_MAX_habit_type, surv_min_habit_type,
    surv_MAX_ability_sub_type, surv_min_ability_sub_type,
    surv_MAX_ability_type, surv_min_ability_type,
    total_MAX_habit_type, total_min_habit_type,
    total_MAX_ability_sub_type, total_min_ability_sub_type,
    total_MAX_ability_type, total_min_ability_type,
    lit_type,
    surv_lit_type,
    total_lit_type,
    ENT, MJR, BEL, CPR, REC,
    정보처리, 전제추론, 성장추구,
    목적이해, 맥락파악, 동시처리,
    위험관리, 변화관리, 과정관리,
    수용능력, 비판능력, 활용능력,
    타인이해, 자기성찰, 관계대응,
    관계, 관계점수,
    에너지, 에너지점수,
    시간, 시간점수,
    전략, 전략점수,
    갈등, 갈등점수,
    자아일치도,
    자기평가정도,
    진로_취업,
    진로_창업,
    진로_연구,
  };
}

export function generateStudentReport(row: ResultBaseRow): StudentReportData {
  const typeCorpus = REPORT_CORPUS[row.total_lit_type] || REPORT_CORPUS['참고형'];
  const name = row.mb_name || '응시자';

  const competencies = [
    {
      category: '창의역량',
      items: [
        { name: '정보처리', label: '정보처리', score: row.정보처리 },
        { name: '전제추론', label: '전제추론', score: row.전제추론 },
        { name: '성장추구', label: '심화탐구', score: row.성장추구 },
      ],
    },
    {
      category: '융합역량',
      items: [
        { name: '목적이해', label: '목적이해', score: row.목적이해 },
        { name: '맥락파악', label: '맥락파악', score: row.맥락파악 },
        { name: '동시처리', label: '동시처리', score: row.동시처리 },
      ],
    },
    {
      category: '관리역량',
      items: [
        { name: '위험관리', label: '위험관리', score: row.위험관리 },
        { name: '변화관리', label: '변화관리', score: row.변화관리 },
        { name: '과정관리', label: '과정관리', score: row.과정관리 },
      ],
    },
    {
      category: '인지역량',
      items: [
        { name: '수용능력', label: '수용능력', score: row.수용능력 },
        { name: '비판능력', label: '비판능력', score: row.비판능력 },
        { name: '활용능력', label: '활용능력', score: row.활용능력 },
      ],
    },
    {
      category: '관계역량',
      items: [
        { name: '타인이해', label: '타인이해', score: row.타인이해 },
        { name: '자기성찰', label: '자기성찰', score: row.자기성찰 },
        { name: '관계대응', label: '관계대응', score: row.관계대응 },
      ],
    },
  ];

  const allCompScores = competencies.flatMap((g) => g.items.map((i) => i.score));
  const maiAverage = allCompScores.reduce((a, b) => a + b, 0) / allCompScores.length;

  const selfCongruenceRate = Math.max(0, Math.min(1, 1 - row.자기평가정도 / 100));

  const hashtags = typeCorpus.habit.hashtags
    .split('#')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `# ${s}`);

  const sr = typeCorpus.selfRealization;
  const fullOrgNarrative = `${name}님은 ${sr.potentialOrg}에서 잠재력을 발휘할 수 있습니다. 또한, ${sr.tolerableEnv}에서도 잘 견딥니다. 그러나 ${name}님은 ${sr.stressfulEnv}에서 다른 사람들보다 스트레스를 크게 받는 편입니다. 따라서 ${sr.suitableJob}를 선택하면 쉽게 지치지 않고 오래 달릴 수 있습니다.`;

  const st = typeCorpus.study;
  const strengthP1 = `${name}님은 ${st.personality1}이기 때문에 ${st.personality2}`;
  const strengthP2 = `따라서, ${st.environment}을 추천합니다. 학습 내용적으로는 ${st.suitableSubject} 추천합니다.`;
  const weaknessP1 = `${name}님은 ${st.obstacle1} ${st.obstacle2}`.trim();
  const weaknessP2 = `${st.alternative1}은 어떨까요? ${st.alternative2} 보는 것을 추천 드립니다.`;

  return {
    id: row.mb_id,
    name,
    groupName: row.group_name || '-',
    serialNo: row.od_id || String(row.test_no),
    testName: row.it_name || '그래프미 진단검사',
    testDate: row.test_date || '-',
    litType: row.lit_type,
    survLitType: row.surv_lit_type,
    totalLitType: row.total_lit_type,
    mbti: typeCorpus.mbti,
    principle: typeCorpus.principle,
    directions: {
      relationship: {
        score: row.관계점수,
        leftLabel: '개인',
        rightLabel: '집단',
        dominant: row.관계점수 < 0 ? '개인' : '집단',
      },
      energy: {
        score: row.에너지점수,
        leftLabel: '생각',
        rightLabel: '행동',
        dominant: row.에너지점수 < 0 ? '생각' : '행동',
      },
      time: {
        score: row.시간점수,
        leftLabel: '미래지향',
        rightLabel: '현재지향',
        dominant: row.시간점수 < 0 ? '미래지향' : '현재지향',
      },
      strategy: {
        score: row.전략점수,
        leftLabel: '발산',
        rightLabel: '수렴',
        dominant: row.전략점수 < 0 ? '발산' : '수렴',
      },
      conflict: {
        score: row.갈등점수,
        leftLabel: '직면',
        rightLabel: '타협',
        dominant: row.갈등점수 < 0 ? '직면' : '타협',
      },
    },
    selfCongruenceRate,
    selfEvaluationGap: row.자기평가정도,
    coreValues: typeCorpus.career.values,
    hashtags,
    hashtagsRaw: typeCorpus.habit.hashtags,
    relationshipAttitude: typeCorpus.habit.relationshipAttitude,
    workAttitude: typeCorpus.habit.workAttitude,
    lifeHabitAdvice: typeCorpus.habit.lifeHabit,
    habitDistribution: {
      selfPct: row.total_habit_A_pct,
      focusSkillPct: row.total_habit_B_pct,
      relObjPct: row.total_habit_C_pct,
    },
    maiAverage,
    competencies,
    careerFit: {
      employment: row.진로_취업,
      entrepreneurship: row.진로_창업,
      research: row.진로_연구,
    },
    orgFit: {
      potentialOrg: sr.potentialOrg,
      tolerableEnv: sr.tolerableEnv,
      stressfulEnv: sr.stressfulEnv,
      suitableJob: sr.suitableJob,
      fullNarrative: fullOrgNarrative,
    },
    studyStrength: {
      personality1: st.personality1,
      personality2: st.personality2,
      environment: st.environment,
      suitableSubject: st.suitableSubject,
      paragraph1: strengthP1,
      paragraph2: strengthP2,
    },
    studyWeakness: {
      obstacle1: st.obstacle1,
      obstacle2: st.obstacle2,
      alternative1: st.alternative1,
      alternative2: st.alternative2,
      paragraph1: weaknessP1,
      paragraph2: weaknessP2,
    },
    studyPlanRatios: {
      prep: st.prepRatio,
      review: st.reviewRatio,
      concept: st.conceptRatio,
      problem: st.problemRatio,
      selfStudy: st.selfStudyRatio,
      tutoring1on1: st.tutoring1on1Ratio,
      groupTutoring: st.groupTutoringRatio,
      academy: st.academyRatio,
      independentSpace: st.independentSpaceRatio,
      openSpace: st.openSpaceRatio,
    },
  };
}

/**
 * Helper to build a No_1..No_208 answer map from a graphit_test record + graphit_item_test list
 */
export function buildNoAnswersMap(
  testRecord: any,
  rawItemAnswers: any[],
  qaMap: Map<number, any>
): Record<string, string> {
  const map: Record<string, string> = {};

  // 1. If testRecord has compact no_answers array (length 208)
  if (Array.isArray(testRecord.no_answers) && testRecord.no_answers.length > 0) {
    for (let i = 0; i < testRecord.no_answers.length; i++) {
      map[`No_${i + 1}`] = String(testRecord.no_answers[i] ?? '');
    }
    return map;
  }

  // 2. Otherwise map from rawItemAnswers via qa_no -> al_test_no (or item_seq)
  for (const ans of rawItemAnswers) {
    const qaNo = Number(ans.qa_no);
    const qa = qaMap.get(qaNo);
    const val = String(ans.test_answer ?? '');
    if (qa?.al_test_no) {
      map[qa.al_test_no] = val;
    } else if (qaNo >= 1001 && qaNo <= 1208) {
      map[`No_${qaNo - 1000}`] = val;
    } else if (ans.item_seq && Number(ans.item_seq) >= 1 && Number(ans.item_seq) <= 208) {
      const fallbackKey = `No_${Number(ans.item_seq)}`;
      if (!map[fallbackKey]) map[fallbackKey] = val;
    }
  }
  return map;
}

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

export const LEARNING_INDICATORS = [
  'motive_A', 'motive_B',
  'perception_A', 'perception_B',
  'path_A', 'path_B', 'path_C', 'path_D',
  'space_A', 'space_B',
] as const;

export const LEARNING_PCT_INDICATORS = [
  'motive_A_pct', 'motive_B_pct',
  'perception_A_pct', 'perception_B_pct',
  'path_A_pct', 'path_B_pct', 'path_C_pct', 'path_D_pct',
  'space_A_pct', 'space_B_pct',
] as const;

export const AQ_INDICATORS = [
  'aq_logic', 'aq_social', 'aq_practical', 'aq_principle', 'aq_creative',
] as const;

export const AQ_TABLE: Record<string, [string, string, string]> = {
  A_list: ['aq_logic', 'aq_social', 'aq_practical'],
  B_list: ['aq_logic', 'aq_social', 'aq_principle'],
  C_list: ['aq_logic', 'aq_social', 'aq_creative'],
  D_list: ['aq_logic', 'aq_practical', 'aq_principle'],
  E_list: ['aq_logic', 'aq_practical', 'aq_creative'],
  F_list: ['aq_logic', 'aq_principle', 'aq_creative'],
  G_list: ['aq_social', 'aq_practical', 'aq_principle'],
  H_list: ['aq_social', 'aq_practical', 'aq_creative'],
  I_list: ['aq_social', 'aq_principle', 'aq_creative'],
  J_list: ['aq_practical', 'aq_principle', 'aq_creative'],
};

export const LEARNING_LIT_TABLE: Record<LitTypeName, [number, number, number, number, number, number, number, number, number, number]> = {
  조감형: [0.2, 0.8, 0.6, 0.4, 0.2, 0.8, 0.6, 0.4, 0.2, 0.8],
  가치형: [0.7, 0.3, 0.3, 0.7, 0.2, 0.8, 0.45, 0.55, 0.2, 0.8],
  사색형: [0.2, 0.8, 0.6, 0.4, 0.9, 0.6, 0.3, 0.2, 0.8, 0.2],
  설득형: [0.8, 0.2, 0.8, 0.2, 0.2, 0.8, 0.4, 0.6, 0.45, 0.55],
  감각형: [0.3, 0.7, 0.8, 0.2, 0.8, 0.7, 0.2, 0.3, 0.8, 0.2],
  체계형: [0.6, 0.4, 0.3, 0.7, 0.2, 0.6, 0.8, 0.4, 0.2, 0.8],
  참고형: [0.2, 0.8, 0.3, 0.7, 0.4, 0.8, 0.6, 0.2, 0.7, 0.3],
  목적형: [0.6, 0.4, 0.6, 0.4, 0.2, 0.7, 0.8, 0.3, 0.7, 0.3],
  현실형: [0.3, 0.7, 0.2, 0.8, 0.2, 0.6, 0.8, 0.4, 0.2, 0.8],
  수용형: [0.3, 0.7, 0.6, 0.4, 0.6, 0.4, 0.2, 0.8, 0.9, 0.1],
  판단형: [0.3, 0.7, 0.4, 0.6, 0.5, 0.2, 0.3, 1.0, 0.6, 0.4],
  실천형: [0.6, 0.4, 0.6, 0.4, 0.3, 0.9, 0.6, 0.2, 0.6, 0.4],
};

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
  // Personalized Learning Roadmap (learning_list & learning_pct_list)
  motive_A: number; motive_B: number;
  perception_A: number; perception_B: number;
  path_A: number; path_B: number; path_C: number; path_D: number;
  space_A: number; space_B: number;
  motive_A_pct: number; motive_B_pct: number;
  perception_A_pct: number; perception_B_pct: number;
  path_A_pct: number; path_B_pct: number; path_C_pct: number; path_D_pct: number;
  space_A_pct: number; space_B_pct: number;
  // AQ Table Indices & Group (aq_table.csv)
  aq_logic: number;
  aq_social: number;
  aq_practical: number;
  aq_principle: number;
  aq_creative: number;
  aq_group: string;
  aq_max_1: string;
  aq_max_2: string;
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
  aqAnalytics: {
    aq_logic: number;
    aq_social: number;
    aq_practical: number;
    aq_principle: number;
    aq_creative: number;
    aq_group: string;
    aq_max_1: string;
    aq_max_2: string;
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

// literacy_table.csv: habit_A..C x ability_A..D -> 12 Literacy Types
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

const SR_REVERSE_SCORE_MAP: Record<number, number> = {
  1: 1.0,
  2: 0.5,
  3: 0,
  4: 0,
  5: 0,
};

function safeChoiceNumber(raw: string): number | null {
  const s = String(raw || '').trim();
  if (!s || s === '모름') return null;
  const first = s[0];
  if (first >= '1' && first <= '9') {
    return parseInt(first, 10);
  }
  const n = parseInt(s, 10);
  return !isNaN(n) ? n : null;
}

function scoreSubjectiveAnswer(rawText: string, ansKey: string, qCode: string): number {
  const txt = String(rawText || '').trim();
  if (!txt || txt === '모름') return 0;
  if (txt.toUpperCase() === 'TRUE') return 1;
  if (txt.toUpperCase() === 'FALSE') return 0;

  const tool = qCode.slice(0, 2);

  // 1. ti: keyword & {special_keyword} matching (Cell 39)
  if (tool === 'ti') {
    const rawKeywords = String(ansKey || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (rawKeywords.length === 0) return 0;
    const keywords: string[] = [];
    const specialKeywords: string[] = [];
    for (const kw of rawKeywords) {
      if (kw.startsWith('{') && kw.endsWith('}')) {
        const sp = kw.slice(1, -1).trim();
        keywords.push(sp);
        specialKeywords.push(sp);
      } else {
        keywords.push(kw);
      }
    }
    const containedKeywords = keywords.filter((w) => txt.includes(w));
    const containedSpecial = specialKeywords.filter((w) => txt.includes(w));
    const stTiPoint = keywords.length > 0 ? containedKeywords.length / keywords.length : 0;
    const stTiSpPoint =
      specialKeywords.length > 0 ? containedSpecial.length / specialKeywords.length : 1;

    if (stTiSpPoint !== 1) return 0;
    if (stTiPoint < 0.5) return 0;
    return 1;
  }

  // 2. ts: slash count scoring (Cell 39)
  if (tool === 'ts') {
    const countSlashes = (txt.match(/\//g) || []).length;
    if (countSlashes === 0) return 0.3;
    if (countSlashes >= 1 && countSlashes <= 2) return 0.4;
    if (countSlashes >= 10) return 1.2;
    if (countSlashes >= 3) return 1.0;
    return 0;
  }

  // 3. to: order & exact match (Cell 39)
  const targetRaw = String(ansKey || '').trim();
  if (!targetRaw) return 0;

  const isNumS = /^\d+(\.\d+)?$/.test(txt);
  const isNumT = /^\d+(\.\d+)?$/.test(targetRaw);
  if (isNumS && isNumT) {
    const sInt = String(Math.trunc(Number(txt)));
    const tInt = String(Math.trunc(Number(targetRaw)));
    return sInt === tInt ? 1 : 0;
  }

  const targetOrder = targetRaw.replace(/[\s,.\-_/]/g, '');
  if (!targetOrder) return 0;

  // Notebook regex: keep only chars present in targetOrder and check exact sequence
  const targetChars = new Set([...targetOrder]);
  const cleanedString = [...txt].filter((ch) => targetChars.has(ch)).join('');
  if (cleanedString === targetOrder) return 1;

  // Fallback for numeric/text variants
  const cleanTxt = txt.replace(/[\s,.\-_/]/g, '');
  return cleanTxt === targetOrder ? 1 : 0;
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
  const survAbyMax: Record<string, number> = {};
  const extraPts: Record<string, number> = {};

  for (const c of ABILITY_INDICATORS) {
    abyEarned[c] = 0;
    abyMax[c] = 0;
    survAbyPts[c] = 0;
    survAbyMax[c] = 0;
  }
  for (const c of EXTRA_INDICATORS) {
    extraPts[c] = 0;
  }

  for (let i = 1; i <= 208; i++) {
    const key = `No_${i}`;
    const rawInput = String(noAnswersMap[key] ?? '').trim();
    const qa = qaByTestNo.get(key);
    if (!qa) {
      scored_no[key] = rawInput;
      continue;
    }

    const qCode = String(qa.qa_code || '');
    const tool = qCode.slice(0, 2);
    const var1 = qCode.slice(5, 8);
    const liftCode = qCode.slice(11, 13);
    const ansKey = String(qa.qa_answer || '').trim();
    const metricName = String(qa.qa_metric || '').trim();
    const metricWeight = Number(qa.qa_weight ?? 0);
    const tendencyMap: Record<string, number> = qa.qa_tendency_map || qa.qa_weights || {};

    let weights: Record<string, number> = {};
    if (qa.qa_weights && Object.keys(qa.qa_weights).length > 0) {
      weights = qa.qa_weights;
    } else if (metricName && !metricName.includes(',') && metricWeight > 0) {
      weights = { [metricName]: metricWeight };
    } else if (var1 && var1 !== 'nnn' && var1 !== '000') {
      const parsedLift = /^\d{2}$/.test(liftCode) ? parseInt(liftCode, 10) / 10 : 1.0;
      weights = { [var1]: parsedLift || 1.0 };
    }

    // Track max weights for ABY standardization (Cell 40: graphit_ABY_lift vs surv_ABY_lift)
    const isSurvTool = tool === 'sr' || tool === 'sR';
    for (const c of ABILITY_INDICATORS) {
      const w = Number(weights[c] || 0);
      if (w > 0) {
        if (isSurvTool) {
          survAbyMax[c] += w;
        } else {
          abyMax[c] += w;
        }
      }
    }

    // 1. rf: tendency choice mapping (seL, foC, skI, reL, obJ -> 1..5) (Cell 36)
    if (tool === 'rf') {
      if (rawInput === '모름') {
        scored_no[key] = rawInput;
        continue;
      }
      let chosenInd = '';
      if ((HABIT_INDICATORS as readonly string[]).includes(rawInput)) {
        chosenInd = rawInput;
      } else {
        const numChoice = safeChoiceNumber(rawInput);
        if (numChoice !== null) {
          for (const h of HABIT_INDICATORS) {
            if (Number(tendencyMap[h]) === numChoice) {
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

    // 2. co: objective cognitive / habit question (Cell 37)
    if (tool === 'co') {
      const choiceNum = safeChoiceNumber(rawInput);
      const ansNum = parseFloat(ansKey);
      const isOk =
        rawInput.toUpperCase() === 'TRUE' ||
        (rawInput !== '' &&
          rawInput.toUpperCase() !== 'FALSE' &&
          choiceNum !== null &&
          !isNaN(ansNum) &&
          choiceNum === ansNum);
      scored_no[key] = rawInput === '' ? '' : isOk ? 'TRUE' : 'FALSE';
      if (isOk) {
        for (const h of HABIT_INDICATORS) {
          if (Number(weights[h]) > 0) habCounts[h] += Number(weights[h]);
        }
        for (const c of ABILITY_INDICATORS) {
          if (Number(weights[c]) > 0) abyEarned[c] += Number(weights[c]);
        }
        for (const c of EXTRA_INDICATORS) {
          if (Number(weights[c]) > 0) extraPts[c] += Number(weights[c]);
        }
      }
      continue;
    }

    // 3. sr / sR: self-report survey question (Cell 38)
    if (tool === 'sr' || tool === 'sR') {
      const choiceNum = safeChoiceNumber(rawInput);
      scored_no[key] = choiceNum !== null ? String(choiceNum) : rawInput;
      const scoreMap = tool === 'sR' ? SR_REVERSE_SCORE_MAP : SR_SCORE_MAP;
      const liftAnswer = choiceNum !== null ? (scoreMap[choiceNum] ?? 0) : 0;

      for (const h of HABIT_INDICATORS) {
        if (Number(weights[h]) > 0) {
          survHabPts[h] += liftAnswer * Number(weights[h]);
        }
      }
      for (const c of ABILITY_INDICATORS) {
        if (Number(weights[c]) > 0) {
          survAbyPts[c] += liftAnswer * Number(weights[c]);
        }
      }
      for (const c of EXTRA_INDICATORS) {
        if (Number(weights[c]) > 0) {
          extraPts[c] += liftAnswer * Number(weights[c]);
        }
      }
      continue;
    }

    // 4. to, ti, ts, te: subjective text analysis (Cell 39)
    if (tool === 'to' || tool === 'ti' || tool === 'ts' || tool === 'te') {
      scored_no[key] = rawInput;
      const pt = scoreSubjectiveAnswer(rawInput, ansKey, qCode);
      if (pt > 0) {
        for (const h of HABIT_INDICATORS) {
          if (Number(weights[h]) > 0) habCounts[h] += pt * Number(weights[h]);
        }
        for (const c of ABILITY_INDICATORS) {
          if (Number(weights[c]) > 0) abyEarned[c] += pt * Number(weights[c]);
        }
        for (const c of EXTRA_INDICATORS) {
          if (Number(weights[c]) > 0) extraPts[c] += pt * Number(weights[c]);
        }
      }
      continue;
    }

    // 5. Default / intro items (ooo...)
    scored_no[key] = rawInput;
  }

  extraPts.slC = Math.round(extraPts.slC * 100) / 100;

  // Habit standardization (Cell 40)
  const habSum = Object.values(habCounts).reduce((a, b) => a + b, 0);
  const seL = habSum !== 0 ? (habCounts.seL / habSum) * 100 : 0;
  const foC = habSum !== 0 ? (habCounts.foC / habSum) * 100 : 0;
  const skI = habSum !== 0 ? (habCounts.skI / habSum) * 100 : 0;
  const reL = habSum !== 0 ? (habCounts.reL / habSum) * 100 : 0;
  const obJ = habSum !== 0 ? (habCounts.obJ / habSum) * 100 : 0;

  const survHabSum = Object.values(survHabPts).reduce((a, b) => a + b, 0);
  const surv_seL = survHabSum !== 0 ? (survHabPts.seL / survHabSum) * 100 : 0;
  const surv_foC = survHabSum !== 0 ? (survHabPts.foC / survHabSum) * 100 : 0;
  const surv_skI = survHabSum !== 0 ? (survHabPts.skI / survHabSum) * 100 : 0;
  const surv_reL = survHabSum !== 0 ? (survHabPts.reL / survHabSum) * 100 : 0;
  const surv_obJ = survHabSum !== 0 ? (survHabPts.obJ / survHabSum) * 100 : 0;

  const total_seL = (2 * seL + surv_seL) / 3;
  const total_foC = (2 * foC + surv_foC) / 3;
  const total_skI = (2 * skI + surv_skI) / 3;
  const total_reL = (2 * reL + surv_reL) / 3;
  const total_obJ = (2 * obJ + surv_obJ) / 3;

  const diff_seL = seL - surv_seL;
  const diff_foC = foC - surv_foC;
  const diff_skI = skI - surv_skI;
  const diff_reL = reL - surv_reL;
  const diff_obJ = obJ - surv_obJ;

  // Ability standardization (Cell 40: ABY_perfect_score / 4 and surv_ABY_perfect_score / 4)
  const ABY_perfect_score = Object.values(abyMax).reduce((a, b) => a + b, 0);
  const surv_ABY_perfect_score = Object.values(survAbyMax).reduce((a, b) => a + b, 0);
  const abyScaleDenom = ABY_perfect_score > 0 ? ABY_perfect_score / 4 : 15.9;
  const survAbyScaleDenom = surv_ABY_perfect_score > 0 ? surv_ABY_perfect_score / 4 : 7.5;

  const abyScores: Record<string, number> = {};
  const abyPcts: Record<string, number> = {};
  const survAbyScores: Record<string, number> = {};
  const totalAbyScores: Record<string, number> = {};
  const diffAbyScores: Record<string, number> = {};

  for (const c of ABILITY_INDICATORS) {
    const v = ABY_perfect_score > 0 ? (abyEarned[c] / abyScaleDenom) * 100 : 0;
    const pct = abyMax[c] > 0 ? (abyEarned[c] / abyMax[c]) * 100 : 0;
    const sv = surv_ABY_perfect_score > 0 ? (survAbyPts[c] / survAbyScaleDenom) * 100 : 0;
    const tv = (2 * v + sv) / 3;
    const dv = v - sv;
    abyScores[c] = v;
    abyPcts[c] = pct;
    survAbyScores[c] = sv;
    totalAbyScores[c] = tv;
    diffAbyScores[c] = dv;
  }

  // Helper for top/bottom rankings (Cell 41)
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
  const habAbcSum = habit_A + habit_B + habit_C;
  const habit_A_pct = habAbcSum !== 0 ? (habit_A / habAbcSum) * 100 : 0;
  const habit_B_pct = habAbcSum !== 0 ? (habit_B / habAbcSum) * 100 : 0;
  const habit_C_pct = habAbcSum !== 0 ? (habit_C / habAbcSum) * 100 : 0;

  const ability_A = ability_sub_1 + ability_sub_2;
  const ability_B = ability_sub_3 + ability_sub_4;
  const ability_C = ability_sub_5 + ability_sub_6;
  const ability_D = ability_sub_7 + ability_sub_8;
  const abyAbcdSum = ability_total_score;
  const ability_A_pct = abyAbcdSum !== 0 ? (ability_A / abyAbcdSum) * 100 : 0;
  const ability_B_pct = abyAbcdSum !== 0 ? (ability_B / abyAbcdSum) * 100 : 0;
  const ability_C_pct = abyAbcdSum !== 0 ? (ability_C / abyAbcdSum) * 100 : 0;
  const ability_D_pct = abyAbcdSum !== 0 ? (ability_D / abyAbcdSum) * 100 : 0;

  const surv_habit_A = surv_seL;
  const surv_habit_B = (surv_foC + surv_skI) / 2;
  const surv_habit_C = (surv_reL + surv_obJ) / 2;
  const survHabAbcSum = surv_habit_A + surv_habit_B + surv_habit_C;
  const surv_habit_A_pct = survHabAbcSum !== 0 ? (surv_habit_A / survHabAbcSum) * 100 : 0;
  const surv_habit_B_pct = survHabAbcSum !== 0 ? (surv_habit_B / survHabAbcSum) * 100 : 0;
  const surv_habit_C_pct = survHabAbcSum !== 0 ? (surv_habit_C / survHabAbcSum) * 100 : 0;

  const surv_ability_A = surv_ability_sub_1 + surv_ability_sub_2;
  const surv_ability_B = surv_ability_sub_3 + surv_ability_sub_4;
  const surv_ability_C = surv_ability_sub_5 + surv_ability_sub_6;
  const surv_ability_D = surv_ability_sub_7 + surv_ability_sub_8;
  const survAbyAbcdSum = surv_ability_total_score;
  const surv_ability_A_pct = survAbyAbcdSum !== 0 ? (surv_ability_A / survAbyAbcdSum) * 100 : 0;
  const surv_ability_B_pct = survAbyAbcdSum !== 0 ? (surv_ability_B / survAbyAbcdSum) * 100 : 0;
  const surv_ability_C_pct = survAbyAbcdSum !== 0 ? (surv_ability_C / survAbyAbcdSum) * 100 : 0;
  const surv_ability_D_pct = survAbyAbcdSum !== 0 ? (surv_ability_D / survAbyAbcdSum) * 100 : 0;

  const total_habit_A = total_seL;
  const total_habit_B = (total_foC + total_skI) / 2;
  const total_habit_C = (total_reL + total_obJ) / 2;
  const totalHabAbcSum = total_habit_A + total_habit_B + total_habit_C;
  const total_habit_A_pct = totalHabAbcSum !== 0 ? (total_habit_A / totalHabAbcSum) * 100 : 0;
  const total_habit_B_pct = totalHabAbcSum !== 0 ? (total_habit_B / totalHabAbcSum) * 100 : 0;
  const total_habit_C_pct = totalHabAbcSum !== 0 ? (total_habit_C / totalHabAbcSum) * 100 : 0;

  const total_ability_A = total_ability_sub_1 + total_ability_sub_2;
  const total_ability_B = total_ability_sub_3 + total_ability_sub_4;
  const total_ability_C = total_ability_sub_5 + total_ability_sub_6;
  const total_ability_D = total_ability_sub_7 + total_ability_sub_8;
  const totalAbyAbcdSum = total_ability_total_score;
  const total_ability_A_pct = totalAbyAbcdSum !== 0 ? (total_ability_A / totalAbyAbcdSum) * 100 : 0;
  const total_ability_B_pct = totalAbyAbcdSum !== 0 ? (total_ability_B / totalAbyAbcdSum) * 100 : 0;
  const total_ability_C_pct = totalAbyAbcdSum !== 0 ? (total_ability_C / totalAbyAbcdSum) * 100 : 0;
  const total_ability_D_pct = totalAbyAbcdSum !== 0 ? (total_ability_D / totalAbyAbcdSum) * 100 : 0;

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
  // Note: Cell 41 line 1037 of notebook ranks ability_sub_1..8 for total_MAX_ability_sub_type
  const totalSubTypeRank = rankEntries([
    ['ability_sub_1', ability_sub_1], ['ability_sub_2', ability_sub_2],
    ['ability_sub_3', ability_sub_3], ['ability_sub_4', ability_sub_4],
    ['ability_sub_5', ability_sub_5], ['ability_sub_6', ability_sub_6],
    ['ability_sub_7', ability_sub_7], ['ability_sub_8', ability_sub_8],
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

  // literacy_table.csv lookup
  const lit_type = LIT_TYPE_MATRIX[`${MAX_habit_type.slice(-1)}*${MAX_ability_type.slice(-1)}`] || '참고형';
  const surv_lit_type = LIT_TYPE_MATRIX[`${surv_MAX_habit_type.slice(-1)}*${surv_MAX_ability_type.slice(-1)}`] || '참고형';
  const total_lit_type = LIT_TYPE_MATRIX[`${total_MAX_habit_type.slice(-1)}*${total_MAX_ability_type.slice(-1)}`] || '참고형';

  // ENT, MJR, BEL, CPR, REC (Cell 42)
  const ENT = (extraPts.slD + extraPts.prP + extraPts.enP + extraPts.flX + extraPts.rsP) / 5;
  const MJR = (extraPts.udT + extraPts.prR + extraPts.adT + extraPts.inT) / 4;
  const BEL = (extraPts.cmA + extraPts.inR + extraPts.spT + extraPts.rnE + extraPts.stB + extraPts.raG) / 6;
  const CPR = (extraPts.slC + extraPts.caE + extraPts.caD) / 3;
  const REC = (extraPts.scR + extraPts.exP + extraPts.laN + extraPts.qlF + extraPts.awD) / 5;

  // 15 Competencies (Cell 42 lines 1103-1146)
  const 정보처리 = ((seL * 3 + skI * 2 + obJ * 1) / 6) * 0.2 + ((abyPcts.kwD * 2 + abyPcts.suM + abyPcts.frM) / 4) * 0.8;
  const 전제추론 = ((total_foC * 3 + total_obJ * 2 + total_reL * 1) / 6) * 0.2 + ((abyPcts.prM * 2 + abyPcts.cpR + abyPcts.frM) / 4) * 0.8;
  const 성장추구 = ((total_seL * 3 + total_foC * 2 + total_obJ * 1) / 6) * 0.2 + ((abyPcts.rbD * 2 + abyPcts.dcS * 2 + abyPcts.prM) / 5) * 0.8;
  const 목적이해 = ((total_skI * 3 + total_foC * 2 + total_obJ * 1) / 6) * 0.2 + ((abyPcts.cpR * 2 + abyPcts.stU * 2 + abyPcts.kwD) / 5) * 0.8;
  const 맥락파악 = ((foC * 3 + skI * 2 + obJ * 1) / 6) * 0.2 + ((abyPcts.seT * 2 + abyPcts.dcS * 2 + abyPcts.suM + abyPcts.stU) / 6) * 0.8;
  const 동시처리 = ((total_obJ * 3 + total_foC * 2 + total_skI * 1) / 6) * 0.2 + ((abyPcts.suM * 2 + abyPcts.frM * 2 + abyPcts.prM + abyPcts.seT) / 6) * 0.8;
  const 위험관리 = ((total_skI * 3 + total_obJ * 2 + total_foC * 1) / 6) * 0.2 + ((abyPcts.inF * 2 + abyPcts.mmM * 2 + abyPcts.cpS + abyPcts.erR) / 6) * 0.8;
  const 변화관리 = ((skI * 3 + reL * 2 + seL * 1) / 6) * 0.2 + ((abyPcts.apP * 2 + abyPcts.stU * 2 + abyPcts.coL + abyPcts.cpR) / 6) * 0.8;
  const 과정관리 = ((total_skI * 3 + total_foC * 2 + total_reL * 1) / 6) * 0.2 + ((abyPcts.frM * 2 + abyPcts.cpS * 2 + abyPcts.stU + abyPcts.mmM) / 6) * 0.8;
  const 수용능력 = ((skI * 3 + obJ * 2 + seL * 1) / 6) * 0.2 + ((abyPcts.coL * 2 + abyPcts.apP * 2 + abyPcts.suM + abyPcts.cpR) / 6) * 0.8;
  const 비판능력 = ((total_foC * 3 + total_seL * 2 + total_skI * 1) / 6) * 0.2 + ((abyPcts.seT * 2 + abyPcts.erR * 2 + abyPcts.jdG + abyPcts.cpS) / 6) * 0.8;
  const 활용능력 = ((total_obJ * 3 + total_seL * 2 + total_foC * 1) / 6) * 0.2 + ((abyPcts.rbD * 2 + abyPcts.mmM * 2 + abyPcts.coL + abyPcts.inF) / 6) * 0.8;
  const 타인이해 = ((reL * 3 + seL * 2 + obJ * 1) / 6) * 0.2 + ((abyPcts.prM * 2 + abyPcts.kwD + abyPcts.jdG) / 4) * 0.8;
  const 자기성찰 = ((total_obJ * 3 + total_reL * 2 + total_seL * 1) / 6) * 0.2 + ((abyPcts.cpS * 2 + abyPcts.erR * 2 + abyPcts.inF) / 5) * 0.8;
  const 관계대응 = ((total_obJ * 3 + total_skI * 2 + total_seL * 1) / 6) * 0.2 + ((abyPcts.jdG * 2 + abyPcts.dcS + abyPcts.cpR) / 4) * 0.8;

  // 5 Directions (Cell 42 lines 1152-1209)
  const 관계점수 = -1 * (((total_foC + total_skI) * 0.6 + total_ability_A * 0.4) - ((total_reL + total_obJ) * 0.6 + total_ability_B * 0.4));
  const 관계 = (total_foC + total_skI) * 0.6 + total_ability_A * 0.4 >= (total_reL + total_obJ) * 0.6 + total_ability_B * 0.4 ? '개인' : '집단';

  const 에너지점수 = -1 * (((total_seL + total_foC) * 0.6 + total_ability_C * 0.4) - ((total_reL + total_obJ) * 0.6 + total_ability_D * 0.4));
  const 에너지 = (total_seL + total_foC) * 0.6 + total_ability_C * 0.4 >= (total_reL + total_obJ) * 0.6 + total_ability_D * 0.4 ? '생각' : '활동';

  const 시간점수 = -1 * (((total_foC + total_skI) * 0.6 + total_ability_B * 0.4) - ((total_foC + total_seL) * 0.6 + total_ability_C * 0.4));
  const 시간 = (total_foC + total_skI) * 0.6 + total_ability_B * 0.4 >= (total_foC + total_seL) * 0.6 + total_ability_C * 0.4 ? '미래' : '현재/과거';

  const 전략점수 = -1 * ((seL * 2 * 0.6 + total_ability_B * 0.4) - ((reL + obJ) * 0.6 + ability_A * 0.4));
  const 전략 = seL * 2 * 0.6 + total_ability_B * 0.4 >= (reL + obJ) * 0.6 + ability_A * 0.4 ? '발산' : '수렴';

  const 갈등점수 = -1 * ((total_seL * 2 * 0.6 + total_ability_A * 0.4) - ((total_reL + total_obJ) * 0.6 + total_ability_C * 0.4));
  const 갈등 = total_seL * 2 * 0.6 + total_ability_A * 0.4 >= (total_reL + total_obJ) * 0.6 + total_ability_C * 0.4 ? '직면' : '타협';

  // Self congruence & evaluation (Cell 42 lines 1213-1216)
  const diffHabMean = (diff_seL + diff_foC + diff_skI + diff_reL + diff_obJ) / 5;
  const diffAbySum = ABILITY_INDICATORS.reduce((s, c) => s + diffAbyScores[c], 0);
  const 자아일치도 = diffHabMean * 0.5 + diffAbySum * 0.5;

  const absHabMean =
    (Math.abs(diff_seL) + Math.abs(diff_foC) + Math.abs(diff_skI) + Math.abs(diff_reL) + Math.abs(diff_obJ)) / 5;
  const absAbyMean = ABILITY_INDICATORS.reduce((s, c) => s + Math.abs(diffAbyScores[c]), 0) / 16;
  const 자기평가정도 = absHabMean * 0.7 + absAbyMean * 0.7;

  // 3 Career Fit Scores (Cell 43 lines 1276-1289)
  const 진로_취업 =
    (관계점수 + 시간점수 + 갈등점수) * 0.5 +
    ((정보처리 + 맥락파악 + 동시처리 + 수용능력 + 비판능력 + 활용능력) / 6) * 0.3 +
    ((과정관리 + 타인이해 + 관계대응) / 3) * 0.7;

  const 진로_창업 =
    (-관계점수 - 시간점수 - 갈등점수) * 0.5 +
    ((목적이해 + 맥락파악 + 동시처리 + 수용능력 + 비판능력 + 활용능력) / 6) * 0.3 +
    ((전제추론 + 성장추구 + 변화관리) / 3) * 0.7;

  const 진로_연구 =
    (-관계점수 - 에너지점수 + 전략점수) * 0.5 +
    ((정보처리 + 목적이해 + 맥락파악 + 동시처리 + 비판능력 + 활용능력) / 6) * 0.3 +
    ((위험관리 + 자기성찰) / 2) * 0.7;

  // Personalized Learning Roadmap Quantification (Cell 43 lines 1332-1488)
  const baseLearn = LEARNING_LIT_TABLE[lit_type] || LEARNING_LIT_TABLE['참고형'];
  let motive_A = baseLearn[0];
  let motive_B = baseLearn[1];
  let perception_A = baseLearn[2];
  let perception_B = baseLearn[3];
  const initPaths: Record<string, number> = {
    path_A: baseLearn[4],
    path_B: baseLearn[5],
    path_C: baseLearn[6],
    path_D: baseLearn[7],
  };
  let space_A = baseLearn[8];
  let space_B = baseLearn[9];

  const ABY_TOP1_score = abyRank.desc[0][1];
  const ABY_TOP2_score = abyRank.desc[1][1];
  const ABY_TOP3_score = abyRank.desc[2][1];
  const ABY_bot1_score = abyRank.asc[0][1];
  const ABY_bot2_score = abyRank.asc[1][1];
  const ABY_bot3_score = abyRank.asc[2][1];

  const mean_AbY_TOP3 = (ABY_TOP1_score + ABY_TOP2_score + ABY_TOP3_score) / 3;
  const mean_AbY_bot3 = (ABY_bot1_score + ABY_bot2_score + ABY_bot3_score) / 3;

  // motive 연산
  if (motive_A < motive_B) {
    motive_A = motive_A - (((100 - seL) / 100) * ((mean_AbY_bot3 - ABY_TOP1_score) / 100));
    motive_B = motive_B + ((foC / 100) * (mean_AbY_TOP3 / 100));
  } else {
    motive_A = motive_A + ((seL / 100) * (mean_AbY_TOP3 / 100));
    motive_B = motive_B - (((100 - foC) / 100) * ((mean_AbY_bot3 - ABY_TOP1_score) / 100));
  }

  // perception 연산
  if (perception_A < perception_B) {
    perception_A = perception_A - (((100 - obJ) / 100) * ((mean_AbY_bot3 - ABY_TOP1_score) / 100)) / 10;
    perception_B = perception_B + ((skI / 100) * (mean_AbY_TOP3 / 100)) / 10;
  } else {
    perception_A = perception_A + ((obJ / 100) * (mean_AbY_TOP3 / 100)) / 10;
    perception_B = perception_B - (((100 - skI) / 100) * ((mean_AbY_bot3 - ABY_TOP1_score) / 100)) / 10;
  }

  // path 연산
  const sortedPaths = Object.entries(initPaths).sort((a, b) => b[1] - a[1]);
  const updatedPaths: Record<string, number> = {};
  updatedPaths[sortedPaths[0][0]] = sortedPaths[0][1] + ((reL / 100) * 0.65 + (ABY_TOP1_score / 100) * 0.35) / 10;
  updatedPaths[sortedPaths[1][0]] = sortedPaths[1][1] + ((reL / 100) * 0.65 + (mean_AbY_TOP3 / 100) * 0.35) / 10;
  updatedPaths[sortedPaths[2][0]] = sortedPaths[2][1] + (((100 - reL) / 100) * 0.65 + (mean_AbY_bot3 / 100) * 0.35) / 10;
  updatedPaths[sortedPaths[3][0]] = sortedPaths[3][1] + (((100 - reL) / 100) * 0.65 + (ABY_bot1_score / 100) * 0.35) / 10;

  const path_A = updatedPaths.path_A;
  const path_B = updatedPaths.path_B;
  const path_C = updatedPaths.path_C;
  const path_D = updatedPaths.path_D;

  // space 연산
  space_A = space_A + (-관계점수 - 에너지점수 - 갈등점수) / 3 / 1000;
  space_B = space_B + (-전략점수 + 에너지점수 + 갈등점수) / 3 / 1000;

  // 백분율 연산 (_pct)
  const motiveSum = motive_A + motive_B || 1;
  const perceptionSum = perception_A + perception_B || 1;
  const pathSum = path_A + path_B + path_C + path_D || 1;
  const spaceSum = space_A + space_B || 1;

  const motive_A_pct = (motive_A / motiveSum) * 100;
  const motive_B_pct = (motive_B / motiveSum) * 100;
  const perception_A_pct = (perception_A / perceptionSum) * 100;
  const perception_B_pct = (perception_B / perceptionSum) * 100;
  const path_A_pct = (path_A / pathSum) * 100;
  const path_B_pct = (path_B / pathSum) * 100;
  const path_C_pct = (path_C / pathSum) * 100;
  const path_D_pct = (path_D / pathSum) * 100;
  const space_A_pct = (space_A / spaceSum) * 100;
  const space_B_pct = (space_B / spaceSum) * 100;

  // AQ Table Analytics (aq_table.csv & Graphit_AI_literacy_analytics_RPA)
  const aq_logic =
    ((abyPcts.stU + abyPcts.seT + abyPcts.erR) / 3) * 0.74 +
    (habit_A_pct * 0.399 + habit_B_pct * 0.399 + habit_C_pct * 0.202) * 0.26;
  const aq_social =
    ((abyPcts.suM + abyPcts.frM + abyPcts.cpS) / 3) * 0.74 +
    (habit_A_pct * 0.349 + habit_B_pct * 0.201 + habit_C_pct * 0.45) * 0.26;
  const aq_practical =
    ((abyPcts.coL + abyPcts.cpR + abyPcts.mmM) / 3) * 0.74 +
    (habit_A_pct * 0.198 + habit_B_pct * 0.401 + habit_C_pct * 0.401) * 0.26;
  const aq_principle =
    ((abyPcts.kwD + abyPcts.prM + abyPcts.inF) / 3) * 0.74 +
    (habit_A_pct * 0.25 + habit_B_pct * 0.5 + habit_C_pct * 0.25) * 0.26;
  const aq_creative =
    ((abyPcts.jdG + abyPcts.apP + abyPcts.rbD) / 3) * 0.74 +
    (habit_A_pct * 0.352 + habit_B_pct * 0.199 + habit_C_pct * 0.449) * 0.26;

  const aqEntries: [string, number][] = [
    ['aq_logic', aq_logic],
    ['aq_social', aq_social],
    ['aq_practical', aq_practical],
    ['aq_principle', aq_principle],
    ['aq_creative', aq_creative],
  ];
  const aqSortedDesc = [...aqEntries].sort((a, b) => b[1] - a[1]);
  const aq_max_1 = aqSortedDesc[0][0];
  const aq_max_2 = aqSortedDesc[1][0];

  // Top 3 AQ items in canonical order ('aq_logic'..'aq_creative') matched against AQ_TABLE (A_list..J_list)
  const top3Set = new Set(aqSortedDesc.slice(0, 3).map((e) => e[0]));
  const canonicalTop3 = AQ_INDICATORS.filter((k) => top3Set.has(k));
  let aq_group = 'A_list';
  for (const [grpName, triple] of Object.entries(AQ_TABLE)) {
    if (
      triple[0] === canonicalTop3[0] &&
      triple[1] === canonicalTop3[1] &&
      triple[2] === canonicalTop3[2]
    ) {
      aq_group = grpName;
      break;
    }
  }

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
    ABY_TOP1: abyRank.desc[0][0], ABY_TOP1_score,
    ABY_TOP2: abyRank.desc[1][0], ABY_TOP2_score,
    ABY_TOP3: abyRank.desc[2][0], ABY_TOP3_score,
    ABY_TOP4: abyRank.desc[3][0], ABY_TOP4_score: abyRank.desc[3][1],
    HAB_bot1: habRank.asc[0][0], HAB_bot1_score: habRank.asc[0][1],
    ABY_bot1: abyRank.asc[0][0], ABY_bot1_score,
    ABY_bot2: abyRank.asc[1][0], ABY_bot2_score,
    ABY_bot3: abyRank.asc[2][0], ABY_bot3_score,
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
    motive_A, motive_B,
    perception_A, perception_B,
    path_A, path_B, path_C, path_D,
    space_A, space_B,
    motive_A_pct, motive_B_pct,
    perception_A_pct, perception_B_pct,
    path_A_pct, path_B_pct, path_C_pct, path_D_pct,
    space_A_pct, space_B_pct,
    aq_logic,
    aq_social,
    aq_practical,
    aq_principle,
    aq_creative,
    aq_group,
    aq_max_1,
    aq_max_2,
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
    aqAnalytics: {
      aq_logic: row.aq_logic,
      aq_social: row.aq_social,
      aq_practical: row.aq_practical,
      aq_principle: row.aq_principle,
      aq_creative: row.aq_creative,
      aq_group: row.aq_group,
      aq_max_1: row.aq_max_1,
      aq_max_2: row.aq_max_2,
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
      prep: row.motive_A_pct > 0 ? row.motive_A_pct / 100 : st.prepRatio,
      review: row.motive_B_pct > 0 ? row.motive_B_pct / 100 : st.reviewRatio,
      concept: row.perception_A_pct > 0 ? row.perception_A_pct / 100 : st.conceptRatio,
      problem: row.perception_B_pct > 0 ? row.perception_B_pct / 100 : st.problemRatio,
      selfStudy: row.path_A_pct > 0 ? row.path_A_pct / 100 : st.selfStudyRatio,
      tutoring1on1: row.path_B_pct > 0 ? row.path_B_pct / 100 : st.tutoring1on1Ratio,
      groupTutoring: row.path_C_pct > 0 ? row.path_C_pct / 100 : st.groupTutoringRatio,
      academy: row.path_D_pct > 0 ? row.path_D_pct / 100 : st.academyRatio,
      independentSpace: row.space_A_pct > 0 ? row.space_A_pct / 100 : st.independentSpaceRatio,
      openSpace: row.space_B_pct > 0 ? row.space_B_pct / 100 : st.openSpaceRatio,
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

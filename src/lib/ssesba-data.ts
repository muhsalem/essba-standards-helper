export type Lang = "ar" | "en";
export type AssessmentMode = "expert" | "self" | "ai_review";
export type RiskTier = "S1" | "S2" | "S3" | "S4";

export const brand = {
  ar: { short: "مَشْتَق (MASHTAQ)", full: "المعايير الشرعية لتصنيف القطاعات الاقتصادية وأنشطة الأعمال" },
  en: { short: "MASHTAQ · SSEBA", full: "Shariah Standards for the Classification of Economic Sectors & Business Activities" },
} as const;

export const axes = [
  { id: "contracts", ar: "العقود", en: "Contracts", weight: 25, hospital: 88 },
  { id: "revenues", ar: "الإيرادات", en: "Revenue", weight: 25, hospital: 96 },
  { id: "financing", ar: "التمويل", en: "Financing", weight: 20, hospital: 72 },
  { id: "operations", ar: "العمليات", en: "Operations", weight: 15, hospital: 90 },
  { id: "governance", ar: "الحوكمة", en: "Governance", weight: 10, hospital: 82 },
  { id: "disclosure", ar: "الإفصاح", en: "Disclosure", weight: 5, hospital: 78 },
] as const;

/** بوابة الأهلية: اختبارات مستقلة ملزمة، تخلّف أي منها يُسقط الأهلية. */
export const gateChecks = [
  { id: "riba", ar: "خلوّ النشاط الأساسي من الربا", en: "Core activity free of riba" },
  { id: "maysir", ar: "خلوّ النشاط الأساسي من الميسر", en: "Core activity free of maysir" },
  { id: "prohibited", ar: "خلوّ النشاط من السلع والخدمات المحرمة", en: "No prohibited goods or services" },
  { id: "gharar", ar: "خلوّ العقود من الغش والغرر الجوهري", en: "No fraud or material gharar" },
] as const;

export type GateState = Record<string, boolean>;

/**
 * عتبة الإخفاق البنيوي المنصوص عليها في المعيار (أقل من 45).
 * لا يوجد في هذه النسخة حدٌّ أدنى معتمد لكل محور، لذلك تُعرض المحاور
 * التي تقل عن هذه العتبة كتنبيهٍ للمراجع دون أثر آلي على الحكم.
 */
export const structuralFailureThreshold = 45;

export const verdictMatrix = {
  compliant: { S1: "approved", S2: "approved_conditional", S3: "conditional", S4: "rejected" },
  conditional: { S1: "conditional", S2: "conditional", S3: "remediation", S4: "rejected" },
  remediation: { S1: "remediation", S2: "remediation", S3: "remediation", S4: "rejected" },
  non_compliant: { S1: "rejected", S2: "rejected", S3: "rejected", S4: "rejected" },
} as const;

export function gatePassed(gate: GateState) {
  return gateChecks.every((check) => gate[check.id] === true);
}

export function failedGateChecks(gate: GateState) {
  return gateChecks.filter((check) => gate[check.id] !== true);
}

export function flaggedAxes(scores: Record<string, number>) {
  return axes.filter((axis) => (scores[axis.id] ?? 0) < structuralFailureThreshold);
}

export function calculateAssessment(scores: Record<string, number>, gate: GateState, risk: RiskTier) {
  if (!gatePassed(gate)) {
    return { score: 0, band: "non_compliant", verdict: "rejected", ineligible: true, structuralFailure: true, flagged: flaggedAxes(scores) } as const;
  }
  const score = Math.round(axes.reduce((total, axis) => total + (scores[axis.id] ?? 0) * axis.weight / 100, 0) * 10) / 10;
  const band = score >= 85 ? "compliant" : score >= 75 ? "conditional" : score >= 60 ? "remediation" : "non_compliant";
  return {
    score,
    band,
    verdict: verdictMatrix[band][risk],
    ineligible: false,
    structuralFailure: score < structuralFailureThreshold,
    flagged: flaggedAxes(scores),
  } as const;
}

export const copy = {
  ar: {
    brand: "مَشْتَق", standard: "المعيار", request: "طلب تقييم", assessment: "التقييم", admin: "الإدارة", explorer: "مستكشف التصنيف",
    back: "العودة إلى المعيار", language: "English", advisory: "نتيجة استرشادية تحتاج اعتماد مراجع شرعي مختص، وليست فتوى ولا اعتمادًا نهائيًا.",
  },
  en: {
    brand: "MASHTAQ · SSEBA", standard: "Standard", request: "Request assessment", assessment: "Assessment", admin: "Admin", explorer: "Classification explorer",
    back: "Back to the standard", language: "العربية", advisory: "An indicative result requiring approval by a qualified Shariah reviewer; it is neither a fatwa nor a final accreditation.",
  },
} as const;

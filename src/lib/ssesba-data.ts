export type Lang = "ar" | "en";
export type AssessmentMode = "expert" | "self" | "ai_review";
export type RiskTier = "S1" | "S2" | "S3" | "S4";

export const axes = [
  { id: "contracts", ar: "العقود", en: "Contracts", weight: 25, hospital: 88 },
  { id: "revenues", ar: "الإيرادات", en: "Revenue", weight: 25, hospital: 96 },
  { id: "financing", ar: "التمويل", en: "Financing", weight: 20, hospital: 72 },
  { id: "operations", ar: "العمليات", en: "Operations", weight: 15, hospital: 90 },
  { id: "governance", ar: "الحوكمة", en: "Governance", weight: 10, hospital: 82 },
  { id: "disclosure", ar: "الإفصاح", en: "Disclosure", weight: 5, hospital: 78 },
] as const;

export const verdictMatrix = {
  compliant: { S1: "approved", S2: "approved_conditional", S3: "conditional", S4: "rejected" },
  conditional: { S1: "conditional", S2: "conditional", S3: "remediation", S4: "rejected" },
  remediation: { S1: "remediation", S2: "remediation", S3: "remediation", S4: "rejected" },
  non_compliant: { S1: "rejected", S2: "rejected", S3: "rejected", S4: "rejected" },
} as const;

export function calculateAssessment(scores: Record<string, number>, eligible: boolean, risk: RiskTier) {
  if (!eligible) return { score: 0, band: "ineligible", verdict: "rejected" } as const;
  const score = Math.round(axes.reduce((total, axis) => total + (scores[axis.id] ?? 0) * axis.weight / 100, 0) * 10) / 10;
  const band = score >= 85 ? "compliant" : score >= 75 ? "conditional" : score >= 60 ? "remediation" : "non_compliant";
  return { score, band, verdict: verdictMatrix[band][risk] };
}

export const copy = {
  ar: {
    brand: "SSESBA", standard: "المعيار", request: "طلب تقييم", assessment: "التقييم", admin: "الإدارة", explorer: "مستكشف التصنيف",
    back: "العودة إلى المعيار", language: "English", advisory: "نتيجة استرشادية تحتاج اعتماد مراجع شرعي مختص.",
  },
  en: {
    brand: "SSESBA", standard: "Standard", request: "Request assessment", assessment: "Assessment", admin: "Admin", explorer: "Classification explorer",
    back: "Back to the standard", language: "العربية", advisory: "An indicative result requiring approval by a qualified Shariah reviewer.",
  },
} as const;

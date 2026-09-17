import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Building2, CheckCircle2, Save, Sparkles } from "lucide-react";
import { SiteShell } from "./SiteShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  axes, brand, calculateAssessment, copy, gateChecks, structuralFailureThreshold,
  type AssessmentMode, type GateState, type Lang, type RiskTier,
} from "@/lib/ssesba-data";
import { getAssessmentCatalog, suggestHospitalAssessment } from "@/lib/ssesba.functions";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

const labels = {
  ar: {
    title: "تقييم مستشفى نموذجي", eyebrow: "تطبيق واقعي تفاعلي",
    desc: "مستشفى عام يقدم خدمات علاجية وتشخيصية وصيدلية. راجع اختبارات الأهلية المستقلة أولًا، ثم عدّل درجات المحاور وفق الأدلة المتاحة.",
    gate: "بوابة الأهلية", gateNote: "اختبارات ملزمة مستقلة؛ تخلّف أي اختبار يُسقط الأهلية ولا تعوّضه درجات المحاور.",
    gateFailed: "تخلّف اختبار أهلية واحد أو أكثر:", risk: "مستوى المخاطر الشرعية",
    riskNote: "يحدده المراجع المختص؛ لا يستنتجه النظام آليًا.", result: "النتيجة المركبة",
    expert: "خبير", self: "ذاتي", ai_review: "اقتراح AI", analyze: "اقتراح الدرجات", evidence: "وصف النشاط والأدلة",
    full: "امتثال كامل", compliant: "ممتثل", conditional: "ممتثل بشروط", remediation: "يحتاج معالجة",
    non_compliant: "غير ممتثل", ineligible: "غير مؤهل", approved: "معتمد", approved_conditional: "معتمد بشروط", rejected: "مرفوض",
    band: "النطاق", weight: "الوزن", structural: "إخفاق بنيوي: الدرجة أقل من 45.",
    flagged: "محاور دون 45 تستوجب مراجعة الأدلة (تنبيه فقط؛ لا يوجد حدٌّ أدنى معتمد لكل محور في هذه النسخة):",
    how: "كيف تُقرأ النتيجة: تُطبَّق بوابة الأهلية أولًا، ثم يُحسب متوسط مرجّح للمحاور الستة، وتُترجم الدرجة إلى نطاق، ثم يُدمج النطاق مع مستوى المخاطر S1–S4 في مصفوفة المعيار للوصول إلى الحكم.",
    example: "اختر نموذج قطاع واقعي", save: "حفظ النتيجة", saved: "حُفظت النتيجة برقم",
  },
  en: {
    title: "Sample hospital assessment", eyebrow: "Interactive real-world application",
    desc: "A general hospital providing clinical, diagnostic, and pharmacy services. Review the independent eligibility tests first, then adjust each axis using available evidence.",
    gate: "Eligibility gate", gateNote: "Independent binding tests; failing any one removes eligibility and cannot be offset by axis scores.",
    gateFailed: "One or more eligibility tests failed:", risk: "Shariah risk tier",
    riskNote: "Selected by a qualified reviewer; the system does not infer it automatically.", result: "Combined result",
    expert: "Expert", self: "Self", ai_review: "AI suggestion", analyze: "Suggest scores", evidence: "Activity and evidence description",
    full: "Full compliance", compliant: "Compliant", conditional: "Conditionally compliant", remediation: "Needs remediation",
    non_compliant: "Non-compliant", ineligible: "Ineligible", approved: "Approved", approved_conditional: "Approved with conditions", rejected: "Rejected",
    band: "Band", weight: "Weight", structural: "Structural failure: score below 45.",
    flagged: "Axes below 45 require evidence review (advisory only; this version defines no approved per-axis floor):",
    how: "Reading the result: the eligibility gate applies first, then the six axes are combined into a weighted score, the score resolves into a band, and the band is combined with the S1–S4 risk tier in the standard's matrix to reach the verdict.",
    example: "Choose a real-sector example", save: "Save result", saved: "Result saved as",
  },
} as const;

export function AssessmentPage({ lang }: { lang: Lang }) {
  const t = labels[lang];
  const [mode, setMode] = useState<AssessmentMode>("expert");
  const [gate, setGate] = useState<GateState>(Object.fromEntries(gateChecks.map((c) => [c.id, true])));
  const [risk, setRisk] = useState<RiskTier>("S2");
  const [scores, setScores] = useState<Record<string, number>>(Object.fromEntries(axes.map((a) => [a.id, a.hospital])));
  const [description, setDescription] = useState(lang === "ar"
    ? "مستشفى عام، إيراداته من الخدمات الطبية والصيدلية المباحة، لديه تمويل تقليدي محدود، ولجنة حوكمة داخلية وتقارير مالية دورية."
    : "A general hospital earning revenue from permissible clinical and pharmacy services, with limited conventional financing, internal governance, and periodic financial reporting.");
  const [aiNote, setAiNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [examples, setExamples] = useState<Awaited<ReturnType<typeof getAssessmentCatalog>>["examples"]>([]);
  const [selectedExample, setSelectedExample] = useState("healthcare");
  const [savedReference, setSavedReference] = useState("");
  const suggest = useServerFn(suggestHospitalAssessment);
  const getCatalog = useServerFn(getAssessmentCatalog);
  const result = useMemo(() => calculateAssessment(scores, gate, risk), [scores, gate, risk]);
  const failed = gateChecks.filter((c) => gate[c.id] !== true);

  useEffect(() => { getCatalog().then((catalog) => setExamples(catalog.examples)).catch(() => undefined); }, [getCatalog]);

  function applyExample(key:string){const example=examples.find((item)=>item.sector_key===key);if(!example)return;setSelectedExample(key);setDescription(lang==="ar"?example.description_ar:example.description_en);setRisk(example.risk_tier as RiskTier);setGate(example.gate_state as GateState);setScores(example.scores as Record<string,number>);setSavedReference("");}

  async function saveResult(){setBusy(true);setError("");try{const{data:{user}}=await supabase.auth.getUser();const example=examples.find((item)=>item.sector_key===selectedExample);const{data,error:saveError}=await supabase.from("assessment_results").insert({owner_user_id:user?.id??null,organization_name:null,sector_key:selectedExample,activity_name:example?(lang==="ar"?example.activity_ar:example.activity_en):"General assessment",assessment_mode:mode,gate_state:gate as Json,scores:scores as Json,risk_tier:risk,weighted_score:result.score,result_band:result.band,verdict:result.verdict,is_eligible:!result.ineligible,notes:description}).select("reference_code").single();if(saveError)throw saveError;setSavedReference(data.reference_code);}catch(e){setError(e instanceof Error?e.message:"Save failed");}finally{setBusy(false);}}

  async function runAI() {
    setBusy(true); setError("");
    try {
      const r = await suggest({ data: { description } });
      setScores(Object.fromEntries(axes.map((a, i) => [a.id, r.scores[i] ?? a.hospital])));
      setAiNote(r.note);
    } catch (e) { setError(e instanceof Error ? e.message : "AI request failed"); }
    finally { setBusy(false); }
  }

  const bandLabel = result.ineligible ? t.ineligible : result.band === "compliant" && result.score >= 95 ? t.full : (t[result.band as keyof typeof t] as string);
  const verdict = t[result.verdict as keyof typeof t] as string;

  return (
    <SiteShell lang={lang} eyebrow={t.eyebrow} title={t.title}>
      <div className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 border-b pb-8 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2 text-brand-gold">
              <Building2 /><span className="font-semibold">{lang === "ar" ? "الرعاية الصحية · ISIC 8610" : "Healthcare · ISIC 8610"}</span>
            </div>
            <p className="leading-7 text-muted-foreground">{t.desc}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{brand[lang].short} — {brand[lang].full}</p>
          </div>
          <Tabs value={mode} onValueChange={(v) => setMode(v as AssessmentMode)}>
            <TabsList className="h-11">
              <TabsTrigger value="expert">{t.expert}</TabsTrigger>
              <TabsTrigger value="self">{t.self}</TabsTrigger>
              <TabsTrigger value="ai_review">{t.ai_review}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {examples.length>0&&<div className="mb-8 max-w-xl"><Label>{t.example}</Label><Select value={selectedExample} onValueChange={applyExample}><SelectTrigger className="mt-2 h-11 bg-card"><SelectValue/></SelectTrigger><SelectContent>{examples.map((item)=><SelectItem key={item.id} value={item.sector_key}>{lang==="ar"?item.title_ar:item.title_en} · {item.isic_code}</SelectItem>)}</SelectContent></Select></div>}

        <div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr]">
          <section className="space-y-7">
            <div className="rounded-md border bg-card p-5">
              <h2 className="text-base font-semibold">{t.gate}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.gateNote}</p>
              <div className="mt-4 space-y-3">
                {gateChecks.map((check) => (
                  <div key={check.id} className="flex items-start gap-3">
                    <Checkbox id={check.id} checked={gate[check.id] === true} onCheckedChange={(v) => setGate({ ...gate, [check.id]: v === true })} className="mt-1" />
                    <Label htmlFor={check.id} className="text-sm leading-6 font-normal">{check[lang]}</Label>
                  </div>
                ))}
              </div>
              {failed.length > 0 && (
                <div className="mt-4 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                  <p className="font-semibold">{t.gateFailed}</p>
                  <ul className="mt-2 list-disc space-y-1 ps-5">{failed.map((c) => <li key={c.id}>{c[lang]}</li>)}</ul>
                </div>
              )}
            </div>

            {mode === "ai_review" && (
              <div className="rounded-md border border-brand-gold/40 bg-brand-parchment p-5">
                <Label>{t.evidence}</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-3 min-h-28 bg-background" />
                <Button onClick={runAI} disabled={busy} className="mt-3 bg-brand-navy text-primary-foreground"><Sparkles />{busy ? "…" : t.analyze}</Button>
                {aiNote && <p className="mt-3 text-sm leading-6">{aiNote}</p>}
                {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
              </div>
            )}

            <div className="space-y-4">
              {axes.map((axis) => {
                const score = scores[axis.id] ?? axis.hospital;
                const low = score < structuralFailureThreshold;
                return (
                  <div key={axis.id} className={`rounded-md border bg-card p-5 ${low ? "border-destructive/50" : ""}`}>
                    <div className="mb-4 flex items-baseline justify-between">
                      <div>
                        <h3 className="font-semibold">{axis[lang]}</h3>
                        <p className="text-xs text-muted-foreground">{t.weight} {axis.weight}%</p>
                      </div>
                      <output className={`font-mono text-xl font-bold ${low ? "text-destructive" : "text-brand-navy"}`}>{score}</output>
                    </div>
                    <Slider value={[score]} max={100} step={1} onValueChange={(v) => setScores({ ...scores, [axis.id]: v[0] ?? 0 })} />
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="lg:sticky lg:top-5 lg:self-start">
            <div className="overflow-hidden rounded-md border bg-card shadow-sm">
              <div className="bg-brand-navy p-6 text-primary-foreground">
                <p className="text-sm text-brand-gold-soft">{t.result}</p>
                <div className="mt-2 flex items-end justify-between">
                  <strong className="font-serif text-5xl">{result.score}</strong><span className="pb-1 text-sm">/ 100</span>
                </div>
              </div>
              <div className="space-y-5 p-6">
                <div>
                  <p className="text-xs text-muted-foreground">{t.band}</p>
                  <p className="mt-1 text-xl font-semibold">{bandLabel}</p>
                  {result.structuralFailure && <p className="mt-1 text-sm text-destructive">{t.structural}</p>}
                </div>
                <div>
                  <Label>{t.risk}</Label>
                  <Select value={risk} onValueChange={(v) => setRisk(v as RiskTier)}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>{["S1", "S2", "S3", "S4"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                  </Select>
                  <p className="mt-2 text-xs text-muted-foreground">{t.riskNote}</p>
                </div>
                <div className={`rounded-md p-4 ${result.verdict === "rejected" ? "bg-destructive/10 text-destructive" : "bg-brand-parchment text-brand-navy"}`}>
                  {result.verdict === "rejected" ? <AlertTriangle /> : <CheckCircle2 />}
                  <p className="mt-2 text-lg font-bold">{verdict}</p>
                </div>
                {result.flagged.length > 0 && (
                  <div className="rounded-md border border-brand-gold/40 bg-brand-parchment/60 p-4 text-xs leading-5">
                    <p className="font-semibold">{t.flagged}</p>
                    <p className="mt-1">{result.flagged.map((a) => a[lang]).join(lang === "ar" ? "، " : ", ")}</p>
                  </div>
                )}
                <p className="border-t pt-4 text-xs leading-5 text-muted-foreground">{t.how}</p>
                <p className="text-xs leading-5 text-muted-foreground">{copy[lang].advisory}</p>
                <Button onClick={saveResult} disabled={busy} className="w-full bg-brand-emerald text-primary-foreground"><Save/>{t.save}</Button>
                {savedReference&&<p className="text-center text-sm font-semibold text-brand-emerald">{t.saved}: {savedReference}</p>}
                {error&&<p className="text-sm text-destructive">{error}</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}

import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardCheck, Loader2, Scale, ShieldAlert, Wrench } from "lucide-react";
import { SiteShell } from "@/features/ssesba/SiteShell";
import { Button } from "@/components/ui/button";
import { complianceLevelForScore, complianceLevels, copy, type Lang } from "@/lib/ssesba-data";
import { evaluateCompanySixScale } from "@/lib/ssesba.functions";

const l10n = {
  ar: {
    eyebrow: "أداة تدقيق شرعي استرشادية",
    title: "المقياس السداسي للامتثال الشرعي",
    intro: "قيّم امتثال شركة وفق المقياس السداسي (100 إلى أقل من 45) مع تطبيق المعايير القطاعية للقطاع الأولي أو الثانوي أو الخدمي. النتيجة قراءة تدقيقية استرشادية منفصلة عن نتيجة معايير التصنيف الشرعي المرجّحة، ولا تُغني عن اعتماد هيئة شرعية مؤهلة.",
    company: "اسم الشركة", sector: "القطاع الاقتصادي", activity: "وصف النشاط الرئيسي", financing: "الهيكل التمويلي والإيرادات", notes: "ملاحظات استثنائية (سياسات، عقود، بيئة عمل) — اختياري",
    sectors: { primary: "أولي (استخراجي، زراعي، رعوي، تعدين)", secondary: "ثانوي (صناعي، تحويلي، بناء، تطوير عقاري)", services: "خدمي (مالي، تقني، تجاري، تعليمي، استشاري)" },
    submit: "قيّم الشركة", loading: "يجري التدقيق…",
    result: "نتيجة التقييم", level: "المستوى", score: "الدرجة", justification: "التبرير الشرعي والمالي", plan: "خطة المعالجة والتطهير",
    scale: "الهيكل السداسي الموحد", current: "المستوى الحالي", advisory: "نتيجة استرشادية تتطلب مراجعة هيئة شرعية مؤهلة؛ ليست فتوى ولا اعتمادًا نهائيًا.",
    levels: ["متوافق كلياً", "متوافق جوهرياً", "متوافق بشروط", "يحتاج معالجة هيكلية", "غير متوافق", "محظور شرعاً"],
  },
  en: {
    eyebrow: "Indicative Shariah audit tool",
    title: "The Six-Level Shariah Compliance Scale",
    intro: "Assess a company's compliance on the six-level scale (100 down to below 45) with sector standards for the primary, secondary, or services sector. The result is an indicative audit reading, separate from the weighted SSESBA score, and does not replace approval by a qualified Shariah board.",
    company: "Company name", sector: "Economic sector", activity: "Main activity description", financing: "Financing structure and revenue", notes: "Exceptional notes (policies, contracts, work environment) — optional",
    sectors: { primary: "Primary (extractive, agriculture, livestock, mining)", secondary: "Secondary (manufacturing, processing, construction, real estate)", services: "Services (financial, tech, commercial, education, consulting)" },
    submit: "Assess the company", loading: "Auditing…",
    result: "Assessment result", level: "Level", score: "Score", justification: "Shariah and financial justification", plan: "Remediation and purification plan",
    scale: "Unified six-level structure", current: "Current level", advisory: "An indicative result requiring review by a qualified Shariah board; neither a fatwa nor a final accreditation.",
    levels: ["Fully compliant", "Substantially compliant", "Compliant with conditions", "Requires structural remediation", "Non-compliant", "Prohibited"],
  },
} as const;

type Sector = keyof (typeof l10n)["ar"]["sectors"];
type SixResult = { score: number; level: string; justification: string[]; plan: string[] };

function levelTone(score: number): string {
  const idx = complianceLevels.findIndex((level) => level.id === complianceLevelForScore(score).id);
  if (idx <= 1 && idx >= 0) return "border-brand-emerald/40 bg-brand-emerald/10 text-brand-emerald";
  if (idx <= 3 && idx >= 0) return "border-brand-gold/50 bg-brand-gold/10 text-brand-gold";
  return "border-destructive/40 bg-destructive/10 text-destructive";
}

export function SixScalePage({ lang }: { lang: Lang }) {
  const t = l10n[lang];
  const evaluate = useServerFn(evaluateCompanySixScale);
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState<Sector>("services");
  const [activity, setActivity] = useState("");
  const [financing, setFinancing] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SixResult | null>(null);

  const submit = async () => {
    setBusy(true); setError(null); setResult(null);
    try {
      const out = await evaluate({ data: { companyName, sector, activity, financing, notes: notes || undefined, lang } });
      setResult(out);
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(false); }
  };

  const field = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-brand-gold focus:outline-none";
  const label = "mb-1 block text-sm font-semibold text-brand-navy";

  return (
    <SiteShell lang={lang} eyebrow={t.eyebrow} title={t.title}>
      <section className="mx-auto max-w-7xl px-5 py-10">
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{t.intro}</p>
        <div className="mt-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label={t.scale}>
          {complianceLevels.map((level, index) => <div key={level.id} className="border-s-4 border-brand-gold bg-card px-3 py-3 shadow-sm"><span className="text-xs text-muted-foreground">{index + 1}</span><strong className="mt-1 block text-sm text-brand-navy">{level[lang]}</strong><span className="font-mono text-xs text-muted-foreground">{level.min === 0 ? "<45" : `${level.min}–${level.max}`}</span></div>)}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <form className="grid gap-4 rounded-lg border border-brand-gold/30 bg-card p-6 shadow-sm" onSubmit={(e) => { e.preventDefault(); if (!busy) void submit(); }}>
            <div><label className={label} htmlFor="six-company">{t.company}</label><input id="six-company" className={field} value={companyName} onChange={(e) => setCompanyName(e.target.value)} required minLength={2} maxLength={160} /></div>
            <div><label className={label} htmlFor="six-sector">{t.sector}</label>
              <select id="six-sector" className={field} value={sector} onChange={(e) => setSector(e.target.value as Sector)}>
                {(Object.keys(t.sectors) as Sector[]).map((key) => <option key={key} value={key}>{t.sectors[key]}</option>)}
              </select>
            </div>
            <div><label className={label} htmlFor="six-activity">{t.activity}</label><textarea id="six-activity" className={field} rows={3} value={activity} onChange={(e) => setActivity(e.target.value)} required minLength={10} maxLength={3000} /></div>
            <div><label className={label} htmlFor="six-financing">{t.financing}</label><textarea id="six-financing" className={field} rows={3} value={financing} onChange={(e) => setFinancing(e.target.value)} required minLength={5} maxLength={3000} /></div>
            <div><label className={label} htmlFor="six-notes">{t.notes}</label><textarea id="six-notes" className={field} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={3000} /></div>
            <Button type="submit" disabled={busy} className="bg-brand-navy text-primary-foreground hover:bg-brand-navy/90">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Scale className="size-4" />}{busy ? t.loading : t.submit}
            </Button>
            {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          </form>

          <div>
            {!result && !busy && (
              <div className="grid h-full min-h-64 place-items-center rounded-lg border border-dashed border-brand-gold/40 bg-brand-parchment/40 p-8 text-center text-sm text-muted-foreground">
                <div><ClipboardCheck className="mx-auto mb-3 size-8 text-brand-gold" />{t.intro}</div>
              </div>
            )}
            {result && (
              <div className="grid gap-4">
                <div className={`rounded-lg border-2 p-6 ${levelTone(result.score)}`}>
                  <div className="text-xs font-semibold uppercase tracking-wide opacity-80">{t.result}</div>
                  <div className="mt-2 font-display-ar text-3xl font-bold">{complianceLevelForScore(result.score)[lang]}</div>
                  <div className="mt-1 text-sm">{t.score}: <b>{result.score} / 100</b></div>
                  <div className="mt-2 text-xs opacity-80">{t.current}: {complianceLevelForScore(result.score)[lang]}</div>
                </div>
                <div className="rounded-lg border border-border bg-card p-5">
                  <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-navy"><ShieldAlert className="size-4 text-brand-gold" />{t.justification}</h2>
                  <ul className="list-disc space-y-1 ps-5 text-sm leading-7">{result.justification.map((line, i) => <li key={i}>{line}</li>)}</ul>
                </div>
                {result.plan.length > 0 && (
                  <div className="rounded-lg border border-brand-gold/40 bg-card p-5">
                    <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-navy"><Wrench className="size-4 text-brand-gold" />{t.plan}</h2>
                    <ul className="list-disc space-y-1 ps-5 text-sm leading-7">{result.plan.map((line, i) => <li key={i}>{line}</li>)}</ul>
                  </div>
                )}
                <p className="text-xs leading-6 text-muted-foreground">{t.advisory}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

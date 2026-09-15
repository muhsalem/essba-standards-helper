import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableResponsesProvider } from "@/lib/ai-gateway.server";

const requestSchema = z.object({
  clientName: z.string().trim().min(2).max(120), organizationName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(255), phone: z.string().trim().max(30).optional(), country: z.string().trim().max(100).optional(),
  sector: z.string().trim().min(2).max(160), activity: z.string().trim().min(2).max(240),
  assessmentType: z.enum(["expert", "self", "ai_review"]), notes: z.string().trim().max(2000).optional(), preferredLanguage: z.enum(["ar", "en"]),
});
const translationSchema = z.object({ sectionId: z.string().uuid(), titleAr: z.string().trim().min(2).max(300), bodyAr: z.string().trim().min(10).max(12000) });
const updateSchema = translationSchema.extend({ titleEn: z.string().trim().min(2).max(300), bodyEn: z.string().trim().min(10).max(12000), note: z.string().trim().max(500).optional() });
const aiAssessmentSchema = z.object({ description: z.string().trim().min(20).max(6000) });

function publicClient() {
  const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error("Cloud configuration is unavailable");
  return createClient<Database>(url, key, { auth: { persistSession: false }, global: { fetch: (input, init) => { const headers = new Headers(init?.headers); if (key.startsWith('sb_')) headers.delete('Authorization'); headers.set('apikey', key); return fetch(input, { ...init, headers }); } } });
}
function assertPreviewAdmin() { if (!import.meta.env.DEV) throw new Error("Admin editing is locked on the published site until secure sign-in is enabled."); }
function aiKey() { const key = process.env['LOVABLE_API_KEY']; if (!key) throw new Error("Lovable AI is not configured."); return key; }
function gatewayMessage(error: unknown) { return error instanceof Error ? error.message : "Lovable AI request failed."; }

export const getStandardSections = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient().from("standard_sections").select("id,section_key,sort_order,title_ar,title_en,body_ar,body_en,translation_status,translated_at,updated_at").eq("is_published", true).order("sort_order");
  if (error) throw new Error(error.message); return data;
});

export const submitAssessmentRequest = createServerFn({ method: "POST" }).inputValidator((input: unknown) => requestSchema.parse(input)).handler(async ({ data }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row, error } = await supabaseAdmin.from("assessment_requests").insert({ client_name: data.clientName, organization_name: data.organizationName, email: data.email, phone: data.phone || null, country: data.country || null, sector: data.sector, activity: data.activity, assessment_type: data.assessmentType, notes: data.notes || null, preferred_language: data.preferredLanguage }).select("reference_code").single();
  if (error) throw new Error(error.message); return row;
});

export const translateStandardSection = createServerFn({ method: "POST" }).inputValidator((input: unknown) => translationSchema.parse(input)).handler(async ({ data }) => {
  assertPreviewAdmin(); const gateway = createLovableResponsesProvider(aiKey());
  try {
    const result = streamText({ model: gateway.model, maxRetries: 0, system: "You are a senior Arabic-English translator specializing in Islamic finance and Shariah standards. Preserve exact percentages, thresholds, proper names, and normative force. Return exactly two lines: TITLE: ... and BODY: ... with no markdown.", prompt: `Translate accurately into formal professional English.\nArabic title: ${data.titleAr}\nArabic body: ${data.bodyAr}`, providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "medium", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } } });
    const text = await result.text; const title = text.match(/^TITLE:\s*(.+)$/m)?.[1]?.trim(); const body = text.match(/^BODY:\s*([\s\S]+)$/m)?.[1]?.trim();
    if (!title || !body) throw new Error("The translation response was incomplete.");
    return { title, body, runId: gateway.getRunId() };
  } catch (error) { throw new Error(gatewayMessage(error)); }
});

export const suggestHospitalAssessment = createServerFn({ method: "POST" }).inputValidator((input: unknown) => aiAssessmentSchema.parse(input)).handler(async ({ data }) => {
  const gateway = createLovableResponsesProvider(aiKey());
  try {
    const result = streamText({ model: gateway.model, maxRetries: 0, system: "You assist a qualified Shariah reviewer using SSESSBA. Never issue a final fatwa. Analyze only the supplied hospital business description. Propose six integer scores from 0 to 100 for contracts, revenues, financing, operations, governance, disclosure. Return one line only: SCORES: contracts,revenues,financing,operations,governance,disclosure | NOTE: concise Arabic rationale. Do not infer a risk tier.", prompt: data.description, providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "medium", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } } });
    const text = await result.text; const match = text.match(/SCORES:\s*([0-9,\s]+)/i); const values = match?.[1]?.split(',').map((v) => Math.max(0, Math.min(100, Number.parseInt(v.trim(), 10))));
    if (!values || values.length !== 6 || values.some(Number.isNaN)) throw new Error("The AI assessment response was incomplete.");
    return { scores: values, note: text.match(/NOTE:\s*(.+)$/is)?.[1]?.trim() ?? "", runId: gateway.getRunId() };
  } catch (error) { throw new Error(gatewayMessage(error)); }
});

export const updateStandardSection = createServerFn({ method: "POST" }).inputValidator((input: unknown) => updateSchema.parse(input)).handler(async ({ data }) => {
  assertPreviewAdmin(); const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: current, error: readError } = await supabaseAdmin.from("standard_sections").select("*").eq("id", data.sectionId).single();
  if (readError) throw new Error(readError.message);
  const { error: revisionError } = await supabaseAdmin.from("content_revisions").insert({ section_id: current.id, snapshot: current, change_note: data.note || "Content updated" });
  if (revisionError) throw new Error(revisionError.message);
  const { error } = await supabaseAdmin.from("standard_sections").update({ title_ar: data.titleAr, body_ar: data.bodyAr, title_en: data.titleEn, body_en: data.bodyEn, translation_status: "approved", translated_at: new Date().toISOString() }).eq("id", data.sectionId);
  if (error) throw new Error(error.message); return { ok: true };
});

export const getAdminData = createServerFn({ method: "GET" }).handler(async () => {
  assertPreviewAdmin(); const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: sections, error: sectionError }, { data: brand, error: brandError }, { data: revisions, error: revisionError }] = await Promise.all([
    supabaseAdmin.from("standard_sections").select("*").order("sort_order"), supabaseAdmin.from("brand_settings").select("*").order("setting_key"), supabaseAdmin.from("content_revisions").select("id,section_id,change_note,created_at").order("created_at", { ascending: false }).limit(20),
  ]);
  if (sectionError || brandError || revisionError) throw new Error(sectionError?.message || brandError?.message || revisionError?.message); return { sections, brand, revisions };
});

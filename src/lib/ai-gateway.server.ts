import { createOpenAI } from "@ai-sdk/openai";

const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export function createLovableResponsesProvider(apiKey: string) {
  let runId: string | undefined;
  let resolveRunId: (value: string | undefined) => void = () => {};
  const runIdReady = new Promise<string | undefined>((resolve) => { resolveRunId = resolve; });
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set(RUN_ID_HEADER, runId);
      const response = await fetch(input, { ...init, headers });
      const next = response.headers.get(RUN_ID_HEADER) ?? undefined;
      if (!runId) { runId = next; resolveRunId(next); }
      return response;
    },
  });
  return { model: provider.responses("openai/gpt-6-astra"), getRunId: () => runId, waitForRunId: () => runId ? Promise.resolve(runId) : runIdReady };
}

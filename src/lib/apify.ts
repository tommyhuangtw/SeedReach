const APIFY_TOKEN = process.env.APIFY_API_TOKEN!;
const APIFY_BASE = "https://api.apify.com/v2";

async function fetchWithRetry(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const maxRetries = 2;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || attempt === maxRetries) return res;
      console.error(`Apify fetch failed (attempt ${attempt}/${maxRetries}): ${res.status}`);
      await new Promise((r) => setTimeout(r, 2000));
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.error(`Apify fetch error (attempt ${attempt}/${maxRetries}):`, error);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("Unreachable");
}

export async function startRun(
  actorId: string,
  input: Record<string, unknown>
): Promise<string> {
  const res = await fetchWithRetry(
    `${APIFY_BASE}/acts/${actorId}/runs?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  if (!res.ok) throw new Error(`Failed to start ${actorId}: ${res.status}`);
  const data = await res.json();
  return data.data.id;
}

export async function waitForRun(
  runId: string,
  maxWaitMs = 600_000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(
      `${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`
    );
    if (!res.ok) throw new Error(`Failed to check run ${runId}: ${res.status}`);
    const data = await res.json();
    const status = data.data.status;
    if (status === "SUCCEEDED") return;
    if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
      throw new Error(`Run ${runId} ended with status: ${status}`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Run ${runId} timed out after ${maxWaitMs / 1000}s`);
}

export async function getDatasetItems(runId: string): Promise<unknown[]> {
  const res = await fetchWithRetry(
    `${APIFY_BASE}/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}`
  );
  if (!res.ok)
    throw new Error(`Failed to get dataset for run ${runId}: ${res.status}`);
  return res.json();
}

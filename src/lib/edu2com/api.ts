// Minimal Edu2com API client used to call the official endpoint
// Based on summerschool implementation but simplified (no retries/upstash)

export interface Edu2comTeamsResponse {
  teams: Array<{
    taskId: string;
    people: Array<{ id: string; skillIds: string[] }>;
    quality?: number;
  }>;
}

export async function callEdu2comTeamFormation(
  payload: unknown,
  opts: { timeoutMs?: number; headers?: Record<string, string> } = {}
): Promise<Edu2comTeamsResponse> {
  const { timeoutMs = 15000, headers = {} } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const endpoint =
      'https://ardid.iiia.csic.es/eduteams/edu2com/v1/teamFormation';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      // If response is not JSON, throw
      throw new Error(text || 'Invalid response from Edu2com');
    }

    if (!res.ok) {
      throw new Error(
        typeof data === 'object' ? JSON.stringify(data) : String(data)
      );
    }

    return data as Edu2comTeamsResponse;
  } finally {
    clearTimeout(timer);
  }
}

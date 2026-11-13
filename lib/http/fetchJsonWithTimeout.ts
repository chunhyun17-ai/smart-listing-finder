// 시간 제한이 있는 요청 도구 (화면에서 서버를 부를 때 쓴다)
// CHECK.md 우선순위 11번 — 서버가 응답하지 않으면 "조회 중…"이 끝없이 보였다.

/** 제한 시간 안에 응답이 오지 않았을 때 던지는 오류 */
export class FetchTimeoutError extends Error {
  constructor(ms: number) {
    super(`${ms}ms 안에 응답이 오지 않았습니다.`);
    this.name = "FetchTimeoutError";
  }
}

export interface FetchJsonResult {
  ok: boolean;
  status: number;
  /** 응답 본문(JSON). JSON이 아니면 null */
  data: unknown;
}

/** 요청을 보내고 JSON 응답까지 읽는다. 제한 시간(밀리초)을 넘기면 FetchTimeoutError를 던진다 */
export async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<FetchJsonResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    // 본문을 읽는 동안에도 제한 시간이 적용되도록 같은 타이머 안에서 읽는다
    let data: unknown = null;
    try {
      data = await response.json();
    } catch (error) {
      if (controller.signal.aborted) throw error;
      data = null;
    }
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    if (controller.signal.aborted) throw new FetchTimeoutError(timeoutMs);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

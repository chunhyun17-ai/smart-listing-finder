// 화면 쪽 시간 제한 테스트
// 지키려는 규칙: 서버가 응답하지 않아도 끝없이 기다리지 않고 제한 시간 뒤에 "조회 실패"로 끝낸다 (CHECK.md 11번)

import { afterEach, describe, expect, it, vi } from "vitest";
import { FetchTimeoutError, fetchJsonWithTimeout } from "@/lib/http/fetchJsonWithTimeout";
import { CLIENT_SEARCH_TIMEOUT_MS, SEARCH_TIMEOUT_MS } from "@/lib/listings/constants";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** 취소(abort) 신호를 받으면 실패하는, 응답하지 않는 가짜 fetch */
function hangingFetch() {
  return vi.fn((_url: string, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    }),
  );
}

describe("시간 제한이 있는 요청", () => {
  it("제한 시간 숫자: 서버 60초, 화면은 서버보다 5초 더 기다린다", () => {
    expect(SEARCH_TIMEOUT_MS).toBe(60_000);
    expect(CLIENT_SEARCH_TIMEOUT_MS).toBe(65_000);
  });

  it("제한 시간 안에 응답하면 JSON을 돌려준다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ total: 3 })));
    const result = await fetchJsonWithTimeout("/api/search", {}, 1000);
    expect(result).toEqual({ ok: true, status: 200, data: { total: 3 } });
  });

  it("오류 응답(400 등)도 상태와 본문을 그대로 돌려준다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: { message: "지역을 선택해 주세요." } }, { status: 400 })),
    );
    const result = await fetchJsonWithTimeout("/api/search", {}, 1000);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.data).toEqual({ error: { message: "지역을 선택해 주세요." } });
  });

  it("JSON이 아닌 응답은 data가 null이다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>오류</html>", { status: 502 })));
    const result = await fetchJsonWithTimeout("/api/search", {}, 1000);
    expect(result).toEqual({ ok: false, status: 502, data: null });
  });

  it("응답이 오지 않으면 제한 시간 뒤에 FetchTimeoutError로 끝난다", async () => {
    vi.stubGlobal("fetch", hangingFetch());
    const started = Date.now();
    await expect(fetchJsonWithTimeout("/api/search", {}, 60)).rejects.toBeInstanceOf(FetchTimeoutError);
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it("연결 자체가 실패하면(네트워크 오류) 시간 초과가 아닌 원래 오류를 그대로 던진다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    const error = await fetchJsonWithTimeout("/api/search", {}, 1000).catch((e) => e);
    expect(error).toBeInstanceOf(TypeError);
    expect(error).not.toBeInstanceOf(FetchTimeoutError);
  });

  it("요청에 취소 신호(signal)를 붙여 보낸다", async () => {
    const fetchMock = vi.fn(async () => Response.json({}));
    vi.stubGlobal("fetch", fetchMock);
    await fetchJsonWithTimeout("/api/search", { method: "POST" }, 1000);
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.method).toBe("POST");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

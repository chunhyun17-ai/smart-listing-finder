// 연락처 API 요청 처리 테스트 (임시 파일에 저장해 실제 저장소까지 함께 확인한다)
// 지키려는 규칙: 다른 사이트가 보낸 저장 요청은 막고, 정상 요청만 저장한다 (보안 점검 위험 4번)

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createContactStore } from "@/lib/contacts/contactStore";
import { createContactsHandlers } from "@/lib/contacts/createContactsHandlers";

/** 테스트마다 새 임시 저장소와 요청 처리기를 만든다 */
function setup() {
  const file = path.join(mkdtempSync(path.join(tmpdir(), "contacts-test-")), "contacts.json");
  const store = createContactStore(file);
  return { store, handlers: createContactsHandlers(store) };
}

const goodBody = { listingId: "s-001", name: "샘플중개사A", phone: "010-0000-0001" };

/** POST 요청을 만든다. 기본은 같은 주소(localhost:3000)에서 보낸 JSON 요청이다 */
function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/contacts", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost:3000",
      origin: "http://localhost:3000",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("연락처 저장 요청 검사 (CSRF 차단)", () => {
  it("같은 주소에서 보낸 JSON 요청은 저장된다 (201)", async () => {
    const { handlers, store } = setup();
    const response = await handlers.POST(post(goodBody));
    expect(response.status).toBe(201);
    expect(await store.list()).toHaveLength(1);
  });

  it("다른 사이트에서 보낸 요청은 403으로 거절하고 저장하지 않는다", async () => {
    const { handlers, store } = setup();
    const response = await handlers.POST(post(goodBody, { origin: "https://evil.example" }));
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error.code).toBe("FORBIDDEN_ORIGIN");
    expect(await store.list()).toHaveLength(0);
  });

  it("같은 컴퓨터의 다른 포트(다른 앱)에서 보낸 요청도 거절한다", async () => {
    const { handlers } = setup();
    const response = await handlers.POST(post(goodBody, { origin: "http://localhost:4000" }));
    expect(response.status).toBe(403);
  });

  it("Origin이 'null'(알 수 없음)이면 거절한다", async () => {
    const { handlers } = setup();
    const response = await handlers.POST(post(goodBody, { origin: "null" }));
    expect(response.status).toBe(403);
  });

  it("브라우저가 '다른 사이트'라고 표시한 요청(Sec-Fetch-Site)은 거절한다", async () => {
    const { handlers } = setup();
    const response = await handlers.POST(post(goodBody, { "sec-fetch-site": "cross-site" }));
    expect(response.status).toBe(403);
  });

  it("JSON이 아닌 형식(text/plain)은 415로 거절하고 저장하지 않는다", async () => {
    const { handlers, store } = setup();
    const response = await handlers.POST(
      post(JSON.stringify(goodBody), { "content-type": "text/plain" }),
    );
    expect(response.status).toBe(415);
    expect(await store.list()).toHaveLength(0);
  });

  it("Content-Type 뒤에 charset이 붙어도 JSON이면 받는다", async () => {
    const { handlers } = setup();
    const response = await handlers.POST(
      post(goodBody, { "content-type": "application/json; charset=utf-8" }),
    );
    expect(response.status).toBe(201);
  });

  it("Origin이 없는 요청(브라우저가 아닌 도구)은 받는다", async () => {
    const { handlers } = setup();
    const request = new Request("http://localhost:3000/api/contacts", {
      method: "POST",
      headers: { "content-type": "application/json", host: "localhost:3000" },
      body: JSON.stringify(goodBody),
    });
    expect((await handlers.POST(request)).status).toBe(201);
  });

  it("입력이 잘못되면 400, 깨진 JSON이면 400이다", async () => {
    const { handlers } = setup();
    expect((await handlers.POST(post({ ...goodBody, name: "  " }))).status).toBe(400);
    expect((await handlers.POST(post("{not json"))).status).toBe(400);
  });
});

describe("연락처 목록·덮어쓰기", () => {
  it("저장한 연락처를 목록에서 다시 불러온다", async () => {
    const { handlers } = setup();
    await handlers.POST(post(goodBody));
    const data = await (await handlers.GET()).json();
    expect(data.total).toBe(1);
    expect(data.contacts[0].phone).toBe("010-0000-0001");
  });

  it("같은 매물을 다시 저장하면 새로 만들지 않고 고쳐 쓴다", async () => {
    const { handlers } = setup();
    await handlers.POST(post(goodBody));
    await handlers.POST(post({ ...goodBody, phone: "010-0000-9999" }));
    const data = await (await handlers.GET()).json();
    expect(data.total).toBe(1);
    expect(data.contacts[0].phone).toBe("010-0000-9999");
  });
});

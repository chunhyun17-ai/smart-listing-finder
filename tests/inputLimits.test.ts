// 입력 크기·개수 제한 테스트
// 지키려는 규칙: 요청 본문은 10KB, 연락처는 상한, 매물 번호·지역·형태 글자는 50자까지만 받는다 (보안 점검 위험 5번)

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ContactLimitError, MAX_CONTACTS, createContactStore } from "@/lib/contacts/contactStore";
import { createContactsHandlers } from "@/lib/contacts/createContactsHandlers";
import { validateContactInput } from "@/lib/contacts/validateContactInput";
import { MAX_BODY_BYTES, readJsonBody } from "@/lib/http/readJsonBody";
import { createSearchHandler } from "@/lib/listings/createSearchHandler";
import { searchListings } from "@/lib/listings/searchListings";
import { validateSearchCondition } from "@/lib/listings/validateSearchCondition";

const tempFile = () =>
  path.join(mkdtempSync(path.join(tmpdir(), "limits-test-")), "contacts.json");

function jsonPost(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/x", {
    method: "POST",
    headers: { "content-type": "application/json", host: "localhost:3000", ...headers },
    body,
  });
}

describe("요청 본문 크기 제한", () => {
  it("제한은 10KB다", () => {
    expect(MAX_BODY_BYTES).toBe(10 * 1024);
  });

  it("작은 JSON은 읽는다", async () => {
    const result = await readJsonBody(jsonPost(JSON.stringify({ a: 1 })));
    expect(result).toEqual({ ok: true, value: { a: 1 } });
  });

  it("제한과 같은 크기까지는 읽는다", async () => {
    const body = JSON.stringify({ x: "a".repeat(100 - 8) }); // 정확히 100바이트
    expect(new TextEncoder().encode(body).length).toBe(100);
    expect((await readJsonBody(jsonPost(body), 100)).ok).toBe(true);
    expect((await readJsonBody(jsonPost(body + " "), 100)).ok).toBe(false);
  });

  it("제한을 넘으면 413으로 거절한다", async () => {
    const big = JSON.stringify({ x: "a".repeat(MAX_BODY_BYTES) });
    const result = await readJsonBody(jsonPost(big));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(413);
      expect((await result.response.json()).error.code).toBe("PAYLOAD_TOO_LARGE");
    }
  });

  it("미리 알려 준 크기(Content-Length)가 제한을 넘으면 읽기 전에 거절한다", async () => {
    const result = await readJsonBody(jsonPost("{}", { "content-length": String(MAX_BODY_BYTES + 1) }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(413);
  });

  it("깨진 JSON은 400이다", async () => {
    const result = await readJsonBody(jsonPost("{not json"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(400);
  });

  it("연락처 API와 검색 API 모두 큰 요청을 413으로 거절한다", async () => {
    const big = JSON.stringify({ name: "a".repeat(MAX_BODY_BYTES) });
    const contacts = createContactsHandlers(createContactStore(tempFile()));
    expect((await contacts.POST(jsonPost(big, { origin: "http://localhost:3000" }))).status).toBe(413);

    const search = createSearchHandler({ search: searchListings, timeoutMs: 1000 });
    expect((await search(jsonPost(big))).status).toBe(413);
  });
});

describe("연락처 개수 상한", () => {
  it("기본 상한은 500개다", () => {
    expect(MAX_CONTACTS).toBe(500);
  });

  it("상한에 도달하면 새 연락처는 저장하지 않고 409로 알린다", async () => {
    const store = createContactStore(tempFile(), { maxContacts: 3 });
    for (const id of ["a", "b", "c"]) {
      await store.add({ listingId: id, name: "N", phone: "010-0000-0001" });
    }
    await expect(store.add({ listingId: "d", name: "N", phone: "010-0000-0001" })).rejects.toBeInstanceOf(ContactLimitError);

    const handlers = createContactsHandlers(store);
    const response = await handlers.POST(
      jsonPost(JSON.stringify({ listingId: "e", name: "N", phone: "010-0000-0002" }), {
        origin: "http://localhost:3000",
      }),
    );
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("CONTACT_LIMIT");
    expect(await store.list()).toHaveLength(3);
  });

  it("상한에 도달해도 이미 있는 매물의 연락처는 고쳐 쓸 수 있다", async () => {
    const store = createContactStore(tempFile(), { maxContacts: 2 });
    await store.add({ listingId: "a", name: "N", phone: "010-0000-0001" });
    await store.add({ listingId: "b", name: "N", phone: "010-0000-0001" });
    const updated = await store.add({ listingId: "a", name: "새 이름", phone: "010-0000-0009" });
    expect(updated.name).toBe("새 이름");
    expect(await store.list()).toHaveLength(2);
  });
});

describe("매물 번호·지역·형태 길이 제한", () => {
  const base = { name: "N", phone: "010-0000-0001" };

  it("정상 매물 번호는 통과한다", () => {
    for (const id of ["s-001", "abc_123", "A".repeat(50)]) {
      expect(validateContactInput({ ...base, listingId: id }).ok).toBe(true);
    }
  });

  it("51자 이상이거나 이상한 글자가 들어 있으면 거절한다", () => {
    for (const id of ["A".repeat(51), "../etc/passwd", "a b", "<script>", "가나다"]) {
      expect(validateContactInput({ ...base, listingId: id }).ok).toBe(false);
    }
  });

  it("지역·부동산 형태가 51자 이상이면 거절한다", () => {
    const ok = { priceMin: 0, priceMax: 1, region: "서울", propertyType: "아파트" };
    expect(validateSearchCondition(ok).ok).toBe(true);
    expect(validateSearchCondition({ ...ok, region: "가".repeat(51) }).ok).toBe(false);
    expect(validateSearchCondition({ ...ok, propertyType: "가".repeat(51) }).ok).toBe(false);
    expect(validateSearchCondition({ ...ok, region: "가".repeat(50) }).ok).toBe(true);
  });
});

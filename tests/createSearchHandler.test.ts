// 매물 조회 요청 처리 테스트
// 지키려는 규칙 (PRD 5번 must 1):
//  - 선택한 금액 범위를 벗어난 매물은 절대 보여주지 않는다
//  - 조회가 제한 시간 안에 끝나지 않으면 임의로 채우지 않고 "조회 실패"로 알린다
//  - 모든 결과에 조회 시각을 함께 보여준다

import { describe, expect, it } from "vitest";
import { createSearchHandler } from "@/lib/listings/createSearchHandler";
import { searchListings } from "@/lib/listings/searchListings";
import type { Listing } from "@/types/listing";
import { makeListing } from "./helpers";

const 억 = 100_000_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 검색 요청을 만든다 */
function request(body: unknown, raw?: string) {
  return new Request("http://localhost/api/search", {
    method: "POST",
    body: raw ?? JSON.stringify(body),
  });
}

const validCondition = {
  priceMin: 0,
  priceMax: 20 * 억,
  region: "서울 서초구",
  propertyType: "아파트",
};

describe("매물 조회 요청 처리", () => {
  it("정상 요청: 200과 매물·판정·조회 시각·건수를 돌려준다", async () => {
    const handler = createSearchHandler({ search: searchListings, timeoutMs: 5000 });
    const response = await handler(request(validCondition));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total).toBe(10);
    expect(data.listings).toHaveLength(10);
    expect(data.suspicions).toHaveLength(10);
    expect(typeof data.fetchedAt).toBe("string");
    expect(data.listings.every((l: Listing) => typeof l.fetchedAt === "string")).toBe(true);
  });

  it("금액 범위 밖 매물은 결과에 하나도 없다 (20억 초과 2건 제외, 정확히 20억은 포함)", async () => {
    const handler = createSearchHandler({ search: searchListings, timeoutMs: 5000 });
    const data = await (await handler(request(validCondition))).json();
    const ids = data.listings.map((l: Listing) => l.id);

    expect(data.listings.every((l: Listing) => l.price <= 20 * 억)).toBe(true);
    expect(ids).not.toContain("s-010");
    expect(ids).not.toContain("s-011");
    expect(ids).toContain("s-012");
  });

  it("조회 함수가 알려 준 매물이 범위 밖이어도 걸러낸다 (조회 방식과 상관없이 항상 적용)", async () => {
    const handler = createSearchHandler({
      search: async () => [
        makeListing({ id: "in", price: 10 * 억 }),
        makeListing({ id: "out", price: 30 * 억 }),
      ],
      timeoutMs: 5000,
    });
    const data = await (await handler(request(validCondition))).json();
    expect(data.listings.map((l: Listing) => l.id)).toEqual(["in"]);
  });

  it("의심 매물도 목록에서 빠지지 않고 함께 돌아온다", async () => {
    const handler = createSearchHandler({ search: searchListings, timeoutMs: 5000 });
    const data = await (await handler(request(validCondition))).json();
    const ids = data.listings.map((l: Listing) => l.id);
    expect(ids).toEqual(expect.arrayContaining(["s-005", "s-008", "s-009"]));
  });

  it("조회가 제한 시간을 넘기면 504 '조회 실패'이고, 매물을 채워 넣지 않는다", async () => {
    const handler = createSearchHandler({
      search: async () => {
        await sleep(1000);
        return [makeListing({ id: "late" })];
      },
      timeoutMs: 50,
    });
    const started = Date.now();
    const response = await handler(request(validCondition));
    const data = await response.json();

    expect(response.status).toBe(504);
    expect(data.error.code).toBe("SEARCH_TIMEOUT");
    expect(data.error.message).toContain("조회 실패");
    expect(data.listings).toBeUndefined();
    expect(Date.now() - started).toBeLessThan(800); // 느린 조회를 끝까지 기다리지 않는다
  });

  it("제한 시간 안에 끝나면 정상 응답한다", async () => {
    const handler = createSearchHandler({
      search: async () => {
        await sleep(20);
        return [makeListing({ id: "ok", price: 10 * 억 })];
      },
      timeoutMs: 1000,
    });
    const response = await handler(request(validCondition));
    expect(response.status).toBe(200);
  });

  it("조회 중 오류가 나면 500 '조회 실패'이고, 매물을 채워 넣지 않는다", async () => {
    const handler = createSearchHandler({
      search: async () => {
        throw new Error("boom");
      },
      timeoutMs: 1000,
    });
    const response = await handler(request(validCondition));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe("SEARCH_FAILED");
    expect(data.error.message).toContain("조회 실패");
    expect(data.listings).toBeUndefined();
  });

  it("결과가 5건 미만이면 가격 비교를 하지 않았다고 알리고(priceRuleSkipped), 5건 이상이면 알리지 않는다", async () => {
    const handler = createSearchHandler({ search: searchListings, timeoutMs: 5000 });
    // 서초구 아파트 20억 이하: 10건 → 가격 비교 함
    const many = await (await handler(request(validCondition))).json();
    expect(many.priceRuleSkipped).toBe(false);
    // 마포구 빌라: 1건 → 가격 비교 못 함
    const few = await (
      await handler(request({ ...validCondition, region: "서울 마포구", propertyType: "빌라" }))
    ).json();
    expect(few.total).toBe(1);
    expect(few.priceRuleSkipped).toBe(true);
  });

  it("결과가 0건이면 가격 비교 생략 안내는 하지 않는다", async () => {
    const handler = createSearchHandler({ search: searchListings, timeoutMs: 5000 });
    const none = await (
      await handler(request({ ...validCondition, region: "부산 해운대구" }))
    ).json();
    expect(none.total).toBe(0);
    expect(none.priceRuleSkipped).toBe(false);
  });

  it("조건에 맞는 매물이 없으면 실패가 아니라 0건으로 응답한다", async () => {
    const handler = createSearchHandler({ search: searchListings, timeoutMs: 5000 });
    const response = await handler(
      request({ ...validCondition, region: "부산 해운대구" }),
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.total).toBe(0);
  });

  it("입력이 잘못되면 400으로 거절한다 (지역 누락, 금액 뒤바뀜, 글자 금액, 깨진 JSON)", async () => {
    const handler = createSearchHandler({ search: searchListings, timeoutMs: 5000 });
    const bad = [
      request({ priceMin: 0, priceMax: 20 * 억, propertyType: "아파트" }),
      request({ ...validCondition, priceMin: 5, priceMax: 1 }),
      request({ ...validCondition, priceMin: "0", priceMax: "9" }),
      request(null, "{not json"),
    ];
    for (const req of bad) {
      const response = await handler(req);
      expect(response.status).toBe(400);
    }
  });
});

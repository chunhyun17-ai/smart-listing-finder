// 가격 의심 규칙 테스트
// 지키려는 규칙: 같은 검색 결과의 ㎡당 가격 중간값보다 훨씬 낮은 매물을 의심으로 표시하고,
//              확신할 수 없으면 "확인 필요"로 표시하며, 이유를 적는다 (PRD 5번 must 2)

import { describe, expect, it } from "vitest";
import { filterByPrice } from "@/lib/listings/filterByPrice";
import { sampleListings } from "@/lib/listings/sampleListings";
import {
  MIN_LISTINGS_FOR_PRICE_RULE,
  PRICE_CHECK_DROP,
  PRICE_SUSPECT_DROP,
  findLowPriceSuspicions,
} from "@/lib/suspicion/priceRule";
import { makeListing, makeNormalListings } from "./helpers";

const 억 = 100_000_000;

/** 기준이 되는 일반 매물 4건(각 20억, 100㎡)에 한 건을 더한 목록 */
function withOne(price: number, area = 100) {
  return [...makeNormalListings(4), makeListing({ id: "target", price, area })];
}

describe("가격 의심 규칙", () => {
  it("기준 숫자: 30% 이상 의심, 15% 이상 확인 필요, 5건 미만은 판정 안 함", () => {
    expect(PRICE_SUSPECT_DROP).toBe(0.3);
    expect(PRICE_CHECK_DROP).toBe(0.15);
    expect(MIN_LISTINGS_FOR_PRICE_RULE).toBe(5);
  });

  it("중간값보다 40% 낮으면 '의심'", () => {
    const result = findLowPriceSuspicions(withOne(12 * 억));
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ listingId: "target", status: "suspect" });
  });

  it("정확히 30% 낮으면 '의심' (경계 포함)", () => {
    const [r] = findLowPriceSuspicions(withOne(14 * 억));
    expect(r.status).toBe("suspect");
  });

  it("정확히 15% 낮으면 '확인 필요' (경계 포함)", () => {
    const [r] = findLowPriceSuspicions(withOne(17 * 억));
    expect(r.status).toBe("check");
  });

  it("14%만 낮으면 판정하지 않는다", () => {
    expect(findLowPriceSuspicions(withOne(17.2 * 억))).toEqual([]);
  });

  it("중간값보다 비싼 매물은 판정하지 않는다", () => {
    expect(findLowPriceSuspicions(withOne(30 * 억))).toEqual([]);
  });

  it("면적이 다른 작은 집은 총가격이 싸도 ㎡당 가격이 정상이면 의심하지 않는다", () => {
    // 40㎡·8억 → ㎡당 2,000만 원으로 나머지(100㎡·20억)와 같다
    expect(findLowPriceSuspicions(withOne(8 * 억, 40))).toEqual([]);
  });

  it("비교할 매물이 5건 미만이면 판정하지 않는다", () => {
    const four = [...makeNormalListings(3), makeListing({ id: "low", price: 1 * 억 })];
    expect(four).toHaveLength(4);
    expect(findLowPriceSuspicions(four)).toEqual([]);
  });

  it("빈 목록은 빈 결과를 돌려준다", () => {
    expect(findLowPriceSuspicions([])).toEqual([]);
  });

  it("면적이 0이거나 가격이 이상한 매물은 비교에서 빼고, 오류 없이 처리한다", () => {
    const listings = [
      ...makeNormalListings(5),
      makeListing({ id: "bad-area", area: 0 }),
      makeListing({ id: "bad-price", price: Number.NaN }),
      makeListing({ id: "negative", price: -1 }),
    ];
    expect(findLowPriceSuspicions(listings)).toEqual([]);
  });

  it("모든 판정에는 중간값과 낮은 비율이 들어간 이유가 있다", () => {
    const [r] = findLowPriceSuspicions(withOne(12 * 억));
    expect(r.reasons).toHaveLength(1);
    expect(r.reasons[0]).toContain("중간값");
    expect(r.reasons[0]).toContain("40%");
  });

  it("샘플 데이터(서초구 아파트, 20억 이하): s-008은 '의심', s-009는 '확인 필요', 나머지는 없음", () => {
    const searchResult = filterByPrice(
      sampleListings.filter((l) => l.region === "서울 서초구" && l.propertyType === "아파트"),
      0,
      20 * 억,
    );
    const result = findLowPriceSuspicions(searchResult);
    expect(result.map((r) => [r.listingId, r.status])).toEqual([
      ["s-008", "suspect"],
      ["s-009", "check"],
    ]);
  });
});

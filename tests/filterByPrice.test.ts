// 금액 범위 걸러내기 테스트
// 지키려는 규칙: 사용자가 선택한 금액 범위를 벗어나는 매물은 절대 보여주지 않는다 (PRD 5번 must 1)

import { describe, expect, it } from "vitest";
import { filterByPrice } from "@/lib/listings/filterByPrice";
import { sampleListings } from "@/lib/listings/sampleListings";
import { makeListing } from "./helpers";

const 억 = 100_000_000;

describe("금액 범위 걸러내기", () => {
  it("범위 안의 매물만 남긴다", () => {
    const listings = [
      makeListing({ id: "a", price: 5 * 억 }),
      makeListing({ id: "b", price: 15 * 억 }),
      makeListing({ id: "c", price: 25 * 억 }),
    ];
    const result = filterByPrice(listings, 0, 20 * 억);
    expect(result.map((l) => l.id)).toEqual(["a", "b"]);
  });

  it("최대 금액과 정확히 같은 매물은 포함한다 (20억 이하)", () => {
    const result = filterByPrice([makeListing({ id: "edge", price: 20 * 억 })], 0, 20 * 억);
    expect(result).toHaveLength(1);
  });

  it("최대 금액보다 1원이라도 비싸면 뺀다", () => {
    const result = filterByPrice([makeListing({ id: "over", price: 20 * 억 + 1 })], 0, 20 * 억);
    expect(result).toHaveLength(0);
  });

  it("최소 금액과 정확히 같은 매물은 포함하고, 1원 모자라면 뺀다", () => {
    const listings = [
      makeListing({ id: "equal", price: 10 * 억 }),
      makeListing({ id: "under", price: 10 * 억 - 1 }),
    ];
    const result = filterByPrice(listings, 10 * 억, 20 * 억);
    expect(result.map((l) => l.id)).toEqual(["equal"]);
  });

  it("가격이 숫자가 아닌 매물은 범위를 확인할 수 없으므로 뺀다", () => {
    const listings = [
      makeListing({ id: "nan", price: Number.NaN }),
      makeListing({ id: "inf", price: Number.POSITIVE_INFINITY }),
    ];
    expect(filterByPrice(listings, 0, 20 * 억)).toHaveLength(0);
  });

  it("빈 목록은 빈 목록을 돌려준다", () => {
    expect(filterByPrice([], 0, 20 * 억)).toEqual([]);
  });

  it("샘플 데이터: 20억 초과 2건은 빠지고, 정확히 20억인 1건은 남는다", () => {
    const result = filterByPrice(sampleListings, 0, 20 * 억);
    const ids = result.map((l) => l.id);
    expect(ids).not.toContain("s-010"); // 23.5억
    expect(ids).not.toContain("s-011"); // 28억
    expect(ids).toContain("s-012"); // 정확히 20억
  });

  it("결과에는 범위 밖 매물이 하나도 없다 (여러 범위로 확인)", () => {
    const ranges: Array<[number, number]> = [
      [0, 20 * 억],
      [0, 19 * 억],
      [10 * 억, 20 * 억],
      [21 * 억, 30 * 억],
    ];
    for (const [min, max] of ranges) {
      const outside = filterByPrice(sampleListings, min, max).filter(
        (l) => l.price < min || l.price > max,
      );
      expect(outside).toEqual([]);
    }
  });
});

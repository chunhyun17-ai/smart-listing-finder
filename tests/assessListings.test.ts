// 의심 판정 합치기 테스트
// 지키려는 규칙: 상태는 가장 심한 쪽을 따르고 이유는 모두 모은다. 의심 매물도 숨기지 않는다 (PRD 5번 must 2)

import { describe, expect, it } from "vitest";
import { sampleListings } from "@/lib/listings/sampleListings";
import { filterByPrice } from "@/lib/listings/filterByPrice";
import { assessListings } from "@/lib/suspicion/assessListings";
import { makeListing, makeNormalListings } from "./helpers";

const 억 = 100_000_000;

describe("의심 판정 합치기", () => {
  it("빈 목록은 빈 결과를 돌려준다", () => {
    expect(assessListings([])).toEqual([]);
  });

  it("매물마다 판정이 하나씩 있고, 입력과 같은 순서다", () => {
    const listings = makeNormalListings(6);
    const result = assessListings(listings);
    expect(result.map((r) => r.listingId)).toEqual(listings.map((l) => l.id));
  });

  it("문제없는 매물은 '이상 없음'이고 이유가 없다", () => {
    const result = assessListings(makeNormalListings(6));
    expect(result.every((r) => r.status === "normal" && r.reasons.length === 0)).toBe(true);
  });

  it("두 규칙에 모두 걸리면 더 심한 상태를 따르고 이유를 모두 모은다", () => {
    // x1: 중복만(확인 필요), x2: 중복(확인 필요) + 가격 40% 낮음(의심)
    const listings = [
      ...makeNormalListings(4),
      makeListing({ id: "x1", address: "같은주소", area: 100, floor: 1 }),
      makeListing({ id: "x2", address: "같은주소", area: 100, floor: 1, price: 12 * 억 }),
    ];
    const byId = Object.fromEntries(assessListings(listings).map((r) => [r.listingId, r]));

    expect(byId["x1"].status).toBe("check");
    expect(byId["x1"].reasons).toHaveLength(1);
    expect(byId["x2"].status).toBe("suspect");
    expect(byId["x2"].reasons).toHaveLength(2);
  });

  it("의심·확인 필요에는 이유가 있고, 이상 없음에는 이유가 없다", () => {
    const result = assessListings(sampleListings);
    for (const r of result) {
      expect(r.status === "normal").toBe(r.reasons.length === 0);
    }
  });

  it("의심 매물도 판정 목록에서 빠지지 않는다 (숨기지 않는다)", () => {
    const result = assessListings(sampleListings);
    expect(result).toHaveLength(sampleListings.length);
  });

  it("샘플 데이터(서초구 아파트, 20억 이하) 전체 판정", () => {
    const searchResult = filterByPrice(
      sampleListings.filter((l) => l.region === "서울 서초구" && l.propertyType === "아파트"),
      0,
      20 * 억,
    );
    const status = Object.fromEntries(
      assessListings(searchResult).map((r) => [r.listingId, r.status]),
    );
    expect(status).toEqual({
      "s-001": "normal",
      "s-002": "normal",
      "s-003": "normal",
      "s-004": "normal",
      "s-005": "suspect", // 같은 주소 3건
      "s-006": "suspect",
      "s-007": "suspect",
      "s-008": "suspect", // 가격 약 41% 낮음
      "s-009": "check", // 가격 약 16% 낮음
      "s-012": "normal",
    });
  });
});

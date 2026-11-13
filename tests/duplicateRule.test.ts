// 중복 등록 의심 규칙 테스트
// 지키려는 규칙: 같은 주소·면적·층 매물이 여러 건이면 건수에 따라 "확인 필요"/"의심"으로 나누고,
//              판정에는 반드시 이유를 적는다 (PRD 5번 must 2)

import { describe, expect, it } from "vitest";
import {
  DUPLICATE_CHECK_THRESHOLD,
  DUPLICATE_SUSPECT_THRESHOLD,
  findDuplicateSuspicions,
} from "@/lib/suspicion/duplicateRule";
import { sampleListings } from "@/lib/listings/sampleListings";
import { makeListing } from "./helpers";

/** 같은 주소·면적·층의 매물을 count건 만든다 (등록자는 모두 다르다) */
function sameAddress(count: number, address = "서울 A동 1") {
  return Array.from({ length: count }, (_, i) =>
    makeListing({ id: `d-${i + 1}`, address, area: 84.9, floor: 3 }),
  );
}

describe("중복 등록 의심 규칙", () => {
  it("기준 숫자: 2건부터 확인 필요, 3건부터 의심", () => {
    expect(DUPLICATE_CHECK_THRESHOLD).toBe(2);
    expect(DUPLICATE_SUSPECT_THRESHOLD).toBe(3);
  });

  it("1건뿐이면 판정하지 않는다", () => {
    expect(findDuplicateSuspicions(sameAddress(1))).toEqual([]);
  });

  it("빈 목록은 빈 결과를 돌려준다", () => {
    expect(findDuplicateSuspicions([])).toEqual([]);
  });

  it("2건이면 둘 다 '확인 필요' (공동중개일 수 있어 단정하지 않는다)", () => {
    const result = findDuplicateSuspicions(sameAddress(2));
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.status === "check")).toBe(true);
  });

  it("3건 이상이면 모두 '의심'", () => {
    for (const count of [3, 4, 6]) {
      const result = findDuplicateSuspicions(sameAddress(count));
      expect(result).toHaveLength(count);
      expect(result.every((r) => r.status === "suspect")).toBe(true);
    }
  });

  it("띄어쓰기만 다른 주소는 같은 주소로 본다", () => {
    const listings = [
      makeListing({ id: "a", address: "서울  A동   1", area: 84.9, floor: 3 }),
      makeListing({ id: "b", address: " 서울 A동 1 ", area: 84.9, floor: 3 }),
    ];
    expect(findDuplicateSuspicions(listings)).toHaveLength(2);
  });

  it("면적이나 층이 다르면 다른 매물이다", () => {
    const diffArea = [
      makeListing({ id: "a", address: "같은주소", area: 84.9, floor: 3 }),
      makeListing({ id: "b", address: "같은주소", area: 59, floor: 3 }),
    ];
    const diffFloor = [
      makeListing({ id: "a", address: "같은주소", area: 84.9, floor: 3 }),
      makeListing({ id: "b", address: "같은주소", area: 84.9, floor: 4 }),
    ];
    expect(findDuplicateSuspicions(diffArea)).toEqual([]);
    expect(findDuplicateSuspicions(diffFloor)).toEqual([]);
  });

  it("모든 판정에는 이유가 1개 이상 있고, 등록자 이름이 들어 있다", () => {
    const result = findDuplicateSuspicions(sameAddress(3));
    for (const r of result) {
      expect(r.reasons.length).toBeGreaterThanOrEqual(1);
      expect(r.reasons[0]).toContain("중복 등록");
      expect(r.reasons[0]).toContain("중개사-d-1");
    }
  });

  it("'확인 필요' 이유에는 직접 확인하라는 안내가 있다", () => {
    const [first] = findDuplicateSuspicions(sameAddress(2));
    expect(first.reasons[0]).toContain("직접 확인");
  });

  it("샘플 데이터: s-005·006·007만 '의심'이고 다른 매물은 포함되지 않는다", () => {
    const result = findDuplicateSuspicions(sampleListings);
    expect(result.map((r) => r.listingId).sort()).toEqual(["s-005", "s-006", "s-007"]);
    expect(result.every((r) => r.status === "suspect")).toBe(true);
  });
});

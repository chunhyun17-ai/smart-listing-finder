// 판정 요약·알짜 매물 걸러내기 테스트
// 지키려는 규칙: 알짜 매물 = '이상 없음'만. 판정이 없으면 알짜로 보지 않는다. 기본 목록은 숨기지 않는다 (PRD 4·5번)

import { describe, expect, it } from "vitest";
import { assessListings } from "@/lib/suspicion/assessListings";
import { filterByPrice } from "@/lib/listings/filterByPrice";
import { sampleListings } from "@/lib/listings/sampleListings";
import { filterCleanListings, summarizeSuspicions } from "@/lib/suspicion/summarize";
import type { SuspicionResult } from "@/types/suspicion";
import { makeListing } from "./helpers";

const 억 = 100_000_000;

const result = (listingId: string, status: SuspicionResult["status"]): SuspicionResult => ({
  listingId,
  status,
  reasons: status === "normal" ? [] : ["이유"],
});

describe("판정 요약", () => {
  it("빈 목록은 모두 0이다", () => {
    expect(summarizeSuspicions([])).toEqual({ total: 0, normal: 0, check: 0, suspect: 0 });
  });

  it("상태별로 센다", () => {
    const summary = summarizeSuspicions([
      result("a", "normal"),
      result("b", "normal"),
      result("c", "check"),
      result("d", "suspect"),
      result("e", "suspect"),
      result("f", "suspect"),
    ]);
    expect(summary).toEqual({ total: 6, normal: 2, check: 1, suspect: 3 });
  });

  it("전체는 세 상태의 합과 같다", () => {
    const s = summarizeSuspicions([result("a", "check"), result("b", "normal"), result("c", "suspect")]);
    expect(s.total).toBe(s.normal + s.check + s.suspect);
  });

  it("샘플 데이터(서초구 아파트, 20억 이하): 알짜 5, 확인 필요 1, 의심 4", () => {
    const searchResult = filterByPrice(
      sampleListings.filter((l) => l.region === "서울 서초구" && l.propertyType === "아파트"),
      0,
      20 * 억,
    );
    const summary = summarizeSuspicions(assessListings(searchResult));
    expect(summary).toEqual({ total: 10, normal: 5, check: 1, suspect: 4 });
  });
});

describe("알짜 매물만 보기", () => {
  const listings = ["a", "b", "c", "d"].map((id) => makeListing({ id }));

  it("'이상 없음'인 매물만 남기고 순서를 지킨다", () => {
    const suspicions = [
      result("a", "normal"),
      result("b", "suspect"),
      result("c", "normal"),
      result("d", "check"),
    ];
    expect(filterCleanListings(listings, suspicions).map((l) => l.id)).toEqual(["a", "c"]);
  });

  it("판정이 없는 매물은 알짜로 보지 않고 뺀다", () => {
    const suspicions = [result("a", "normal")];
    expect(filterCleanListings(listings, suspicions).map((l) => l.id)).toEqual(["a"]);
  });

  it("모두 의심이면 빈 목록이다", () => {
    const suspicions = listings.map((l) => result(l.id, "suspect"));
    expect(filterCleanListings(listings, suspicions)).toEqual([]);
  });

  it("빈 목록은 빈 목록이다", () => {
    expect(filterCleanListings([], [])).toEqual([]);
  });

  it("원래 목록을 바꾸지 않는다", () => {
    const copy = [...listings];
    filterCleanListings(listings, listings.map((l) => result(l.id, "suspect")));
    expect(listings).toEqual(copy);
  });

  it("샘플 데이터: 알짜 5건은 s-001~004와 s-012다", () => {
    const searchResult = filterByPrice(
      sampleListings.filter((l) => l.region === "서울 서초구" && l.propertyType === "아파트"),
      0,
      20 * 억,
    );
    const clean = filterCleanListings(searchResult, assessListings(searchResult));
    expect(clean.map((l) => l.id)).toEqual(["s-001", "s-002", "s-003", "s-004", "s-012"]);
  });
});

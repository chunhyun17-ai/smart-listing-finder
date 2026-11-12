// 매물 조회: 조건에 맞는 매물을 가져온다
// Design Ref: DESIGN.md §3 "lib/listings/ — 매물 가져오기 (샘플 / 네이버 연계)"
// 지금은 샘플 데이터로만 동작한다. 네이버 부동산에는 접속하지 않는다.
// (조회 방식 결정: docs/naver-terms-check.md — A. 샘플 데이터 우선)
//
// 아직 하지 않는 것 (뒤 작업에서 추가):
// - 금액 범위로 걸러내기 (PLAN 7번)
// - 1분 안에 결과가 없으면 "조회 실패" (PLAN 6번)

import type { Listing, SearchCondition } from "@/types/listing";
import { sampleListings } from "./sampleListings";

/** 지역·부동산 형태 조건에 맞는 매물을 돌려준다. 조회 시각은 지금 시각으로 찍는다 */
export async function searchListings(
  condition: SearchCondition,
): Promise<Listing[]> {
  const fetchedAt = new Date().toISOString();

  return sampleListings
    .filter(
      (listing) =>
        listing.region === condition.region &&
        listing.propertyType === condition.propertyType,
    )
    .map((listing) => ({ ...listing, fetchedAt }));
}

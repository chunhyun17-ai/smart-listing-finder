// 금액 범위 걸러내기
// Design Ref: DESIGN.md §2 "걸러내기 — 선택한 금액 범위 밖 매물을 뺀다"
// Plan SC: 사용자가 선택한 금액 범위를 벗어나는 매물은 절대 보여주지 않는다
//
// 조회 방식(샘플/네이버)과 상관없이 항상 적용되도록 조회 뒤 단계로 따로 둔다.

import type { Listing } from "@/types/listing";

/**
 * 가격이 priceMin 이상 priceMax 이하인 매물만 남긴다.
 * 양 끝 금액은 포함한다. ("20억 이하"에서 정확히 20억 원인 매물은 보여준다)
 * 가격이 숫자가 아니거나 유한하지 않은 매물은 범위를 확인할 수 없으므로 뺀다.
 */
export function filterByPrice(
  listings: Listing[],
  priceMin: number,
  priceMax: number,
): Listing[] {
  return listings.filter(
    (listing) =>
      Number.isFinite(listing.price) &&
      listing.price >= priceMin &&
      listing.price <= priceMax,
  );
}

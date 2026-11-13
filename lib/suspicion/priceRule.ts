// 허위매물 의심 규칙 ②: 같은 검색 결과보다 가격이 훨씬 낮음
// Design Ref: DESIGN.md §2 "판정 ② — 가격을 같은 검색 결과의 중간값과 비교한다"
// Plan SC: 시세 기준은 같은 검색 결과 안 매물들의 가격 중간값으로 한다.
//          의심 매물에는 반드시 이유를 적고, 확신할 수 없으면 "확인 필요"로 표시한다.
//
// 비교는 총가격이 아니라 면적당 가격(㎡당)으로 한다.
//   이유: 면적이 다른 매물이 섞이면 작은 집이 총가격만으로는 항상 싸 보여서 잘못 의심되기 때문이다.
// 결과가 너무 적으면 중간값을 믿을 수 없으므로 판정하지 않는다.
// 아래 기준 숫자는 제안값이다. 확정되면 이 상수만 고치면 된다.

import type { Listing } from "@/types/listing";
import type { SuspicionResult } from "@/types/suspicion";

/** 중간값보다 이 비율 이상 낮으면 "의심" (0.3 = 30%) */
export const PRICE_SUSPECT_DROP = 0.3;

/** 중간값보다 이 비율 이상 낮으면 "확인 필요" (0.15 = 15%) */
export const PRICE_CHECK_DROP = 0.15;

/** 비교할 매물이 이보다 적으면 중간값을 믿을 수 없어 판정하지 않는다 */
export const MIN_LISTINGS_FOR_PRICE_RULE = 5;

/** 면적당 가격(원/㎡). 계산할 수 없으면 null */
function pricePerArea(listing: Listing): number | null {
  if (!Number.isFinite(listing.price) || listing.price <= 0) return null;
  if (!Number.isFinite(listing.area) || listing.area <= 0) return null;
  return listing.price / listing.area;
}

/** 숫자 목록의 중간값. 짝수 개이면 가운데 두 값의 평균 */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** ㎡당 가격을 "1,296만 원" 모양으로 보여준다 */
function formatPerArea(won: number): string {
  return `${Math.round(won / 10_000).toLocaleString("ko-KR")}만 원`;
}

/**
 * 같은 검색 결과의 중간값보다 가격이 훨씬 낮은 매물의 판정 결과를 돌려준다.
 * 해당하지 않는 매물은 결과에 포함하지 않는다. (이상 없음은 뒤에서 합칠 때 채운다)
 */
export function findLowPriceSuspicions(listings: Listing[]): SuspicionResult[] {
  // 면적당 가격을 계산할 수 있는 매물만 비교 대상으로 삼는다
  const priced = listings
    .map((listing) => ({ listing, perArea: pricePerArea(listing) }))
    .filter(
      (item): item is { listing: Listing; perArea: number } =>
        item.perArea !== null,
    );

  if (priced.length < MIN_LISTINGS_FOR_PRICE_RULE) return [];

  const medianPerArea = median(priced.map((item) => item.perArea));

  const results: SuspicionResult[] = [];
  for (const { listing, perArea } of priced) {
    const drop = (medianPerArea - perArea) / medianPerArea;
    if (drop < PRICE_CHECK_DROP) continue;

    const status = drop >= PRICE_SUSPECT_DROP ? "suspect" : "check";
    const percent = Math.round(drop * 100);
    const detail = `같은 검색 결과의 중간값(㎡당 ${formatPerArea(medianPerArea)})보다 약 ${percent}% 낮습니다. (이 매물 ㎡당 ${formatPerArea(perArea)})`;
    const reason =
      status === "suspect"
        ? `가격 의심: ${detail}`
        : `가격 확인 필요: ${detail}`;

    results.push({ listingId: listing.id, status, reasons: [reason] });
  }
  return results;
}

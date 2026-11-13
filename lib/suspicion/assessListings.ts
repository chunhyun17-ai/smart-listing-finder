// 허위매물 의심 판정 합치기
// Design Ref: DESIGN.md §2 "판정 ①②③" — 규칙들의 결과를 합쳐 매물마다 하나의 판정으로 만든다
// Plan SC: 의심 매물은 숨기지 않고 함께 보여준다. 의심·확인 필요에는 반드시 이유를 적는다.
//          최종 판단은 사용자가 하며, 여기서는 표시할 판정만 만든다.
//
// 합치는 방식: 상태는 가장 심한 쪽을 따르고(의심 > 확인 필요 > 이상 없음), 이유는 모두 모은다.

import type { Listing } from "@/types/listing";
import type { SuspicionResult, SuspicionStatus } from "@/types/suspicion";
import { findDuplicateSuspicions } from "./duplicateRule";
import { findLowPriceSuspicions } from "./priceRule";

/** 상태의 심한 정도 (숫자가 클수록 심함) */
const SEVERITY: Record<SuspicionStatus, number> = {
  normal: 0,
  check: 1,
  suspect: 2,
};

/** 매물 목록 전체에 대한 판정을 돌려준다. 입력과 같은 순서이고, 매물마다 하나씩 있다 */
export function assessListings(listings: Listing[]): SuspicionResult[] {
  // 규칙별 결과를 매물 번호로 모은다
  const found = new Map<string, SuspicionResult[]>();
  for (const result of [
    ...findDuplicateSuspicions(listings),
    ...findLowPriceSuspicions(listings),
  ]) {
    const list = found.get(result.listingId);
    if (list) {
      list.push(result);
    } else {
      found.set(result.listingId, [result]);
    }
  }

  return listings.map((listing): SuspicionResult => {
    const results = found.get(listing.id);
    if (!results) {
      return { listingId: listing.id, status: "normal", reasons: [] };
    }
    const status = results.reduce<SuspicionStatus>(
      (worst, result) =>
        SEVERITY[result.status] > SEVERITY[worst] ? result.status : worst,
      "normal",
    );
    return {
      listingId: listing.id,
      status,
      reasons: results.flatMap((result) => result.reasons),
    };
  });
}

// 판정 결과 요약과 "알짜 매물만 보기" 걸러내기
// Design Ref: PRD 4번 "알짜 매물 = 허위매물 의심이 없는 매물", PRD 5번 "의심 매물은 숨기지 않고 함께 보여준다"
//
// 기본 화면은 모든 매물을 보여준다. 여기서 만드는 걸러내기는 사용자가 직접 체크했을 때만 쓴다.

import type { Listing } from "@/types/listing";
import type { SuspicionResult } from "@/types/suspicion";

/** 판정별 건수 */
export interface SuspicionSummary {
  /** 전체 판정 수 */
  total: number;
  /** 이상 없음 (알짜 매물) */
  normal: number;
  /** 확인 필요 */
  check: number;
  /** 의심 */
  suspect: number;
}

/** 판정 결과를 상태별로 센다 */
export function summarizeSuspicions(
  suspicions: SuspicionResult[],
): SuspicionSummary {
  const summary: SuspicionSummary = { total: 0, normal: 0, check: 0, suspect: 0 };
  for (const suspicion of suspicions) {
    summary.total += 1;
    summary[suspicion.status] += 1;
  }
  return summary;
}

/**
 * '이상 없음'으로 판정된 매물(알짜 매물)만 남긴다. 입력과 같은 순서를 지킨다.
 * 판정이 없는 매물은 확인되지 않은 것이므로 알짜로 보지 않고 뺀다.
 */
export function filterCleanListings(
  listings: Listing[],
  suspicions: SuspicionResult[],
): Listing[] {
  const cleanIds = new Set(
    suspicions.filter((s) => s.status === "normal").map((s) => s.listingId),
  );
  return listings.filter((listing) => cleanIds.has(listing.id));
}

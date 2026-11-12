// 허위매물 의심 규칙 ①: 중복 등록
// Design Ref: DESIGN.md §2 "판정 ① — 같은 주소·면적·층이 여러 건이면 의심, 이유를 적는다"
// Plan SC: 의심 매물에는 반드시 이유를 적는다. 확신할 수 없으면 "허위"라고 단정하지 않고 "확인 필요"로 표시한다.
//
// 같은 주소·면적·층의 매물이 여러 건 올라와 있으면 중복 등록을 의심한다.
// 다만 여러 중개사가 한 매물을 함께 올리는 일(공동중개)은 정상일 수 있어서,
// 건수가 적을 때는 단정하지 않고 "확인 필요"로만 표시한다.
// 아래 기준 숫자는 제안값이다. 확정되면 이 상수만 고치면 된다.

import type { Listing } from "@/types/listing";
import type { SuspicionResult } from "@/types/suspicion";

/** 이 건수 이상이면 "확인 필요" (공동중개일 수 있음) */
export const DUPLICATE_CHECK_THRESHOLD = 2;

/** 이 건수 이상이면 "의심" */
export const DUPLICATE_SUSPECT_THRESHOLD = 3;

/** 주소의 띄어쓰기 차이로 다른 매물처럼 보이지 않게 정리한다 */
function normalizeAddress(address: string): string {
  return address.replace(/\s+/g, " ").trim();
}

/** 같은 매물인지 가르는 열쇠: 주소 + 면적 + 층 */
function duplicateKey(listing: Listing): string {
  return `${normalizeAddress(listing.address)}|${listing.area}|${listing.floor}`;
}

/**
 * 중복 등록이 의심되는 매물의 판정 결과를 돌려준다.
 * 중복이 아닌 매물은 결과에 포함하지 않는다. (이상 없음은 뒤에서 합칠 때 채운다)
 */
export function findDuplicateSuspicions(listings: Listing[]): SuspicionResult[] {
  // 열쇠가 같은 매물끼리 묶는다
  const groups = new Map<string, Listing[]>();
  for (const listing of listings) {
    const key = duplicateKey(listing);
    const group = groups.get(key);
    if (group) {
      group.push(listing);
    } else {
      groups.set(key, [listing]);
    }
  }

  const results: SuspicionResult[] = [];
  for (const group of groups.values()) {
    if (group.length < DUPLICATE_CHECK_THRESHOLD) continue;

    const status =
      group.length >= DUPLICATE_SUSPECT_THRESHOLD ? "suspect" : "check";
    const registrants = group.map((item) => item.registrantName).join(", ");
    const reason =
      status === "suspect"
        ? `중복 등록 의심: 같은 주소·면적·층의 매물이 ${group.length}건 올라와 있습니다. (등록: ${registrants})`
        : `중복 등록 확인 필요: 같은 주소·면적·층의 매물이 ${group.length}건 있습니다. 공동중개일 수 있으니 직접 확인해 주세요. (등록: ${registrants})`;

    for (const listing of group) {
      results.push({ listingId: listing.id, status, reasons: [reason] });
    }
  }
  return results;
}

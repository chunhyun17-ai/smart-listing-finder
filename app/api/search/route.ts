// 매물 조회 서버 코드(API): POST /api/search
// Design Ref: DESIGN.md §2 "서버 코드(API) 두 개" — 조건을 받아 매물을 돌려준다
// 지금은 샘플 데이터로 동작한다. (판정 결과는 PLAN 10~12번에서 추가)
// 처리 과정은 lib/listings/createSearchHandler.ts에 있다.

import {
  createSearchHandler,
  SEARCH_TIMEOUT_MS,
} from "@/lib/listings/createSearchHandler";
import { searchListings } from "@/lib/listings/searchListings";

export const POST = createSearchHandler({
  search: searchListings,
  timeoutMs: SEARCH_TIMEOUT_MS,
});

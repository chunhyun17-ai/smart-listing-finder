// 매물 조회 요청을 처리하는 함수를 만들어 주는 곳
// Design Ref: DESIGN.md §2 "입력 → 처리 → 출력"
// 조회 방식과 제한 시간을 바깥에서 끼워 넣을 수 있게 분리해 두었다.
// (느린 응답을 흉내 내어 "조회 실패"를 확인하기 위해)
// Plan SC: 1분 안에 결과가 없으면 임의로 채우지 않고 "조회 실패"로 알린다

import type { Listing, SearchCondition } from "@/types/listing";
import { assessListings } from "../suspicion/assessListings";
import { filterByPrice } from "./filterByPrice";
import { validateSearchCondition } from "./validateSearchCondition";
import { SearchTimeoutError, withTimeout } from "./withTimeout";

/** 조회 제한 시간: 60초 */
export const SEARCH_TIMEOUT_MS = 60_000;

/** 화면에 보여줄 조회 실패 안내 문구 */
const SEARCH_FAILED_MESSAGE = "조회 실패: 매물을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.";

interface SearchHandlerOptions {
  /** 매물을 가져오는 함수 */
  search: (condition: SearchCondition) => Promise<Listing[]>;
  /** 제한 시간(밀리초) */
  timeoutMs: number;
}

/** 오류 응답을 만든다. 형식: { error: { code, message } } */
function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

/** POST 요청을 처리하는 함수를 만든다 */
export function createSearchHandler({ search, timeoutMs }: SearchHandlerOptions) {
  return async function handle(request: Request): Promise<Response> {
    // 1) 요청 내용(JSON)을 읽는다
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, "INVALID_JSON", "요청 형식이 올바르지 않습니다.");
    }

    // 2) 입력값을 검사한다
    const validation = validateSearchCondition(body);
    if (!validation.ok) {
      return errorResponse(400, "INVALID_INPUT", validation.message);
    }

    // 3) 제한 시간 안에 매물을 조회한다. 실패하면 임의로 채우지 않고 "조회 실패"로 알린다
    try {
      const fetched = await withTimeout(search(validation.value), timeoutMs);
      // 선택한 금액 범위를 벗어난 매물은 여기서 뺀다
      const { priceMin, priceMax } = validation.value;
      const listings = filterByPrice(fetched, priceMin, priceMax);
      // 허위매물 의심 판정을 붙인다. 의심 매물도 목록에서 빼지 않고 함께 돌려준다
      const suspicions = assessListings(listings);
      return Response.json({
        listings,
        suspicions,
        fetchedAt: new Date().toISOString(),
        total: listings.length,
      });
    } catch (error) {
      if (error instanceof SearchTimeoutError) {
        return errorResponse(504, "SEARCH_TIMEOUT", SEARCH_FAILED_MESSAGE);
      }
      return errorResponse(500, "SEARCH_FAILED", SEARCH_FAILED_MESSAGE);
    }
  };
}

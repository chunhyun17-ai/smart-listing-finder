// 매물 조회 서버 코드(API): POST /api/search
// Design Ref: DESIGN.md §2 "서버 코드(API) 두 개" — 조건을 받아 매물을 돌려준다
// 지금은 샘플 데이터로 동작한다. (판정 결과는 PLAN 10~12번에서 추가)

import { searchListings } from "@/lib/listings/searchListings";
import { validateSearchCondition } from "@/lib/listings/validateSearchCondition";

/** 오류 응답을 만든다. 형식: { error: { code, message } } */
function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
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

  // 3) 매물을 조회해 돌려준다
  const listings = await searchListings(validation.value);
  return Response.json({
    listings,
    fetchedAt: new Date().toISOString(),
    total: listings.length,
  });
}

// 요청 검사: 다른 사이트가 몰래 보낸 저장 요청(CSRF)을 막는다
// 보안 점검 위험 4번 — POST가 요청이 어느 사이트에서 왔는지(Origin)와 형식(Content-Type)을 확인하지 않았다.
//
// 브라우저는 다른 사이트에서 보내는 요청에 항상 Origin(출처)을 붙이고, 사전 확인 없이 보낼 수 있는
// 형식(text/plain 등)은 정해져 있다. 그래서 JSON 형식만 받고 출처가 내 주소와 같을 때만 통과시키면
// 다른 사이트가 보낸 요청은 막힌다. (Origin이 없는 요청은 브라우저가 아닌 도구(curl, 테스트)이므로 허용한다)

/** JSON을 보내는 POST 요청이 안전한지 검사한다. 문제가 있으면 거절 응답을, 괜찮으면 null을 돌려준다 */
export function guardJsonPost(request: Request): Response | null {
  // 1) 형식: JSON만 받는다
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return Response.json(
      {
        error: {
          code: "UNSUPPORTED_MEDIA_TYPE",
          message: "JSON 형식(Content-Type: application/json)으로 보내 주세요.",
        },
      },
      { status: 415 },
    );
  }

  // 2) 출처: 요청이 내 주소에서 왔을 때만 받는다
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const host = request.headers.get("host") ?? new URL(request.url).host;

  let sameOrigin = true;
  if (origin !== null) {
    try {
      sameOrigin = new URL(origin).host === host;
    } catch {
      sameOrigin = false; // Origin이 "null" 등 알 수 없는 값
    }
  }
  if (fetchSite === "cross-site") sameOrigin = false;

  if (!sameOrigin) {
    return Response.json(
      {
        error: {
          code: "FORBIDDEN_ORIGIN",
          message: "다른 사이트에서 보낸 요청은 받을 수 없습니다.",
        },
      },
      { status: 403 },
    );
  }

  return null;
}

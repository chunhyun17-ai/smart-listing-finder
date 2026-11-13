// 요청 본문(JSON)을 크기 제한을 두고 읽는다
// 보안 점검 위험 5번 — 요청 본문 크기 제한이 없어 아주 큰 요청으로 서버를 괴롭힐 수 있었다.
//
// 크기가 제한을 넘으면 끝까지 읽지 않고 중간에 멈춘다.

/** 요청 본문 최대 크기: 10KB (이 앱의 요청은 모두 몇백 바이트다) */
export const MAX_BODY_BYTES = 10 * 1024;

export type ReadJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; response: Response };

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status });
}

const tooLarge = () =>
  errorResponse(413, "PAYLOAD_TOO_LARGE", "요청이 너무 큽니다.");

/** JSON 본문을 읽는다. 너무 크거나 JSON이 아니면 거절 응답을 함께 돌려준다 */
export async function readJsonBody(
  request: Request,
  maxBytes: number = MAX_BODY_BYTES,
): Promise<ReadJsonResult> {
  // 1) 미리 알려 준 크기가 제한을 넘으면 읽지 않고 거절한다
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, response: tooLarge() };
  }

  // 2) 실제로 읽으면서 크기를 센다. 제한을 넘는 순간 멈춘다
  const chunks: Uint8Array[] = [];
  let received = 0;
  if (request.body) {
    const reader = request.body.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > maxBytes) {
          await reader.cancel();
          return { ok: false, response: tooLarge() };
        }
        chunks.push(value);
      }
    } catch {
      return {
        ok: false,
        response: errorResponse(400, "INVALID_JSON", "요청 형식이 올바르지 않습니다."),
      };
    }
  }

  // 3) JSON으로 해석한다
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return {
      ok: false,
      response: errorResponse(400, "INVALID_JSON", "요청 형식이 올바르지 않습니다."),
    };
  }
}

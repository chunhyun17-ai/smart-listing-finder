// 원본 링크 주소 검사
// 보안 점검 위험 10번 — '원본 보기' 링크를 검사 없이 그대로 썼다. 지금은 고정된 예시 주소뿐이라 위험이 없지만,
// 실제 데이터를 붙이면 javascript: 같은 이상한 주소가 들어올 수 있다.

/**
 * 안전한 https 주소만 돌려준다. 그 밖의 것(javascript:, data:, http:, 주소가 아닌 글자 등)은 null.
 * 주소에 아이디·비밀번호가 끼어 있는 것(https://사이트@가짜주소)도 속이는 데 쓰이므로 거절한다.
 */
export function toSafeHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username !== "" || url.password !== "") return null;
  return url.href;
}

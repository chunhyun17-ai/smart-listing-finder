// 모든 응답에 붙이는 보안 헤더
// 보안 점검 위험 9번 — 보안 헤더(CSP, 화면 끼워넣기 방지, nosniff, Referrer-Policy)가 하나도 없었다.
//
// 이 첫 화면은 미리 만들어 두는(정적) 페이지라 요청마다 달라지는 nonce 방식의 엄격한 CSP를 쓸 수 없다.
// 그래서 같은 사이트의 스크립트만 허용하되, Next.js가 넣는 인라인 스크립트는 허용하는 현실적인 CSP를 쓴다.
// (참고: node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md)

export interface HeaderItem {
  key: string;
  value: string;
}

/** 개발 서버(핫 리로드)가 막히지 않도록 CSP는 배포·운영(production)에서만 붙인다 */
export function buildCsp(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/** 응답 헤더 목록을 만든다 */
export function getSecurityHeaders(isProduction: boolean): HeaderItem[] {
  const headers: HeaderItem[] = [
    // 브라우저가 파일 종류를 멋대로 추측해 스크립트로 실행하는 것을 막는다
    { key: "X-Content-Type-Options", value: "nosniff" },
    // 다른 사이트가 이 화면을 몰래 끼워 넣어(클릭재킹) 속이는 것을 막는다
    { key: "X-Frame-Options", value: "DENY" },
    // 다른 사이트로 이동할 때 주소의 자세한 내용을 넘기지 않는다
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // 이 앱이 쓰지 않는 기기 기능(카메라, 마이크, 위치)을 끈다
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ];
  if (isProduction) {
    headers.push({ key: "Content-Security-Policy", value: buildCsp() });
  }
  return headers;
}

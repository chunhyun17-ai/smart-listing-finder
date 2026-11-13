// 보안 헤더 목록 테스트 (실제 응답은 운영 서버를 띄워 따로 확인한다)

import { describe, expect, it } from "vitest";
import { buildCsp, getSecurityHeaders } from "@/lib/security/securityHeaders";

const value = (headers: ReturnType<typeof getSecurityHeaders>, key: string) =>
  headers.find((h) => h.key === key)?.value;

describe("보안 헤더", () => {
  it("개발 중에도 기본 보안 헤더 4개는 붙는다", () => {
    const headers = getSecurityHeaders(false);
    expect(value(headers, "X-Content-Type-Options")).toBe("nosniff");
    expect(value(headers, "X-Frame-Options")).toBe("DENY");
    expect(value(headers, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(value(headers, "Permissions-Policy")).toContain("camera=()");
  });

  it("CSP는 개발 서버가 막히지 않도록 운영에서만 붙는다", () => {
    expect(value(getSecurityHeaders(false), "Content-Security-Policy")).toBeUndefined();
    expect(value(getSecurityHeaders(true), "Content-Security-Policy")).toBe(buildCsp());
  });

  it("CSP: 같은 사이트만 허용하고 화면 끼워넣기·플러그인·다른 사이트로의 양식 전송을 막는다", () => {
    const csp = buildCsp();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("connect-src 'self'");
  });

  it("CSP에 모든 곳을 허용하는 '*'나 eval 허용이 들어 있지 않다", () => {
    const csp = buildCsp();
    expect(csp).not.toMatch(/(^|[\s;])\*(\s|;|$)/);
    expect(csp).not.toContain("unsafe-eval");
  });
});

// 원본 링크 검사 테스트: https 주소만 링크로 쓴다 (보안 점검 위험 10번)

import { describe, expect, it } from "vitest";
import { sampleListings } from "@/lib/listings/sampleListings";
import { toSafeHttpsUrl } from "@/lib/listings/safeUrl";

describe("원본 링크 검사", () => {
  it("정상 https 주소는 통과한다", () => {
    expect(toSafeHttpsUrl("https://example.com/sample/s-001")).toBe("https://example.com/sample/s-001");
    expect(toSafeHttpsUrl("  https://land.example.com/a?b=1#c  ")).toBe("https://land.example.com/a?b=1#c");
  });

  it("대문자 HTTPS도 https로 인정한다", () => {
    expect(toSafeHttpsUrl("HTTPS://example.com/x")).toBe("https://example.com/x");
  });

  it.each([
    ["javascript:alert(1)"],
    ["JaVaScRiPt:alert(1)"],
    [" javascript:alert(1)"],
    ["data:text/html,<script>alert(1)</script>"],
    ["vbscript:msgbox(1)"],
    ["file:///C:/Windows/win.ini"],
    ["http://example.com/insecure"],
    ["ftp://example.com/x"],
  ])("위험하거나 https가 아닌 주소는 거절한다: %s", (value) => {
    expect(toSafeHttpsUrl(value)).toBeNull();
  });

  it("주소가 아닌 값은 거절한다", () => {
    for (const value of ["", "   ", "example.com", "/상대/경로", "not a url", undefined, null, 123, {}]) {
      expect(toSafeHttpsUrl(value)).toBeNull();
    }
  });

  it("아이디·비밀번호가 끼어 있는 속임수 주소는 거절한다", () => {
    expect(toSafeHttpsUrl("https://google.com@evil.example/")).toBeNull();
    expect(toSafeHttpsUrl("https://user:pass@example.com/")).toBeNull();
  });

  it("샘플 매물의 원본 링크는 모두 통과한다 (화면에서 링크가 사라지지 않는다)", () => {
    for (const listing of sampleListings) {
      expect(toSafeHttpsUrl(listing.sourceUrl)).not.toBeNull();
    }
  });
});

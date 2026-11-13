// 가격 표기 테스트: 가격(원)을 읽기 쉬운 글자로 바꾼다

import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/format/formatPrice";

describe("가격 표기", () => {
  it.each([
    [1_850_000_000, "18억 5,000만 원"],
    [2_000_000_000, "20억 원"],
    [950_000_000, "9억 5,000만 원"],
    [50_000_000, "5,000만 원"],
    [1_000_012_345, "10억 1만 원"],
    [0, "0원"],
  ])("%d원 → %s", (won, expected) => {
    expect(formatPrice(won)).toBe(expected);
  });

  it("음수나 숫자가 아닌 값은 '가격 정보 없음'", () => {
    expect(formatPrice(-5)).toBe("가격 정보 없음");
    expect(formatPrice(Number.NaN)).toBe("가격 정보 없음");
  });
});

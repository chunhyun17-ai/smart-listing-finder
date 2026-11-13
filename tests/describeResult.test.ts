// 결과 안내 문구 테스트: 0건이어도 조회 시각을 보여준다 (PRD 5번 "모든 결과에 조회 시각")

import { describe, expect, it } from "vitest";
import { describeResult } from "@/lib/format/describeResult";

const at = "2026-11-13T11:10:14+09:00";

describe("결과 안내 문구", () => {
  it("결과가 있으면 조회 시각과 건수를 보여준다", () => {
    const text = describeResult(10, at);
    expect(text).toContain("조회 시각:");
    expect(text).toContain("(10건)");
    expect(text).not.toContain("없습니다");
  });

  it("0건이어도 조회 시각을 함께 보여주고 매물이 없다고 알린다", () => {
    const text = describeResult(0, at);
    expect(text).toContain("조회 시각:");
    expect(text).toContain("(0건)");
    expect(text).toContain("조건에 맞는 매물이 없습니다.");
  });

  it("1건도 정상 표시한다", () => {
    expect(describeResult(1, at)).toContain("(1건)");
  });
});

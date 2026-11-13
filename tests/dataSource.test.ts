// 데이터 출처 안내 테스트: 샘플 데이터일 때만 안내를 보여준다

import { describe, expect, it } from "vitest";
import { DATA_SOURCE, getDataSourceNotice } from "@/lib/listings/dataSource";
import { sampleListings } from "@/lib/listings/sampleListings";

describe("데이터 출처 안내", () => {
  it("지금은 샘플 데이터 출처다 (샘플 매물만 쓰고 있다)", () => {
    expect(DATA_SOURCE).toBe("sample");
    expect(sampleListings.length).toBeGreaterThan(0);
  });

  it("샘플이면 '지어낸 것'이고 '실제 매물이 아니다'라고 알린다", () => {
    const notice = getDataSourceNotice("sample");
    expect(notice).toContain("샘플");
    expect(notice).toContain("지어낸");
    expect(notice).toContain("실제 매물이 아닙니다");
  });

  it("실제 데이터(live)면 안내를 보여주지 않는다", () => {
    expect(getDataSourceNotice("live")).toBeNull();
  });
});

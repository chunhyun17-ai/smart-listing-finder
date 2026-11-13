// 지금 앱이 보여주는 매물이 어디서 온 것인지
// CHECK.md 우선순위 26번 — 지어낸 샘플 매물이 실제 조회처럼 조회 시각과 함께 보였다.
//
// 네이버 부동산 연계(PLAN 5번)를 붙이면 이 값을 "live"로 바꾸면 안내가 사라진다.

export type DataSource = "sample" | "live";

/** 현재 매물의 출처: 지금은 지어낸 샘플 데이터다 (docs/naver-terms-check.md의 결정 A) */
export const DATA_SOURCE: DataSource = "sample";

/** 화면에 보여줄 안내 문구. 샘플이 아니면 null (안내를 보여주지 않는다) */
export function getDataSourceNotice(source: DataSource): string | null {
  return source === "sample"
    ? "연습용 샘플 데이터예요. 아래 매물·주소·중개사·전화번호는 모두 지어낸 것이고, 네이버 부동산의 실제 매물이 아닙니다."
    : null;
}

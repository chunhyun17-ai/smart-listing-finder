// 검색 결과 한 줄 안내 문구
// Plan SC: 모든 결과에 조회 시각을 함께 표시한다. (결과가 0건이어도 언제 조회했는지 보여준다)

/** 예: "조회 시각: 2026. 11. 13. 오전 11:10:14 (10건)" / 0건이면 뒤에 "— 조건에 맞는 매물이 없습니다."를 붙인다 */
export function describeResult(total: number, fetchedAt: string): string {
  const time = new Date(fetchedAt).toLocaleString("ko-KR");
  return total === 0
    ? `조회 시각: ${time} (0건) — 조건에 맞는 매물이 없습니다.`
    : `조회 시각: ${time} (${total}건)`;
}

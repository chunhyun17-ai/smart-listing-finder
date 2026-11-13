// 허위매물 의심 판정 결과의 데이터 모양
// Design Ref: DESIGN.md §2 "데이터 모양" — 판정 결과
// Plan SC: 확신할 수 없으면 "허위"라고 단정하지 않고 "확인 필요"로 표시한다

/** 판정 상태: 이상 없음 / 확인 필요(확신할 수 없음) / 의심 */
export type SuspicionStatus = "normal" | "check" | "suspect";

/** 판정 결과 한 건 */
export interface SuspicionResult {
  /** 어느 매물에 대한 판정인지 (매물 번호) */
  listingId: string;
  /** 판정 상태 */
  status: SuspicionStatus;
  /** 의심·확인 필요의 이유 목록. 상태가 normal이 아니면 반드시 1개 이상 */
  reasons: string[];
}

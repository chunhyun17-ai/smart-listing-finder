// 연락처의 데이터 모양
// Design Ref: DESIGN.md §2 "데이터 모양" — 연락처
// 주의: 전화번호는 개인정보다. 본인 확인 목적으로만 쓰고 외부 공유·GitHub 업로드를 하지 않는다.

/** 저장한 연락처 한 건 */
export interface Contact {
  /** 연락처 번호 */
  id: string;
  /** 어느 매물의 연락처인지 (매물 번호) */
  listingId: string;
  /** 이름 (등록자 또는 중개사) */
  name: string;
  /** 전화번호 */
  phone: string;
  /** 저장한 시각 (ISO 형식 문자열) */
  savedAt: string;
}

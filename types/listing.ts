// 매물과 검색 조건의 데이터 모양
// Design Ref: DESIGN.md §2 "데이터 모양" — 매물

/** 검색 조건: 사용자가 검색 화면에서 입력하는 값 */
export interface SearchCondition {
  /** 최소 금액(원). 제한이 없으면 0 */
  priceMin: number;
  /** 최대 금액(원). 이 금액을 넘는 매물은 절대 보여주지 않는다 */
  priceMax: number;
  /** 지역 (선택지의 범위는 구현 전에 정한다) */
  region: string;
  /** 부동산 형태: 아파트, 빌라, 오피스텔 등 (선택지는 구현 전에 정한다) */
  propertyType: string;
}

/** 매물 한 건 */
export interface Listing {
  /** 매물 번호 */
  id: string;
  /** 매물 제목 */
  title: string;
  /** 가격(원) */
  price: number;
  /** 주소 */
  address: string;
  /** 지역 */
  region: string;
  /** 부동산 형태 */
  propertyType: string;
  /** 면적(㎡) */
  area: number;
  /** 층 */
  floor: number;
  /** 등록자·중개사 이름 */
  registrantName: string;
  /** 원본 링크 */
  sourceUrl: string;
  /** 조회 시각 (ISO 형식 문자열, 예: 2026-11-12T14:30:00+09:00) */
  fetchedAt: string;
}

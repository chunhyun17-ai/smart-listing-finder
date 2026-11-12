// 검색 화면의 선택지 (지역, 부동산 형태)
// Design Ref: DESIGN.md §5 "결정이 남은 것 3번 — 지역·부동산 형태 선택지의 범위"
//
// 임시 안: 아직 선택지 범위가 정해지지 않아서, 샘플 데이터에 있는 값만 넣었다.
// 범위가 정해지면 이 파일만 고치면 화면에 반영된다.

/** 지역 선택지 */
export const REGION_OPTIONS = ["서울 서초구", "서울 마포구"] as const;

/** 부동산 형태 선택지 */
export const PROPERTY_TYPE_OPTIONS = ["아파트", "빌라", "오피스텔"] as const;

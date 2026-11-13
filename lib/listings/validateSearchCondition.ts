// 검색 조건 입력값 검사
// Design Ref: DESIGN.md §2 "입력 → 처리 → 출력" — 입력: 세 조건이 모두 있어야 검색한다
// (입력 검사 도구 Zod는 아직 승인 전이라, 직접 만든 간단한 검사를 쓴다)

import type { SearchCondition } from "@/types/listing";

/** 검사 결과: 통과하면 정리된 조건, 실패하면 이유 */
export type ValidationResult =
  | { ok: true; value: SearchCondition }
  | { ok: false; message: string };

/** 값이 0 이상의 유한한 숫자인지 확인한다 */
function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/** 값이 비어 있지 않은 글자인지 확인한다 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** 요청으로 받은 값(무엇이 들어올지 모름)을 검사해 SearchCondition으로 바꾼다 */
export function validateSearchCondition(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, message: "검색 조건이 올바르지 않습니다." };
  }

  const { priceMin, priceMax, region, propertyType } = input as Record<
    string,
    unknown
  >;

  if (!isNonNegativeNumber(priceMin) || !isNonNegativeNumber(priceMax)) {
    return { ok: false, message: "금액 범위를 0 이상의 숫자로 입력해 주세요." };
  }
  if (priceMin > priceMax) {
    return { ok: false, message: "최소 금액이 최대 금액보다 클 수 없습니다." };
  }
  if (!isNonEmptyString(region)) {
    return { ok: false, message: "지역을 선택해 주세요." };
  }
  if (!isNonEmptyString(propertyType)) {
    return { ok: false, message: "부동산 형태를 선택해 주세요." };
  }

  return {
    ok: true,
    value: {
      priceMin,
      priceMax,
      region: region.trim(),
      propertyType: propertyType.trim(),
    },
  };
}

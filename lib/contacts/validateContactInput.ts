// 연락처 입력값 검사
// Design Ref: DESIGN.md §2 "연락처 저장 → 입력값 검사"

/** 검사를 통과한 연락처 입력 */
export interface ContactInput {
  listingId: string;
  name: string;
  phone: string;
}

export type ContactValidationResult =
  | { ok: true; value: ContactInput }
  | { ok: false; message: string };

/** 이름 최대 길이 */
const MAX_NAME_LENGTH = 50;

/** 전화번호에 쓸 수 있는 글자: 숫자, +, -, 공백, 괄호 */
const PHONE_PATTERN = /^[0-9+\-\s()]+$/;

/** 전화번호 숫자 개수의 범위 */
const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;

export function validateContactInput(input: unknown): ContactValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, message: "연락처 정보가 올바르지 않습니다." };
  }
  const { listingId, name, phone } = input as Record<string, unknown>;

  if (typeof listingId !== "string" || listingId.trim() === "") {
    return { ok: false, message: "어느 매물의 연락처인지 알 수 없습니다." };
  }
  if (typeof name !== "string" || name.trim() === "") {
    return { ok: false, message: "이름을 입력해 주세요." };
  }
  if (name.trim().length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      message: `이름은 ${MAX_NAME_LENGTH}자 이하로 입력해 주세요.`,
    };
  }
  if (typeof phone !== "string" || !PHONE_PATTERN.test(phone.trim())) {
    return {
      ok: false,
      message: "전화번호는 숫자, +, -, 괄호만 사용해 입력해 주세요.",
    };
  }
  const digitCount = phone.replace(/\D/g, "").length;
  if (digitCount < MIN_PHONE_DIGITS || digitCount > MAX_PHONE_DIGITS) {
    return { ok: false, message: "전화번호 자릿수가 올바르지 않습니다." };
  }

  return {
    ok: true,
    value: {
      listingId: listingId.trim(),
      name: name.trim(),
      phone: phone.trim(),
    },
  };
}

// 제한 시간 안에 끝나지 않으면 실패로 처리하는 도구
// Design Ref: DESIGN.md §2 "가져오기 — 60초 안에 결과가 없으면 '조회 실패'"

/** 제한 시간을 넘겼을 때 던지는 오류 */
export class SearchTimeoutError extends Error {
  constructor(ms: number) {
    super(`조회가 ${ms}ms 안에 끝나지 않았습니다.`);
    this.name = "SearchTimeoutError";
  }
}

/** 작업이 ms(밀리초) 안에 끝나면 그 결과를, 아니면 SearchTimeoutError를 돌려준다 */
export function withTimeout<T>(task: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new SearchTimeoutError(ms)), ms);
  });

  // 어느 쪽이 먼저 끝나든 타이머를 정리한다
  return Promise.race([task, timeout]).finally(() => clearTimeout(timer));
}

// 조회 관련 숫자 모음 (서버와 화면이 함께 쓴다)
// Plan SC: 조회가 1분 안에 나오지 않으면 임의로 채우지 않고 "조회 실패"로 알린다

/** 서버가 조회를 기다리는 최대 시간: 60초 */
export const SEARCH_TIMEOUT_MS = 60_000;

/** 화면이 서버 응답을 기다리는 최대 시간. 서버의 "조회 실패" 응답이 먼저 도착하도록 5초 더 준다 */
export const CLIENT_SEARCH_TIMEOUT_MS = SEARCH_TIMEOUT_MS + 5_000;

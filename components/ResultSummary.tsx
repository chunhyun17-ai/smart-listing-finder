// 검색 결과 요약: 알짜 / 확인 필요 / 의심 건수와 "알짜 매물만 보기" 체크칸
// Design Ref: PRD 4번 흐름 "알짜 매물 목록 확인", PRD 5번 "의심 매물은 숨기지 않는다"
// 기본은 모든 매물을 보여주고, 사용자가 직접 체크했을 때만 알짜 매물만 보여준다.
// 숨긴 건수는 항상 알려 준다. 색만으로 구분하지 않도록 글자도 함께 보여준다.

import { MIN_LISTINGS_FOR_PRICE_RULE } from "@/lib/suspicion/priceRule";
import type { SuspicionSummary } from "@/lib/suspicion/summarize";

interface ResultSummaryProps {
  summary: SuspicionSummary;
  /** 결과가 적어 가격 비교를 하지 못했는지 */
  priceRuleSkipped: boolean;
  /** "알짜 매물만 보기"가 켜져 있는지 */
  onlyClean: boolean;
  onToggle: (next: boolean) => void;
}

export default function ResultSummary({
  summary,
  priceRuleSkipped,
  onlyClean,
  onToggle,
}: ResultSummaryProps) {
  const hidden = summary.check + summary.suspect;

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <ul
        aria-label="검색 결과 요약"
        className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-zinc-900 dark:text-zinc-100"
      >
        <li>
          <span aria-hidden="true">✅ </span>알짜 {summary.normal}건
        </li>
        <li>
          <span aria-hidden="true">⚠️ </span>확인 필요 {summary.check}건
        </li>
        <li>
          <span aria-hidden="true">🚫 </span>의심 {summary.suspect}건
        </li>
      </ul>

      {priceRuleSkipped && (
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          ℹ️ 비교할 매물이 {MIN_LISTINGS_FOR_PRICE_RULE}건 미만이라 가격 비교는 하지 않았어요.
          중복 등록 여부만 확인했으니, 가격은 직접 살펴 주세요.
        </p>
      )}

      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
        <input
          type="checkbox"
          checked={onlyClean}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4"
        />
        알짜 매물만 보기
      </label>

      {onlyClean && (
        <p role="status" className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {summary.normal === 0
            ? "알짜 매물이 없습니다. 체크를 풀면 확인 필요·의심 매물도 볼 수 있어요."
            : hidden > 0
              ? `확인 필요·의심 ${hidden}건은 숨겼어요. 체크를 풀면 다시 보여요.`
              : "숨긴 매물이 없습니다."}
        </p>
      )}
    </div>
  );
}

"use client";

// 검색 조건 입력 화면 (DESIGN.md §1 ② 검색 조건)
// Design Ref: DESIGN.md §1 — 금액(최소~최대), 지역, 부동산 형태, 검색 버튼
// Plan SC: 검색 버튼을 누를 때만 조회한다. 자동 반복 조회는 하지 않는다.
//
// 조회 상태 한 줄(조회 시각·건수·실패 안내)과 매물 목록(ListingList)도 함께 보여준다.

import { useState, type FormEvent } from "react";
import ListingList from "@/components/ListingList";
import ResultSummary from "@/components/ResultSummary";
import { describeResult } from "@/lib/format/describeResult";
import { FetchTimeoutError, fetchJsonWithTimeout } from "@/lib/http/fetchJsonWithTimeout";
import { CLIENT_SEARCH_TIMEOUT_MS } from "@/lib/listings/constants";
import { filterCleanListings, summarizeSuspicions } from "@/lib/suspicion/summarize";
import type { Listing } from "@/types/listing";
import type { SuspicionResult } from "@/types/suspicion";
import {
  PROPERTY_TYPE_OPTIONS,
  REGION_OPTIONS,
} from "@/lib/listings/searchOptions";
import { validateSearchCondition } from "@/lib/listings/validateSearchCondition";

/** 화면에서는 "억 원" 단위로 입력받고, 서버에는 "원" 단위로 보낸다 */
const WON_PER_EOK = 100_000_000;

/** 조회 상태 */
type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "done";
      total: number;
      fetchedAt: string;
      listings: Listing[];
      suspicions: SuspicionResult[];
      /** 결과가 적어 가격 비교를 하지 못했는지 */
      priceRuleSkipped: boolean;
    };

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass = "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

interface SearchPanelProps {
  /** 매물 카드에서 연락처를 저장했을 때 부른다 */
  onContactSaved: () => void;
}

export default function SearchPanel({ onContactSaved }: SearchPanelProps) {
  // 입력값은 모두 글자로 들고 있다가, 검색할 때 숫자로 바꾼다
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("20");
  const [region, setRegion] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // "알짜 매물만 보기": 기본은 꺼 둔다 (의심 매물도 숨기지 않고 함께 보여준다)
  const [onlyClean, setOnlyClean] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // 1) 화면에서 먼저 입력값을 검사한다 (서버와 같은 규칙)
    if (priceMax.trim() === "") {
      setStatus({ kind: "error", message: "최대 금액을 입력해 주세요." });
      return;
    }
    const validation = validateSearchCondition({
      priceMin: priceMin.trim() === "" ? 0 : Math.round(Number(priceMin) * WON_PER_EOK),
      priceMax: Math.round(Number(priceMax) * WON_PER_EOK),
      region,
      propertyType,
    });
    if (!validation.ok) {
      setStatus({ kind: "error", message: validation.message });
      return;
    }

    // 2) 서버에 조회를 요청한다
    setStatus({ kind: "loading" });
    try {
      // 서버가 응답하지 않아도 끝없이 기다리지 않도록 시간 제한을 둔다
      const result = await fetchJsonWithTimeout(
        "/api/search",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validation.value),
        },
        CLIENT_SEARCH_TIMEOUT_MS,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 서버가 보낸 JSON의 모양은 위 API 설계를 따른다
      const data = result.data as any;
      if (!result.ok || data === null) {
        setStatus({
          kind: "error",
          message: data?.error?.message ?? "조회 실패: 알 수 없는 오류입니다.",
        });
        return;
      }
      setStatus({
        kind: "done",
        total: data.total,
        fetchedAt: data.fetchedAt,
        listings: data.listings,
        suspicions: data.suspicions,
        priceRuleSkipped: Boolean(data.priceRuleSkipped),
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof FetchTimeoutError
            ? "조회 실패: 1분 안에 결과가 오지 않았습니다. 잠시 후 다시 시도해 주세요."
            : "조회 실패: 서버에 연결하지 못했습니다.",
      });
    }
  }

  return (
    <section aria-labelledby="search-heading" className="w-full">
      <h2 id="search-heading" className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
        검색 조건
      </h2>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price-min" className={labelClass}>
              최소 금액 (억 원, 비우면 제한 없음)
            </label>
            <input
              id="price-min"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="예: 10"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="price-max" className={labelClass}>
              최대 금액 (억 원)
            </label>
            <input
              id="price-max"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="예: 20"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="region" className={labelClass}>
              지역
            </label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={inputClass}
            >
              <option value="">선택하세요</option>
              {REGION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="property-type" className={labelClass}>
              부동산 형태
            </label>
            <select
              id="property-type"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className={inputClass}
            >
              <option value="">선택하세요</option>
              {PROPERTY_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={status.kind === "loading"}
          className="h-12 rounded-full bg-foreground px-6 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc] sm:w-40"
        >
          {status.kind === "loading" ? "조회 중…" : "검색"}
        </button>
      </form>

      {/* 조회 상태 한 줄: 안내, 조회 중, 조회 실패, 조회 시각과 건수 */}
      <p role="status" className="mt-4 min-h-6 text-base text-zinc-700 dark:text-zinc-300">
        {status.kind === "idle" && "조건을 입력하고 검색하세요."}
        {status.kind === "loading" && "조회 중…"}
        {status.kind === "error" && (
          <span className="text-red-600 dark:text-red-400">{status.message}</span>
        )}
        {status.kind === "done" && describeResult(status.total, status.fetchedAt)}
      </p>

      {/* 매물 목록: 조회에 성공하고 결과가 있을 때만 보여준다 (실패 시에는 비워 둔다) */}
      {status.kind === "done" && status.total > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          <ResultSummary
            summary={summarizeSuspicions(status.suspicions)}
            priceRuleSkipped={status.priceRuleSkipped}
            onlyClean={onlyClean}
            onToggle={setOnlyClean}
          />
          <ListingList
            listings={
              onlyClean
                ? filterCleanListings(status.listings, status.suspicions)
                : status.listings
            }
            suspicions={status.suspicions}
            onContactSaved={onContactSaved}
          />
        </div>
      )}
    </section>
  );
}

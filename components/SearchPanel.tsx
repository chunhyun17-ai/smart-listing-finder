"use client";

// 검색 조건 입력 화면 (DESIGN.md §1 ② 검색 조건)
// Design Ref: DESIGN.md §1 — 금액(최소~최대), 지역, 부동산 형태, 검색 버튼
// Plan SC: 검색 버튼을 누를 때만 조회한다. 자동 반복 조회는 하지 않는다.
//
// 매물 목록 화면은 PLAN 9번에서 만든다. 지금은 조회 상태를 한 줄로만 보여준다.

import { useState, type FormEvent } from "react";
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
  | { kind: "done"; total: number; fetchedAt: string };

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass = "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function SearchPanel() {
  // 입력값은 모두 글자로 들고 있다가, 검색할 때 숫자로 바꾼다
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("20");
  const [region, setRegion] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

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
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.value),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus({
          kind: "error",
          message: data?.error?.message ?? "조회 실패: 알 수 없는 오류입니다.",
        });
        return;
      }
      setStatus({ kind: "done", total: data.total, fetchedAt: data.fetchedAt });
    } catch {
      setStatus({
        kind: "error",
        message: "조회 실패: 서버에 연결하지 못했습니다.",
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

      {/* 조회 상태 한 줄 (목록은 PLAN 9번에서 만든다) */}
      <p role="status" className="mt-4 min-h-6 text-base text-zinc-700 dark:text-zinc-300">
        {status.kind === "idle" && "조건을 입력하고 검색하세요."}
        {status.kind === "loading" && "조회 중…"}
        {status.kind === "error" && (
          <span className="text-red-600 dark:text-red-400">{status.message}</span>
        )}
        {status.kind === "done" &&
          (status.total === 0
            ? "조건에 맞는 매물이 없습니다."
            : `${status.total}건을 조회했습니다. (조회 시각: ${new Date(status.fetchedAt).toLocaleString("ko-KR")})`)}
      </p>
    </section>
  );
}

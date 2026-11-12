// 매물 목록 화면 (DESIGN.md §1 ③ 검색 결과)
// Design Ref: DESIGN.md §1 — 제목, 가격, 주소·면적·층·형태, 등록자·중개사
// 의심 표시와 연락처 저장 버튼은 PLAN 10~13번에서 이 카드에 추가한다.

import { formatPrice } from "@/lib/format/formatPrice";
import type { Listing } from "@/types/listing";

interface ListingListProps {
  listings: Listing[];
}

export default function ListingList({ listings }: ListingListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {listings.map((listing) => (
        <li
          key={listing.id}
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <h3 className="text-base font-semibold text-black dark:text-zinc-50">
              {listing.title}
            </h3>
            <p className="shrink-0 text-lg font-bold text-black dark:text-zinc-50">
              {formatPrice(listing.price)}
            </p>
          </div>

          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {listing.address}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {listing.propertyType} · {listing.area}㎡ · {listing.floor}층
          </p>

          <div className="mt-2 flex items-center justify-between gap-4 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              등록: {listing.registrantName}
            </span>
            <a
              href={listing.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-950 underline dark:text-zinc-50"
            >
              원본 보기
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}

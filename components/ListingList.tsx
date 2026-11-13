// 매물 목록 화면 (DESIGN.md §1 ③ 검색 결과)
// Design Ref: DESIGN.md §1 — 제목, 가격, 주소·면적·층·형태, 등록자·중개사, 의심 표시와 이유
// Plan SC: 의심 매물은 숨기지 않고 의심 표시를 붙여 함께 보여준다. 의심·확인 필요에는 이유를 적는다.
//          최종 판단은 사용자가 한다. (그래서 "허위"라고 단정하는 표현은 쓰지 않는다)
// 카드 아래에는 연락처 저장 버튼(ContactSaveForm)이 있다.

import ContactSaveForm from "@/components/ContactSaveForm";
import { formatPrice } from "@/lib/format/formatPrice";
import { toSafeHttpsUrl } from "@/lib/listings/safeUrl";
import type { Listing } from "@/types/listing";
import type { SuspicionResult, SuspicionStatus } from "@/types/suspicion";

interface ListingListProps {
  listings: Listing[];
  /** 매물별 판정 결과 (매물 번호로 찾는다) */
  suspicions: SuspicionResult[];
  /** 연락처를 저장했을 때 부른다 */
  onContactSaved: () => void;
}

/** 의심·확인 필요 표시의 글자와 색. 색만으로 구분하지 않도록 글자도 함께 보여준다 */
const BADGE: Record<
  Exclude<SuspicionStatus, "normal">,
  { label: string; badgeClass: string; cardClass: string }
> = {
  suspect: {
    label: "의심",
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
    cardClass: "border-red-300 dark:border-red-900",
  },
  check: {
    label: "확인 필요",
    badgeClass: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    cardClass: "border-amber-300 dark:border-amber-900",
  },
};

export default function ListingList({
  listings,
  suspicions,
  onContactSaved,
}: ListingListProps) {
  const suspicionById = new Map(suspicions.map((s) => [s.listingId, s]));

  return (
    <ul className="flex flex-col gap-3">
      {listings.map((listing) => {
        const suspicion = suspicionById.get(listing.id);
        // 안전한 https 주소일 때만 링크로 만든다 (아니면 "원본 링크 없음")
        const safeUrl = toSafeHttpsUrl(listing.sourceUrl);
        const badge =
          suspicion && suspicion.status !== "normal"
            ? BADGE[suspicion.status]
            : null;

        return (
          <li
            key={listing.id}
            className={`rounded-xl border bg-white p-4 dark:bg-zinc-950 ${
              badge ? badge.cardClass : "border-zinc-200 dark:border-zinc-800"
            }`}
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

            {badge && suspicion && (
              <div className="mt-3">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${badge.badgeClass}`}
                >
                  {badge.label}
                </span>
                <ul className="mt-2 list-disc pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                  {suspicion.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-4 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                등록: {listing.registrantName}
              </span>
              {safeUrl ? (
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-zinc-950 underline dark:text-zinc-50"
                >
                  원본 보기
                </a>
              ) : (
                <span className="text-zinc-500 dark:text-zinc-400">원본 링크 없음</span>
              )}
            </div>

            <ContactSaveForm listing={listing} onSaved={onContactSaved} />
          </li>
        );
      })}
    </ul>
  );
}

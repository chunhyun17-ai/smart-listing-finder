// 테스트에서 함께 쓰는 도구

import type { Listing } from "@/types/listing";

/** 테스트용 매물을 간단히 만든다. 바꾸고 싶은 값만 넘기면 나머지는 기본값이다 */
export function makeListing(overrides: Partial<Listing> & { id: string }): Listing {
  return {
    title: overrides.id,
    price: 2_000_000_000,
    address: `테스트주소 ${overrides.id}`,
    region: "테스트구",
    propertyType: "아파트",
    area: 100,
    floor: 3,
    registrantName: `중개사-${overrides.id}`,
    sourceUrl: "https://example.com/test",
    fetchedAt: "2026-11-13T00:00:00+09:00",
    ...overrides,
  };
}

/** 같은 조건의 일반 매물 n건 (주소가 서로 달라 중복이 아니고, ㎡당 가격이 모두 같다) */
export function makeNormalListings(count: number): Listing[] {
  return Array.from({ length: count }, (_, i) =>
    makeListing({ id: `n-${i + 1}` }),
  );
}

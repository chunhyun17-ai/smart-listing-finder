// 가격(원)을 읽기 쉬운 글자로 바꾼다
// 예: 1_850_000_000 → "18억 5,000만 원", 2_000_000_000 → "20억 원", 50_000_000 → "5,000만 원"

const WON_PER_EOK = 100_000_000;
const WON_PER_MAN = 10_000;

export function formatPrice(won: number): string {
  if (!Number.isFinite(won) || won < 0) return "가격 정보 없음";
  if (won === 0) return "0원";

  // 만 원 단위로 반올림한 뒤 억과 만으로 나눈다
  const totalMan = Math.round(won / WON_PER_MAN);
  const eok = Math.floor((totalMan * WON_PER_MAN) / WON_PER_EOK);
  const man = totalMan - (eok * WON_PER_EOK) / WON_PER_MAN;

  const parts: string[] = [];
  if (eok > 0) parts.push(`${eok.toLocaleString("ko-KR")}억`);
  if (man > 0) parts.push(`${man.toLocaleString("ko-KR")}만`);
  return `${parts.join(" ")} 원`;
}

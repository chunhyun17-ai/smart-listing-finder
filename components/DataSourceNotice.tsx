// 데이터 출처 안내 줄: 지어낸 샘플 데이터일 때만 제목 아래에 보여준다
// 실제 매물처럼 오해해 연락하거나 거래 판단을 하지 않도록 알려 준다.

import { DATA_SOURCE, getDataSourceNotice } from "@/lib/listings/dataSource";

export default function DataSourceNotice() {
  const notice = getDataSourceNotice(DATA_SOURCE);
  if (!notice) return null;

  return (
    <p
      role="note"
      className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
    >
      <span aria-hidden="true">ℹ️ </span>
      {notice}
    </p>
  );
}

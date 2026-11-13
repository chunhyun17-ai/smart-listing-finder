// 첫 화면
// Design Ref: DESIGN.md §1 "화면 구성" — ① 제목, ② 검색 조건, ③ 검색 결과, ④ 저장한 연락처

import DataSourceNotice from "@/components/DataSourceNotice";
import Workspace from "@/components/Workspace";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col gap-10 bg-white px-6 py-16 dark:bg-black sm:px-16 sm:py-24">
        {/* 앱 이름을 보여주는 큰 제목 */}
        <h1 className="text-5xl font-bold tracking-tight text-black dark:text-zinc-50">
          알짜 매물 탐색기
        </h1>
        <DataSourceNotice />
        <Workspace />
      </main>
    </div>
  );
}

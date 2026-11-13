"use client";

// 검색 화면과 저장한 연락처를 한 화면에 묶는다
// 연락처를 저장하면 아래 "저장한 연락처" 목록이 바로 새로 불러와지도록 이어 준다.

import { useState } from "react";
import ContactsPanel from "@/components/ContactsPanel";
import SearchPanel from "@/components/SearchPanel";

export default function Workspace() {
  // 연락처를 저장할 때마다 올라가는 숫자: 목록을 다시 불러오라는 신호
  const [contactsVersion, setContactsVersion] = useState(0);

  return (
    <>
      <SearchPanel onContactSaved={() => setContactsVersion((v) => v + 1)} />
      <ContactsPanel refreshKey={contactsVersion} />
    </>
  );
}

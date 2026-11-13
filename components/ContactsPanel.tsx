"use client";

// 저장한 연락처 목록 (DESIGN.md §1 ④ 저장한 연락처)
// 개인정보 주의: 내 컴퓨터에 저장한 연락처를 보여주는 화면이다. 외부에 공유하지 않는다.

import { useEffect, useState } from "react";
import type { Contact } from "@/types/contact";

interface ContactsPanelProps {
  /** 이 값이 바뀌면 목록을 다시 불러온다 (연락처를 저장할 때마다 올라간다) */
  refreshKey: number;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; contacts: Contact[] };

export default function ContactsPanel({ refreshKey }: ContactsPanelProps) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/contacts");
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setState({
            kind: "error",
            message: data?.error?.message ?? "저장한 연락처를 불러오지 못했습니다.",
          });
          return;
        }
        setState({ kind: "done", contacts: data.contacts });
      } catch {
        if (!cancelled) {
          setState({ kind: "error", message: "서버에 연결하지 못했습니다." });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <section aria-labelledby="contacts-heading" className="w-full">
      <h2 id="contacts-heading" className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
        저장한 연락처
      </h2>

      {state.kind === "loading" && (
        <p className="text-base text-zinc-700 dark:text-zinc-300">불러오는 중…</p>
      )}
      {state.kind === "error" && (
        <p role="alert" className="text-base text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}
      {state.kind === "done" && state.contacts.length === 0 && (
        <p className="text-base text-zinc-700 dark:text-zinc-300">
          저장한 연락처가 없습니다.
        </p>
      )}
      {state.kind === "done" && state.contacts.length > 0 && (
        <ul className="flex flex-col gap-2">
          {state.contacts.map((contact) => (
            <li
              key={contact.id}
              className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-semibold text-black dark:text-zinc-50">
                {contact.name}
              </span>
              <span className="text-zinc-800 dark:text-zinc-200">{contact.phone}</span>
              <span className="text-zinc-500 dark:text-zinc-400">
                매물 {contact.listingId} ·{" "}
                {new Date(contact.savedAt).toLocaleString("ko-KR")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

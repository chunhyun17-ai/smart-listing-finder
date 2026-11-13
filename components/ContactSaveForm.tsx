"use client";

// 매물 카드의 "연락처 저장" 버튼과 입력칸
// Design Ref: DESIGN.md §1 매물 카드 — [연락처 저장] / §2 연락처 저장 흐름
// 개인정보 주의: 저장한 연락처는 내 컴퓨터의 파일에만 보관하고, 본인 확인 목적으로만 쓴다.

import { useState, type FormEvent } from "react";
import type { Listing } from "@/types/listing";

interface ContactSaveFormProps {
  listing: Listing;
  /** 저장에 성공했을 때 부른다 (저장한 연락처 목록을 새로 불러오게 한다) */
  onSaved: () => void;
}

type SaveStatus =
  | { kind: "closed" }
  | { kind: "editing" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export default function ContactSaveForm({ listing, onSaved }: ContactSaveFormProps) {
  // 이름과 전화번호는 매물의 등록자 정보로 미리 채워 두고, 고칠 수 있다
  const [name, setName] = useState(listing.registrantName);
  const [phone, setPhone] = useState(listing.registrantPhone ?? "");
  const [status, setStatus] = useState<SaveStatus>({ kind: "closed" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "saving" });
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, name, phone }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus({
          kind: "error",
          message: data?.error?.message ?? "연락처를 저장하지 못했습니다.",
        });
        return;
      }
      setStatus({ kind: "saved" });
      onSaved();
    } catch {
      setStatus({ kind: "error", message: "서버에 연결하지 못했습니다." });
    }
  }

  const isOpen =
    status.kind === "editing" ||
    status.kind === "saving" ||
    status.kind === "error";

  return (
    <div className="mt-3">
      {!isOpen && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStatus({ kind: "editing" })}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            {status.kind === "saved" ? "연락처 다시 저장" : "연락처 저장"}
          </button>
          {status.kind === "saved" && (
            <span role="status" className="text-sm text-green-700 dark:text-green-400">
              저장했습니다.
            </span>
          )}
        </div>
      )}

      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`contact-name-${listing.id}`}
                className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                이름
              </label>
              <input
                id={`contact-name-${listing.id}`}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor={`contact-phone-${listing.id}`}
                className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                전화번호
              </label>
              <input
                id={`contact-phone-${listing.id}`}
                type="tel"
                inputMode="tel"
                value={phone}
                placeholder="예: 010-1234-5678"
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={status.kind === "saving"}
              className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background disabled:opacity-50"
            >
              {status.kind === "saving" ? "저장 중…" : "저장"}
            </button>
            <button
              type="button"
              onClick={() => setStatus({ kind: "closed" })}
              disabled={status.kind === "saving"}
              className="rounded-full px-4 py-1.5 text-sm text-zinc-700 underline disabled:opacity-50 dark:text-zinc-300"
            >
              취소
            </button>
          </div>

          {status.kind === "error" && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {status.message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

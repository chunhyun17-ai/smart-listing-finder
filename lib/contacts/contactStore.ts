// 연락처 저장소: 내 컴퓨터의 파일 하나(data/contacts.json)에 저장한다
// Design Ref: DESIGN.md §2 "연락처 저장 → 서버에 저장" / PRD 7번 "개인정보"
// 개인정보 주의: 이 파일은 .gitignore(/data/)에 등록되어 있어 GitHub에 올라가지 않는다.
//
// 이 방식은 내 컴퓨터에서 실행할 때만 쓸 수 있다. Vercel에 배포하면 파일에 저장할 수 없으므로
// 배포 전에 저장 방식을 다시 정해야 한다. (DESIGN.md §5 결정 5번)

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Contact } from "@/types/contact";

/** 새로 저장할 연락처 (번호와 저장 시각은 저장소가 붙인다) */
export interface NewContact {
  listingId: string;
  name: string;
  phone: string;
}

/** 파일 경로를 받아 연락처 저장소를 만든다 (테스트에서는 임시 파일을 넘긴다) */
export function createContactStore(filePath: string) {
  // 저장 요청이 동시에 와도 파일이 꼬이지 않도록 한 번에 하나씩 처리한다
  let queue: Promise<unknown> = Promise.resolve();
  function inOrder<T>(task: () => Promise<T>): Promise<T> {
    const next = queue.then(task, task);
    queue = next.catch(() => undefined);
    return next;
  }

  /** 파일에서 연락처를 읽는다. 파일이 아직 없으면 빈 목록 */
  async function read(): Promise<Contact[]> {
    try {
      const text = await fs.readFile(filePath, "utf8");
      const data: unknown = JSON.parse(text);
      return Array.isArray(data) ? (data as Contact[]) : [];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  /** 연락처 전체를 파일에 쓴다 */
  async function write(contacts: Contact[]): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(contacts, null, 2), "utf8");
  }

  return {
    /** 저장한 연락처 목록 (최근에 저장한 것이 먼저) */
    list(): Promise<Contact[]> {
      return inOrder(async () => {
        const contacts = await read();
        return [...contacts].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
      });
    },

    /** 연락처를 저장한다. 같은 매물의 연락처가 이미 있으면 새로 만들지 않고 고쳐 쓴다 */
    add(input: NewContact): Promise<Contact> {
      return inOrder(async () => {
        const contacts = await read();
        const savedAt = new Date().toISOString();
        const index = contacts.findIndex(
          (contact) => contact.listingId === input.listingId,
        );

        let saved: Contact;
        if (index >= 0) {
          saved = { ...contacts[index], ...input, savedAt };
          contacts[index] = saved;
        } else {
          saved = { id: randomUUID(), ...input, savedAt };
          contacts.push(saved);
        }
        await write(contacts);
        return saved;
      });
    },
  };
}

/** 앱이 쓰는 기본 저장소: my-app/data/contacts.json */
export const defaultContactStore = createContactStore(
  path.join(process.cwd(), "data", "contacts.json"),
);

// 연락처 서버 코드(API)의 요청 처리: GET /api/contacts (목록), POST /api/contacts (저장)
// Design Ref: DESIGN.md §2 "서버 코드(API) 두 개 — GET·POST /api/contacts"
// 저장소를 바깥에서 끼워 넣을 수 있게 분리해 두었다. (테스트에서는 임시 파일 저장소를 넣는다)

import type { Contact } from "@/types/contact";
import type { NewContact } from "./contactStore";
import { validateContactInput } from "./validateContactInput";

interface ContactStoreLike {
  list: () => Promise<Contact[]>;
  add: (input: NewContact) => Promise<Contact>;
}

/** 오류 응답을 만든다. 형식: { error: { code, message } } */
function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export function createContactsHandlers(store: ContactStoreLike) {
  return {
    /** 저장한 연락처 목록을 돌려준다 */
    async GET(): Promise<Response> {
      try {
        const contacts = await store.list();
        return Response.json({ contacts, total: contacts.length });
      } catch {
        return errorResponse(
          500,
          "STORAGE_FAILED",
          "저장한 연락처를 불러오지 못했습니다.",
        );
      }
    },

    /** 연락처를 저장하고, 저장된 내용을 돌려준다 */
    async POST(request: Request): Promise<Response> {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return errorResponse(400, "INVALID_JSON", "요청 형식이 올바르지 않습니다.");
      }

      const validation = validateContactInput(body);
      if (!validation.ok) {
        return errorResponse(400, "INVALID_INPUT", validation.message);
      }

      try {
        const contact = await store.add(validation.value);
        return Response.json({ contact }, { status: 201 });
      } catch {
        return errorResponse(
          500,
          "STORAGE_FAILED",
          "연락처를 저장하지 못했습니다.",
        );
      }
    },
  };
}

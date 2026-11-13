// 연락처 서버 코드(API): GET /api/contacts, POST /api/contacts
// Design Ref: DESIGN.md §2 "서버 코드(API) 두 개"
// 처리 과정은 lib/contacts/createContactsHandlers.ts에 있다.

import { defaultContactStore } from "@/lib/contacts/contactStore";
import { createContactsHandlers } from "@/lib/contacts/createContactsHandlers";

// 참고: 이 프로젝트는 cacheComponents 설정을 쓰므로 `dynamic` 옵션을 쓸 수 없다.
// GET이 파일을 읽는 동안에는 Next.js가 결과를 미리 만들어 두지 않고 요청 때마다 처리한다.
// (node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md 참고)

const handlers = createContactsHandlers(defaultContactStore);

export const GET = handlers.GET;
export const POST = handlers.POST;

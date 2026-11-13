// 자동 테스트 설정 (Vitest)
// Design Ref: DESIGN.md §6 "테스트 계획" / PLAN 14번
// 실행: npm test

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // 코드에서 쓰는 "@/" 경로(프로젝트 폴더)를 테스트에서도 그대로 쓰게 한다
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});

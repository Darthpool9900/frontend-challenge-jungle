import { defineConfig } from "@playwright/test";

// ==========================================
// PLAYWRIGHT — REGRESSÃO VISUAL (visual/)
// Não importar a configuração E2E.
// ==========================================

export default defineConfig({
  testDir: "./visual",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,

  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    trace: "retain-on-failure",
  },

  // Preserva as baselines já aprovadas em visual/__screenshots__.
  // {ext} é necessário porque {arg} não inclui ".png".
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",

  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.015,
    },
  },

  webServer: {
    command:
      "npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    env: {
      VITE_ENABLE_MOCKS: "true",
      VITE_ENABLE_TEST_HARNESS: "true",
    },
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

import { test, expect } from "@playwright/test";

const pages = [
  { path: "/", name: "home" },
  { path: "/nft/nft-001", name: "nft-detail" },
  { path: "/cart", name: "cart" },
  { path: "/login", name: "login" },
] as const;

for (const viewport of [
  { width: 390, height: 844, name: "mobile" },
  { width: 1440, height: 900, name: "desktop" },
] as const) {
  for (const entry of pages) {
    test(`${entry.name} — ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(entry.path);
      await page.locator("#root").waitFor({ state: "visible" });
      // The same Roboto stylesheet now loads without blocking rendering.
      // Wait for it before comparing pixels with the approved baselines.
      await page.waitForFunction(() => {
        const fontLink = document.querySelector<HTMLLinkElement>("#kurio-fonts");
        return !fontLink || fontLink.media === "all" || fontLink.dataset.failed === "true";
      }, null, { timeout: 15_000 });
      await page.evaluate(() => document.fonts.ready);
      // Baselines must be reviewed against the Figma PNGs after generation.
      await expect(page).toHaveScreenshot(
        `${entry.name}-${viewport.name}.png`,
        {
          animations: "disabled",
          caret: "hide",
          maxDiffPixelRatio: 0.015,
        },
      );
    });
  }
}

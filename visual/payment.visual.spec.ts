
import { test, expect } from "@playwright/test";

// ==========================================
// REGRESSÃO VISUAL — CHECKOUT
// DESKTOP E MOBILE
// ==========================================

for (const viewport of [
  {
    name: "mobile",
    width: 390,
    height: 844,
  },
  {
    name: "desktop",
    width: 1440,
    height: 900,
  },
] as const) {
  test(`checkout — ${viewport.name}`, async ({ page }) => {
    // ========================================
    // CONFIGURAR VIEWPORT
    // ========================================

    await page.setViewportSize(viewport);

    // ========================================
    // AUTENTICAR USUÁRIO
    // ========================================

    await page.goto("/login");

    await page
      .getByRole("textbox", {
        name: "E-mail",
      })
      .fill("ana@jungle.test");

    await page
      .getByLabel("Senha", {
        exact: true,
      })
      .fill("Demo@12345");

    await page
      .getByRole("button", {
        name: "Entrar",
        exact: true,
      })
      .click();

    await expect(page).toHaveURL(/\/profile/);

    // ========================================
    // ABRIR NFT
    // ========================================

    await page.goto("/nft/nft-001");

    await expect(
      page.locator(".detail-info h1"),
    ).toBeVisible();

    // ========================================
    // ADICIONAR NFT AO CARRINHO
    // ========================================

    if (viewport.name === "mobile") {
      await page
        .locator(".mobile-detail-buy")
        .getByRole("button", {
          name: "Comprar NFT",
        })
        .click();
    } else {
      await page
        .locator(".desktop-buy")
        .getByRole("button", {
          name: "COMPRAR",
        })
        .click();
    }

    await expect(page).toHaveURL(/\/cart/);

    // ========================================
    // AVANÇAR PARA CHECKOUT
    // ========================================

    // Desktop e mobile usam o botão do resumo
    // da carteira (.cart-summary).
    //
    // O antigo .mobile-cart-action está oculto
    // no layout mobile atual.

    const checkoutButton = page
      .locator(".cart-summary")
      .getByRole("button", {
        name: /Conectar e finalizar/,
      });

    await expect(
      checkoutButton,
    ).toBeVisible();

    await expect(
      checkoutButton,
    ).toBeEnabled();

    await checkoutButton.click();

    // ========================================
    // VALIDAR CHECKOUT
    // ========================================

    await expect(page).toHaveURL(/\/checkout/);

    await expect(
      page.locator(".checkout-layout"),
    ).toBeVisible();

    await expect(
      page.locator(".payment-summary"),
    ).toContainText("Seus NFTs");

    // ========================================
    // AGUARDAR FONTES
    // ========================================

    await page.waitForFunction(() => {
      const fontLink =
        document.querySelector<HTMLLinkElement>(
          "#kurio-fonts",
        );

      return (
        !fontLink ||
        fontLink.media === "all" ||
        fontLink.dataset.failed === "true"
      );
    });

    await page.evaluate(
      () => document.fonts.ready,
    );

    // ========================================
    // SCREENSHOT DE REGRESSÃO VISUAL
    // ========================================

    await expect(page).toHaveScreenshot(
      `payment-${viewport.name}.png`,
      {
        animations: "disabled",
        caret: "hide",
        maxDiffPixelRatio: 0.015,
      },
    );
  });
}

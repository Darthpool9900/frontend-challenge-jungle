
import { test, expect } from "@playwright/test";

// ==========================================
// CONFIGURAÇÕES DE VIEWPORT
// ==========================================

const desktop = {
  width: 1440,
  height: 900,
};

const mobile = {
  width: 390,
  height: 844,
};

// ==========================================
// TESTES DE CATÁLOGO
// DESKTOP E MOBILE
// ==========================================

for (const [label, viewport] of [
  ["desktop", desktop],
  ["mobile", mobile],
] as const) {
  test.describe(`Jornada de catálogo - ${label}`, () => {
    test.use({ viewport });

    // ======================================
    // HOME E DETALHES
    // ======================================

    test(
      "abre home e detalhes com dados do mock",
      async ({ page }) => {
      await page.goto("/");

        await expect(
          page.getByText("SEJA DONO DO FUTURO"),
        ).toBeVisible();

      const cards = page.locator("article.nft-card");

      await expect(cards.first()).toBeVisible();

        await cards
          .first()
          .locator("a.nft-name")
          .click();

      await expect(page).toHaveURL(/\/nft\/nft-/);

        await expect(
          page.locator(".detail-info h1"),
        ).toBeVisible();
      },
    );

    // ======================================
    // BUSCA, FILTROS E HISTÓRICO
    // ======================================

    test(
      "busca e filtros mantêm estado na URL, refresh e histórico",
      async ({ page }) => {
      // ==================================
      // ABRIR MERCADO
      // ==================================

      await page.goto("/market");

        await expect(
          page.locator(".market-search input"),
        ).toBeVisible();

      // ==================================
      // PESQUISAR NFT
      // ==================================

        await page
          .locator(".market-search input")
          .fill("Emerald");

        await page
          .locator(".market-search button")
          .click();

      await expect(page).toHaveURL(/q=Emerald/);

        await expect(
          page.locator(".nft-card").first(),
        ).toBeVisible();

      // ==================================
      // VERIFICAR BUSCA APÓS REFRESH
      // ==================================

      await page.reload();

        await expect(
          page.locator(".market-search input"),
        ).toHaveValue("Emerald");

      // ==================================
      // LIMPAR PESQUISA
      // ==================================

        await page
          .locator(".market-search input")
          .fill("");

        await page
          .locator(".market-search button")
          .click();

      await expect(page).not.toHaveURL(/q=Emerald/);

      // ==================================
      // ABRIR FILTROS NO MOBILE
      // ==================================

      if (label === "mobile") {
          await page
            .locator(".mobile-filter-toggle")
            .click();

          await expect(
            page.locator(
              ".market-page .catalog-sidebar",
            ),
          ).toHaveClass(/mobile-open/);
      }

      // ==================================
      // SELECIONAR CATEGORIA
      // ==================================

      const categoryButton = page
          .locator(
            ".market-page .catalog-sidebar .filter-panel",
          )
        .getByRole("button", {
          name: /Arte digital/,
        });

        await expect(
          categoryButton,
        ).toBeVisible();

      await categoryButton.click();

      // ==================================
      // VALIDAR URL
      // ==================================

        await expect(page).toHaveURL(
          /category=arte-digital/,
        );

      // ==================================
      // ATUALIZAR PÁGINA
      // ==================================

      await page.reload();

      // A categoria deve continuar na URL.
        await expect(page).toHaveURL(
          /category=arte-digital/,
        );

      // ==================================
      // CORREÇÃO MOBILE
      // ==================================

      // No mobile, os filtros ficam ocultos
      // depois do refresh.
      //
      // Abrimos o painel novamente antes
      // de consultar seus botões.

      if (label === "mobile") {
          const filterToggle = page.locator(
            ".mobile-filter-toggle",
          );

          await expect(
            filterToggle,
          ).toBeVisible();

        await filterToggle.click();

          await expect(
            page.locator(
              ".market-page .catalog-sidebar",
            ),
          ).toHaveClass(/mobile-open/);
      }

      // ==================================
      // VALIDAR FILTRO PERSISTIDO
      // ==================================

      const selectedCategory = page
          .locator(
            ".market-page .catalog-sidebar .filter-panel",
          )
        .getByRole("button", {
          name: /Arte digital/,
        });

        await expect(
          selectedCategory,
        ).toBeVisible();

        await expect(
          selectedCategory,
        ).toHaveClass(/chosen/);

      // ==================================
      // VALIDAR HISTÓRICO
      // ==================================

      await page.goBack();

        await expect(page).not.toHaveURL(
          /category=arte-digital/,
        );
      },
    );

    // ======================================
    // NFT INEXISTENTE
    // ======================================

    test(
      "rota inexistente de NFT apresenta feedback",
      async ({ page }) => {
        await page.goto(
          "/nft/nft-inexistente",
        );

        await expect(
          page.getByText("NFT não encontrado."),
        ).toBeVisible();
      },
    );
    });
}

// ==========================================
// TESTES DE CONTA E CARRINHO
// DESKTOP
// ==========================================

test.describe("Conta e compra - desktop", () => {
  test.use({ viewport: desktop });

  // ========================================
  // LOGIN E LOGOUT
  // ========================================

  test(
    "login e logout usam sessão real do mock",
    async ({ page }) => {
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

      await expect(
        page.getByText("Perfil do colecionador"),
      ).toBeVisible();

    // ====================================
    // LOGOUT
    // ====================================

    await page
      .locator(".account-sidebar")
      .getByRole("button", {
        name: "Sair",
      })
      .click();

    await expect(page).toHaveURL(/\/$/);
    },
  );

  // ========================================
  // PERSISTÊNCIA DO CARRINHO
  // ========================================

  test(
    "carrinho de visitante persiste após refresh",
    async ({ page }) => {
    await page.goto("/nft/nft-001");

      await expect(
        page.locator(".detail-layout"),
      ).toBeVisible();

    // Adicionar NFT ao carrinho.
    await page
      .locator(".desktop-buy")
      .getByRole("button", {
        name: "COMPRAR",
      })
      .click();

    await expect(page).toHaveURL(/\/cart/);

      await expect(
        page.locator(".cart-row"),
      ).toHaveCount(1);

    // ====================================
    // REFRESH
    // ====================================

    await page.reload();

    // O item deve continuar no carrinho.
      await expect(
        page.locator(".cart-row"),
      ).toHaveCount(1);

    await expect(
      page.getByText("Subtotal", {
        exact: true,
      }),
    ).toBeVisible();
    },
  );
  });

// ==========================================
// TESTE DE CHECKOUT COMPLETO
// DESKTOP
// ==========================================

test.describe(
  "Fluxo de compra simulado - desktop",
  () => {
  test.use({ viewport: desktop });

    test(
      "pedido confirmado aparece no recibo sem backend real",
      async ({ page }) => {
    // ==================================
    // LOGIN
    // ==================================

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

        await expect(page).toHaveURL(
          /\/profile/,
        );

    // ==================================
    // ADICIONAR NFT
    // ==================================

    await page.goto("/nft/nft-001");

    await page
      .locator(".desktop-buy")
      .getByRole("button", {
        name: "COMPRAR",
      })
      .click();

        await expect(page).toHaveURL(
          /\/cart/,
        );

    // ==================================
    // ABRIR CHECKOUT
    // ==================================

    await page
      .locator(".cart-summary")
      .getByRole("button", {
        name: /Conectar e finalizar/,
      })
      .click();

        await expect(page).toHaveURL(
          /\/checkout/,
        );

    // ==================================
    // ADICIONAR CARTEIRA
    // ==================================

    await page
      .locator(".payment-summary")
      .getByRole("button", {
        name: "Adicionar carteira",
      })
      .click();

    await page
          .locator(
            ".collector .wallet-create-inline",
          )
      .getByLabel("Nome da carteira")
      .fill("Carteira de teste");

    await page
          .locator(
            ".collector .wallet-create-inline",
          )
      .getByLabel("Endereço 0x")
          .fill(
            "0x1111111111111111111111111111111111111111",
          );

    await page
          .locator(
            ".collector .wallet-create-inline",
          )
      .getByRole("button", {
        name: "Salvar carteira",
      })
      .click();

    // ==================================
    // CONFIRMAR COMPRA
    // ==================================

    await page
      .getByRole("button", {
        name: "Confirmar compra",
      })
      .click();

        await expect(page).toHaveURL(
          /\/order\//,
        );

    // ==================================
    // VALIDAR PAGAMENTO CONFIRMADO
    // ==================================

    await expect(
          page.getByText(
            "Seu NFT agora faz parte da sua coleção!",
          ),
    ).toBeVisible({
      timeout: 15_000,
    });

    // ==================================
    // VALIDAR REFERÊNCIA DE TRANSAÇÃO
    // ==================================

        await expect(
          page.getByText(/SIM-/),
        ).toBeVisible();
      },
    );
  },
);

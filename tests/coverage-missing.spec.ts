import { test, expect, type Page } from "@playwright/test";

// ==========================================
// REGRESSÃO COMPLEMENTAR — JUNGLE / KURIO
// Cada teste usa um contexto isolado do Playwright.
// ==========================================

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };
const walletAddressA = `0x${"1".repeat(40)}`;

async function login(page: Page, email = "ana@jungle.test", password = "Demo@12345") {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "E-mail" }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/profile/);
  await expect(page.getByText("Perfil do colecionador")).toBeVisible();
}

async function addNft(page: Page, isMobile = false) {
  await page.goto("/nft/nft-001");
  await expect(page.locator(".detail-info h1")).toBeVisible();
  if (isMobile) {
    await page.locator(".mobile-detail-buy").getByRole("button", { name: "Comprar NFT" }).click();
  } else {
    await page.locator(".desktop-buy").getByRole("button", { name: "COMPRAR" }).click();
  }
  await expect(page).toHaveURL(/\/cart/);
  await expect(page.locator(".cart-row")).toHaveCount(1);
}

async function apiScenario(page: Page, path: string, payload: unknown) {
  return page.evaluate(async ({ path, payload }) => {
      const token = localStorage.getItem("jungle.auth.token");
      const response = await fetch(`/api${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      return {
        status: response.status,
        body: await response.json().catch(() => null),
      };
  }, { path, payload });
}

async function prepareCheckout(page: Page) {
  await login(page);
  await addNft(page);
  await page.locator(".cart-summary").getByRole("button", { name: /Conectar e finalizar/ }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await page.locator(".payment-summary").getByRole("button", { name: "Adicionar carteira" }).click();
  const form = page.locator(".collector .wallet-create-inline");
  await form.getByLabel("Nome da carteira").fill("Carteira E2E");
  await form.getByLabel("Endereço 0x").fill(walletAddressA);
  await form.getByRole("button", { name: "Salvar carteira" }).click();
  await expect(page.locator(".payment-summary .wallet-radio")).toHaveCount(1);
}

// ==========================================
// CADASTRO, FORMULÁRIOS E SESSÃO
// ==========================================

test.describe("Cadastro, validações e sessão", () => {
  test.use({ viewport: desktop });

  test("cadastro válido cria conta e recupera sessão após refresh", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("textbox", { name: "Nome de usuário" }).fill("Novo Colecionador");
    await page.getByRole("textbox", { name: "E-mail" }).fill("novo-coletor@jungle.test");
    await page.getByLabel("Senha", { exact: true }).fill("MinhaSenha@2026");
    await page.getByLabel("Confirmar senha").fill("MinhaSenha@2026");
    await page.getByRole("button", { name: "Criar perfil" }).click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByLabel("Nome de exibição")).toHaveValue("Novo Colecionador");
    await page.reload();
    await expect(page.getByText("Perfil do colecionador")).toBeVisible();
  });

  test("cadastro rejeita confirmação de senha diferente", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("textbox", { name: "Nome de usuário" }).fill("Novo Colecionador");
    await page.getByRole("textbox", { name: "E-mail" }).fill("outro@jungle.test");
    await page.getByLabel("Senha", { exact: true }).fill("MinhaSenha@2026");
    await page.getByLabel("Confirmar senha").fill("MinhaSenha@2025");
    await page.getByRole("button", { name: "Criar perfil" }).click();
    await expect(page.getByRole("alert")).toContainText("As senhas precisam ser iguais");
    await expect(page).toHaveURL(/\/register/);
  });

  test("cadastro mostra conflito de e-mail existente retornado pelo MSW", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("textbox", { name: "Nome de usuário" }).fill("Duplicado");
    await page.getByRole("textbox", { name: "E-mail" }).fill("ana@jungle.test");
    await page.getByLabel("Senha", { exact: true }).fill("MinhaSenha@2026");
    await page.getByLabel("Confirmar senha").fill("MinhaSenha@2026");
    await page.getByRole("button", { name: "Criar perfil" }).click();
    await expect(page.getByRole("alert")).toContainText("Este e-mail já está cadastrado");
  });

  test("login com senha incorreta apresenta erro sem autenticar", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("textbox", { name: "E-mail" }).fill("ana@jungle.test");
    await page.getByLabel("Senha", { exact: true }).fill("incorreta-123");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("E-mail ou senha incorretos");
    await expect(page).toHaveURL(/\/login/);
  });

  test("sessão expirada no banco de mocks impede consulta privada", async ({ page }) => {
    await login(page);
    await page.evaluate(() => {
      const key = "jungle.auth.db.v1";
      const raw = localStorage.getItem(key);
      if (!raw) throw new Error("Banco local de autenticação não encontrado");
      const database = JSON.parse(raw) as { sessions: Array<{ expiresAt: string }> };
      for (const session of database.sessions) {
        session.expiresAt = "2000-01-01T00:00:00.000Z";
      }
      localStorage.setItem(key, JSON.stringify(database));
    });
    await page.reload();
    await expect(page.getByText("Entre para seu perfil")).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("jungle.auth.token"))).toBeNull();
  });

  test("rota protegida solicita autenticação de visitante", async ({ page }) => {
    for (const path of ["/profile", "/wallets", "/orders", "/checkout", "/favorites"]) {
      await page.goto(path);
      await expect(page.getByRole("link", { name: "Entrar" }).last()).toBeVisible();
    }
  });
});

// ==========================================
// CATÁLOGO E DISPONIBILIDADE
// ==========================================

test.describe("Filtros combinados, estoque e edições", () => {
  test.use({ viewport: desktop });

  test("categoria, ordenação e paginação coexistem na URL", async ({ page }) => {
    await page.goto("/market");
    await page.locator(".catalog-sidebar .filter-panel")
      .getByRole("button", { name: /Arte digital/ }).click();
    await expect(page).toHaveURL(/category=arte-digital/);
    await page.locator(".sort-label select").selectOption("price_desc");
    await expect(page).toHaveURL(/sort=price_desc/);
    await expect(page).toHaveURL(/category=arte-digital/);
    await page.getByRole("navigation", { name: "Páginas do mercado" })
      .getByRole("button", { name: "2", exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    await page.reload();
    await expect(page.locator(".sort-label select")).toHaveValue("price_desc");
    await expect(page).toHaveURL(/page=2/);
    await page.locator(".catalog-sidebar .filter-panel")
      .getByRole("button", { name: /Jogos/ }).click();
    await expect(page).toHaveURL(/category=gaming/);
    await expect(page).not.toHaveURL(/page=2/);
  });

  test("NFT esgotado impede compra e mostra indisponibilidade", async ({ page }) => {
    await page.goto("/nft/nft-008");
    await expect(page.locator(".detail-info h1")).toBeVisible();
    await expect(page.getByText("Edição esgotada")).toBeVisible();
    await expect(page.locator(".desktop-buy").getByRole("button", { name: "COMPRAR" })).toBeDisabled();
  });

  test("mudança de preço pelo MSW bloqueia avanço de um carrinho desatualizado", async ({ page }) => {
    await addNft(page);
    const patch = await page.evaluate(async () => {
      const response = await fetch("/api/__test/nfts/nft-001/editions/nft-001-edition-3", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceEth: "9.123" }),
      });
      return response.status;
    });
    expect(patch).toBe(200);
    await expect(page.locator(".cart-row .error-text"))
      .toContainText("Preço atualizado", { timeout: 10_000 });
    await page.locator(".cart-summary")
      .getByRole("button", { name: /Conectar e finalizar/ }).click();
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.locator(".cart-summary .notice"))
      .toContainText("Revise os itens");
  });
});

// ==========================================
// PERFIL, AVATAR E SENHA
// ==========================================

test.describe("Perfil do colecionador", () => {
  test.use({ viewport: desktop });

  test("edição de nome, usuário e bio persiste após refresh", async ({ page }) => {
    await login(page);
    await page.getByLabel("Nome de exibição").fill("Ana E2E");
    await page.getByLabel("Nome de usuário").fill("ana-e2e");
    await page.getByLabel("Apelido da carteira").fill("Arte e colecionáveis");
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByRole("status")).toContainText("Perfil atualizado com sucesso");
    await page.reload();
    await expect(page.getByLabel("Nome de exibição")).toHaveValue("Ana E2E");
    await expect(page.getByLabel("Nome de usuário")).toHaveValue("ana-e2e");
    await expect(page.getByLabel("Apelido da carteira")).toHaveValue("Arte e colecionáveis");
  });

  test("alteração para e-mail de outro usuário exibe conflito", async ({ page }) => {
    await login(page);
    await page.getByLabel("E-mail").fill("lucas@jungle.test");
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByRole("status")).toContainText("E-mail já utilizado por outro usuário");
  });

  test("avatar aceita imagem pequena e rejeita arquivos inválidos", async ({ page }) => {
    await login(page);
    const file = page.locator(".avatar-picker input[type='file']");
    await file.setInputFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==", "base64"),
    });
    await expect(page.locator(".avatar-picker img")).toBeVisible();
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByRole("status")).toContainText("Perfil atualizado com sucesso");
    await page.reload();
    await expect(page.locator(".avatar-picker img")).toBeVisible();
    await file.setInputFiles({
      name: "sem-imagem.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("não é uma imagem"),
    });
    await expect(page.getByRole("status")).toContainText("Escolha uma imagem de até 700 KB");
  });

  test("alteração de senha valida confirmação, senha atual e autentica com nova senha", async ({ page }) => {
    await login(page);
    const old = page.getByLabel("Senha atual");
    const next = page.getByLabel("Nova senha", { exact: true });
    const confirm = page.getByLabel("Confirmar nova senha");
    await old.fill("Demo@12345");
    await next.fill("NovaSenha@2026");
    await confirm.fill("diferente-123");
    await page.getByRole("button", { name: "Alterar senha" }).click();
    await expect(page.getByRole("status")).toContainText("As senhas não conferem");
    await old.fill("senha-atual-errada");
    await confirm.fill("NovaSenha@2026");
    await page.getByRole("button", { name: "Alterar senha" }).click();
    await expect(page.getByRole("status")).toContainText("A senha atual está incorreta");
    await old.fill("Demo@12345");
    await page.getByRole("button", { name: "Alterar senha" }).click();
    await expect(page.getByRole("status")).toContainText("Senha alterada com sucesso");
    await page.locator(".account-sidebar").getByRole("button", { name: "Sair" }).click();
    await login(page, "ana@jungle.test", "NovaSenha@2026");
  });
});

// ==========================================
// CARTEIRAS E FAVORITOS
// ==========================================

test.describe("Carteiras e favoritos", () => {
  test.use({ viewport: desktop });

  test("carteira principal é criada, editada e persistida", async ({ page }) => {
    await login(page);
    await page.goto("/wallets");
    await page.getByLabel("Nome de exibição").fill("Principal E2E");
    await page.getByPlaceholder("Endereço 0x da carteira").fill(walletAddressA);
    await page.getByRole("button", { name: "Salvar carteira" }).click();
    await expect(page.locator(".saved-wallet").first()).toContainText("Principal E2E");
    await page.reload();
    await expect(page.locator(".saved-wallet").first()).toContainText(walletAddressA);
    await page.locator(".saved-wallet").first().getByRole("button", { name: "Editar" }).click();
    await page.getByLabel("Nome de exibição").fill("Principal Editada");
    await page.getByRole("button", { name: "Atualizar carteira" }).click();
    await expect(page.locator(".saved-wallet").first()).toContainText("Principal Editada");
  });

  test("carteira secundária pode tornar-se principal", async ({ page }) => {
    await login(page);
    await page.goto("/wallets");
    await page.getByLabel("Nome de exibição").fill("Principal");
    await page.getByPlaceholder("Endereço 0x da carteira").fill(walletAddressA);
    await page.getByRole("button", { name: "Salvar carteira" }).click();
    await expect(page.locator(".saved-wallet")).toHaveCount(1);

    await page.getByLabel("Nome de exibição").fill("Secundária");
    await page.getByPlaceholder("Endereço 0x da carteira")
      .fill(`0x${"2".repeat(40)}`);
    await page.getByLabel("Tipo de carteira").selectOption("secondary");
    await page.getByRole("button", { name: "Salvar carteira" }).click();
    await expect(page.locator(".saved-wallet")).toHaveCount(2);

    await page.locator(".wallet-bottom")
      .getByRole("button", { name: "Definir principal" }).click();
    await expect(page.locator(".wallet-title + .saved-wallet"))
      .toContainText("Secundária");
    await page.reload();
    await expect(page.locator(".wallet-title + .saved-wallet"))
      .toContainText("Secundária");
  });

  test("carteira com endereço inválido exibe erro de validação", async ({ page }) => {
    await login(page);
    await page.goto("/wallets");
    await page.getByLabel("Nome de exibição").fill("Carteira inválida");
    await page.getByPlaceholder("Endereço 0x da carteira").fill("0x123");
    await page.getByRole("button", { name: "Salvar carteira" }).click();
    await expect(page.locator(".account-content .notice")).toContainText("Dados da carteira inválidos");
    await expect(page.locator(".saved-wallet")).toHaveCount(0);
  });

  test("favoritar, recarregar e desfavoritar mantêm estado no MSW", async ({ page }) => {
    await login(page);
    await page.goto("/nft/nft-001");
    await expect(page.locator(".detail-info h1")).toBeVisible();
    await page.locator(".desktop-buy").getByRole("button", { name: "Favoritar", exact: true }).click();
    await expect(page.locator(".desktop-buy").getByRole("button", { name: "Favoritado" })).toBeVisible();
    await page.goto("/favorites");
    await expect(page.locator("article.nft-card")).toHaveCount(1);
    await page.reload();
    await expect(page.locator("article.nft-card")).toHaveCount(1);
    await page.goto("/nft/nft-001");
    await page.locator(".desktop-buy").getByRole("button", { name: "Favoritado" }).click();
    await page.goto("/favorites");
    await expect(page.getByText("Nenhum NFT favorito ainda.")).toBeVisible();
  });

  test("falha 401 em favorito desfaz a atualização otimista", async ({ page }) => {
    await login(page);
    await page.goto("/nft/nft-001");
    const favorite = page.locator(".desktop-buy").getByRole("button", { name: "Favoritar", exact: true });
    await expect(favorite).toBeVisible();
    // Retira apenas a credencial do transporte; o cache ainda mantém a sessão.
    // A mutation REST deve receber 401 e desfazer a mudança otimista.
    await page.evaluate(() => localStorage.removeItem("jungle.auth.token"));
    await favorite.click();
    await expect(page.locator(".desktop-buy").getByRole("button", { name: "Favoritar", exact: true }))
      .toBeVisible({ timeout: 10_000 });
  });

  test("troca de conta não exibe favoritos de outro usuário", async ({ page }) => {
    await login(page);
    await page.goto("/nft/nft-001");
    await page.locator(".desktop-buy").getByRole("button", { name: "Favoritar", exact: true }).click();
    await expect(page.locator(".desktop-buy").getByRole("button", { name: "Favoritado" })).toBeVisible();
    await page.goto("/profile");
    await page.locator(".account-sidebar").getByRole("button", { name: "Sair" }).click();
    await login(page, "lucas@jungle.test");
    await page.goto("/favorites");
    await expect(page.locator("article.nft-card")).toHaveCount(0);
    await expect(page.getByText("Nenhum NFT favorito ainda.")).toBeVisible();
  });
});

// ==========================================
// CARRINHO E CUPONS
// ==========================================

test.describe("Carrinho e cupons", () => {
  test.use({ viewport: desktop });

  test("quantidade aumenta, diminui e remoção esvazia o carrinho", async ({ page }) => {
    await addNft(page);
    const item = page.locator(".cart-row");
    await item.getByRole("button", { name: "Aumentar" }).click();
    await expect(item.locator(".quantity")).toContainText("2");
    await page.reload();
    await expect(item.locator(".quantity")).toContainText("2");
    await item.getByRole("button", { name: "Diminuir" }).click();
    await expect(item.locator(".quantity")).toContainText("1");
    await item.getByRole("button", { name: "Remover NFT" }).click();
    await expect(page.getByText("Seu carrinho está vazio.")).toBeVisible();
  });

  test("cupom válido aplica desconto e cupons inválido/expirado são rejeitados", async ({ page }) => {
    await addNft(page);
    const coupon = page.locator(".cart-summary #coupon");
    const apply = page.locator(".cart-summary").getByRole("button", { name: "Aplicar" });
    await coupon.fill("KURIO10");
    await apply.click();
    await expect(page.locator(".cart-summary .notice")).toContainText("Cupom aplicado");
    await coupon.fill("EXPIRED10");
    await apply.click();
    await expect(page.locator(".cart-summary .notice")).toContainText(/expirou|expirad[oa]/i);
    await coupon.fill("NAOEXISTE");
    await apply.click();
    await expect(page.locator(".cart-summary .notice")).toContainText(/inválido|não existe|desconhecido/i);
  });

  test("itens do visitante são mesclados ao carrinho autenticado", async ({ page }) => {
    await addNft(page);
    await page.locator(".cart-summary").getByRole("button", { name: /Conectar e finalizar/ }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.getByRole("textbox", { name: "E-mail" }).fill("ana@jungle.test");
    await page.getByLabel("Senha", { exact: true }).fill("Demo@12345");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/checkout/);
    await page.goto("/cart");
    await expect(page.locator(".cart-row")).toHaveCount(1);
    await page.reload();
    await expect(page.locator(".cart-row")).toHaveCount(1);
  });
});

// ==========================================
// PAGAMENTO, FALHAS E RECUPERAÇÃO
// ==========================================

test.describe("Pagamento e idempotência no fluxo visual", () => {
  test.use({ viewport: desktop });

  test("pagamento recusado mostra estado de recusa e preserva o carrinho", async ({ page }) => {
    await prepareCheckout(page);
    const scenario = await apiScenario(page, "/__test/orders/scenario", { outcome: "decline" });
    expect(scenario.status).toBe(200);
    await page.getByRole("button", { name: "Confirmar compra" }).click();
    await expect(page).toHaveURL(/\/order\//);
    await expect(page.getByRole("heading", { name: "Pagamento não aprovado" })).toBeVisible({ timeout: 15_000 });
    await page.goto("/cart");
    await expect(page.locator(".cart-row")).toHaveCount(1);
  });

  test("timeout de pagamento preserva pedido recuperável após refresh", async ({ page }) => {
    await prepareCheckout(page);
    const scenario = await apiScenario(page, "/__test/orders/scenario", { outcome: "timeout" });
    expect(scenario.status).toBe(200);
    await page.getByRole("button", { name: "Confirmar compra" }).click();
    await expect(page).toHaveURL(/\/order\//, { timeout: 15_000 });
    const orderUrl = page.url();
    await page.reload();
    await expect(page).toHaveURL(orderUrl);
    await expect(page.locator(".receipt-meta")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".receipt-meta")).toContainText(/pending|confirmed|declined/);
    });

  test("duplo clique não gera dois pedidos no MSW", async ({ page }) => {
    await prepareCheckout(page);
    const button = page.getByRole("button", { name: "Confirmar compra" });
    await button.dblclick();
    await expect(page).toHaveURL(/\/order\//, { timeout: 15_000 });
    await page.goto("/orders");
    await expect(page.locator(".orders-list .order-entry")).toHaveCount(1);
  });

  test("conexão com carteira recusada apresenta erro sem criar pedido", async ({ page }) => {
    await prepareCheckout(page);
    const scenario = await apiScenario(page, "/__test/wallet-connection/scenario", { nextConnect: "reject" });
    expect(scenario.status).toBe(200);
    await page.getByRole("button", { name: "Confirmar compra" }).click();
    await expect(page.locator(".payment-summary [role='alert']")).toContainText("Conexão recusada");
    await expect(page).toHaveURL(/\/checkout/);
  });
});

// ==========================================
// RESPONSIVIDADE E NAVEGAÇÃO POR TECLADO
// ==========================================

for (const [label, viewport] of [
  ["desktop", desktop],
  ["mobile", mobile],
] as const) {
  test.describe(`Acessibilidade de fluxo — ${label}`, () => {
    test.use({ viewport });

    test("formulário de login permite navegar e enviar pelo teclado", async ({ page }) => {
      await page.goto("/login");
      const email = page.getByRole("textbox", { name: "E-mail" });
      await email.focus();
      await email.fill("ana@jungle.test");
      await page.getByLabel("Senha", { exact: true }).fill("Demo@12345");
      await page.getByLabel("Senha", { exact: true }).press("Enter");
      await expect(page).toHaveURL(/\/profile/);
    });

    test("páginas de catálogo não criam overflow horizontal", async ({ page }) => {
      await page.goto("/market");
      await expect(page.locator(".market-page")).toBeVisible();
      const sizes = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(sizes.content).toBeLessThanOrEqual(sizes.viewport + 1);
    });
  });
}

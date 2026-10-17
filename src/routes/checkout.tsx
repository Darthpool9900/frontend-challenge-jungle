import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

import Decimal from "decimal.js";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Wallet, CheckCircle2 } from "lucide-react";
import { useCart } from "@/features/cart/cart.hooks";
import { useAuthSession } from "@/features/auth/auth.hooks";
import { useWallets, useCreateWallet } from "@/features/wallet/wallet.hooks";
import {
  useWalletConnection,
  useConnectWallet,
} from "@/features/wallet/wallet-connection.hooks";
import { useCreateQuote } from "@/features/checkout/quote.hooks";
import {
  useCheckoutOrder,
  useRecoverCheckout,
} from "@/features/orders/order-recovery.hooks";
import type { WalletNetwork } from "@/contracts/wallet";
import { Shell, Breadcrumb, NotLoggedIn } from "@/kurio/Shell";
import { displayName, eth, messageOf, nftArt, networks } from "@/kurio/visual";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });
// eslint-disable-next-line react-refresh/only-export-components
function CheckoutPage() {
  const cart = useCart(),
    session = useAuthSession(),
    wallets = useWallets(),
    connectState = useWalletConnection(),
    createWallet = useCreateWallet(),
    connect = useConnectWallet(),
    quote = useCreateQuote(),
    checkout = useCheckoutOrder(),
    recover = useRecoverCheckout(),
    nav = useNavigate();
  const user = session.data?.user;
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [username, setUsername] = useState(""),
    [network, setNetwork] = useState<WalletNetwork>("ethereum"),
    [selectedWallet, setSelectedWallet] = useState(""),
    [coupon, setCoupon] = useState(
      sessionStorage.getItem("kurio.coupon") || "",
    ),
    [notes, setNotes] = useState(""),
    [error, setError] = useState(""),
    [total, setTotal] = useState(""),
    [discount, setDiscount] = useState("0"),
    [fee, setFee] = useState("0.012"),
    [newAddress, setNewAddress] = useState(""),
    [newLabel, setNewLabel] = useState("Minha carteira"),
    [showWallet, setShowWallet] = useState(false);
  const lines = cart.data?.items || [],
    wallet = wallets.data?.find(
      (w) =>
        w.id ===
        (selectedWallet ||
          wallets.data?.find((w) => w.kind === "primary")?.id ||
          wallets.data?.[0]?.id),
    );
  const activeNetwork = showWallet ? network : wallet?.network || network;
  const displayCollectorName = name || user?.name || "";
  const displayCollectorEmail = email || user?.email || "";
  const displayUsername = username || user?.name || "";
  const makeQuote = async () => {
    const q = await quote.mutateAsync({
      network: activeNetwork,
      couponCode: coupon || undefined,
    });
    setTotal(q.totalEth);
    setDiscount(q.discountEth);
    setFee(q.networkFeeEth);
    return q;
  };
  const pay = async () => {
    setError("");
    if (!user) {
      void nav({ to: "/login" });
      return;
    }
    if (!lines.length) {
      setError("Carrinho vazio.");
      return;
    }
    if (!wallet) {
      setError("Selecione ou cadastre uma carteira.");
      return;
    }
    try {
      if (
        connectState.data?.status !== "connected" ||
        connectState.data.walletId !== wallet.id ||
        connectState.data.network !== wallet.network
      ) {
        await connect.mutateAsync({
          walletId: wallet.id,
          network: wallet.network,
        });
      }
      const q = await makeQuote();
      if (q.status !== "ready") {
        setError("Revise os itens do carrinho antes de continuar.");
        return;
      }
      const result = await checkout.mutateAsync({
        quoteId: q.quoteId,
        walletId: wallet.id,
        collector: {
          name: displayCollectorName.trim(),
          email: displayCollectorEmail.trim(),
        },
      });
      sessionStorage.setItem("kurio.lastOrderId", result.order.id);
      void nav({ to: "/order/$orderId", params: { orderId: result.order.id } });
    } catch (e) {
      setError(messageOf(e));
    }
  };
  const addWallet = async () => {
    setError("");
    try {
      const w = await createWallet.mutateAsync({
        label: newLabel,
        address: newAddress,
        network: activeNetwork,
        kind: wallets.data?.some((w) => w.kind === "primary")
          ? "secondary"
          : "primary",
      });
      setSelectedWallet(w.id);
      setShowWallet(false);
    } catch (e) {
      setError(messageOf(e));
    }
  };
  return (
    <Shell mobileNav={false}>
      <div className="mobile-page-title">
        <Button unstyled onClick={() => history.back()} aria-label="Voltar">
          <ChevronLeft />
        </Button>
        <h1>Pagamento com carteira</h1>
      </div>
      <div className="desktop-only">
        <Breadcrumb
          items={[{ title: "Mercado", to: "/" }, { title: "Pagamento" }]}
        />
      </div>
      {!user ? (
        <NotLoggedIn subject="finalizar sua compra" />
      ) : (
        <div className="checkout-layout">
          <section className="collector">
            <h2>Perfil do colecionador</h2>
            <div className="form-grid">
              <Label unstyled>
                Nome de exibição <em>*</em>
                <Input
                  unstyled
                  required
                  value={displayCollectorName}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome de exibição"
                />
              </Label>
              <Label unstyled>
                Nome de usuário <em>*</em>
                <Input
                  unstyled
                  required
                  value={displayUsername}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nome de usuário"
                />
              </Label>
              <Label unstyled>
                Rede <em>*</em>
                <NativeSelect
                  unstyled
                  value={activeNetwork}
                  onChange={(e) => {
                    setNetwork(e.target.value as WalletNetwork);
                    setSelectedWallet("");
                  }}
                >
                  {networks.map((n) => (
                    <option value={n} key={n}>
                      {n[0].toUpperCase() + n.slice(1)}
                    </option>
                  ))}
                </NativeSelect>
              </Label>
              <Label unstyled>
                Nome do perfil <em>*</em>
                <Input
                  unstyled
                  value={displayCollectorName}
                  onChange={(e) => setName(e.target.value)}
                />
              </Label>
              <Label unstyled>
                Endereço da carteira <em>*</em>
                <Input
                  unstyled
                  placeholder="Endereço 0x da carteira"
                  value={wallet?.address || newAddress}
                  readOnly={!!wallet}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
              </Label>
              <Label unstyled>
                Carteira secundária
                <Input
                  unstyled
                  value={
                    wallets.data?.find((w) => w.kind === "secondary")
                      ?.address || ""
                  }
                  placeholder="ENS ou carteira secundária (opcional)"
                  readOnly
                />
              </Label>
              <Label unstyled>
                Tipo de carteira <em>*</em>
                <NativeSelect
                  unstyled
                  value={selectedWallet}
                  onChange={(e) => {
                    const w = wallets.data?.find(
                      (w) => w.id === e.target.value,
                    );
                    setSelectedWallet(e.target.value);
                    if (w) setNetwork(w.network);
                  }}
                >
                  <option value="">Selecione uma carteira</option>
                  {wallets.data?.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label} ({w.network})
                    </option>
                  ))}
                </NativeSelect>
              </Label>
              <Label unstyled>
                Código de indicação
                <Input unstyled placeholder="Opcional" />
              </Label>
              <Label unstyled>
                E-mail <em>*</em>
                <Input
                  unstyled
                  type="email"
                  required
                  value={displayCollectorEmail}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Label>
              <Label unstyled>
                Nome ENS
                <NativeSelect unstyled defaultValue=".eth">
                  <option>.eth</option>
                  <option>.base.eth</option>
                </NativeSelect>
              </Label>
            </div>
            <Label unstyled className="check-line">
              <Input
                unstyled
                type="checkbox"
                checked={showWallet}
                onChange={(e) => setShowWallet(e.target.checked)}
              />{" "}
              Usar outra carteira?
            </Label>
            {showWallet && (
              <div className="wallet-create-inline">
                <Label unstyled>
                  Nome da carteira
                  <Input
                    unstyled
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />
                </Label>
                <Label unstyled>
                  Endereço 0x
                  <Input
                    unstyled
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="0x..."
                  />
                </Label>
                <Button
                  unstyled
                  className="primary"
                  onClick={() => void addWallet()}
                  disabled={createWallet.isPending}
                >
                  Salvar carteira
                </Button>
              </div>
            )}
            <Label unstyled>
              Observação do colecionador (opcional)
              <Textarea
                unstyled
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
              />
            </Label>
          </section>
          <aside className="payment-summary">
            <div className="mobile-wallet-top">
              <h2>Carteira conectada</h2>
              <Button unstyled onClick={() => setShowWallet(!showWallet)}>
                Trocar carteira
              </Button>
            </div>
            <h2>Seus NFTs</h2>
            <div className="payment-thead">
              <span>NFTs</span>
              <span>Subtotal</span>
            </div>
            {lines.map((line) => (
              <div className="payment-item" key={line.editionId}>
                <img src={nftArt(line.nftId)} alt={line.nftName} />
                <div>
                  <strong>{displayName(line.nftId, line.nftName)}</strong>
                  <small>
                    ID do token · {line.editionName} (x {line.quantity})
                  </small>
                </div>
                <strong>{eth(line.lineTotalEth)}</strong>
              </div>
            ))}
            <form
              className="promo-apply"
              onSubmit={(e) => {
                e.preventDefault();
                void makeQuote().catch((e) => setError(messageOf(e)));
              }}
            >
              <Label unstyled>Tem um código promocional? Aplique aqui</Label>
              <div>
                <Input
                  unstyled
                  aria-label="Código promocional"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Código promocional"
                />
                <Button unstyled className="primary">
                  Aplicar
                </Button>
              </div>
            </form>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{eth(cart.data?.subtotalEth)}</dd>
              </div>
              <div>
                <dt>Desconto do lançamento</dt>
                <dd>(-) {eth(discount)}</dd>
              </div>
              <div>
                <dt>Taxa de rede</dt>
                <dd>{eth(fee)}</dd>
              </div>
            </dl>
            <p className="tax-hint">Taxa estimada</p>
            <div className="summary-total">
              <strong>Total</strong>
              <strong>
                {eth(
                  total ||
                    new Decimal(cart.data?.subtotalEth ?? "0")
                      .plus(fee)
                      .toString(),
                )}
              </strong>
            </div>
            <h2 className="wallet-heading">Carteira e rede</h2>
            {wallets.data?.length ? (
              <div className="wallet-radio-list">
                {wallets.data.map((w) => (
                  <Button
                    unstyled
                    key={w.id}
                    className={`wallet-radio ${selectedWallet === w.id ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedWallet(w.id);
                      setNetwork(w.network);
                    }}
                  >
                    <span className="radio-bubble" />
                    {w.label} <small>· {w.network}</small>
                    {connectState.data?.walletId === w.id && (
                      <CheckCircle2 size={16} />
                    )}
                  </Button>
                ))}
              </div>
            ) : (
              <Button
                unstyled
                className="outline-btn full"
                onClick={() => setShowWallet(true)}
              >
                <Wallet size={16} /> Adicionar carteira
              </Button>
            )}
            <div className="mobile-checkout-wallet">
              <Button
                unstyled
                className="outline-btn full"
                onClick={() => setShowWallet(!showWallet)}
              >
                {showWallet ? "Fechar cadastro" : "Adicionar nova carteira"}
              </Button>
              {showWallet && (
                <form
                  className="wallet-create-inline"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void addWallet();
                  }}
                >
                  <Label unstyled>
                    Apelido da carteira
                    <Input
                      unstyled
                      required
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                    />
                  </Label>
                  <Label unstyled>
                    Endereço da carteira
                    <Input
                      unstyled
                      required
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="0x..."
                    />
                  </Label>
                  <Label unstyled>
                    Rede
                    <NativeSelect
                      unstyled
                      value={network}
                      onChange={(e) =>
                        setNetwork(e.target.value as WalletNetwork)
                      }
                    >
                      {networks.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </NativeSelect>
                  </Label>
                  <Button unstyled className="primary" type="submit">
                    Salvar carteira
                  </Button>
                </form>
              )}
            </div>
            <div className="wallet-provider-list">
              <Label unstyled>
                <Input unstyled type="radio" name="provider" /> MetaMask
              </Label>
              <Label unstyled>
                <Input unstyled type="radio" name="provider" defaultChecked />{" "}
                Coinbase Wallet
              </Label>
              <Label unstyled>
                <Input unstyled type="radio" name="provider" /> WalletConnect
              </Label>
            </div>
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
            {!lines.length && (
              <p className="notice">Adicione NFTs ao carrinho para concluir.</p>
            )}
            <Button
              unstyled
              className="primary full checkout-pay"
              disabled={checkout.isPending || quote.isPending || !lines.length}
              onClick={() => void pay()}
            >
              {checkout.isPending ? "Processando..." : "Confirmar compra"}
            </Button>
            <Button
              unstyled
              className="recover-link"
              onClick={async () => {
                if (!user) return;
                try {
                  const result = await recover.mutateAsync();
                  if (result)
                    void nav({
                      to: "/order/$orderId",
                      params: { orderId: result.order.id },
                    });
                  else setError("Nenhum pedido pendente para recuperar.");
                } catch (e) {
                  setError(messageOf(e));
                }
              }}
            >
              Recuperar pagamento pendente
            </Button>
          </aside>
        </div>
      )}
    </Shell>
  );
}

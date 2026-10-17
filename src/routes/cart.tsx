import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import Decimal from "decimal.js";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
} from "@/features/cart/cart.hooks";
import { useNftList } from "@/features/nfts/nft.hooks";
import { useCreateQuote } from "@/features/checkout/quote.hooks";
import { useAuthSession } from "@/features/auth/auth.hooks";
import { Shell, Breadcrumb } from "@/kurio/Shell";
import { Recommend } from "@/kurio/NftCard";
import { CartSkeleton } from "@/kurio/Skeletons";
import {
  displayName,
  nftArt,
  eth,
  messageOf,
  tokenFromName,
} from "@/kurio/visual";

export const Route = createFileRoute("/cart")({ component: CartPage });
// eslint-disable-next-line react-refresh/only-export-components
function CartPage() {
  const cart = useCart(),
    update = useUpdateCartItem(),
    remove = useRemoveCartItem(),
    list = useNftList({ pageSize: 9 }),
    quote = useCreateQuote(),
    session = useAuthSession(),
    nav = useNavigate(),
    [coupon, setCoupon] = useState(""),
    [message, setMessage] = useState(""),
    [discount, setDiscount] = useState("0"),
    [fee, setFee] = useState("0.012"),
    [total, setTotal] = useState("");
  const lines = cart.data?.items || [];
  const apply = async () => {
    setMessage("");
    try {
      const result = await quote.mutateAsync({
        network: "ethereum",
        couponCode: coupon || undefined,
      });
      setDiscount(result.discountEth);
      setFee(result.networkFeeEth);
      setTotal(result.totalEth);
      sessionStorage.setItem("kurio.coupon", coupon.trim().toUpperCase());
      setMessage(result.couponCode ? "Cupom aplicado!" : "Cotação atualizada.");
    } catch (e) {
      setMessage(messageOf(e));
    }
  };
  const next = () => {
    if (!lines.length) return;
    const bad = lines.some((l) => l.status !== "available" || l.priceChanged);
    if (bad) {
      setMessage("Revise os itens indisponíveis ou com preços alterados.");
      return;
    }
    if (!session.data?.user)
      sessionStorage.setItem("kurio.afterLogin", "/checkout");
    void nav({ to: session.data?.user ? "/checkout" : "/login" });
  };
  return (
    <Shell mobileNav={false}>
      <div className="mobile-page-title">
        <Button unstyled onClick={() => history.back()} aria-label="Voltar">
          <ChevronLeft />
        </Button>
        <h1>Carrinho de NFTs</h1>
      </div>
      <div className="desktop-only">
        <Breadcrumb
          items={[{ title: "Mercado", to: "/" }, { title: "Carrinho" }]}
        />
      </div>
      <div className="cart-layout">
        <section className="cart-items">
          <div className="cart-table-head">
            <span>NFTs</span>
            <span>Preço</span>
            <span>Edições</span>
            <span>Total</span>
          </div>
          {cart.isLoading ? (
            <CartSkeleton />
          ) : !lines.length ? (
            <div className="empty-state">
              <h2>Seu carrinho está vazio.</h2>
              <p>Descubra obras digitais para começar sua coleção.</p>
              <Link to="/" className="primary">
                Explorar NFTs
              </Link>
            </div>
          ) : (
            lines.map((line) => (
              <div className="cart-row" key={`${line.nftId}:${line.editionId}`}>
                <img src={nftArt(line.nftId)} alt={line.nftName} />
                <div className="cart-item-name">
                  <Link to="/nft/$nftId" params={{ nftId: line.nftId }}>
                    {displayName(line.nftId, line.nftName)}
                  </Link>
                  <small>
                    ID do token:{" "}
                    {tokenFromName(displayName(line.nftId, line.nftName))} ·{" "}
                    {line.editionName}
                  </small>
                  {(line.status !== "available" || line.priceChanged) && (
                    <small className="error-text">
                      {line.priceChanged
                        ? "Preço atualizado; revise o item."
                        : "Estoque indisponível"}
                    </small>
                  )}
                </div>
                <strong className="line-unit">{eth(line.unitPriceEth)}</strong>
                <div className="quantity">
                  <Button
                    unstyled
                    title="Diminuir"
                    disabled={update.isPending}
                    onClick={() =>
                      line.quantity === 1
                        ? remove.mutate({
                            nftId: line.nftId,
                            editionId: line.editionId,
                          })
                        : update.mutate({
                            nftId: line.nftId,
                            editionId: line.editionId,
                            quantity: line.quantity - 1,
                          })
                    }
                  >
                    <Minus size={15} />
                  </Button>
                  {line.quantity}
                  <Button
                    unstyled
                    title="Aumentar"
                    disabled={
                      update.isPending ||
                      line.quantity >= line.availableQuantity
                    }
                    onClick={() =>
                      update.mutate({
                        nftId: line.nftId,
                        editionId: line.editionId,
                        quantity: line.quantity + 1,
                      })
                    }
                  >
                    <Plus size={15} />
                  </Button>
                </div>
                <strong className="line-total">{eth(line.lineTotalEth)}</strong>
                <Button
                  unstyled
                  className="remove-item"
                  title="Remover NFT"
                  onClick={() =>
                    remove.mutate({
                      nftId: line.nftId,
                      editionId: line.editionId,
                    })
                  }
                >
                  <Trash2 size={20} />
                </Button>
              </div>
            ))
          )}
        </section>
        <aside className="cart-summary">
          <h2>Resumo da carteira</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void apply();
            }}
          >
            <Label unstyled htmlFor="coupon">
              Código promocional
            </Label>
            <div className="coupon-field">
              <Input
                unstyled
                id="coupon"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Digite o código promocional..."
              />
              <Button
                unstyled
                type="submit"
                className="primary"
                disabled={quote.isPending}
              >
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
                    .minus(discount)
                    .plus(fee)
                    .toString(),
              )}
            </strong>
          </div>
          {message && (
            <p className="notice" role="status">
              {message}
            </p>
          )}
          <Button
            unstyled
            className="primary full"
            onClick={next}
            disabled={!lines.length}
          >
            Conectar e finalizar <ArrowRight size={16} />
          </Button>
          <Link to="/" className="keep-shopping">
            Continuar explorando
          </Link>
        </aside>
      </div>
      <div className="desktop-only">
        <Recommend
          title="Colecionadores também viram"
          items={(list.data?.items || []).slice(1)}
        />
      </div>
      <div className="mobile-cart-action">
        <Button
          unstyled
          className="primary full"
          onClick={next}
          disabled={!lines.length}
        >
          Conectar e finalizar
        </Button>
      </div>
    </Shell>
  );
}

import { Button } from "@/components/ui/button";

import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import {
  ChevronLeft,
  Heart,
  Minus,
  Plus,
  Share2,
  ShoppingCart,
} from "lucide-react";

import { useNftDetail, useNftList } from "@/features/nfts/nft.hooks";

import { useAddCartItem } from "@/features/cart/cart.hooks";
import { useAuthSession } from "@/features/auth/auth.hooks";

import {
  useFavorites,
  useAddFavorite,
  useRemoveFavorite,
} from "@/features/favorites/favorites.hooks";

import { Breadcrumb, Shell } from "@/kurio/Shell";
import { Recommend } from "@/kurio/NftCard";
import { DetailSkeleton } from "@/kurio/Skeletons";

import {
  displayName,
  nftArt,
  eth,
  tokenFromName,
  messageOf,
} from "@/kurio/visual";

import "./nft-detail.css";

// ==========================================
// ROTA
// ==========================================

export const Route = createFileRoute("/nft/$nftId")({
  component: NftDetailPage,
});

// eslint-disable-next-line react-refresh/only-export-components
function NftDetailPage() {
  const { nftId } = Route.useParams();
  const navigate = useNavigate();

  // ========================================
  // API E HOOKS
  // ========================================

  const detail = useNftDetail(nftId);
  const recommendations = useNftList({
    pageSize: 9,
  });

  const addCart = useAddCartItem();
  const session = useAuthSession();

  const favorites = useFavorites();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  // ========================================
  // ESTADO
  // ========================================

  const [editionId, setEditionId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [tab, setTab] = useState<"details" | "reviews">("details");

  const [error, setError] = useState("");

  // ========================================
  // NFT E EDIÇÃO SELECIONADA
  // ========================================

  const nft = detail.data?.nft;

  const edition =
    nft?.editions.find(
      (item) => item.id === (editionId || `${nft.id}-edition-3`),
    ) ?? nft?.editions[0];

  const stock = edition?.availableQuantity ?? 0;

  const selectedQuantity = Math.min(quantity, Math.max(1, stock));

  const isFavorite = Boolean(favorites.data?.nftIds.includes(nftId));

  const isSavingFavorite = addFavorite.isPending || removeFavorite.isPending;

  const title = nft ? displayName(nft.id, nft.name) : "";

  // ========================================
  // VOLTAR
  // ========================================

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      void navigate({
        to: "/market",
      });
    }
  }

  // ========================================
  // FAVORITOS
  // ========================================

  function toggleFavorite() {
    if (!session.data?.user) {
      void navigate({
        to: "/login",
      });

      return;
    }

    if (isSavingFavorite) {
      return;
    }

    if (isFavorite) {
      removeFavorite.mutate(nftId);
    } else {
      addFavorite.mutate(nftId);
    }
  }

  // ========================================
  // CARRINHO / COMPRA
  // ========================================

  async function addItem(goToCart: boolean) {
    if (!nft || !edition || stock < 1) {
      return;
    }

    setError("");

    try {
      await addCart.mutateAsync({
        nftId: nft.id,
        editionId: edition.id,
        quantity: selectedQuantity,
      });

      if (goToCart) {
        await navigate({
          to: "/cart",
        });
      }
    } catch (cause) {
      setError(messageOf(cause));
    }
  }

  // ========================================
  // QUANTIDADE
  // ========================================

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    setQuantity((current) => Math.min(stock, current + 1));
  }

  // ========================================
  // RENDERIZAÇÃO
  // ========================================

  return (
    <Shell active="Mercado" mobileNav={false}>
      <div className="nft-detail-page">
        {/* BREADCRUMB DESKTOP */}

        <div className="desktop-only nft-detail-breadcrumb">
          <Breadcrumb
            items={[
              {
                title: "Mercado",
                to: "/market",
              },
            ]}
          />
        </div>

        {!nft ? (
          detail.isLoading ? (
            <DetailSkeleton />
          ) : (
            <div className="empty-state">NFT não encontrado.</div>
          )
        ) : (
          <>
            <div className="detail-layout">
              {/* ============================
                  IMAGEM
                 ============================ */}

              <div className="detail-media">
                {/* NAVEGAÇÃO MOBILE */}

                <div className="nft-mobile-nav">
                  <Button
                    unstyled
                    type="button"
                    onClick={goBack}
                    aria-label="Voltar"
                  >
                    <ChevronLeft size={19} />
                  </Button>

                  <Button
                    unstyled
                    type="button"
                    onClick={toggleFavorite}
                    disabled={isSavingFavorite}
                    aria-label={
                      isFavorite ? "Remover dos favoritos" : "Favoritar NFT"
                    }
                    aria-pressed={isFavorite}
                  >
                    <Heart
                      size={19}
                      fill={isFavorite ? "currentColor" : "none"}
                    />
                  </Button>
                </div>

                {/* MINIATURAS DESKTOP */}

                <div className="detail-thumbs" aria-label="Prévia do NFT">
                  <div className="active">
                    <img src={nftArt(nft)} alt={`Miniatura de ${title}`} />
                  </div>
                </div>

                {/* IMAGEM PRINCIPAL */}

                <div className="detail-main-img">
                  <img
                    src={nftArt(nft)}
                    alt={title}
                    width={450}
                    height={450}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                </div>
              </div>

              {/* ============================
                  INFORMAÇÕES DO NFT
                 ============================ */}

              <div className="detail-info">
                {/* TÍTULO E AVALIAÇÃO */}

                <h1>
                  <span>{title}</span>

                  <span className="mobile-rating">★ 4.8 (19)</span>
                </h1>

                {/* PREÇO DESKTOP */}

                <div className="desktop-only detail-price-desktop">
                  <strong className="accent">{eth(edition?.priceEth)}</strong>

                  <span className="stars">
                    ★★★★★
                    <span>19 avaliações de colecionadores</span>
                  </span>

                  <hr />
                </div>

                {/* DESCRIÇÃO */}

                <b className="desktop-only">Sobre este NFT:</b>

                <p className="detail-intro">
                  {nft.id === "nft-001"
                    ? "Um colecionável digital 1/50 finalizado à mão da coleção Kurio Editions, verificado na Ethereum."
                    : nft.description}
                </p>

                {/* EDIÇÕES */}

                <b className="detail-edition-label">Edição:</b>

                <div
                  className="edition-switch"
                  role="group"
                  aria-label="Selecionar edição"
                >
                  {nft.editions.map((item) => (
                    <Button
                      unstyled
                      type="button"
                      key={item.id}
                      className={item.id === edition?.id ? "active" : ""}
                      disabled={item.availableQuantity === 0}
                      aria-pressed={item.id === edition?.id}
                      onClick={() => {
                        setEditionId(item.id);
                        setQuantity(1);
                        setError("");
                      }}
                    >
                      {item.name}
                    </Button>
                  ))}
                </div>

                {/* =========================
                    COMPRA SOMENTE DESKTOP
                   ========================= */}

                <div className="desktop-buy">
                  <div className="quantity">
                    <Button
                      unstyled
                      type="button"
                      onClick={decreaseQuantity}
                      disabled={selectedQuantity <= 1}
                      aria-label="Diminuir quantidade"
                    >
                      <Minus size={17} />
                    </Button>

                    <span>{selectedQuantity}</span>

                    <Button
                      unstyled
                      type="button"
                      onClick={increaseQuantity}
                      disabled={selectedQuantity >= stock}
                      aria-label="Aumentar quantidade"
                    >
                      <Plus size={17} />
                    </Button>
                  </div>

                  <Button
                    unstyled
                    type="button"
                    className="primary"
                    disabled={stock < 1 || addCart.isPending}
                    onClick={() => {
                      void addItem(true);
                    }}
                  >
                    COMPRAR
                  </Button>

                  <Button
                    unstyled
                    type="button"
                    className="outlined"
                    disabled={isSavingFavorite}
                    onClick={toggleFavorite}
                  >
                    <Heart
                      size={17}
                      fill={isFavorite ? "currentColor" : "none"}
                    />

                    {isFavorite ? "Favoritado" : "Favoritar"}
                  </Button>
                </div>

                {/* =========================
                    METADADOS
                   ========================= */}

                <div className="detail-metadata">
                  <p>ID do token: {tokenFromName(title)}</p>

                  <p>Coleção: {nft.collection.name}</p>

                  <p>
                    Atributos:{" "}
                    {nft.attributes.map((item) => item.value).join(", ") || "—"}
                  </p>
                </div>

                {/* ESTOQUE E ERROS */}

                {stock < 1 && (
                  <p className="detail-stock-notice">Edição esgotada</p>
                )}

                {error && (
                  <p className="error-text" role="alert">
                    {error}
                  </p>
                )}

                {/* COMPARTILHAR DESKTOP */}

                <div className="desktop-only detail-share">
                  Compartilhar este NFT:
                  <Button
                    unstyled
                    type="button"
                    className="link-button"
                    aria-label="Copiar link do NFT"
                    onClick={() => {
                      void navigator.clipboard?.writeText(window.location.href);
                    }}
                  >
                    <Share2 size={18} />
                  </Button>
                </div>

                {/* =========================
                    COMPRA SOMENTE MOBILE
                   ========================= */}

                <div className="mobile-detail-buy">
                  {/* QUANTIDADE E PREÇO */}

                  <div className="mobile-price-row">
                    <div className="quantity">
                      <span>Qtd:</span>

                      <Button
                        unstyled
                        type="button"
                        onClick={decreaseQuantity}
                        disabled={selectedQuantity <= 1}
                        aria-label="Diminuir quantidade"
                      >
                        <Minus size={14} />
                      </Button>

                      <span>{selectedQuantity}</span>

                      <Button
                        unstyled
                        type="button"
                        onClick={increaseQuantity}
                        disabled={selectedQuantity >= stock}
                        aria-label="Aumentar quantidade"
                      >
                        <Plus size={14} />
                      </Button>
                    </div>

                    <strong>{eth(edition?.priceEth)}</strong>
                  </div>

                  {/* BOTÕES */}

                  <div className="mobile-buy-buttons">
                    <Button
                      unstyled
                      type="button"
                      className="primary"
                      disabled={stock < 1 || addCart.isPending}
                      onClick={() => {
                        void addItem(true);
                      }}
                    >
                      {addCart.isPending ? "Adicionando..." : "Comprar NFT"}
                    </Button>

                    <Button
                      unstyled
                      type="button"
                      aria-label="Adicionar ao carrinho"
                      disabled={stock < 1 || addCart.isPending}
                      onClick={() => {
                        void addItem(false);
                      }}
                    >
                      <ShoppingCart size={20} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================
                CONTEÚDO SOMENTE DESKTOP
               ================================= */}

            <section className="detail-description desktop-only">
              <div
                className="catalog-tabs"
                role="group"
                aria-label="Informações do NFT"
              >
                <Button
                  unstyled
                  type="button"
                  className={tab === "details" ? "selected" : ""}
                  onClick={() => {
                    setTab("details");
                  }}
                >
                  Detalhes do NFT
                </Button>

                <Button
                  unstyled
                  type="button"
                  className={tab === "reviews" ? "selected" : ""}
                  onClick={() => {
                    setTab("reviews");
                  }}
                >
                  Avaliações de colecionadores (19)
                </Button>
              </div>

              {tab === "details" ? (
                <>
                  <p>
                    {title} é uma obra digital da coleção {nft.collection.name}.
                    Seus atributos fazem parte dos metadados deste colecionável.
                  </p>

                  <p>{nft.description}</p>

                  <b>Rede:</b>

                  <p>Ethereum (ambiente de demonstração).</p>
                </>
              ) : (
                <p>★ ★ ★ ★ ★ — Avaliado por 19 colecionadores.</p>
              )}
            </section>

            {/* RECOMENDAÇÕES DESKTOP */}

            <div className="desktop-only">
              <Recommend
                loading={recommendations.isPending}
                items={(recommendations.data?.items ?? []).filter(
                  (item) => item.id !== nftId,
                )}
                title="Mais desta coleção"
              />
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}

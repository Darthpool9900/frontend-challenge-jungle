import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, ShoppingCart, Search } from "lucide-react";
import type { NftSummary } from "@/contracts/nft";
import { useAuthSession } from "@/features/auth/auth.hooks";
import {
  useFavorites,
  useAddFavorite,
  useRemoveFavorite,
} from "@/features/favorites/favorites.hooks";
import { useAddCartItem } from "@/features/cart/cart.hooks";
import { nftArt, displayName, eth } from "./visual";

export function NftCard({
  nft,
  compact = false,
  priority = false,
}: {
  nft: NftSummary;
  compact?: boolean;
  priority?: boolean;
}) {
  const nav = useNavigate();
  const session = useAuthSession();
  const favorites = useFavorites();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const addCart = useAddCartItem();

  const favorite = Boolean(favorites.data?.nftIds.includes(nft.id));

  const toggle = () => {
    if (!session.data?.user) {
      void nav({ to: "/login" });
      return;
    }

    if (favorite) {
      removeFavorite.mutate(nft.id);
    } else {
      addFavorite.mutate(nft.id);
    }
  };

  return (
    <Card asChild unstyled>
      <article
        className={`nft-card relative min-w-0 ${compact ? "compact" : ""}`}
      >
        <div className="nft-thumb relative bg-kurio-panel">
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            aria-label={`Ver ${displayName(nft.id, nft.name)}`}
          >
            <img
              src={nftArt(nft)}
              alt={displayName(nft.id, nft.name)}
              width={450}
              height={450}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
            />
          </Link>

          {nft.rarity === "legendary" && (
            <span className="rare-label">RARO</span>
          )}

          <Button
            unstyled
            className="favorite-btn"
            title={favorite ? "Remover dos favoritos" : "Favoritar"}
            onClick={toggle}
          >
            <Heart size={20} fill={favorite ? "currentColor" : "none"} />
          </Button>

          <div className="nft-hover-actions">
            <Button
              unstyled
              title="Adicionar ao carrinho"
              onClick={() =>
                addCart.mutate({
                  nftId: nft.id,
                  editionId: `${nft.id}-edition-3`,
                  quantity: 1,
                })
              }
              disabled={!nft.availableQuantity}
            >
              <ShoppingCart size={18} />
            </Button>

            <Link
              to="/nft/$nftId"
              params={{ nftId: nft.id }}
              title="Ver detalhes"
            >
              <Search size={18} />
            </Link>
          </div>
        </div>

        <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="nft-name">
          {displayName(nft.id, nft.name)}
        </Link>

        <p className="nft-price text-kurio-highlight">
          {eth(nft.startingPriceEth)}
        </p>
      </article>
    </Card>
  );
}

export function Recommend({
  items,
  title = "Mais desta coleção",
  loading = false,
}: {
  items: NftSummary[];
  title?: string;
  loading?: boolean;
}) {
  return (
    <section className="recommend">
      <h2 className="section-title">{title}</h2>

      <div className="recommend-grid">
        {loading
          ? Array.from({ length: 5 }, (_, index) => (
              <div className="nft-card" key={index} aria-hidden="true">
                <div className="nft-thumb kurio-skeleton" />
                <div className="kurio-skeleton skeleton-name" />
                <div className="kurio-skeleton skeleton-price" />
              </div>
            ))
          : items
              .slice(0, 5)
              .map((item) => <NftCard nft={item} key={item.id} compact />)}
      </div>

      <div className="dots">○ ● ○</div>
    </section>
  );
}

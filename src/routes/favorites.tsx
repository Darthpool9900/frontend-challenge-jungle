import { createFileRoute, Link } from "@tanstack/react-router";
import { useFavorites } from "@/features/favorites/favorites.hooks";
import { useNftList } from "@/features/nfts/nft.hooks";
import { AccountShell } from "@/kurio/Account";
import { NftCard } from "@/kurio/NftCard";
export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
});
// eslint-disable-next-line react-refresh/only-export-components
function FavoritesPage() {
  const favorites = useFavorites(),
    nfts = useNftList({ pageSize: 48 }),
    selected = (nfts.data?.items || []).filter((n) =>
      favorites.data?.nftIds.includes(n.id),
    );
  return (
    <AccountShell>
      <h2>Lista de interesse</h2>
      <p>Suas obras digitais favoritas, reunidas em um só lugar.</p>
      {selected.length ? (
        <div className="catalog-grid favorites-grid">
          {selected.map((n) => (
            <NftCard key={n.id} nft={n} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          Nenhum NFT favorito ainda.{" "}
          <Link to="/" className="primary">
            Explorar coleções
          </Link>
        </div>
      )}
    </AccountShell>
  );
}

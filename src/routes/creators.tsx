import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell, SectionTitle } from "@/kurio/Shell";
import { useNftList } from "@/features/nfts/nft.hooks";
import { NftCard } from "@/kurio/NftCard";
export const Route = createFileRoute("/creators")({ component: Creators });
// eslint-disable-next-line react-refresh/only-export-components
function Creators() {
  const nfts = useNftList({ pageSize: 9 });
  return (
    <Shell>
      <div className="simple-page">
        <h1>Criadores em destaque</h1>
        <p>
          Arte digital selecionada de criadores e estúdios da cultura digital.
        </p>
        <SectionTitle>Explore suas criações</SectionTitle>
        <div className="catalog-grid grid">
          {nfts.data?.items.slice(0, 6).map((n) => (
            <NftCard key={n.id} nft={n} />
          ))}
        </div>
        <Link to="/" className="primary">
          Ver marketplace
        </Link>
      </div>
    </Shell>
  );
}

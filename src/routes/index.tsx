import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useNftList } from "@/features/nfts/nft.hooks";
import type { NftListParams } from "@/contracts/nft";
import { catalogParams, validateCatalogSearch } from "@/kurio/catalog-search";
import { CatalogSkeleton } from "@/kurio/Skeletons";
import { Shell } from "@/kurio/Shell";
import { NftCard } from "@/kurio/NftCard";
import { nftArt } from "@/kurio/visual";

export const Route = createFileRoute("/")({
  validateSearch: validateCatalogSearch,
  component: Marketplace,
});
// eslint-disable-next-line react-refresh/only-export-components
function Marketplace() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const category = search.category ?? "";
  const tab = search.tab ?? "all";
  const sort: NftListParams["sort"] = search.sort ?? "recent";
  const page = search.page ?? 1;
  const [priceDraft, setPriceDraft] = useState<{
    applied: string;
    value: string;
  } | null>(null);
  const appliedPrice = search.maxPriceEth ?? "12.30";
  const limit =
    priceDraft?.applied === appliedPrice ? priceDraft.value : appliedPrice;
  const [mobileFilters, setMobileFilters] = useState(search.filters === "1");

  useEffect(() => {
    const open = () => setMobileFilters((value) => !value);
    window.addEventListener("kurio-open-filters", open);
    return () => window.removeEventListener("kurio-open-filters", open);
  }, []);

  function updateSearch(patch: Partial<typeof search>) {
    void navigate({
      to: "/",
      search: (previous) => ({ ...previous, ...patch, page: undefined }),
    });
  }

  const list = useNftList(catalogParams(search));
  const catalog = useNftList({ pageSize: 48 });
  const cards = list.data?.items ?? [];
  const countByCategory = (id: string) =>
    catalog.data?.items.filter((item) => item.category === id).length ?? 0;

  return (
    <Shell active="Início">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Bem-vindo à Kurio</p>
          <h1>
            SEJA DONO DO FUTURO
            <br />
            DA ARTE DIGITAL
          </h1>
          <p>
            Descubra NFTs selecionados de criadores emergentes e consagrados.
            Colecione arte digital rara, apoie artistas e tenha um parte da
            cultura da internet.
          </p>
          <a className="primary" href="#colecoes">
            EXPLORAR <ArrowRight className="mobile-only" size={17} />
          </a>
          <span className="hero-dots">● ● ●</span>
        </div>
        <div className="hero-image">
          <img src={nftArt("nft-001")} alt="Emerald Ape da Kurio" />
        </div>
      </section>
      <section id="colecoes" className="market-layout">
        <aside
          className={`catalog-sidebar ${mobileFilters ? "mobile-open" : ""}`}
        >
          <div className="filter-panel">
            <h3>Coleções</h3>
            {[
              ["Arte digital", "arte-digital"],
              ["Fotografia", "fotografia"],
              ["Música", "musica"],
              ["Arte 3D", "arte-3d"],
              ["Colecionáveis", "colecionaveis"],
              ["Generativa", "generativa"],
              ["Jogos", "gaming"],
              ["Assinaturas", "assinaturas"],
              ["Utilidade", "utilidade"],
            ].map(([label, key]) => (
              <Button
                unstyled
                className={category === key ? "chosen" : ""}
                key={key}
                onClick={() =>
                  updateSearch({ category: category === key ? undefined : key })
                }
              >
                {label}
                <span>({countByCategory(key)})</span>
              </Button>
            ))}
            <h3>Faixa de preço</h3>
            <Input
              unstyled
              type="range"
              min="0.02"
              max="12.30"
              step="0.01"
              value={limit}
              onChange={(e) =>
                setPriceDraft({ applied: appliedPrice, value: e.target.value })
              }
              aria-label="Preço máximo"
            />
            <p>
              Preço: 0,02 - {Number(limit).toFixed(2).replace(".", ",")} ETH
            </p>
            <Button
              unstyled
              className="primary"
              onClick={() => {
                updateSearch({
                  maxPriceEth: limit === "12.30" ? undefined : limit,
                });
                setMobileFilters(false);
              }}
            >
              Aplicar
            </Button>
            <h3>Rede</h3>
            <Button
              unstyled
              type="button"
              className="chosen"
              aria-pressed="true"
            >
              Ethereum <span>({catalog.data?.pagination.totalItems ?? 0})</span>
            </Button>
            <Button
              unstyled
              type="button"
              disabled
              title="Sem NFTs dessa rede nas fixtures"
            >
              Polygon <span>(0)</span>
            </Button>
            <Button
              unstyled
              type="button"
              disabled
              title="Sem NFTs dessa rede nas fixtures"
            >
              Solana <span>(0)</span>
            </Button>
          </div>
          <div className="side-feature">
            <strong>NFT EM DESTAQUE</strong>
            <h3>OFERTA LIMITADA</h3>
            <img
              src={nftArt("nft-002")}
              alt="NFT em destaque"
              loading="lazy"
              decoding="async"
              width={450}
              height={450}
            />
          </div>
        </aside>
        <div className="market-results">
          <div className="catalog-topline">
            <div className="catalog-tabs">
              {(
                [
                  ["all", "Todos os NFTs"],
                  ["new", "Novos lançamentos"],
                  ["popular", "Em alta"],
                ] as const
              ).map(([value, label]) => (
                <Button
                  unstyled
                  className={tab === value ? "selected" : ""}
                  key={value}
                  onClick={() =>
                    updateSearch({
                      tab: value,
                      sort: value === "popular" ? "popular" : "recent",
                    })
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
            <Label unstyled className="sort-label">
              Ordenar por:{" "}
              <NativeSelect
                unstyled
                value={sort}
                onChange={(e) =>
                  updateSearch({
                    sort: e.target.value as NftListParams["sort"],
                    tab: "all",
                  })
                }
              >
                <option value="recent">Listados recentemente</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
                <option value="popular">Popularidade</option>
              </NativeSelect>
            </Label>
          </div>
          {list.isPending ? (
            <CatalogSkeleton />
          ) : list.isError ? (
            <div className="empty-state" role="alert">
              <h2>Não foi possível carregar os NFTs</h2>
              <Button
                unstyled
                className="primary"
                onClick={() => void list.refetch()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : cards.length ? (
            <div className="catalog-grid grid">
              {cards.map((nft, index) => (
                <NftCard nft={nft} key={nft.id} priority={index === 0} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>Nenhum NFT encontrado</h2>
              <p>Experimente buscar por outra coleção ou faixa de preço.</p>
              <Button
                unstyled
                className="primary"
                onClick={() => {
                  setPriceDraft(null);
                  void navigate({ to: "/", search: {} });
                }}
              >
                Limpar filtros
              </Button>
            </div>
          )}
          <nav className="pagination" aria-label="Paginação do catálogo">
            <Button
              unstyled
              aria-label="Página anterior"
              disabled={page === 1}
              onClick={() =>
                void navigate({
                  to: "/",
                  search: (previous) => ({ ...previous, page: page - 1 }),
                })
              }
            >
              ‹
            </Button>
            {Array.from(
              { length: Math.min(4, list.data?.pagination.totalPages || 1) },
              (_, i) => i + 1,
            ).map((number) => (
              <Button
                unstyled
                aria-current={page === number ? "page" : undefined}
                className={page === number ? "active" : ""}
                key={number}
                onClick={() =>
                  void navigate({
                    to: "/",
                    search: (previous) => ({ ...previous, page: number }),
                  })
                }
              >
                {number}
              </Button>
            ))}
            <Button
              unstyled
              aria-label="Próxima página"
              disabled={page >= (list.data?.pagination.totalPages || 1)}
              onClick={() =>
                void navigate({
                  to: "/",
                  search: (previous) => ({ ...previous, page: page + 1 }),
                })
              }
            >
              <ChevronRight size={18} />
            </Button>
          </nav>
        </div>
      </section>
      <section className="promos">
        <div>
          <img
            src={nftArt("nft-001")}
            alt="Coleção limitada"
            loading="lazy"
            decoding="async"
            width={450}
            height={450}
          />
          <div>
            <h3>
              Lançamentos genesis
              <br />
              de edição limitada
            </h3>
            <p>
              Colecione edições escassas diretamente dos criadores antes da
              revelação pública.
            </p>
            <Link to="/market" className="primary">
              Explorar <ArrowRight size={15} />
            </Link>
          </div>
        </div>
        <div>
          <img
            src={nftArt("nft-003")}
            alt="Arte digital"
            loading="lazy"
            decoding="async"
            width={450}
            height={450}
          />
          <div>
            <h3>
              Arte digital selecionada
              <br />e muito mais
            </h3>
            <p>
              Explore novos artistas, coleções verificadas e obras digitais que
              definem a cultura.
            </p>
            <Link to="/market" className="primary">
              Explorar <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
      <section className="journal">
        <h2>Diário da Cunhagem</h2>
        <p>
          Histórias, guias e insights para colecionadores sobre o universo da
          propriedade digital.
        </p>
        <div className="journal-grid">
          {[
            ["Como funciona a propriedade de NFTs", "nft-003"],
            ["10 artistas digitais para acompanhar", "nft-001"],
            ["Raridade, atributos e procedência", "nft-002"],
            ["Como proteger sua carteira", "nft-007"],
          ].map(([title, id], i) => (
            <article key={title}>
              <img
                src={nftArt(id)}
                alt="Arte digital"
                loading="lazy"
                decoding="async"
                width={450}
                height={450}
              />
              <div>
                <small>
                  {12 + i} de setembro | Leitura de {i + 2} min
                </small>
                <h3>{title}</h3>
                <p>Conheça as novidades da cultura digital e seus criadores.</p>
                <Link to="/learn">Ler mais →</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <Button
        unstyled
        className="mobile-filter-toggle"
        onClick={() => setMobileFilters(!mobileFilters)}
      >
        {mobileFilters ? "Fechar filtros" : "Filtrar coleções"}
      </Button>
    </Shell>
  );
}

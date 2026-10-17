import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

import { useEffect, useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import type { NftListParams } from "@/contracts/nft";
import { catalogParams, validateCatalogSearch } from "@/kurio/catalog-search";

import { useNftList } from "@/features/nfts/nft.hooks";

import { NftCard } from "@/kurio/NftCard";
import { Breadcrumb, Shell } from "@/kurio/Shell";
import { nftArt } from "@/kurio/visual";
import { CatalogSkeleton } from "@/kurio/Skeletons";
import "./market.css";

// ==========================================
// CATEGORIAS DO MERCADO
// ==========================================

const CATEGORIES = [
  { name: "Arte digital", value: "arte-digital" },
  { name: "Fotografia", value: "fotografia" },
  { name: "Música", value: "musica" },
  { name: "Arte 3D", value: "arte-3d" },
  { name: "Colecionáveis", value: "colecionaveis" },
  { name: "Generativa", value: "generativa" },
  { name: "Jogos", value: "gaming" },
  { name: "Assinaturas", value: "assinaturas" },
  { name: "Utilidade", value: "utilidade" },
] as const;

const MAX_PRICE = "12.30";

type Tab = "all" | "new" | "popular";

// ==========================================
// ROTA /market
// ==========================================

export const Route = createFileRoute("/market")({
  validateSearch: validateCatalogSearch,

  component: MarketPage,
});

// eslint-disable-next-line react-refresh/only-export-components
function MarketPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const q = search.q ?? "";
  const category = search.category ?? "";
  const maxPrice = search.maxPriceEth ?? MAX_PRICE;
  const tab: Tab = search.tab ?? "all";
  const sort: NftListParams["sort"] = search.sort ?? "recent";
  const page = search.page ?? 1;

  const [searchDraft, setSearchDraft] = useState<{
    base: string;
    value: string;
  } | null>(null);
  const searchInput = searchDraft?.base === q ? searchDraft.value : q;
  const [priceDraft, setPriceDraft] = useState<{
    base: string;
    value: string;
  } | null>(null);
  const priceSlider =
    priceDraft?.base === maxPrice ? priceDraft.value : maxPrice;
  const [mobileFilters, setMobileFilters] = useState(false);

  function changeFilters(patch: Partial<typeof search>) {
    void navigate({
      to: "/market",
      search: (previous) => ({ ...previous, ...patch, page: undefined }),
    });
  }

  // ========================================
  // EVENTO DE FILTROS MOBILE
  // ========================================

  useEffect(() => {
    const toggleFilters = () => {
      setMobileFilters((open) => !open);
    };

    window.addEventListener("kurio-open-filters", toggleFilters);

    return () => {
      window.removeEventListener("kurio-open-filters", toggleFilters);
    };
  }, []);

  // ========================================
  // PARÂMETROS DA API
  // ========================================

  const params = catalogParams(search);

  // Catálogo filtrado
  const list = useNftList(params);

  // Catálogo completo para contagem por categoria
  const catalog = useNftList({
    page: 1,
    pageSize: 48,
    sort: "recent",
  });

  const items = list.data?.items ?? [];

  const totalPages = list.data?.pagination.totalPages ?? 0;

  const totalItems = list.data?.pagination.totalItems ?? 0;

  // ========================================
  // CONTAGEM POR CATEGORIA
  // ========================================

  const countByCategory = (id: string) => {
    return (
      catalog.data?.items.filter((item) => item.category === id).length ?? 0
    );
  };

  // ========================================
  // PESQUISA
  // ========================================

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    changeFilters({ q: searchInput.trim() || undefined });
  };

  // ========================================
  // ABAS DE ORDENAÇÃO
  // ========================================

  const changeTab = (nextTab: Tab) => {
    changeFilters({
      tab: nextTab,
      sort: nextTab === "popular" ? "popular" : "recent",
    });
  };

  // ========================================
  // LIMPAR FILTROS
  // ========================================

  const resetFilters = () => {
    setPriceDraft(null);
    setSearchDraft(null);
    setMobileFilters(false);
    void navigate({ to: "/market", search: {} });
  };

  // ========================================
  // PAGINAÇÃO
  // ========================================

  const firstPage = Math.max(1, Math.min(page - 1, totalPages - 3));

  const pages = Array.from(
    {
      length: Math.min(4, totalPages),
    },
    (_, index) => firstPage + index,
  );

  // ========================================
  // RENDERIZAÇÃO
  // ========================================

  return (
    <Shell active="Mercado">
      <div className="market-page">
        {/* ==================================
            BREADCRUMB
           ================================== */}

        <div className="desktop-only">
          <Breadcrumb
            items={[
              {
                title: "Mercado",
              },
            ]}
          />
        </div>

        {/* ==================================
            TÍTULO
           ================================== */}

        <div className="market-heading">
          <h1>Mercado de NFTs</h1>

          <p>Explore NFTs exclusivos, coleções e criadores da Kurio.</p>
        </div>

        {/* ==================================
            PESQUISA
           ================================== */}

        <form className="market-search" onSubmit={submitSearch}>
          <Search size={20} aria-hidden="true" />

          <Input
            unstyled
            type="search"
            aria-label="Pesquisar NFTs"
            placeholder="Pesquisar NFTs, artistas e coleções"
            value={searchInput}
            onChange={(event) => {
              setSearchDraft({ base: q, value: event.target.value });
            }}
          />

          <Button unstyled type="submit" className="primary">
            Buscar
          </Button>
        </form>

        {/* ==================================
            LAYOUT DO MERCADO
           ================================== */}

        <div className="market-layout">
          {/* ================================
              BARRA LATERAL DE FILTROS
             ================================ */}

          <aside
            className={`catalog-sidebar ${mobileFilters ? "mobile-open" : ""}`}
          >
            <div className="filter-panel">
              {/* COLEÇÕES */}

              <h3>Coleções</h3>

              {CATEGORIES.map(({ name, value }) => (
                <Button
                  unstyled
                  type="button"
                  key={value}
                  className={category === value ? "chosen" : ""}
                  onClick={() => {
                    changeFilters({
                      category: category === value ? undefined : value,
                    });
                  }}
                >
                  {name}

                  <span>({countByCategory(value)})</span>
                </Button>
              ))}

              {/* FAIXA DE PREÇO */}

              <h3>Faixa de preço</h3>

              <Input
                unstyled
                type="range"
                aria-label="Preço máximo"
                min="0.02"
                max={MAX_PRICE}
                step="0.01"
                value={priceSlider}
                onChange={(event) => {
                  setPriceDraft({ base: maxPrice, value: event.target.value });
                }}
              />

              <p>
                Preço: 0,02 - {Number(priceSlider).toFixed(2).replace(".", ",")}{" "}
                ETH
              </p>

              <Button
                unstyled
                type="button"
                className="primary"
                onClick={() => {
                  changeFilters({
                    maxPriceEth:
                      priceSlider === MAX_PRICE ? undefined : priceSlider,
                  });
                  setMobileFilters(false);
                }}
              >
                Aplicar
              </Button>

              {/* REDES */}

              <h3>Rede</h3>

              <Button
                unstyled
                type="button"
                className="chosen"
                onClick={() => {
                  // Os NFTs simulados não fornecem rede por item.
                }}
              >
                Ethereum
                <span>({catalog.data?.pagination.totalItems ?? 0})</span>
              </Button>

              <Button
                unstyled
                type="button"
                disabled
                title="Sem NFTs dessa rede no mock"
              >
                Polygon
                <span>(0)</span>
              </Button>

              <Button
                unstyled
                type="button"
                disabled
                title="Sem NFTs dessa rede no mock"
              >
                Solana
                <span>(0)</span>
              </Button>

              <p className="fine-print">
                Os NFTs deste catálogo de demonstração estão na Ethereum.
              </p>

              {/* LIMPAR FILTROS */}

              <Button unstyled type="button" onClick={resetFilters}>
                Limpar todos os filtros
              </Button>
            </div>

            {/* NFT EM DESTAQUE */}

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

          {/* ================================
              RESULTADOS
             ================================ */}

          <section
            className="market-results"
            aria-label="Resultados do mercado"
          >
            {/* ABAS */}

            <div className="catalog-topline">
              <div
                className="catalog-tabs"
                role="group"
                aria-label="Tipo de listagem"
              >
                <Button
                  unstyled
                  type="button"
                  className={tab === "all" ? "selected" : ""}
                  onClick={() => {
                    changeTab("all");
                  }}
                >
                  Todos os NFTs
                </Button>

                <Button
                  unstyled
                  type="button"
                  className={tab === "new" ? "selected" : ""}
                  onClick={() => {
                    changeTab("new");
                  }}
                >
                  Novos lançamentos
                </Button>

                <Button
                  unstyled
                  type="button"
                  className={tab === "popular" ? "selected" : ""}
                  onClick={() => {
                    changeTab("popular");
                  }}
                >
                  Em alta
                </Button>
              </div>

              {/* ORDENAÇÃO */}

              <Label unstyled className="sort-label">
                Ordenar por:
                <NativeSelect
                  unstyled
                  value={sort}
                  onChange={(event) => {
                    changeFilters({
                      sort: event.target.value as NftListParams["sort"],
                      tab: "all",
                    });
                  }}
                >
                  <option value="recent">Listados recentemente</option>

                  <option value="oldest">Mais antigos</option>

                  <option value="price_asc">Menor preço</option>

                  <option value="price_desc">Maior preço</option>

                  <option value="popular">Popularidade</option>
                </NativeSelect>
              </Label>
            </div>

            {/* CONTAGEM */}

            <p className="fine-print market-result-count">
              {list.isLoading
                ? "Buscando NFTs..."
                : `${totalItems} NFT(s) encontrado(s)`}
            </p>

            {/* =================================
                GRID DE NFTs
               ================================= */}

            {list.isPending ? (
              <CatalogSkeleton />
            ) : list.isError ? (
              <div className="empty-state">
                <h2>Não foi possível carregar os NFTs</h2>

                <Button
                  unstyled
                  type="button"
                  className="primary"
                  onClick={() => {
                    void list.refetch();
                  }}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : items.length > 0 ? (
              <div className="catalog-grid grid">
                {items.map((nft, index) => (
                  <NftCard nft={nft} key={nft.id} priority={index === 0} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h2>Nenhum NFT encontrado</h2>

                <p>Experimente outra busca, coleção ou faixa de preço.</p>

                <Button
                  unstyled
                  type="button"
                  className="primary"
                  onClick={resetFilters}
                >
                  Limpar filtros
                </Button>
              </div>
            )}

            {/* =================================
                PAGINAÇÃO
               ================================= */}

            {totalPages > 1 && !list.isError && (
              <nav className="pagination" aria-label="Páginas do mercado">
                <Button
                  unstyled
                  type="button"
                  aria-label="Página anterior"
                  disabled={page === 1}
                  onClick={() => {
                    void navigate({
                      to: "/market",
                      search: (previous) => ({ ...previous, page: page - 1 }),
                    });
                  }}
                >
                  <ChevronLeft size={18} />
                </Button>

                {pages.map((number) => (
                  <Button
                    unstyled
                    type="button"
                    key={number}
                    className={page === number ? "active" : ""}
                    aria-current={page === number ? "page" : undefined}
                    onClick={() => {
                      void navigate({
                        to: "/market",
                        search: (previous) => ({ ...previous, page: number }),
                      });
                    }}
                  >
                    {number}
                  </Button>
                ))}

                <Button
                  unstyled
                  type="button"
                  aria-label="Próxima página"
                  disabled={page >= totalPages}
                  onClick={() => {
                    void navigate({
                      to: "/market",
                      search: (previous) => ({ ...previous, page: page + 1 }),
                    });
                  }}
                >
                  <ChevronRight size={18} />
                </Button>
              </nav>
            )}
          </section>
        </div>

        {/* ==================================
            BOTÃO DE FILTROS MOBILE
           ================================== */}

        <Button
          unstyled
          type="button"
          className="mobile-filter-toggle"
          aria-expanded={mobileFilters}
          onClick={() => {
            setMobileFilters((open) => !open);
          }}
        >
          {mobileFilters ? "Fechar filtros" : "Filtrar coleções"}
        </Button>
      </div>
    </Shell>
  );
}

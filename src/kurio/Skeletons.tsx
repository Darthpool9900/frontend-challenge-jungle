/** Same card geometry as the catalog, with reduced-motion support in CSS. */
export function CatalogSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="catalog-grid grid"
      role="status"
      aria-label="Carregando NFTs"
    >
      {Array.from({ length: count }, (_, index) => (
        <div className="nft-card" key={index} aria-hidden="true">
          <div className="nft-thumb kurio-skeleton" />
          <div className="kurio-skeleton skeleton-name" />
          <div className="kurio-skeleton skeleton-price" />
        </div>
      ))}
      <span className="sr-only">Carregando NFTs...</span>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div role="status" aria-label="Carregando carrinho">
      {Array.from({ length: 3 }, (_, index) => (
        <div className="cart-row" key={index} aria-hidden="true">
          <div className="kurio-skeleton skeleton-cart-image" />
          <div className="kurio-skeleton skeleton-cart-text" />
        </div>
      ))}
      <span className="sr-only">Carregando carrinho...</span>
    </div>
  );
}

/** Reserve the detail page geometry while mock queries load to prevent footer CLS. */
export function DetailSkeleton() {
  return (
    <div role="status" aria-label="Carregando detalhes do NFT">
      <div className="detail-layout">
        <div className="detail-media">
          <div className="detail-thumbs desktop-only">
            <div
              className="kurio-skeleton"
              style={{ width: 100, height: 100, borderRadius: 8 }}
            />
          </div>
          <div className="detail-main-img kurio-skeleton" aria-hidden="true" />
        </div>
        <div className="detail-info" aria-hidden="true">
          <div
            className="kurio-skeleton"
            style={{ width: "75%", height: 30, marginBottom: 24 }}
          />
          <div
            className="kurio-skeleton"
            style={{ width: "45%", height: 24, marginBottom: 32 }}
          />
          <div
            className="kurio-skeleton"
            style={{ width: "100%", height: 70, marginBottom: 30 }}
          />
          <div
            className="kurio-skeleton"
            style={{ width: "85%", height: 65, marginBottom: 30 }}
          />
          <div
            className="kurio-skeleton"
            style={{ width: "70%", height: 75 }}
          />
        </div>
      </div>
      <section
        className="detail-description desktop-only"
        style={{ minHeight: 210 }}
      >
        <div className="kurio-skeleton" style={{ width: "40%", height: 32 }} />
      </section>
      <div className="desktop-only">
        <section className="recommend">
          <div
            className="kurio-skeleton"
            style={{ width: "32%", height: 28, marginBottom: 24 }}
          />
          <div className="recommend-grid">
            {Array.from({ length: 5 }, (_, index) => (
              <div className="nft-card" key={index} aria-hidden="true">
                <div className="nft-thumb kurio-skeleton" />
                <div className="kurio-skeleton skeleton-name" />
                <div className="kurio-skeleton skeleton-price" />
              </div>
            ))}
          </div>
          <div className="dots" aria-hidden="true">
            ○ ● ○
          </div>
        </section>
      </div>
      <span className="sr-only">Carregando NFT...</span>
    </div>
  );
}

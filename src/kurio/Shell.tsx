import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useState, useSyncExternalStore, type ReactNode } from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import {
  Heart,
  Home,
  Search,
  ShoppingCart,
  UserRound,
  SlidersHorizontal,
  LogIn,
  ArrowRight,
  Camera,
  Play,
  AtSign,
  Menu,
  X,
} from "lucide-react";

import { useCart } from "@/features/cart/cart.hooks";

import { useAuthSession, useLogout } from "@/features/auth/auth.hooks";

import { useFavorites } from "@/features/favorites/favorites.hooks";

// ==========================================
// RESPONSIVIDADE DO MENU
// ==========================================

const mobileQuery = "(max-width: 700px)";

function subscribeMobile(callback: () => void) {
  const media = window.matchMedia(mobileQuery);

  media.addEventListener("change", callback);

  return () => {
    media.removeEventListener("change", callback);
  };
}

function getMobileSnapshot() {
  return window.matchMedia(mobileQuery).matches;
}

function getMobileServerSnapshot() {
  return false;
}

// ==========================================
// HEADER
// ==========================================

export function Header({ active = "Mercado" }: { active?: string }) {
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    getMobileSnapshot,
    getMobileServerSnapshot,
  );

  const cart = useCart();
  const session = useAuthSession();
  const logout = useLogout();
  const nav = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [menu, setMenu] = useState(false);

  const search = () => {
    void nav({
      to: "/market",
      search: {
        q: term.trim() || undefined,
      },
    });

    setSearchOpen(false);
  };

  return (
    <>
      <header className="kurio-header" data-active={active}>
        <div className="site-width header-inner flex items-center">
          {/* LOGO */}

          <Link to="/" className="brand">
            KURIO
          </Link>

          {/* NAVEGAÇÃO DESKTOP */}

          <nav className="desktop-nav flex">
            <Link
              to="/"
              activeProps={{
                className: "active",
              }}
            >
              Início
            </Link>

            <Link
              to="/market"
              activeProps={{
                className: "active",
              }}
            >
              Mercado
            </Link>

            <Link to="/creators">Criadores</Link>

            <Link to="/learn">Aprenda</Link>
          </nav>

          {/* AÇÕES DO HEADER */}

          <div className="header-actions">
            {/* PESQUISA */}

            <Button
              unstyled
              type="button"
              title="Pesquisar"
              aria-label="Pesquisar"
              className="icon-button"
              onClick={() => {
                setSearchOpen(!searchOpen);
              }}
            >
              <Search size={20} />
            </Button>

            {/* CARRINHO */}

            <Link to="/cart" aria-label="Carrinho" className="cart-icon">
              <ShoppingCart size={20} />

              {Boolean(cart.data?.itemCount) && (
                <span>{cart.data?.itemCount}</span>
              )}
            </Link>

            {/* LOGIN OU PERFIL */}

            {session.data?.user ? (
              <Button
                unstyled
                type="button"
                className="primary small"
                onClick={() => {
                  void nav({
                    to: "/profile",
                  });
                }}
              >
                <UserRound size={16} />

                {session.data.user.name.split(" ")[0]}
              </Button>
            ) : (
              <Link to="/login" className="primary small">
                <LogIn size={16} />
                Entrar
              </Link>
            )}
          </div>

          {/* MENU HAMBÚRGUER:
              RENDERIZADO SOMENTE NO MOBILE */}

          {isMobile && (
            <Button
              unstyled
              type="button"
              className="mobile-menu icon-button"
              aria-label="Menu"
              aria-expanded={menu}
              onClick={() => {
                setMenu(!menu);
              }}
            >
              {menu ? <X size={22} /> : <Menu size={22} />}
            </Button>
          )}
        </div>

        {/* CAMPO DE PESQUISA */}

        {searchOpen && (
          <form
            className="nav-search"
            onSubmit={(event) => {
              event.preventDefault();
              search();
            }}
          >
            <Input
              unstyled
              autoFocus
              placeholder="Buscar coleções, artistas e NFTs"
              value={term}
              onChange={(event) => {
                setTerm(event.target.value);
              }}
            />

            <Button unstyled className="primary" type="submit">
              Buscar
            </Button>
          </form>
        )}

        {/* LINKS DO MENU MOBILE */}

        {isMobile && menu && (
          <div className="mobile-menu-list">
            <Link to="/" onClick={() => setMenu(false)}>
              Início
            </Link>

            <Link to="/cart" onClick={() => setMenu(false)}>
              Carrinho
            </Link>

            <Link to="/favorites" onClick={() => setMenu(false)}>
              Favoritos
            </Link>

            <Link to="/profile" onClick={() => setMenu(false)}>
              Meu perfil
            </Link>

            {session.data?.user && (
              <Button
                unstyled
                type="button"
                onClick={() => {
                  logout.mutate();
                  setMenu(false);
                }}
              >
                Sair
              </Button>
            )}
          </div>
        )}
      </header>

      {/* PESQUISA MOBILE */}

      <div className="mobile-top-search">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            search();
          }}
        >
          <Search size={22} />

          <Input
            unstyled
            aria-label="Explorar coleções"
            placeholder="Explorar coleções"
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
            }}
          />
        </form>

        <Button
          unstyled
          type="button"
          title="Filtros"
          onClick={() => {
            window.dispatchEvent(new Event("kurio-open-filters"));
          }}
        >
          <SlidersHorizontal />
        </Button>
      </div>
    </>
  );
}

// ==========================================
// NAVEGAÇÃO INFERIOR MOBILE
// ==========================================

export function MobileTabs() {
  const cart = useCart();
  const favorites = useFavorites();

  return (
    <nav className="mobile-tabs" aria-label="Navegação">
      <Link
        to="/"
        activeProps={{
          className: "active",
        }}
        aria-label="Início"
      >
        <Home fill="currentColor" size={22} />
      </Link>

      <Link
        to="/favorites"
        activeProps={{
          className: "active",
        }}
        aria-label="Favoritos"
      >
        <Heart fill="currentColor" size={23} />

        {!!favorites.data?.nftIds.length && <small />}
      </Link>

      <Link
        to="/market"
        aria-label="Explorar mercado"
        className="mobile-center"
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 13V11C6 7.1 9.1 4 13 4H23C26.9 4 30 7.1 30 11V13"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M4 14H32M4 22H32"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M6 23V25C6 28.9 9.1 32 13 32H23C26.9 32 30 28.9 30 25V23"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </Link>

      <Link
        to="/cart"
        activeProps={{
          className: "active",
        }}
        aria-label="Carrinho"
      >
        <ShoppingCart fill="currentColor" size={22} />

        {!!cart.data?.itemCount && <small />}
      </Link>

      <Link
        to="/profile"
        activeProps={{
          className: "active",
        }}
        aria-label="Perfil"
      >
        <UserRound fill="currentColor" size={21} />
      </Link>
    </nav>
  );
}

// ==========================================
// FOOTER
// ==========================================

export function Footer() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <footer className="kurio-footer">
      <div className="site-width">
        {/* BENEFÍCIOS */}

        <div className="benefits">
          <div>
            <span className="benefit-icon">W</span>

            <h3>Segurança da carteira</h3>

            <p>
              Proteja sua carteira e colecione arte digital verificada com
              confiança.
            </p>
          </div>

          <div>
            <span className="benefit-icon">C</span>

            <h3>Criadores em destaque</h3>

            <p>
              Conheça artistas, estúdios e comunidades que moldam a cultura
              digital na rede.
            </p>
          </div>

          <div>
            <span className="benefit-icon">D</span>

            <h3>Alertas de lançamentos</h3>

            <p>
              Receba calendários de cunhagem, novidades de listas de acesso e
              análises do mercado.
            </p>
          </div>

          <div>
            <h3>Antecipe-se ao próximo lançamento</h3>

            <form
              className="footer-form"
              onSubmit={(event) => {
                event.preventDefault();

                if (email.includes("@")) {
                  setSent(true);
                }
              }}
            >
              <Input
                unstyled
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                placeholder="digite seu e-mail..."
                required
              />

              <Button unstyled type="submit" className="primary">
                Enviar
              </Button>
            </form>

            <p>
              {sent
                ? "Inscrição registrada!"
                : "Receba lançamentos selecionados, histórias de criadores e novidades do mercado."}
            </p>
          </div>
        </div>

        {/* INFORMAÇÕES */}

        <div className="footer-strip">
          <strong>KURIO</strong>

          <span>
            Feito para colecionadores,
            <br />
            criadores e cultura
          </span>

          <span>contato@email.com</span>

          <span>+55 11 4002 8922</span>
        </div>

        {/* LINKS */}

        <div className="footer-links">
          <div>
            <h3>Meu perfil</h3>

            <Link to="/profile">Meu perfil</Link>

            <Link to="/orders">Minha coleção</Link>

            <Link to="/favorites">Lista de interesse</Link>
          </div>

          <div>
            <h3>Central de ajuda</h3>

            <Link to="/learn">Central de ajuda</Link>

            <Link to="/learn">Como comprar NFTs</Link>

            <Link to="/wallets">Carteira e segurança</Link>
          </div>

          <div>
            <h3>Coleções</h3>

            <Link to="/market">Arte digital</Link>

            <Link to="/market">Fotografia</Link>

            <Link to="/market">Música</Link>
          </div>

          <div>
            <h3>Redes sociais</h3>

            <span className="social-row">
              <AtSign size={17} />
              <Camera size={17} />
              <Play size={17} />
            </span>

            <h3>Carteiras compatíveis</h3>

            <small className="network-badge">
              METAMASK · WALLETCONNECT · COINBASE
            </small>
          </div>
        </div>

        {/* COPYRIGHT */}

        <p className="copyright">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </div>
    </footer>
  );
}

// ==========================================
// LAYOUT PRINCIPAL
// ==========================================

interface ShellProps {
  children: ReactNode;
  active?: string;
  footer?: boolean;
  mobileNav?: boolean;
}

export function Shell({
  children,
  active = "Mercado",
  footer = true,
  mobileNav = true,
}: ShellProps) {
  return (
    <>
      <Header active={active} />

      <main className="site-width main-content">{children}</main>

      {footer && <Footer />}

      {mobileNav && <MobileTabs />}
    </>
  );
}

// ==========================================
// BREADCRUMB
// ==========================================

interface BreadcrumbItem {
  title: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="breadcrumb">
      <Link to="/">Início</Link>

      {items.map((item, index) => (
        <span key={index}>
          {" / "}

          {item.to ? <Link to={item.to}>{item.title}</Link> : item.title}
        </span>
      ))}
    </div>
  );
}

// ==========================================
// TÍTULO DE SEÇÃO
// ==========================================

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="section-title">{children}</h2>;
}

// ==========================================
// USUÁRIO NÃO AUTENTICADO
// ==========================================

export function NotLoggedIn({
  subject = "acessar esta área",
}: {
  subject?: string;
}) {
  return (
    <div className="empty-state">
      <UserRound size={36} />

      <h2>Entre para {subject}</h2>

      <p>Crie uma conta ou acesse seu perfil de colecionador.</p>

      <Link className="primary" to="/login">
        Entrar
        <ArrowRight size={17} />
      </Link>
    </div>
  );
}

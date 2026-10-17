import { Button } from "@/components/ui/button";

import { Link, useNavigate } from "@tanstack/react-router";
import { useLogout, useAuthSession } from "@/features/auth/auth.hooks";
import {
  UserRound,
  Wallet,
  ShoppingCart,
  Heart,
  Gift,
  Download,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { Shell, NotLoggedIn } from "./Shell";

export function AccountShell({ children }: { children: React.ReactNode }) {
  const session = useAuthSession(),
    logout = useLogout(),
    nav = useNavigate();
  if (!session.data?.user)
    return (
      <Shell>
        <NotLoggedIn subject="seu perfil" />
      </Shell>
    );
  return (
    <Shell footer={false}>
      <div className="account-layout">
        <aside className="account-sidebar">
          <h2>Meu perfil</h2>
          <Link to="/profile" activeProps={{ className: "active" }}>
            <UserRound size={18} />
            Dados do perfil
          </Link>
          <Link to="/wallets" activeProps={{ className: "active" }}>
            <Wallet size={18} />
            Carteiras
          </Link>
          <Link to="/orders" activeProps={{ className: "active" }}>
            <ShoppingCart size={18} />
            Atividade
          </Link>
          <Link to="/favorites" activeProps={{ className: "active" }}>
            <Heart size={18} />
            Lista de interesse
          </Link>
          <Link to="/market">
            <Gift size={18} />
            Ofertas
          </Link>
          <Link to="/orders">
            <Download size={18} />
            Arquivos baixados
          </Link>
          <Link to="/learn">
            <HelpCircle size={18} />
            Suporte
          </Link>
          <Button
            unstyled
            onClick={async () => {
              await logout.mutateAsync().catch(() => {});
              void nav({ to: "/" });
            }}
          >
            <LogOut size={18} />
            Sair
          </Button>
        </aside>
        <div className="account-content">{children}</div>
      </div>
    </Shell>
  );
}

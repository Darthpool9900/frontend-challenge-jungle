import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, X } from "lucide-react";
import { useLogin, useRegister } from "@/features/auth/auth.hooks";
import { messageOf } from "./visual";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const register = useRegister(),
    login = useLogin(),
    navigate = useNavigate(),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [visible, setVisible] = useState(false),
    [error, setError] = useState(""),
    [socialMessage, setSocialMessage] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "register" && password !== confirm) {
      setError("As senhas precisam ser iguais.");
      return;
    }
    try {
      if (mode === "login") await login.mutateAsync({ email, password });
      else await register.mutateAsync({ name, email, password });
      const dest = sessionStorage.getItem("kurio.afterLogin");
      sessionStorage.removeItem("kurio.afterLogin");
      void navigate({ to: dest === "/checkout" ? "/checkout" : "/profile" });
    } catch (e) {
      setError(messageOf(e));
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-underlay" />
      <section className="auth-panel">
        <Link to="/" className="close-auth" aria-label="Fechar">
          <X size={22} />
        </Link>
        <Link to="/" className="mobile-auth-logo">
          KURIO
        </Link>
        <div className="auth-switch desktop-only">
          <Link to="/login" className={mode === "login" ? "selected" : ""}>
            Entrar
          </Link>
          <span> | </span>
          <Link
            to="/register"
            className={mode === "register" ? "selected" : ""}
          >
            Criar conta
          </Link>
        </div>
        <h1 className="mobile-auth-title">
          {mode === "login" ? "Entrar" : "Criar perfil de colecionador"}
        </h1>
        <p className="auth-intro desktop-only">
          {mode === "login"
            ? "Entre para gerenciar sua carteira, coleção e perfil de criador."
            : "Comece sua coleção de arte digital e descubra novos criadores."}
        </p>
        <form className="auth-form" onSubmit={(e) => void submit(e)}>
          {mode === "register" && (
            <Input
              unstyled
              aria-label="Nome de usuário"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome de usuário"
            />
          )}
          <Input
            unstyled
            aria-label="E-mail"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={
              mode === "login" ? "contato@email.com" : "Digite seu e-mail"
            }
          />
          <div className="password-wrap">
            <Input
              unstyled
              aria-label="Senha"
              required
              minLength={mode === "login" ? 1 : 8}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              type={visible ? "text" : "password"}
              placeholder={mode === "login" ? "************" : "Senha"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              unstyled
              type="button"
              aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setVisible(!visible)}
            >
              {visible ? <Eye size={18} /> : <EyeOff size={18} />}
            </Button>
          </div>
          {mode === "register" && (
            <div className="password-wrap">
              <Input
                unstyled
                aria-label="Confirmar senha"
                type={visible ? "text" : "password"}
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirmar senha"
              />
              <Button
                unstyled
                type="button"
                aria-label="Mostrar senha"
                onClick={() => setVisible(!visible)}
              >
                <EyeOff size={18} />
              </Button>
            </div>
          )}
          {mode === "login" && (
            <Button
              unstyled
              type="button"
              className="forgot-link"
              onClick={() =>
                setError(
                  "Recuperação por e-mail indisponível nesta demonstração.",
                )
              }
            >
              Esqueceu a senha?
            </Button>
          )}
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <Button
            unstyled
            type="submit"
            className="primary full auth-submit inline-flex"
            disabled={login.isPending || register.isPending}
          >
            {login.isPending || register.isPending
              ? "Aguarde..."
              : mode === "login"
                ? "Entrar"
                : "Criar perfil"}
          </Button>
        </form>
        <div className="auth-divider">Ou continue com</div>
        <div className="social-auth">
          <Button
            unstyled
            onClick={() =>
              setSocialMessage(
                "Login com Google indisponível no backend mock. Use e-mail e senha.",
              )
            }
          >
            <span className="google-icon">G</span> Continuar com Google
          </Button>
          <Button
            unstyled
            onClick={() =>
              setSocialMessage(
                "Login com Facebook indisponível no backend mock. Use e-mail e senha.",
              )
            }
          >
            <span className="facebook-icon">f</span> Continuar com Facebook
          </Button>
          {socialMessage && (
            <p role="status" className="fine-print">
              {socialMessage}
            </p>
          )}
        </div>
        <p className="auth-bottom">
          {mode === "login" ? (
            <>
              Novo na Kurio? <Link to="/register">Crie uma conta</Link>
            </>
          ) : (
            <>
              Já tem uma conta? <Link to="/login">Entre</Link>
            </>
          )}
        </p>
      </section>
    </div>
  );
}

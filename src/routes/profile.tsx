import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AccountShell } from "@/kurio/Account";
import { useAuthSession } from "@/features/auth/auth.hooks";
import { sessionQueryOptions } from "@/features/auth/auth.queries";
import { authService } from "@/services/auth.service";
import { messageOf } from "@/kurio/visual";
export const Route = createFileRoute("/profile")({ component: Profile });
// eslint-disable-next-line react-refresh/only-export-components
function Profile() {
  const session = useAuthSession(),
    queryClient = useQueryClient(),
    [name, setName] = useState(""),
    [username, setUsername] = useState(""),
    [gender, setGender] = useState(""),
    [bio, setBio] = useState(""),
    [email, setEmail] = useState(""),
    [avatar, setAvatar] = useState<string | null | undefined>(undefined),
    [oldPass, setOldPass] = useState(""),
    [newPass, setNewPass] = useState(""),
    [confirm, setConfirm] = useState(""),
    [message, setMessage] = useState(""),
    [saving, setSaving] = useState(false);
  const shownName = name || session.data?.user.name || "",
    shownUsername =
      username ||
      session.data?.user.username ||
      session.data?.user.name.replace(/\s/g, "").toLowerCase() ||
      "",
    shownEmail = email || session.data?.user.email || "";
  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const u = await authService.updateProfile({
        name: shownName,
        email: shownEmail,
        username: shownUsername,
        gender: gender || session.data?.user.gender || "",
        bio: bio || session.data?.user.bio || "",
        avatarUrl: avatar,
      });
      if (session.data) {
        queryClient.setQueryData(sessionQueryOptions.queryKey, {
          ...session.data,
          user: u,
        });
      }
      setMessage("Perfil atualizado com sucesso.");
    } catch (e) {
      setMessage(messageOf(e));
    } finally {
      setSaving(false);
    }
  };
  const changePassword = async () => {
    if (!oldPass || !newPass) {
      setMessage("Preencha as duas senhas.");
      return;
    }
    if (newPass !== confirm) {
      setMessage("As senhas não conferem.");
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword({
        currentPassword: oldPass,
        newPassword: newPass,
      });
      setOldPass("");
      setNewPass("");
      setConfirm("");
      setMessage("Senha alterada com sucesso.");
    } catch (e) {
      setMessage(messageOf(e));
    } finally {
      setSaving(false);
    }
  };
  const upload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 700_000) {
      setMessage("Escolha uma imagem de até 700 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };
  return (
    <AccountShell>
      <div className="account-tabs">
        <Link to="/profile" className="active">
          Dados do perfil
        </Link>
        <Link to="/orders">Minha coleção</Link>
        <Link to="/favorites">Favoritos</Link>
      </div>
      <h2>Perfil do colecionador</h2>
      <div className="account-form form-grid">
        <Label unstyled>
          Nome de exibição <em>*</em>
          <Input
            unstyled
            value={shownName}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </Label>
        <Label unstyled>
          Nome de usuário <em>*</em>
          <Input
            unstyled
            value={shownUsername}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Label>
        <Label unstyled>
          E-mail <em>*</em>
          <Input
            unstyled
            value={shownEmail}
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Label>
        <Label unstyled>
          Sexo{" "}
          <NativeSelect
            unstyled
            value={gender || session.data?.user.gender || ""}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Selecione</option>
            <option value="not_disclosed">Prefiro não informar</option>
            <option value="female">Feminino</option>
            <option value="male">Masculino</option>
            <option value="other">Outro</option>
          </NativeSelect>
        </Label>
        <Label unstyled>
          Apelido da carteira
          <Textarea
            unstyled
            rows={3}
            value={bio || session.data?.user.bio || ""}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Conte um pouco sobre você..."
          />
        </Label>
        <div className="avatar-picker-wrap">
          <Label unstyled>Avatar</Label>
          <div className="avatar-picker">
            {avatar || session.data?.user.avatarUrl ? (
              <img
                src={avatar || session.data?.user.avatarUrl || ""}
                alt="Avatar"
                width="60"
                height="60"
              />
            ) : (
              <span>👤</span>
            )}
            <Label unstyled className="primary file-upload-label">
              Adicionar
              <Input
                unstyled
                type="file"
                accept="image/*"
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </Label>
            <Button unstyled onClick={() => setAvatar(null)}>
              Remover
            </Button>
          </div>
        </div>
      </div>
      <Button
        unstyled
        className="primary"
        disabled={saving}
        onClick={() => void save()}
      >
        Salvar perfil
      </Button>
      <h3>Alterar senha</h3>
      <div className="password-column">
        <Label unstyled>
          Senha atual
          <Input
            unstyled
            type="password"
            value={oldPass}
            onChange={(e) => setOldPass(e.target.value)}
          />
        </Label>
        <Label unstyled>
          Nova senha
          <Input
            unstyled
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
          />
        </Label>
        <Label unstyled>
          Confirmar nova senha
          <Input
            unstyled
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Label>
      </div>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <Button
        unstyled
        className="primary"
        disabled={saving}
        onClick={() => void changePassword()}
      >
        Alterar senha
      </Button>
    </AccountShell>
  );
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AccountShell } from "@/kurio/Account";
import {
  useWallets,
  useCreateWallet,
  useUpdateWallet,
  useSetPrimaryWallet,
} from "@/features/wallet/wallet.hooks";
import {
  useWalletConnection,
  useConnectWallet,
  useDisconnectWallet,
} from "@/features/wallet/wallet-connection.hooks";
import { messageOf, networks } from "@/kurio/visual";
import type { WalletNetwork, WalletKind } from "@/contracts/wallet";
export const Route = createFileRoute("/wallets")({ component: WalletsPage });
// eslint-disable-next-line react-refresh/only-export-components
function WalletsPage() {
  const wallets = useWallets(),
    create = useCreateWallet(),
    update = useUpdateWallet(),
    setPrimary = useSetPrimaryWallet(),
    connection = useWalletConnection(),
    connect = useConnectWallet(),
    disconnect = useDisconnectWallet();
  const [label, setLabel] = useState(""),
    [address, setAddress] = useState(""),
    [network, setNetwork] = useState<WalletNetwork>("ethereum"),
    [kind, setKind] = useState<WalletKind>("primary"),
    [edit, setEdit] = useState<string | null>(null),
    [message, setMessage] = useState("");
  const primary = wallets.data?.find((w) => w.kind === "primary"),
    secondary = wallets.data?.find((w) => w.kind === "secondary");
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      if (edit)
        await update.mutateAsync({
          walletId: edit,
          input: { label, address, network, kind },
        });
      else
        await create.mutateAsync({
          label,
          address,
          network,
          kind: wallets.data?.some((w) => w.kind === kind)
            ? kind === "primary"
              ? "secondary"
              : "primary"
            : kind,
        });
      setEdit(null);
      setLabel("");
      setAddress("");
      setMessage("Carteira salva com sucesso.");
    } catch (e) {
      setMessage(messageOf(e));
    }
  };
  return (
    <AccountShell>
      <div className="wallet-title">
        <div>
          <h2>Carteira principal</h2>
          <p>
            Estas carteiras ficam disponíveis no pagamento e para receber NFTs
            comprados.
          </p>
        </div>
        <Button
          unstyled
          onClick={() => {
            setEdit(null);
            setAddress("");
            setLabel("");
            setKind("primary");
          }}
        >
          Adicionar
        </Button>
      </div>
      {primary && (
        <div className="saved-wallet">
          <b>{primary.label}</b>
          <small>{primary.address}</small>
          <span>{primary.network}</span>
          <Button
            unstyled
            onClick={() => {
              setEdit(primary.id);
              setLabel(primary.label);
              setAddress(primary.address);
              setNetwork(primary.network);
              setKind(primary.kind);
            }}
          >
            Editar
          </Button>
          <Button
            unstyled
            onClick={() =>
              void connect
                .mutateAsync({ walletId: primary.id, network: primary.network })
                .catch((e) => setMessage(messageOf(e)))
            }
          >
            {connection.data?.walletId === primary.id
              ? "Conectada"
              : "Conectar"}
          </Button>
        </div>
      )}
      <form onSubmit={(e) => void save(e)} className="form-grid account-form">
        <Label unstyled>
          Nome de exibição <em>*</em>
          <Input
            unstyled
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nome da carteira"
          />
        </Label>
        <Label unstyled>
          Apelido da carteira <em>*</em>
          <Input
            unstyled
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Minha carteira"
          />
        </Label>
        <Label unstyled>
          Rede <em>*</em>
          <NativeSelect
            unstyled
            value={network}
            onChange={(e) => setNetwork(e.target.value as WalletNetwork)}
          >
            {networks.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </NativeSelect>
        </Label>
        <Label unstyled>
          Nome do perfil
          <Input unstyled placeholder="Nome de colecionador" />
        </Label>
        <Label unstyled>
          Endereço da carteira <em>*</em>
          <Input
            unstyled
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Endereço 0x da carteira"
          />
        </Label>
        <Label unstyled>
          ENS ou carteira secundária
          <Input unstyled placeholder="ENS ou carteira secundária (opcional)" />
        </Label>
        <Label unstyled>
          Tipo de carteira <em>*</em>
          <NativeSelect
            unstyled
            value={kind}
            onChange={(e) => setKind(e.target.value as WalletKind)}
          >
            <option value="primary">Principal</option>
            <option value="secondary">Secundária</option>
          </NativeSelect>
        </Label>
        <Label unstyled>
          Código de indicação
          <Input unstyled placeholder="Opcional" />
        </Label>
        <Label unstyled>
          E-mail
          <Input unstyled type="email" placeholder="contato@email.com" />
        </Label>
        <Label unstyled>
          Nome ENS
          <NativeSelect unstyled>
            <option>.eth</option>
          </NativeSelect>
        </Label>
        <div className="form-end">
          <Button
            unstyled
            className="primary"
            disabled={create.isPending || update.isPending}
          >
            {edit ? "Atualizar carteira" : "Salvar carteira"}
          </Button>
        </div>
      </form>
      {message && <p className="notice">{message}</p>}
      <div className="wallet-bottom">
        <div>
          <h2>Carteira secundária</h2>
          {secondary ? (
            <div className="saved-wallet">
              <b>{secondary.label}</b>
              <small>{secondary.address}</small>
              <Button
                unstyled
                onClick={() => void setPrimary.mutateAsync(secondary.id)}
              >
                Definir principal
              </Button>
            </div>
          ) : (
            <p>Você ainda não adicionou uma carteira secundária.</p>
          )}
        </div>
        <Button
          unstyled
          onClick={() => {
            setEdit(null);
            setLabel("");
            setAddress("");
            setKind("secondary");
          }}
        >
          ◯ Igual à carteira principal <b>Adicionar</b>
        </Button>
      </div>
      {connection.data?.status === "connected" && (
        <Button
          unstyled
          className="outline-btn"
          onClick={() => disconnect.mutate()}
        >
          Desconectar carteira
        </Button>
      )}
    </AccountShell>
  );
}

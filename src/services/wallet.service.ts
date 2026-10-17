
import { api } from '@/api/client'

import type {
  Wallet,
  CreateWalletInput,
  UpdateWalletInput,
  WalletListResponse,
  WalletMutationResponse,
} from '@/contracts/wallet'

export const walletService = {

  // GET /api/wallets
  // Listar as carteiras do usuário autenticado
  async list(): Promise<Wallet[]> {
    const { data } = await api.get<WalletListResponse>(
      '/wallets'
    )

    return data.wallets
  },

  // POST /api/wallets
  // Cadastrar uma nova carteira
  async create(
    input: CreateWalletInput
  ): Promise<Wallet> {
    const { data } = await api.post<WalletMutationResponse>(
      '/wallets',
      input
    )

    return data.wallet
  },

  // PATCH /api/wallets/:walletId
  // Atualizar uma carteira existente
  async update(
    walletId: string,
    input: UpdateWalletInput
  ): Promise<Wallet> {
    const { data } = await api.patch<WalletMutationResponse>(
      `/wallets/${encodeURIComponent(walletId)}`,
      input
    )

    return data.wallet
  },

  // Consultar a carteira principal
  async getPrimary(): Promise<Wallet | null> {
    const wallets = await this.list()

    return wallets.find(
      wallet => wallet.kind === 'primary'
    ) ?? null
  },

  // Consultar a carteira secundária
  async getSecondary(): Promise<Wallet | null> {
    const wallets = await this.list()

    return wallets.find(
      wallet => wallet.kind === 'secondary'
    ) ?? null
  },

  // Definir uma carteira como principal
  async setPrimary(walletId: string): Promise<Wallet> {
    return this.update(walletId, {
      kind: 'primary',
    })
  },
}

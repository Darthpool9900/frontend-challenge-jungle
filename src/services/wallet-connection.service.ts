
import { api } from '@/api/client'

import type {
  WalletConnection,
  ConnectWalletInput,
} from '@/contracts/wallet-connection'

import type {
  WalletNetwork,
} from '@/contracts/wallet'

export const walletConnectionService = {

  // Consultar conexão atual
  async get(): Promise<WalletConnection> {
    const { data } = await api.get<WalletConnection>(
      '/wallet-connection'
    )

    return data
  },

  // Conectar carteira
  async connect(
    input: ConnectWalletInput
  ): Promise<WalletConnection> {
    const { data } = await api.post<WalletConnection>(
      '/wallet-connection/connect',
      input
    )

    return data
  },

  // Trocar rede simulada
  async switchNetwork(
    network: WalletNetwork
  ): Promise<WalletConnection> {
    const { data } = await api.post<WalletConnection>(
      '/wallet-connection/switch-network',
      { network }
    )

    return data
  },

  // Desconectar carteira
  async disconnect(): Promise<WalletConnection> {
    const { data } = await api.post<WalletConnection>(
      '/wallet-connection/disconnect'
    )

    return data
  },
}

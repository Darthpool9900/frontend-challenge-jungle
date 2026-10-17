
import type { WalletNetwork } from '@/contracts/wallet'

export interface CouponFixture {
  code: string
  type: 'percentage' | 'fixed'
  value: string
  expiresAt: string
}

// Cupons de demonstração.
export const coupons: CouponFixture[] = [
  {
    code: 'KURIO10',
    type: 'percentage',
    value: '10',
    expiresAt: '2099-12-31T23:59:59.000Z',
  },
  {
    code: 'ETH005',
    type: 'fixed',
    value: '0.05',
    expiresAt: '2099-12-31T23:59:59.000Z',
  },
  {
    code: 'EXPIRED10',
    type: 'percentage',
    value: '10',
    expiresAt: '2020-01-01T00:00:00.000Z',
  },
]

// Taxas fictícias, expressas em ETH.
// Não representam taxas reais das blockchains.
export const networkFeesEth: Record<
  WalletNetwork,
  string
> = {
  ethereum: '0.012',
  polygon: '0.0002',
  base: '0.0003',
  arbitrum: '0.0005',
}

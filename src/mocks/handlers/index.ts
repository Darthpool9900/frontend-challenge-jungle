
import { http, HttpResponse } from 'msw'

import { authHandlers } from './auth.handlers'
import { nftHandlers } from './nft.handlers'
import { favoritesHandlers } from './favorites.handlers'
import { cartHandlers } from './cart.handlers'
import { nftScenarioHandlers } from './nft.scenarios'
import { walletHandlers } from './wallet.handlers'
import { walletConnectionHandlers } from './wallet-connection.handlers'
import { quoteHandlers } from './quote.handlers'
import { orderHandlers } from './order.handlers'
import { orderScenarioHandlers } from './order.scenarios'


export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'ok',
      message: 'Jungle Marketplace API funcionando!',
      timestamp: new Date().toISOString(),
    })
  }),

  ...authHandlers,
  ...nftHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...nftScenarioHandlers,
  ...walletHandlers,
  ...walletConnectionHandlers,
  ...quoteHandlers,
  ...orderHandlers,
  ...orderScenarioHandlers,
]

import { socketHandlers } from './realtime/socket.handlers'
import { socketScenarioHandlers } from './realtime/socket.scenarios'

import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers, ...socketHandlers, ...socketScenarioHandlers)

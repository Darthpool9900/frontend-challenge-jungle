import { test, expect } from '@playwright/test'
import type {} from '../src/mocks/realtime/test-harness'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => window.realtimeTest?.status() === 'connected')
})

test('real transport, price, stock, cache, duplicates, stale events and quote review', async ({ page }) => {
  const nft = await page.evaluate(() => window.realtimeTest.observe())
  const edition = nft.editions.find(item => item.availableQuantity > 0)!
  const quote = await page.evaluate(([id, editionId]) => window.realtimeTest.quote(id, editionId), [nft.id, edition.id])
  await page.evaluate(([id, editionId]) => window.realtimeTest.patch(id, editionId, { priceEth: '9.123', availableQuantity: 0 }), [nft.id, edition.id])
  await expect.poll(() => page.evaluate(() => window.realtimeTest.diagnostics().nftReceived)).toBe(1)
  await expect.poll(() => page.evaluate(id => window.realtimeTest.nft(id)?.nft.editions.find(e => e.id === id + '-edition-1')?.priceEth, nft.id)).toBe('9.123')
  const rest = await page.evaluate(id => window.realtimeTest.restNft(id), nft.id)
  expect(rest.nft.editions.find(item => item.id === edition.id)?.availableQuantity).toBe(0)
  await expect.poll(() => page.evaluate(id => window.realtimeTest.cachedQuote(id)?.status, quote.quoteId)).toBe('requires_review')
  await expect.poll(() => page.evaluate(() => window.realtimeTest.cart()?.items[0]?.status)).toBe('unavailable')
  await page.evaluate(async () => {
    await window.realtimeTest.scenario('duplicate')
    await window.realtimeTest.scenario('stale')
  })
  await expect.poll(() => page.evaluate(() => window.realtimeTest.diagnostics().nftReceived)).toBe(3)
  expect((await page.evaluate(id => window.realtimeTest.restNft(id), nft.id)).nft.version).toBe(rest.nft.version)
  expect((await page.evaluate(id => window.realtimeTest.nft(id), nft.id))?.nft.version).toBe(rest.nft.version)
})

test('old in-flight REST response cannot overwrite updated NFT', async ({ page }) => {
  const nft = await page.evaluate(() => window.realtimeTest.observe())
  await page.evaluate(id => window.realtimeTest.holdNft(id), nft.id)
  await page.waitForFunction(() => window.realtimeTest.heldStarted())
  await page.evaluate(([id, editionId]) => window.realtimeTest.patch(id, editionId, { priceEth: '7.5' }), [nft.id, nft.editions[0].id])
  await expect.poll(() => page.evaluate(id => window.realtimeTest.nft(id)?.nft.version, nft.id)).toBe(nft.version + 1)
  await page.evaluate(() => window.realtimeTest.releaseHeld())
  expect((await page.evaluate(id => window.realtimeTest.nft(id), nft.id))?.nft.editions[0].priceEth).toBe('7.5')
})

for (const outcome of ['confirm', 'decline', 'timeout'] as const) {
  test(`order ${outcome}: event, idempotency, financial consistency`, async ({ page }) => {
    await page.evaluate(() => window.realtimeTest.login())
    await page.waitForFunction(() => window.realtimeTest.status() === 'connected')
    const nft = await page.evaluate(() => window.realtimeTest.observe())
    const edition = nft.editions.find(item => item.availableQuantity > 0)!
    const order = await page.evaluate(({ id, editionId, outcome }) => window.realtimeTest.buy(id, editionId, outcome), { id: nft.id, editionId: edition.id, outcome })
    expect(order.status).toBe('pending')
    const terminal = outcome === 'decline' ? 'declined' : 'confirmed'
    await expect.poll(() => page.evaluate(id => window.realtimeTest.order(id)?.order.status, order.id)).toBe(terminal)
    await expect.poll(() => page.evaluate(() => window.realtimeTest.diagnostics().orderReceived)).toBe(1)
    const settled = await page.evaluate(id => window.realtimeTest.order(id), order.id)
    await page.evaluate(async () => {
      await window.realtimeTest.scenario('duplicate', 'order.updated')
      await window.realtimeTest.scenario('stale', 'order.updated')
    })
    await expect.poll(() => page.evaluate(() => window.realtimeTest.diagnostics().orderReceived)).toBe(3)
    const history = await page.evaluate(() => window.realtimeTest.orders())
    expect(history.orders).toHaveLength(1)
    expect(history.orders[0]).toEqual(settled?.order)
    const rest = await page.evaluate(id => window.realtimeTest.restNft(id), nft.id)
    expect(rest.nft.editions.find(item => item.id === edition.id)?.availableQuantity).toBe(edition.availableQuantity - (outcome === 'decline' ? 0 : 1))
  })
}

test('disconnection, missed terminal event, reconnect and refresh recover same order', async ({ page }) => {
  await page.evaluate(() => window.realtimeTest.login())
  await page.waitForFunction(() => window.realtimeTest.status() === 'connected')
  const nft = await page.evaluate(() => window.realtimeTest.observe())
  const order = await page.evaluate(({ id, editionId }) => window.realtimeTest.buy(id, editionId, 'confirm'), { id: nft.id, editionId: nft.editions[0].id })
  await page.evaluate(() => window.realtimeTest.offline())
  await expect.poll(() => page.evaluate(() => window.realtimeTest.connections())).toBe(0)
  await expect.poll(() => page.evaluate(async () => (await window.realtimeTest.orders()).orders[0].status)).toBe('confirmed')
  expect(await page.evaluate(() => window.realtimeTest.diagnostics().orderReceived)).toBe(0)
  await page.evaluate(() => window.realtimeTest.online())
  await page.waitForFunction(() => window.realtimeTest.status() === 'connected')
  await expect.poll(() => page.evaluate(id => window.realtimeTest.order(id)?.order.status, order.id)).toBe('confirmed')
  await page.reload()
  await page.waitForFunction(() => window.realtimeTest?.status() === 'connected')
  const restored = await page.evaluate(id => window.realtimeTest.observeOrder(id), order.id)
  expect(restored.order.status).toBe('confirmed')
  expect(restored.order.idempotencyKey).toBe(order.idempotencyKey)
})

test('automatic reconnect and StrictMode retain exactly one connection', async ({ page }) => {
  const initial = await page.evaluate(() => window.realtimeTest.diagnostics().connectionsCreated)
  await page.evaluate(() => window.realtimeTest.remount())
  expect(await page.evaluate(() => window.realtimeTest.diagnostics().connectionsCreated)).toBe(initial)
  await page.evaluate(() => window.realtimeTest.scenario('disconnect'))
  await expect.poll(() => page.evaluate(() => window.realtimeTest.connections())).toBe(1)
  await page.waitForFunction(() => window.realtimeTest.status() === 'connected')
  expect(await page.evaluate(() => window.realtimeTest.diagnostics().connectionsCreated)).toBe(initial)
})

test('connection errors are observable and automatic retry recovers REST state', async ({ page }) => {
  const nft = await page.evaluate(() => window.realtimeTest.observe())
  await page.evaluate(() => window.realtimeTest.scenario('reject'))
  await page.waitForFunction(() => window.realtimeTest.status() === 'error')
  await page.evaluate(([id, editionId]) => window.realtimeTest.patch(id, editionId, { priceEth: '8.75' }), [nft.id, nft.editions[0].id])
  await page.evaluate(() => window.realtimeTest.scenario('resume'))
  await page.waitForFunction(() => window.realtimeTest.status() === 'connected')
  await expect.poll(() => page.evaluate(id => window.realtimeTest.nft(id)?.nft.editions[0].priceEth, nft.id)).toBe('8.75')
})

test('logout and account switch isolate private events', async ({ page }) => {
  await page.evaluate(() => window.realtimeTest.login())
  await page.waitForFunction(() => window.realtimeTest.status() === 'connected')
  const nft = await page.evaluate(() => window.realtimeTest.observe())
  const order = await page.evaluate(({ id, editionId }) => window.realtimeTest.buy(id, editionId, 'decline'), { id: nft.id, editionId: nft.editions[0].id })
  await expect.poll(() => page.evaluate(id => window.realtimeTest.order(id)?.order.status, order.id)).toBe('declined')
  const before = await page.evaluate(() => window.realtimeTest.diagnostics().orderReceived)
  await page.evaluate(() => window.realtimeTest.logout())
  await page.evaluate(() => window.realtimeTest.login('lucas@jungle.test'))
  await page.waitForFunction(() => window.realtimeTest.status() === 'connected')
  await page.evaluate(() => window.realtimeTest.scenario('duplicate', 'order.updated'))
  expect((await page.evaluate(() => window.realtimeTest.orders())).orders).toEqual([])
  expect(await page.evaluate(() => window.realtimeTest.diagnostics().orderReceived)).toBe(before)
  expect(await page.evaluate(id => window.realtimeTest.order(id), order.id)).toBeUndefined()
  expect(await page.evaluate(() => window.realtimeTest.connections())).toBe(1)
})

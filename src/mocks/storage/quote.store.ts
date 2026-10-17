
import type { QuoteResponse } from '@/contracts/quote'

interface StoredQuote {
  owner: string
  quote: QuoteResponse
}

type QuoteDatabase = Record<string, StoredQuote>

const STORAGE_KEY = 'jungle.quotes.db.v1'

function readDatabase(): QuoteDatabase {
  const saved = localStorage.getItem(STORAGE_KEY)

  if (!saved) return {}

  try {
    const parsed: unknown = JSON.parse(saved)

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      return {}
    }

    return parsed as QuoteDatabase
  } catch {
    return {}
  }
}

export function saveQuote(
  owner: string,
  quote: QuoteResponse
): void {
  const db = readDatabase()

  db[quote.quoteId] = {
    owner,
    quote: structuredClone(quote),
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(db)
  )
}

export function findQuote(
  owner: string,
  quoteId: string
): QuoteResponse | null {
  const stored = readDatabase()[quoteId]

  if (!stored || stored.owner !== owner) {
    return null
  }

  return structuredClone(stored.quote)
}

export function resetQuoteDatabase(): void {
  localStorage.removeItem(STORAGE_KEY)
}

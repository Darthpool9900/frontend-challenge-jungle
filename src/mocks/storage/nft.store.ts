
import type {
  NftCollection,
  NftDetail,
} from '@/contracts/nft'

import {
  collections,
  createNftFixtures,
} from '../data/nft.fixtures'

export interface NftDatabase {
  nfts: NftDetail[]
  collections: NftCollection[]
}

const STORAGE_KEY = 'jungle.nft.db.v1'

let cache: NftDatabase | null = null

function createInitialDatabase(): NftDatabase {
  return {
    nfts: createNftFixtures(),
    collections: structuredClone(collections),
  }
}

export function getNftDatabase(): NftDatabase {
  if (cache) {
    return cache
  }

  const saved = localStorage.getItem(STORAGE_KEY)

  if (saved) {
    try {
      const parsed: unknown = JSON.parse(saved)

      if (
        parsed &&
        typeof parsed === 'object' &&
        'nfts' in parsed &&
        'collections' in parsed &&
        Array.isArray(parsed.nfts) &&
        Array.isArray(parsed.collections)
      ) {
        cache = parsed as NftDatabase
        return cache
      }
    } catch {
      // Persistência inválida: recriar banco inicial.
    }
  }

  cache = createInitialDatabase()
  saveNftDatabase(cache)

  return cache
}

export function saveNftDatabase(database: NftDatabase): void {
  cache = database
  localStorage.setItem(STORAGE_KEY, JSON.stringify(database))
}

export function resetNftDatabase(): NftDatabase {
  localStorage.removeItem(STORAGE_KEY)

  cache = createInitialDatabase()
  saveNftDatabase(cache)

  return cache
}

export function findNftById(id: string): NftDetail | undefined {
  return getNftDatabase().nfts.find((nft) => nft.id === id)
}


import Decimal from 'decimal.js'

import type {
  NftDetail,
  NftListQuery,
  NftListResponse,
  NftSummary,
} from '@/contracts/nft'

import {
  findNftById,
  getNftDatabase,
} from '../storage/nft.store'

// Converte o NFT completo para o formato do catálogo.
function toSummary(nft: NftDetail): NftSummary {
  return {
    id: nft.id,
    name: nft.name,
    coverImageUrl: nft.coverImageUrl,
    category: nft.category,
    rarity: nft.rarity,
    creator: nft.creator,
    collection: nft.collection,
    startingPriceEth: nft.startingPriceEth,
    availableQuantity: nft.availableQuantity,
    featured: nft.featured,
    popularity: nft.popularity,
    createdAt: nft.createdAt,
    version: nft.version,
  }
}

// Busca ignorando diferenças entre maiúsculas e minúsculas.
function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

// Aplica todos os filtros.
function filterNfts(
  nfts: NftDetail[],
  query: NftListQuery
): NftDetail[] {
  return nfts.filter((nft) => {
    // Busca textual.
    if (query.search) {
      const search = normalizeText(query.search)

      const searchable = normalizeText([
        nft.name,
        nft.description,
        nft.collection.name,
        nft.creator.name,
      ].join(' '))

      if (!searchable.includes(search)) {
        return false
      }
    }

    // Categoria.
    if (
      query.category &&
      nft.category !== query.category
    ) {
      return false
    }

    // Coleção.
    if (
      query.collectionId &&
      nft.collection.id !== query.collectionId
    ) {
      return false
    }

    // Raridade.
    if (
      query.rarity &&
      nft.rarity !== query.rarity
    ) {
      return false
    }

    // Disponibilidade.
    if (
      query.availability === 'available' &&
      nft.availableQuantity <= 0
    ) {
      return false
    }

    if (
      query.availability === 'sold_out' &&
      nft.availableQuantity > 0
    ) {
      return false
    }

    // Preços utilizando Decimal.js.
    const price = new Decimal(nft.startingPriceEth)

    if (
      query.minPriceEth !== undefined &&
      price.lt(new Decimal(query.minPriceEth))
    ) {
      return false
    }

    if (
      query.maxPriceEth !== undefined &&
      price.gt(new Decimal(query.maxPriceEth))
    ) {
      return false
    }

    return true
  })
}

// Ordenação determinística.
function sortNfts(
  nfts: NftDetail[],
  sort: NftListQuery['sort']
): NftDetail[] {
  return [...nfts].sort((a, b) => {
    let comparison: number

    switch (sort) {
      case 'price_asc':
        comparison = new Decimal(a.startingPriceEth)
          .comparedTo(b.startingPriceEth)
        break

      case 'price_desc':
        comparison = new Decimal(b.startingPriceEth)
          .comparedTo(a.startingPriceEth)
        break

      case 'popular':
        comparison = b.popularity - a.popularity
        break

      case 'oldest':
        comparison =
          Date.parse(a.createdAt) - Date.parse(b.createdAt)
        break

      case 'recent':
      default:
        comparison =
          Date.parse(b.createdAt) - Date.parse(a.createdAt)
        break
    }

    // Desempate estável.
    return comparison || a.id.localeCompare(b.id)
  })
}

// GET /api/nfts
export function listNfts(
  query: NftListQuery
): NftListResponse {
  const db = getNftDatabase()

  const filtered = filterNfts(db.nfts, query)
  const sorted = sortNfts(filtered, query.sort)

  const totalItems = sorted.length
  const totalPages = Math.ceil(totalItems / query.pageSize)

  const offset = (query.page - 1) * query.pageSize

  const items = sorted
    .slice(offset, offset + query.pageSize)
    .map(toSummary)

  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      totalItems,
      totalPages,
    },
  }
}

// GET /api/nfts/:id
export function getNftById(
  id: string
): NftDetail | undefined {
  return findNftById(id)
}

// GET /api/collections
export function listCollections() {
  return getNftDatabase().collections
}

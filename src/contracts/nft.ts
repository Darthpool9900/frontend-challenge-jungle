
import { z } from 'zod'

// Valores em ETH nunca serão armazenados como number.
export const ethAmountSchema = z.string().regex(
  /^(0|[1-9]\d*)(\.\d{1,18})?$/,
  'Valor em ETH inválido'
)

// Raridades
export const nftRaritySchema = z.enum([
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
])

// Ordenação
export const nftSortSchema = z.enum([
  'recent',
  'oldest',
  'price_asc',
  'price_desc',
  'popular',
])

// Parâmetros da listagem
export const nftListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),

  category: z.string().trim().min(1).optional(),

  collectionId: z.string().trim().min(1).optional(),

  rarity: nftRaritySchema.optional(),

  availability: z.enum([
    'available',
    'sold_out',
  ]).optional(),

  minPriceEth: ethAmountSchema.optional(),
  maxPriceEth: ethAmountSchema.optional(),

  sort: nftSortSchema.default('recent'),

  page: z.coerce.number().int().min(1).default(1),

  pageSize: z.coerce.number()
    .int()
    .min(1)
    .max(48)
    .default(12),
})

// Criador
export interface NftCreator {
  id: string
  name: string
  avatarUrl: string | null
}

// Coleção
export interface NftCollection {
  id: string
  name: string
  description?: string
}

// Atributos do NFT
export interface NftAttribute {
  traitType: string
  value: string
}

// Edição individual
export interface NftEdition {
  id: string
  name: string
  priceEth: string
  totalSupply: number
  availableQuantity: number
  version: number
}

// NFT resumido para o catálogo
export interface NftSummary {
  id: string
  name: string
  coverImageUrl: string
  category: string
  rarity: z.infer<typeof nftRaritySchema>

  creator: NftCreator
  collection: NftCollection

  startingPriceEth: string
  availableQuantity: number

  featured: boolean
  popularity: number

  createdAt: string
  version: number
}

// NFT completo para a página de detalhes
export interface NftDetail extends NftSummary {
  description: string
  images: string[]
  attributes: NftAttribute[]
  editions: NftEdition[]
}

// Metadados da paginação
export interface NftPagination {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

// Resposta de GET /api/nfts
export interface NftListResponse {
  items: NftSummary[]
  pagination: NftPagination
}

// Resposta de GET /api/nfts/:id
export interface NftDetailResponse {
  nft: NftDetail
}

// Evento Socket.IO
export interface NftUpdatedEvent {
  eventId: string
  nftId: string
  editionId: string
  version: number
  priceEth: string
  availableQuantity: number
  occurredAt: string
}

// Tipos de entrada e saída das consultas
export type NftListParams = z.input<
  typeof nftListQuerySchema
>

export type NftListQuery = z.output<
  typeof nftListQuerySchema
>

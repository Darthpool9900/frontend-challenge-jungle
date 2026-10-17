
import Decimal from 'decimal.js'

import type {
  NftCollection,
  NftCreator,
  NftDetail,
  NftEdition,
  NftSummary,
} from '@/contracts/nft'

export const collections: NftCollection[] = [
  {
    id: 'kurio-apes',
    name: 'Kurio Apes',
    description: 'Coleção de primatas digitais exclusivos.',
  },
  {
    id: 'digital-legends',
    name: 'Digital Legends',
    description: 'Personagens lendários da arte digital.',
  },
  {
    id: 'pixel-world',
    name: 'Pixel World',
    description: 'Colecionáveis inspirados na arte pixelada.',
  },
  {
    id: 'cosmic-art',
    name: 'Cosmic Art',
    description: 'Exploração artística do universo.',
  },
]

export const creators: NftCreator[] = [
  { id: 'creator-1', name: 'Kurio Studio', avatarUrl: null },
  { id: 'creator-2', name: 'Alex Digital', avatarUrl: null },
  { id: 'creator-3', name: 'Pixel Master', avatarUrl: null },
  { id: 'creator-4', name: 'Cosmic Labs', avatarUrl: null },
]

type Seed = [
  name: string,
  category: string,
  rarity: NftSummary['rarity'],
  collectionId: string,
  priceEth: string,
  creatorIndex: number
]

const seeds: Seed[] = [
  ['Emerald Ape #042', 'arte-digital', 'rare', 'kurio-apes', '1.19', 0],
  ['Golden Ape #017', 'arte-digital', 'legendary', 'kurio-apes', '2.50', 0],
  ['Cyber Ape #081', 'arte-digital', 'epic', 'kurio-apes', '1.75', 0],
  ['Royal Ape #003', 'arte-digital', 'legendary', 'kurio-apes', '3.20', 0],
  ['Neon Ape #112', 'arte-digital', 'rare', 'kurio-apes', '0.89', 0],
  ['Shadow Ape #034', 'arte-digital', 'epic', 'kurio-apes', '1.48', 0],
  ['Crystal Ape #065', 'arte-digital', 'rare', 'kurio-apes', '0.95', 0],
  ['Ocean Ape #019', 'arte-digital', 'uncommon', 'kurio-apes', '0.65', 0],
  ['Fire Ape #077', 'arte-digital', 'rare', 'kurio-apes', '1.05', 0],
  ['Diamond Ape #001', 'arte-digital', 'legendary', 'kurio-apes', '4.25', 0],

  ['Cyber Samurai', 'colecionaveis', 'epic', 'digital-legends', '1.85', 1],
  ['Neon Warrior', 'colecionaveis', 'rare', 'digital-legends', '0.95', 1],
  ['Digital Queen', 'colecionaveis', 'legendary', 'digital-legends', '2.75', 1],
  ['Phantom Knight', 'colecionaveis', 'epic', 'digital-legends', '1.45', 1],
  ['Crystal Guardian', 'colecionaveis', 'rare', 'digital-legends', '0.82', 1],
  ['Golden Phoenix', 'colecionaveis', 'legendary', 'digital-legends', '3.15', 1],
  ['Cyber Dragon', 'colecionaveis', 'epic', 'digital-legends', '2.10', 1],
  ['Shadow Hunter', 'colecionaveis', 'uncommon', 'digital-legends', '0.55', 1],

  ['Pixel City', 'gaming', 'common', 'pixel-world', '0.25', 2],
  ['Pixel Hero', 'gaming', 'rare', 'pixel-world', '0.65', 2],
  ['Retro Castle', 'gaming', 'uncommon', 'pixel-world', '0.45', 2],
  ['Pixel Dragon', 'gaming', 'epic', 'pixel-world', '1.15', 2],
  ['Retro Spaceship', 'gaming', 'rare', 'pixel-world', '0.75', 2],
  ['Pixel Kingdom', 'gaming', 'legendary', 'pixel-world', '1.95', 2],

  ['Cosmic Nebula', 'arte-digital', 'rare', 'cosmic-art', '0.85', 3],
  ['Galaxy Dream', 'arte-digital', 'epic', 'cosmic-art', '1.35', 3],
  ['Lunar Eclipse', 'arte-digital', 'legendary', 'cosmic-art', '2.25', 3],
  ['Solar Storm', 'arte-digital', 'rare', 'cosmic-art', '0.95', 3],
  ['Starborn', 'arte-digital', 'uncommon', 'cosmic-art', '0.50', 3],
  ['Infinite Cosmos', 'arte-digital', 'legendary', 'cosmic-art', '3.80', 3],
]

// Imagens temporárias: não dependem de APIs externas.
function createPlaceholder(name: string, index: number): string {
  const colors = ['#285746', '#693b77', '#8b542e', '#293e79']
  const color = colors[index % colors.length]

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="600" height="600" viewBox="0 0 600 600">
      <rect width="600" height="600" fill="${color}"/>
      <circle cx="300" cy="245" r="115" fill="#ffffff" opacity=".12"/>
      <text x="300" y="440" text-anchor="middle"
        font-size="25" font-family="monospace"
        font-weight="bold" fill="white">KURIO NFT</text>
      <text x="300" y="485" text-anchor="middle"
        font-size="17" font-family="monospace"
        fill="white">#${String(index + 1).padStart(3, '0')}</text>
    </svg>
  `

  void name

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function createEditions(
  nftId: string,
  basePrice: string,
  soldOut: boolean,
  index: number
): NftEdition[] {
  const price = new Decimal(basePrice)

  const specs = [
    { name: '1/1', supply: 1, multiplier: '3' },
    { name: '1/10', supply: 10, multiplier: '1.5' },
    { name: '1/50', supply: 50, multiplier: '1' },
    { name: 'ABERTA', supply: 1000, multiplier: '1' },
  ]

  return specs.map((spec, editionIndex) => ({
    id: `${nftId}-edition-${editionIndex + 1}`,
    name: spec.name,
    priceEth: price.mul(spec.multiplier).toString(),
    totalSupply: spec.supply,
    availableQuantity: soldOut
      ? 0
      : editionIndex === 0
        ? 1
        : Math.max(1, spec.supply - (index % 8)),
    version: 1,
  }))
}

export function createNftFixtures(): NftDetail[] {
  return seeds.map((seed, index) => {
    const [
      name,
      category,
      rarity,
      collectionId,
      basePrice,
      creatorIndex,
    ] = seed

    const id = `nft-${String(index + 1).padStart(3, '0')}`

    // Alguns NFTs estarão esgotados para testar filtros.
    const soldOut = (index + 1) % 8 === 0

    const editions = createEditions(
      id,
      basePrice,
      soldOut,
      index
    )

    const collection = collections.find(
      (item) => item.id === collectionId
    )!

    const image = createPlaceholder(name, index)

    const nft: NftDetail = {
      id,
      name,
      category,
      rarity,
      creator: creators[creatorIndex],
      collection,

      coverImageUrl: image,
      images: [image, image, image, image],

      description:
        `${name} é um colecionável digital da coleção ` +
        `${collection.name}, disponível em diferentes edições.`,

      attributes: [
        { traitType: 'Raridade', value: rarity },
        { traitType: 'Coleção', value: collection.name },
        { traitType: 'Categoria', value: category },
      ],

      editions,

      startingPriceEth: Decimal.min(
        ...editions.map((edition) => edition.priceEth)
      ).toString(),

      availableQuantity: editions.reduce(
        (total, edition) => total + edition.availableQuantity,
        0
      ),

      featured: index < 4,
      popularity: 1000 - index * 20,

      createdAt: new Date(
        Date.UTC(2026, 8, 1 + (index % 28))
      ).toISOString(),

      version: 1,
    }

    return nft
  })
}


type FavoritesDatabase = Record<string, string[]>

const STORAGE_KEY = 'jungle.favorites.db.v1'

function readDatabase(): FavoritesDatabase {
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

    const result: FavoritesDatabase = {}

    for (const [userId, ids] of Object.entries(parsed)) {
      if (Array.isArray(ids)) {
        result[userId] = ids.filter(
          (id): id is string => typeof id === 'string'
        )
      }
    }

    return result
  } catch {
    return {}
  }
}

function saveDatabase(db: FavoritesDatabase): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

export function getFavoriteIds(userId: string): string[] {
  const db = readDatabase()
  return [...(db[userId] ?? [])]
}

export function addFavorite(
  userId: string,
  nftId: string
): void {
  const db = readDatabase()

  db[userId] = Array.from(
    new Set([...(db[userId] ?? []), nftId])
  )

  saveDatabase(db)
}

export function removeFavorite(
  userId: string,
  nftId: string
): void {
  const db = readDatabase()

  db[userId] = (db[userId] ?? []).filter(
    id => id !== nftId
  )

  saveDatabase(db)
}

export function resetFavorites(): void {
  localStorage.removeItem(STORAGE_KEY)
}

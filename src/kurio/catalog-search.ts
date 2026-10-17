import { z } from "zod";

import {
  ethAmountSchema,
  nftSortSchema,
  type NftListParams,
} from "@/contracts/nft";

const catalogSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: z.string().trim().max(80).optional().catch(undefined),
  sort: nftSortSchema.optional().catch(undefined),
  maxPriceEth: ethAmountSchema.optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
  tab: z.enum(["all", "new", "popular"]).optional().catch(undefined),
  filters: z.string().optional().catch(undefined),
});

export type CatalogSearch = z.infer<typeof catalogSchema>;

/** TanStack Router uses this for direct visits, refreshes and browser history. */
export function validateCatalogSearch(
  search: Record<string, unknown>,
): CatalogSearch {
  const result = catalogSchema.parse(search);

  return Object.fromEntries(
    Object.entries(result).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  ) as CatalogSearch;
}

export function catalogParams(search: CatalogSearch): NftListParams {
  return {
    search: search.q || undefined,
    category: search.category || undefined,
    sort:
      search.tab === "popular"
        ? "popular"
        : search.tab === "new"
          ? "recent"
          : (search.sort ?? "recent"),
    maxPriceEth: search.maxPriceEth,
    page: search.page ?? 1,
    pageSize: 9,
  };
}

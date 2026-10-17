import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { FavoritesResponse } from "@/contracts/favorites";
import { favoritesService } from "@/services/favorites.service";
import { useAuthSession } from "@/features/auth/auth.hooks";

import { favoriteKeys, favoritesQueryOptions } from "./favorites.queries";

export function useFavorites() {
  const session = useAuthSession();
  const userId = session.data?.user.id;

  return useQuery({
    ...favoritesQueryOptions(userId ?? "anonymous"),
    enabled: Boolean(userId),
  });
}

/**
 * Optimistic favorite toggle, with rollback on errors.
 * Mutate only the current user's cache to avoid leaking private data.
 */
function useFavoriteMutation(action: "add" | "remove") {
  const queryClient = useQueryClient();
  const session = useAuthSession();
  const userId = session.data?.user.id;

  return useMutation({
    mutationFn: async (nftId: string) => {
      if (!userId) {
        throw new Error("É necessário fazer login para favoritar NFTs.");
      }

      return action === "add"
        ? favoritesService.add(nftId)
        : favoritesService.remove(nftId);
    },

    onMutate: async (nftId: string) => {
      if (!userId) {
        return { previous: undefined, userId: undefined };
      }

      const queryKey = favoriteKeys.byUser(userId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FavoritesResponse>(queryKey);

      queryClient.setQueryData<FavoritesResponse>(queryKey, (current) => {
        const nftIds = current?.nftIds ?? [];

        return {
          nftIds:
            action === "add"
              ? Array.from(new Set([...nftIds, nftId]))
              : nftIds.filter((id) => id !== nftId),
        };
      });

      return { previous, userId };
    },

    onError: (_error, _nftId, context) => {
      if (!context?.userId) return;

      const queryKey = favoriteKeys.byUser(context.userId);

      if (context.previous === undefined) {
        queryClient.removeQueries({ queryKey, exact: true });
      } else {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    onSettled: async (_data, _error, _nftId, context) => {
      if (!context?.userId) return;

      await queryClient.invalidateQueries({
        queryKey: favoriteKeys.byUser(context.userId),
      });
    },
  });
}

export function useAddFavorite() {
  return useFavoriteMutation("add");
}

export function useRemoveFavorite() {
  return useFavoriteMutation("remove");
}

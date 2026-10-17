import Decimal from "decimal.js";
import type { NftSummary } from "@/contracts/nft";

export const art = [
  "/kurio/emerald.webp",
  "/kurio/sage.webp",
  "/kurio/ivory.webp",
  "/kurio/golden.webp",
] as const;
const names: Record<string, string> = {
  "nft-001": "Emerald Ape #042",
  "nft-002": "Sage Nomad #009",
  "nft-003": "Neon Vessel #552",
  "nft-004": "Cosmic Bloom #118",
  "nft-005": "Violet Nomad #314",
  "nft-006": "Ivory Baron #088",
  "nft-007": "Golden Beat #207",
  "nft-008": "Golden Frequency #071",
  "nft-009": "Golden Signal #160",
};
export const displayName = (id: string, fallback: string) =>
  names[id] ?? fallback;
export function nftArt(
  nft:
    | Pick<NftSummary, "id" | "coverImageUrl">
    | { nftId: string; imageUrl: string }
    | string,
) {
  const id = typeof nft === "string" ? nft : "id" in nft ? nft.id : nft.nftId;
  const n = Number(id.match(/\d+/)?.[0] || 1);
  const idx =
    n >= 7 && n <= 9
      ? 3
      : n <= 1
        ? 0
        : n === 2 || n === 4 || n === 5
          ? 1
          : n === 3 || n === 6
            ? 2
            : n % 4 === 0
              ? 1
              : n % 4 === 1
                ? 0
                : n % 4 === 2
                  ? 2
                  : 3;
  return art[idx];
}
/** Format ETH without lossy conversion to JavaScript Number. */
export function eth(value: string | number | undefined): string {
  const [integer, fraction = ""] = new Decimal(String(value ?? "0"))
    .toFixed()
    .split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${grouped}.${fraction.padEnd(2, "0")} ETH`;
}
export function messageOf(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const e = error as {
      response?: { data?: { error?: { message?: string } } };
      message?: string;
    };
    return (
      e.response?.data?.error?.message ||
      e.message ||
      "Não foi possível concluir a operação."
    );
  }
  return "Não foi possível concluir a operação.";
}
export const networks = ["ethereum", "polygon", "base", "arbitrum"] as const;
export function tokenFromName(name: string) {
  return name.match(/#\d+/)?.[0] || "#0042";
}

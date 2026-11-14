import { ARTWORKS, PATRONAGE_DENOMINATOR, type Version } from "./artworks";
import type { StewardData } from "./graphql";

const YEAR_SECONDS = 365n * 24n * 60n * 60n;

// The subgraph stores this placeholder when foreclosureTime() reverts (per-second patronage rounds to zero).
const FORECLOSURE_TIME_PLACEHOLDER = 4894893805n;

export interface StewardState {
  price: bigint;
  /** Patronage accrued since the last on-chain collection (uncapped, as patronageOwed() returns it). */
  patronageOwed: bigint;
  /** Mirrors depositAbleToWithdraw(). */
  availableDeposit: bigint;
  /** Mirrors foreclosed(): the deposit no longer covers patronage, but nobody has triggered the collection yet. */
  isPastDue: boolean;
  /** The _currentPrice buy() will accept: it collects first, and if that forecloses, the price is zero. */
  buyPrice: bigint;
  /** Unix seconds, or null when unknown or not applicable. */
  foreclosureTime: number | null;
  /** Patronage collected so far plus what is owed but not yet collected (capped at the deposit). */
  lifetimePatronage: bigint;
}

/** Patronage that accrues on a price over the given number of seconds. */
export function patronageForSeconds(price: bigint, seconds: number, version: Version): bigint {
  return (price * BigInt(seconds) * ARTWORKS[version].patronageNumerator) / PATRONAGE_DENOMINATOR / YEAR_SECONDS;
}

/** Seconds a deposit lasts at a given price, or null if no patronage accrues (price 0). */
export function depositRunwaySeconds(price: bigint, deposit: bigint, version: Version): number | null {
  const perYear = (price * ARTWORKS[version].patronageNumerator) / PATRONAGE_DENOMINATOR;
  if (perYear === 0n) return null;
  return Number((deposit * YEAR_SECONDS) / perYear);
}

// Reproduces the steward contracts' view functions from subgraph data, so the UI needs no RPC reads.
// Same integer arithmetic and operation order as patronageOwed() in ArtSteward.sol / ArtStewardV2.sol.
export function stewardState(steward: StewardData | undefined, version: Version, now: number): StewardState | null {
  if (!steward) return null;

  const price = BigInt(steward.currentPrice);
  const deposit = BigInt(steward.currentDeposit);
  const elapsed = BigInt(Math.max(0, now - parseInt(steward.timeLastCollected)));
  const patronageOwed =
    (price * elapsed * ARTWORKS[version].patronageNumerator) / PATRONAGE_DENOMINATOR / YEAR_SECONDS;

  // _collectPatronage() only runs while price > 0; a steward-held artwork can't be foreclosed again.
  const isPastDue = price > 0n && patronageOwed >= deposit;
  const availableDeposit = isPastDue ? 0n : deposit - patronageOwed;

  const rawForeclosureTime = BigInt(steward.foreclosureTime);
  const foreclosureTime =
    price > 0n && rawForeclosureTime > 0n && rawForeclosureTime !== FORECLOSURE_TIME_PLACEHOLDER
      ? Number(rawForeclosureTime)
      : null;

  return {
    price,
    patronageOwed,
    availableDeposit,
    isPastDue,
    buyPrice: isPastDue ? 0n : price,
    foreclosureTime,
    lifetimePatronage: BigInt(steward.totalCollected) + (patronageOwed < deposit ? patronageOwed : deposit),
  };
}

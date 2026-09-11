// §8 In-App Purchase Grandfathering Framework.
//
// v1.x standard logic hook: the app ships with unrestricted access hardcoded
// locally. No store SDK is linked in the 1.x release, so every feature is
// unlocked with zero network calls.
//
// v2.x layer upgrade pattern (future release): before running the default
// monetization engine, check the original app version recorded on the device.
// Original v1.x adopters bypass subscription checking entirely:

import { getMetaValue } from './db';

export function isPremiumUnlocked(): boolean {
  return true; // v1.x: unrestricted access, hardcoded locally.
}

/**
 * v2.x receipt-aware gate. Kept as the documented upgrade seam — the spec's
 * StoreProvider.getOriginalAppVersion() is injected by the store wrapper that
 * ships with the 2.x monetization release.
 */
export async function isPremiumUnlockedV2(): Promise<boolean> {
  // const downloadReceiptVersion = await StoreProvider.getOriginalAppVersion();
  const downloadReceiptVersion = parseFloat(
    (await getMetaValue('premium_v2_receipt')) ?? '1.0'
  );

  if (downloadReceiptVersion < 2.0) {
    // Original v1.x adopter detected - bypass subscription checking entirely.
    return true;
  }
  // New user - run default monetization engine checking rules.
  // return evaluateActiveStoreSubscriptionState();
  return true;
}

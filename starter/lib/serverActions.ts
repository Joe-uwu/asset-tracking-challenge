'use server';

import { createApiClient } from '@/lib/api-client';
import type { Location } from '@/lib/types';

/**
 * Update the facilities record for an asset (set or clear rack location).
 * @param assetTag - The asset tag.
 * @param rackLocation - The rack location string to set, or null to clear.
 */
export const updateAssetFacilities = async (
  assetTag: string,
  rackLocation: string | null
) => {
  const api = createApiClient();

  return await api.mock.updateFacilities({
    tagged_id: assetTag,
    rack_location: rackLocation,
  });
};

/**
 * Update the finance record for an asset.
 * @param assetTag - The asset tag.
 * @param financeData - The finance update data (e.g., status, book_value_usd, etc.)
 */
export const updateAssetFinance = async (
  assetTag: string,
  financeData: Partial<{
    status: 'capitalized' | 'pending_receipt' | 'retired' | 'impaired';
    book_value_usd?: number;
    site?: string;
    capitalized_on?: string | null;
  }>
) => {
  const api = createApiClient();

  return await api.mock.updateFinance({
    tag: assetTag,
    ...financeData,
    status: financeData.status ?? "pending_receipt",
  });
};
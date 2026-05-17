import { useCallback } from 'react';
import useSWR, { Key, SWRResponse } from 'swr';

/**
 * Simple fetcher for API calls - no custom retry logic as per requirements
 * (Backend hardening including retries is explicitly NOT required)
 */
const fetcher = async (url: string): Promise<any> => {
  const response = await fetch(url, {
    credentials: 'include', // Include cookies for authentication
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message ?? `HTTP ${response.status}`);
  }

  return await response.json();
};

/**
 * Custom hook for data fetching with SWR.
 * @param key - The SWR key.
 * @returns SWRResponse.
 */
export const useApiData = <Data = any, Error = any>(key: Key): SWRResponse<Data, Error> => {
  return useSWR<Data, Error>(key, fetcher, {
    // SWR provides automatic revalidation and cache invalidation
    // No custom retry logic needed as per requirements
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
};

/**
 * Custom hook for mutating data with SWR.
 * @param key - The SWR key to mutate.
 * @returns A tuple [trigger, { data, error, isMutating, reset }].
 */
export const useApiMutation = <Data = any, Error = any>(key: Key) => {
  const { data, mutate, ...rest } = useApiData<Data, Error>(key);
  const trigger = useCallback(
    async (mutator: Data | ((currentData: Data | undefined) => Data | Promise<Data | undefined>)) => {
      try {
        const result = await mutate(mutator, {
          revalidate: false, // We'll revalidate after the mutation
          throwOnError: true,
        });
        // Revalidate after successful mutation
        await mutate();
        return result;
      } catch (err) {
        // Mutation failed, error will be handled by SWR
        throw err;
      }
    },
    [mutate]
  );

  return [trigger, { data, ...rest }] as const;
};
import { requireOptionalNativeModule } from 'expo-modules-core';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { loadOwned, saveOwned } from '@/lib/files';
import { FALLBACK_PRICE } from '@/lib/model';

import { NativeIap } from '@/state/native-iap';

export const iapAvailable = requireOptionalNativeModule('ExpoIap') != null;

type EntitlementContextValue = {
  ready: boolean;
  isPro: boolean;
  priceLabel: string;
  iapAvailable: boolean;
  busy: boolean;
  error: string | null;
  buy: () => Promise<void>;
  restore: () => Promise<void>;
  previewLifetime: () => void;
  clearError: () => void;
};

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

type PurchaseActions = {
  buy: () => Promise<void>;
  restore: () => Promise<void>;
};

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const [owned, setOwned] = useState(false);
  const [preview, setPreview] = useState(false);
  const [ready, setReady] = useState(false);
  const [priceLabel, setPriceLabel] = useState(FALLBACK_PRICE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actions = useRef<PurchaseActions>({
    buy: async () => {
      throw new Error('Lifetime is sold in the App Store build of RentProof.');
    },
    restore: async () => {
      throw new Error('Restore works in the App Store build of RentProof.');
    },
  });

  useEffect(() => {
    let cancelled = false;
    loadOwned()
      .then((value) => {
        if (!cancelled) setOwned(value);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const applyOwned = useCallback(async (next: boolean) => {
    setOwned(next);
    await saveOwned(next);
  }, []);

  const register = useCallback((next: PurchaseActions) => {
    actions.current = next;
  }, []);

  const buy = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await actions.current.buy();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The purchase did not finish.');
    } finally {
      setBusy(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await actions.current.restore();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not restore purchases.');
    } finally {
      setBusy(false);
    }
  }, []);

  const value = useMemo<EntitlementContextValue>(
    () => ({
      ready,
      isPro: owned || preview,
      priceLabel,
      iapAvailable,
      busy,
      error,
      buy,
      restore,
      previewLifetime: () => setPreview(true),
      clearError: () => setError(null),
    }),
    [ready, owned, preview, priceLabel, busy, error, buy, restore],
  );

  return (
    <EntitlementContext.Provider value={value}>
      {iapAvailable ? (
        <NativeIap register={register} onOwned={applyOwned} onPrice={setPriceLabel} onError={setError} />
      ) : null}
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlement(): EntitlementContextValue {
  const value = useContext(EntitlementContext);
  if (!value) throw new Error('EntitlementProvider is missing');
  return value;
}

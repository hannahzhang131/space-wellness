import { useEffect } from 'react';
import { ErrorCode, finishTransaction, getAvailablePurchases, isUserCancelledError, useIAP } from 'expo-iap';

import { LIFETIME_PRODUCT_ID } from '@/lib/model';

type PurchaseActions = {
  buy: () => Promise<void>;
  restore: () => Promise<void>;
};

type Props = {
  register: (actions: PurchaseActions) => void;
  onOwned: (owned: boolean) => Promise<void>;
  onPrice: (price: string) => void;
  onError: (message: string | null) => void;
};

export function NativeIap({ register, onOwned, onPrice, onError }: Props) {
  const { connected, products, requestPurchase } = useIAP({
    onPurchaseSuccess: (purchase) => {
      if (purchase.productId !== LIFETIME_PRODUCT_ID) return;
      void finishTransaction({ purchase, isConsumable: false })
        .catch(() => undefined)
        .finally(() => {
          void onOwned(true);
        });
    },
    onPurchaseError: (error) => {
      if (isUserCancelledError(error)) return;
      if (error.code === ErrorCode.AlreadyOwned) {
        void onOwned(true);
        return;
      }
      onError(error.message);
    },
  });

  useEffect(() => {
    const product = products.find((item) => item.id === LIFETIME_PRODUCT_ID);
    if (product?.displayPrice) onPrice(product.displayPrice);
  }, [onPrice, products]);

  useEffect(() => {
    register({
      buy: async () => {
        if (!connected) throw new Error('The App Store is not reachable yet. Try again in a moment.');
        await requestPurchase({
          type: 'in-app',
          request: {
            apple: { sku: LIFETIME_PRODUCT_ID },
            google: { skus: [LIFETIME_PRODUCT_ID] },
          },
        });
      },
      restore: async () => {
        const purchases = await getAvailablePurchases();
        const owned = purchases.some((purchase) => purchase.productId === LIFETIME_PRODUCT_ID);
        await onOwned(owned);
        if (!owned) throw new Error('This Apple ID has not bought Lifetime.');
      },
    });
  }, [connected, onOwned, register, requestPurchase]);

  return null;
}

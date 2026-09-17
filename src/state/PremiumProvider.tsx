import { getMetaValue, setMetaValue } from "@/core/db";
import type { Plan } from "@/core/premium";
import {
  ErrorCode,
  finishTransaction as finishStoreTransaction,
  type Product,
  type Purchase,
  useIAP,
} from "expo-iap";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

export const PRO_PRODUCT_ID = "com.gaffersoccer.app.pro";

type PremiumContextValue = {
  plan: Plan;
  isPro: boolean;
  product: Product | null;
  isReady: boolean;
  isBusy: boolean;
  error: string | null;
  purchasePro: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  clearError: () => void;
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan>("free");
  const [isReady, setIsReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activatePro = useCallback(() => {
    setPlan("pro");
    void setMetaValue("premium_entitlement", "pro");
  }, []);

  const handlePurchaseSuccess = useCallback(
    (purchase: Purchase) => {
      if (
        purchase.productId !== PRO_PRODUCT_ID ||
        purchase.purchaseState !== "purchased"
      ) {
        return;
      }
      activatePro();
      void finishStoreTransaction({ purchase, isConsumable: false }).catch(
        () => setError("Purchase completed, but could not finish the store transaction."),
      );
    },
    [activatePro],
  );

  const iap = useIAP({
    onPurchaseSuccess: handlePurchaseSuccess,
    onPurchaseError: (purchaseError) => {
      if (purchaseError.code !== ErrorCode.UserCancelled) {
        setError(purchaseError.message);
      }
    },
    onError: (iapError) => setError(iapError.message),
  });

  useEffect(() => {
    let mounted = true;
    getMetaValue("premium_entitlement")
      .then((savedPlan) => {
        if (mounted && savedPlan === "pro") setPlan("pro");
      })
      .finally(() => {
        if (mounted) setIsReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!iap.connected || Platform.OS === "web") return;
    void iap.fetchProducts({ skus: [PRO_PRODUCT_ID], type: "in-app" }).catch(
      (iapError) => setError(iapError instanceof Error ? iapError.message : "Could not load Gaffer Pro."),
    );
    void iap.getAvailablePurchases().catch((iapError) =>
      setError(iapError instanceof Error ? iapError.message : "Could not restore purchases."),
    );
  }, [iap.connected]);

  useEffect(() => {
    if (
      iap.availablePurchases.some(
        (purchase) =>
          purchase.productId === PRO_PRODUCT_ID &&
          purchase.purchaseState === "purchased",
      )
    ) {
      activatePro();
    }
  }, [activatePro, iap.availablePurchases]);

  const purchasePro = useCallback(async () => {
    if (Platform.OS === "web") {
      setError("Gaffer Pro purchases are available in the iOS and Android apps.");
      return;
    }
    setError(null);
    setIsBusy(true);
    try {
      await iap.requestPurchase({
        request: {
          apple: { sku: PRO_PRODUCT_ID },
          google: { skus: [PRO_PRODUCT_ID] },
        },
        type: "in-app",
      });
    } catch (purchaseError) {
      setError(
        purchaseError instanceof Error
          ? purchaseError.message
          : "Could not start the Pro purchase.",
      );
    } finally {
      setIsBusy(false);
    }
  }, [iap]);

  const restorePurchases = useCallback(async () => {
    if (Platform.OS === "web") {
      setError("Purchase restoration is available in the iOS and Android apps.");
      return;
    }
    setError(null);
    setIsBusy(true);
    try {
      await iap.getAvailablePurchases();
    } catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "Could not restore purchases.",
      );
    } finally {
      setIsBusy(false);
    }
  }, [iap]);

  const value = useMemo<PremiumContextValue>(
    () => ({
      plan,
      isPro: plan === "pro",
      product: iap.products.find((item) => item.id === PRO_PRODUCT_ID) ?? null,
      isReady,
      isBusy,
      error,
      purchasePro,
      restorePurchases,
      clearError: () => setError(null),
    }),
    [error, iap.products, isBusy, isReady, plan, purchasePro, restorePurchases],
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium(): PremiumContextValue {
  const value = useContext(PremiumContext);
  if (!value) throw new Error("usePremium must be used inside PremiumProvider");
  return value;
}

"use client";

import { createContext, useContext } from "react";
import { BrandMark } from "@/components/brand-mark";
import type { Product } from "@/lib/product";

const HostProductContext = createContext<Product>("forms");

/** Carries the hostname's product to logged-out pages, which brand by host. */
export function HostProductProvider({
  product,
  children,
}: {
  product: Product;
  children: React.ReactNode;
}) {
  return <HostProductContext value={product}>{children}</HostProductContext>;
}

/** The product the hostname brands, for logged-out pages. */
export function useHostProduct(): Product {
  return useContext(HostProductContext);
}

/** Logo for auth card headers. `full` is the large logo with the "By Canopy" tagline, used on login. */
export function AuthBrandMark({ full = false }: { full?: boolean }) {
  const product = useContext(HostProductContext);

  if (full) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Static SVG brand asset
      <img src={`/brand/${product}-logo-full.svg`} alt="" className="h-16 w-auto" />
    );
  }
  return <BrandMark size="md" product={product} />;
}

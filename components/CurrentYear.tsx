"use client";

import { Suspense } from "react";

// Behind Suspense so the landing page still prerenders under cacheComponents.
export default function CurrentYear() {
  return (
    <Suspense>
      <Year />
    </Suspense>
  );
}

function Year() {
  return new Date().getFullYear();
}

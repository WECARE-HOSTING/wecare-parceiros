import { Suspense } from "react";

export default function IndicarLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}

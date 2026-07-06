import { Suspense } from "react";
import SectionPageClient from "./section-page-client";

export default function SectionPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] bg-white" />}>
      <SectionPageClient />
    </Suspense>
  );
}

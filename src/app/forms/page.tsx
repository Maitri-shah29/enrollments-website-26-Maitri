import { Suspense } from "react";
import FormsClient from "../components/forms-client";

export default function FormsPage() {
  return (
    //suspense pauses ui components from rendering until async part finishes
    <div className="min-h-screen bg-white">
      <Suspense
        fallback={<div className="p-6 text-gray-600">Loading form…</div>}
      >
        <FormsClient />
      </Suspense>
    </div>
  );
}

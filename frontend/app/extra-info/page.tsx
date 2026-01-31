"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { useRouter } from "next/navigation";

export default function ExtraInfoPage() {
  const router = useRouter();
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen">
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>
      <h1 className="text-3xl font-bold mb-4">Extra Info</h1>
      <p className="text-lg text-gray-700">This is the extra info page.</p>
    </div>
  );
}

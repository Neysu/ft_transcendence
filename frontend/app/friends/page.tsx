"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { useRouter } from "next/navigation";

export default function FriendsPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-[calc(100vh-160px)]">
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>
      {/* Add your friends list content here */}
    </div>
  );
}
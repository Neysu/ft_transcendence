"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { DEFAULT_AVATAR_PATH, resolveAvatarUrl } from "@/lib/avatar";

export interface ProfilePicButtonProps {
  imageUrl?: string;
  onClick?: () => void;
  size?: number;
}

/**
 * Atom: ProfilePicButton
 * A circular profile picture button that displays the user's profile image.
 * Navigates to settings/param page on click.
 */
export const ProfilePicButton: React.FC<ProfilePicButtonProps> = ({ 
  imageUrl = DEFAULT_AVATAR_PATH, 
  onClick, 
  size = 64 
}) => {
  const { profileImage } = useAuth();
  const resolvedImage = resolveAvatarUrl(profileImage || imageUrl);
  const [currentImage, setCurrentImage] = useState(resolvedImage);

  useEffect(() => {
    setCurrentImage(resolvedImage);
  }, [resolvedImage]);

  return (
    <button
      onClick={onClick}
      className="rounded-full overflow-hidden border border-white/25 bg-white/10 shadow-md hover:scale-105 active:scale-95 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 focus:ring-offset-2 focus:ring-offset-transparent"
      style={{ width: size, height: size }}
    >
      <Image
        src={currentImage}
        alt="Profile"
        width={size}
        height={size}
        draggable={false}
        className="object-cover w-full h-full"
        onDragStart={(event) => event.preventDefault()}
        onError={() => {
          if (currentImage !== DEFAULT_AVATAR_PATH) {
            setCurrentImage(DEFAULT_AVATAR_PATH);
          }
        }}
      />
    </button>
  );
};

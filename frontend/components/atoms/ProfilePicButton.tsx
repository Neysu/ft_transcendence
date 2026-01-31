"use client";
import React from "react";
import Image from "next/image";

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
  imageUrl = "/russian-borzoi-profile-portrait-19997228-removebg-preview.png", 
  onClick, 
  size = 64 
}) => {
  return (
    <button
      onClick={onClick}
      className="rounded-full overflow-hidden border-4 border-white bg-white shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-purple-500"
      style={{ width: size, height: size }}
    >
      <Image
        src={imageUrl}
        alt="Profile"
        width={size}
        height={size}
        className="object-cover w-full h-full"
      />
    </button>
  );
};

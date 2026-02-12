"use client";

import Image from "next/image";
import type { ReactNode, SyntheticEvent } from "react";

type ProfileIdentityCardProps = {
  imageSrc: string;
  imageAlt: string;
  title: string;
  subtitle?: string;
  badge?: string;
  topBannerContent?: ReactNode;
  topBannerContentClassName?: string;
  actions?: ReactNode;
  isLoading?: boolean;
  onImageError?: (event: SyntheticEvent<HTMLImageElement, Event>) => void;
};

export function ProfileIdentityCard({
  imageSrc,
  imageAlt,
  title,
  subtitle,
  badge,
  topBannerContent,
  topBannerContentClassName,
  actions,
  isLoading = false,
  onImageError,
}: ProfileIdentityCardProps) {
  return (
    <section
      className="relative rounded-3xl border backdrop-blur-md overflow-visible"
      style={{
        borderColor: "var(--profile-identity-card-border)",
        backgroundColor: "var(--profile-identity-card-bg)",
        boxShadow: "0 1px 2px 0 var(--profile-identity-card-shadow)",
      }}
    >
      <div
        className="h-28 rounded-t-3xl"
        style={{ backgroundImage: "var(--profile-identity-banner)" }}
      />
      {topBannerContent ? (
        <div className={`absolute z-10 ${topBannerContentClassName ?? "top-3 right-3"}`}>
          {topBannerContent}
        </div>
      ) : null}
      <div className="px-5 pb-5 -mt-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="rounded-full overflow-hidden border-4 bg-white shadow-lg w-24 h-24 md:w-28 md:h-28"
              style={{ borderColor: "var(--profile-identity-avatar-border)" }}
            >
              {isLoading ? (
                <div className="w-full h-full bg-gray-300 animate-pulse" />
              ) : (
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                  onError={onImageError}
                />
              )}
            </div>
            <div className="min-w-0">
              {badge ? (
                <p
                  className="mb-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                  style={{
                    backgroundColor: "var(--profile-identity-badge-bg)",
                    color: "var(--profile-identity-badge-text)",
                  }}
                >
                  {badge}
                </p>
              ) : null}
              <p className="text-2xl font-bold leading-tight break-all text-slate-900">{title}</p>
              {subtitle ? <p className="text-sm text-slate-700 break-all">{subtitle}</p> : null}
            </div>
          </div>
          {actions ? <div className="md:pb-1">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}


import React from "react";
import Link from "next/link";

interface ExtraInfoProps {
  text?: string;
  className?: string;
}

/**
 * Atom: ExtraInfo
 * Small text for extra information, always at the bottom center.
 */

const ExtraInfo: React.FC<ExtraInfoProps> = ({ text = "extra info", className = "" }) => (
  <Link
    href="/extra-info"
    style={{
      position: "fixed",
      bottom: 16,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 50,
      display: "inline-block",
      textDecoration: "none"
    }}
    className={className}
    tabIndex={0}
    aria-label="Extra info"
  >
    <span
      className={
        `text-base font-medium text-gray-700 hover:text-blue-500 transition-colors duration-200 px-6 py-2 ` +
        `rounded-full bg-[rgba(200,200,200,0.5)] shadow-md backdrop-blur-sm`
      }
      style={{
        borderRadius: "999px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        background: "rgba(200, 200, 200, 0.5)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)"
      }}
    >
      {text}
    </span>
  </Link>
);

export default ExtraInfo;

"use client";

import React from "react";

export const Logo = () => {
  const [theme, setTheme] = React.useState<string>("green");
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      setTheme(document.documentElement.getAttribute("data-theme") || "green");
    }
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") || "green");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Theme-based colors
  const colors = theme === "purple" ? {
    background: {
      color1: "rgba(216, 180, 254, 0.85)",
      color2: "rgba(196, 140, 254, 0.85)",
    },
    rock: {
      color: "#FFE135",
      shadow: "rgba(200, 150, 0, 0.6)",
    },
    paper: {
      color: "#FFB1B1",
      shadow: "rgba(180, 130, 100, 0.6)",
    },
    scissors: {
      color: "#00D9D9",
      shadow: "rgba(0, 180, 180, 0.6)",
    },
  } : {
    background: {
      color1: "rgba(155, 250, 50, 0.5)",
      color2: "rgba(200, 255, 100, 0.5)",
    },
    rock: {
      color: "#6993e2",
      shadow: "rgba(255, 107, 53, 0.6)",
    },
    paper: {
      color: "#F4E4C1",
      shadow: "rgba(240, 200, 140, 0.6)",
    },
    scissors: {
      color: "#004E89",
      shadow: "rgba(0, 78, 137, 0.6)",
    },
  };

  return (
    <div className="w-full flex justify-center py-6">
      <div className="relative w-full max-w-4xl h-32 sm:h-40 flex items-center justify-center">
        {/* Tilted ellipse background using SVG for perfect oval */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 200"
          preserveAspectRatio="none"
          style={{ zIndex: 0 }}
        >
          <ellipse
            cx="400"
            cy="100"
            rx="380"
            ry="80"
            fill={`url(#${theme}Gradient)`}
            transform="rotate(8 400 100)"
          />
          <defs>
            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.background.color1} />
              <stop offset="100%" stopColor={colors.background.color2} />
            </linearGradient>
            <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.background.color1} />
              <stop offset="100%" stopColor={colors.background.color2} />
            </linearGradient>
          </defs>
        </svg>

        {/* Text container */}
        <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-4 px-2">
          {/* Rock */}
          <span
            className="font-black whitespace-nowrap"
            style={{
              fontSize: "clamp(1.5rem, 6vw, 3.75rem)",
              color: colors.rock.color,
              textShadow: `clamp(2px, 0.4vw, 3px) clamp(2px, 0.4vw, 3px) 0px ${colors.rock.shadow}, clamp(3px, 0.6vw, 5px) clamp(3px, 0.6vw, 5px) 0px rgba(0, 0, 0, 0.2)`,
              fontFamily: '"Comic Sans MS", cursive, sans-serif',
              transform: "translateY(clamp(-30px, -4vw, -40px))",
            }}
          >
            Rock
          </span>

          {/* Paper */}
          <span
            className="font-bold whitespace-nowrap"
            style={{
              fontSize: "clamp(1.5rem, 6vw, 3.75rem)",
              color: colors.paper.color,
              textShadow: `clamp(2px, 0.4vw, 3px) clamp(2px, 0.4vw, 3px) 0px ${colors.paper.shadow}, clamp(3px, 0.6vw, 5px) clamp(3px, 0.6vw, 5px) 0px rgba(0, 0, 0, 0.2)`,
              fontFamily: '"Georgia", serif',
			  transform: "translateY(clamp(-6px, -1vw, -10px))",
            }}
          >
            Paper
          </span>

          {/* Scissors */}
          <span
            className="font-black whitespace-nowrap"
            style={{
              fontSize: "clamp(1.5rem, 6vw, 3.75rem)",
              color: colors.scissors.color,
              textShadow: `clamp(2px, 0.4vw, 3px) clamp(2px, 0.4vw, 3px) 0px ${colors.scissors.shadow}, clamp(3px, 0.6vw, 5px) clamp(3px, 0.6vw, 5px) 0px rgba(0, 0, 0, 0.2)`,
              fontFamily: '"Arial Black", sans-serif',
              transform: "translateY(clamp(16px, 2vw, 22px))",
            }}
          >
            Scissors
          </span>
        </div>
      </div>
    </div>
  );
};

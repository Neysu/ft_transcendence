"use client";
import React from "react";

export interface RPSOpponentProps {
  size?: number;
  isLoading?: boolean;
  opponentChoice?: "rock" | "paper" | "scissors" | null; // Backend will provide this
}

/**
 * Atom: RPSOpponent
 * A circular display area with theme-aware styling for showing opponent's choice.
 * 
 * BACKEND INTEGRATION:
 * - Receives opponentChoice prop from parent component
 * - Parent should fetch opponent's choice from backend after game starts
 * - Update opponentChoice state when backend response arrives
 * - isLoading should be true while waiting for backend response
 */
export const RPSOpponent: React.FC<RPSOpponentProps> = ({ 
  size = 160,
  isLoading = false,
  opponentChoice = null,
}) => {
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

  // Theme-aware border and background colors
  let borderColor = "";
  let bgColor = "";
  
  if (theme === "purple") {
    borderColor = "border-purple-500";
    bgColor = "bg-purple-100 dark:bg-purple-900";
  } else if (theme === "blue") {
    borderColor = "border-blue-500";
    bgColor = "bg-blue-100 dark:bg-blue-900";
  } else {
    // default green theme
    borderColor = "border-green-500";
    bgColor = "bg-green-100 dark:bg-green-900";
  }

  // Image map for opponent's choices - BACKEND ANSWER DISPLAY
  const imageMap: Record<string, string> = {
    rock: "/rps/rock.png",
    paper: "/rps/paper.png",
    scissors: "/rps/scissor.png",
  };

  return (
    <div
      className={`rounded-full border-4 ${borderColor} ${bgColor} shadow-lg flex items-center justify-center overflow-hidden ${isLoading ? "animate-pulse" : ""}`}
      style={{ width: size, height: size }}
    >
      {isLoading ? (
        // LOADING STATE: While waiting for backend response
        <div className="text-gray-400 dark:text-gray-600 text-sm">...</div>
      ) : opponentChoice ? (
        // BACKEND ANSWER RECEIVED: Display opponent's choice image
        <img
          src={imageMap[opponentChoice]}
          alt={opponentChoice}
          className="object-cover w-full h-full"
        />
      ) : (
        // NO CHOICE YET: Empty state before game starts
        <div className="text-gray-300 dark:text-gray-700 text-xs text-center px-2">Waiting...</div>
      )}
    </div>
  );
};

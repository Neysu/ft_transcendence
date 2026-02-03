"use client";
import React from "react";

export type Choice = "rock" | "paper" | "scissors";

export interface RPSChoiceProps {
  choice: Choice;
  onClick?: (choice: Choice) => void;
  size?: number;
}

/**
 * Atom: RPSChoice
 * A circular button displaying rock, paper, or scissors with theme-aware styling.
 * Changes color based on the current theme.
 */
export const RPSChoice: React.FC<RPSChoiceProps> = ({ 
  choice, 
  onClick, 
  size = 160 
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

  // Image paths for each choice
  const imageMap: Record<Choice, string> = {
    rock: "/rps/rock.png",
    paper: "/rps/paper.png",
    scissors: "/rps/scissor.png",
  };

  const handleClick = () => {
    if (onClick) {
      onClick(choice);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`rounded-full overflow-hidden border-4 ${borderColor} ${bgColor} shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2`}
      style={{ width: size, height: size }}
      title={choice.charAt(0).toUpperCase() + choice.slice(1)}
    >
      <img
        src={imageMap[choice]}
        alt={choice}
        className="object-cover w-full h-full"
      />
    </button>
  );
};

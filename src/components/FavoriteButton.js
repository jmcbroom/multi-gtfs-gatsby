import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

/**
 * Reusable favorite star button with hover effects.
 * Handles event propagation internally.
 *
 * @param {boolean} isFavorited - Whether the item is currently favorited
 * @param {function} onClick - Callback when button is clicked
 * @param {string} size - Icon size: "sm", "base", or "lg"
 * @param {string} className - Additional CSS classes
 */
const FavoriteButton = ({
  isFavorited,
  onClick,
  size = "base",
  className = "",
}) => {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(e);
  };

  const sizeClasses = {
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
  };

  return (
    <button
      onClick={handleClick}
      className={`flex-shrink-0 transition-colors ${
        isFavorited
          ? "text-yellow-500"
          : "text-gray-400 dark:text-zinc-400 hover:text-yellow-400"
      } ${className}`}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <FontAwesomeIcon
        icon={faStar}
        className={`${sizeClasses[size] || sizeClasses.base} ${!isFavorited ? "opacity-50" : ""}`}
      />
    </button>
  );
};

export default FavoriteButton;

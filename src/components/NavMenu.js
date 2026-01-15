import React, { useState, useEffect } from "react";
import { HamburgerMenuIcon, Cross1Icon } from "@radix-ui/react-icons";
import { Link } from "gatsby";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faCompass, faTableList, faInfoCircle } from "@fortawesome/free-solid-svg-icons";

const NavMenu = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const menuItems = [
    { to: "/departure-board", icon: faTableList, label: "Departure board" },
    { to: "/trip-planner", icon: faCompass, label: "Trip planner" },
    { to: "/favorites", icon: faStar, label: "Favorites", iconClass: "text-yellow-500" },
    { to: "/about", icon: faInfoCircle, label: "About" },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
        aria-expanded={mobileMenuOpen}
      >
        <HamburgerMenuIcon className="w-5 h-5" />
      </button>

      {/* Backdrop overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in drawer */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-72 bg-white dark:bg-zinc-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
          <span className="font-semibold text-lg">Menu</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close menu"
          >
            <Cross1Icon className="w-5 h-5" />
          </button>
        </div>

        {/* Menu items */}
        <nav className="p-2">
          {menuItems.map((item, index) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <FontAwesomeIcon
                icon={item.icon}
                className={`w-5 ${item.iconClass || "text-gray-500 dark:text-zinc-400"}`}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Desktop menu */}
      <nav className="hidden md:flex items-center gap-4">
        <Link
          to="/departure-board"
          className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          title="Departure board"
        >
          <FontAwesomeIcon icon={faTableList} />
        </Link>
        <Link
          to="/trip-planner"
          className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          title="Trip planner"
        >
          <FontAwesomeIcon icon={faCompass} />
        </Link>
        <Link
          to="/favorites"
          className="text-yellow-500 hover:text-yellow-600 transition-colors"
          title="Favorites"
        >
          <FontAwesomeIcon icon={faStar} />
        </Link>
      </nav>
    </>
  );
};

export default NavMenu;

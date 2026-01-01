import React, { useState } from "react";
import { HamburgerMenuIcon, Cross1Icon } from "@radix-ui/react-icons";
import "../styles/menu.css";
import { Link } from "gatsby";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faCompass, faTableList } from "@fortawesome/free-solid-svg-icons";

const NavMenu = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden p-2 rounded"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <Cross1Icon className="w-5 h-5" />
        ) : (
          <HamburgerMenuIcon className="w-5 h-5" />
        )}
      </button>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 z-50">
          <div className="py-2">
            <Link to="/departure-board" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700" onClick={() => setMobileMenuOpen(false)}>
              <FontAwesomeIcon icon={faTableList} /> Departure board
            </Link>
            <Link to="/trip-planner" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700" onClick={() => setMobileMenuOpen(false)}>
              <FontAwesomeIcon icon={faCompass} /> Trip planner
            </Link>
            <Link to="/favorites" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700" onClick={() => setMobileMenuOpen(false)}>
              <FontAwesomeIcon icon={faStar} className="text-yellow-500" /> Favorites
            </Link>
          </div>
        </div>
      )}

      {/* Desktop menu */}
      <nav className="hidden md:flex items-center gap-4">
        <Link to="/departure-board" className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100" title="Departure board">
          <FontAwesomeIcon icon={faTableList} />
        </Link>
        <Link to="/trip-planner" className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100" title="Trip planner">
          <FontAwesomeIcon icon={faCompass} />
        </Link>
        <Link to="/favorites" className="text-yellow-500 hover:text-yellow-600" title="Favorites">
          <FontAwesomeIcon icon={faStar} />
        </Link>
      </nav>
    </>
  );
};

export default NavMenu;

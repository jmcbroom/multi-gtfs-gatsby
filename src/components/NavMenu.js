import React, { useState, useEffect } from "react";
import { HamburgerMenuIcon, Cross1Icon } from "@radix-ui/react-icons";
import { Link } from "gatsby";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faCompass, faTableList, faInfoCircle, faBus } from "@fortawesome/free-solid-svg-icons";
import { useSanityAgencies } from "../hooks/useSanityAgencies";

const NavMenu = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const data = useSanityAgencies();

  // Sort agencies by sortOrder
  const sortedAgencies = [...data.sanityAgencies.edges].sort((a, b) => {
    const aOrder = a.node.sortOrder;
    const bOrder = b.node.sortOrder;
    if (aOrder === null || aOrder === undefined) return 1;
    if (bOrder === null || bOrder === undefined) return -1;
    return aOrder - bOrder;
  });

  // Filter local bus agencies
  const localBusAgencies = sortedAgencies.filter(
    (e) => e.node.agencyType === "local-bus"
  );

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
        className={`md:hidden fixed top-0 right-0 h-full w-72 bg-white dark:bg-zinc-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-end pt-2 px-2 border-gray-200 dark:border-zinc-700">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close menu"
          >
            <Cross1Icon className="w-5 h-5" />
          </button>
        </div>

        {/* Menu items */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <nav className="flex-1 p-2 overflow-y-auto">
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

            {/* Local Bus Systems */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
              <h3 className="px-4 pb-2 text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
                Local Bus Systems
              </h3>
              {localBusAgencies.map((agency, index) => (
                <Link
                  key={agency.node.slug.current}
                  to={`/${agency.node.slug.current}`}
                  className="flex items-center gap-3 pr-4 pl-4 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors border-l-4 -ml-2"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    animationDelay: `${(menuItems.length + index) * 50}ms`,
                    borderLeftColor: agency.node.color?.hex || '#666666'
                  }}
                >
                  <FontAwesomeIcon
                    icon={faBus}
                    className="w-5 text-gray-500 dark:text-zinc-400"
                  />
                  <span className="font-medium">{agency.node.name}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* About - pinned to bottom */}
          <div className="border-t border-gray-200 dark:border-zinc-700 p-2">
            <Link
              to="/about"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FontAwesomeIcon
                icon={faInfoCircle}
                className="w-4 text-gray-400 dark:text-zinc-500"
              />
              <span className="text-sm text-gray-600 dark:text-zinc-400">About</span>
            </Link>
          </div>
        </div>
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

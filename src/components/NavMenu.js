import React, { useState } from "react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import classNames from "classnames";
import { CaretDownIcon, HamburgerMenuIcon, Cross1Icon } from "@radix-ui/react-icons";
import "../styles/menu.css";
import { Link } from "gatsby";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faMapLocationDot } from "@fortawesome/free-solid-svg-icons";

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
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">Bus systems</div>
            <Link to="/ddot" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700" onClick={() => setMobileMenuOpen(false)}>DDOT</Link>
            <Link to="/smart" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700" onClick={() => setMobileMenuOpen(false)}>SMART</Link>
            <Link to="/theride" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700" onClick={() => setMobileMenuOpen(false)}>The Ride</Link>
            <Link to="/transit-windsor" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700" onClick={() => setMobileMenuOpen(false)}>Transit Windsor</Link>
            <div className="border-t border-gray-200 dark:border-zinc-700 my-2"></div>
            <Link to="/trip-planner" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700" onClick={() => setMobileMenuOpen(false)}>
              <FontAwesomeIcon icon={faMapLocationDot} /> Trip planner
            </Link>
            <Link to="/favorites" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700" onClick={() => setMobileMenuOpen(false)}>
              <FontAwesomeIcon icon={faStar} className="text-yellow-500" /> Favorites
            </Link>
          </div>
        </div>
      )}

      {/* Desktop menu */}
      <NavigationMenu.Root className="NavigationMenuRoot hidden md:flex">
        <NavigationMenu.List className="NavigationMenuList">
          <NavigationMenu.Item>
            <NavigationMenu.Trigger className="NavigationMenuTrigger">
              Buses <CaretDownIcon className="CaretDown" aria-hidden />
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className="NavigationMenuContent">
              <ul className="List one">
                <ListItem to="/ddot" title="DDOT">
                  City of Detroit
                </ListItem>
                <ListItem to="/smart" title="SMART">
                  Macomb/Oakland/Wayne counties
                </ListItem>
                <ListItem to="/theride" title="The Ride">
                  Ann Arbor/Ypsilanti
                </ListItem>
                <ListItem to="/transit-windsor" title="Transit Windsor">
                  Windsor, Ontario
                </ListItem>
              </ul>
            </NavigationMenu.Content>
          </NavigationMenu.Item>

          <NavigationMenu.Item className="NavigationMenuLink">
            <Link to="/trip-planner"><FontAwesomeIcon icon={faMapLocationDot} className="mr-2" /></Link>
          </NavigationMenu.Item>

          <NavigationMenu.Item className="NavigationMenuLink">
            <Link to="/favorites"><FontAwesomeIcon icon={faStar} className="text-yellow-500"></FontAwesomeIcon> </Link>
          </NavigationMenu.Item>

          <NavigationMenu.Indicator className="NavigationMenuIndicator">
            <div className="Arrow" />
          </NavigationMenu.Indicator>
        </NavigationMenu.List>

        <div className="ViewportPosition">
          <NavigationMenu.Viewport className="NavigationMenuViewport" />
        </div>
      </NavigationMenu.Root>
    </>
  );
};

const ListItem = React.forwardRef(
  ({ className, children, title, ...props }, forwardedRef) => (
    <li>
      <NavigationMenu.Link asChild>
        <Link
          className={classNames("ListItemLink", className)}
          {...props}
          ref={forwardedRef}
        >
          <div className="ListItemHeading">{title}</div>
          <p className="ListItemText">{children}</p>
        </Link>
      </NavigationMenu.Link>
    </li>
  )
);

export default NavMenu;

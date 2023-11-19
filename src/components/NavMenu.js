import React from "react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import classNames from "classnames";
import { CaretDownIcon } from "@radix-ui/react-icons";
import "../styles/menu.css";
import { Link } from "gatsby";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

const NavMenu = () => {
  return (
    <NavigationMenu.Root className="NavigationMenuRoot">
      <NavigationMenu.List className="NavigationMenuList">
        {/* <NavigationMenu.Item>
          <NavigationMenu.Trigger className="NavigationMenuTrigger">
            Buses <CaretDownIcon className="CaretDown" aria-hidden />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="NavigationMenuContent">
            <ul className="List one">
              <ListItem to="/ddot" title="DDOT">
                Buses in the city of Detroit
              </ListItem>
              <ListItem to="/smart" title="SMART">
                Buses in Macomb, Oakland, Wayne counties
              </ListItem>
              <ListItem to="/theride" title="The Ride">
                Buses in Ann Arbor and Ypsilanti
              </ListItem>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item> */}

        {/* <NavigationMenu.Item className="NavigationMenuLink">
          <Link to="/region-map">Map</Link>
        </NavigationMenu.Item>

        <NavigationMenu.Item className="NavigationMenuLink">
          <Link to="/nearby">Nearby</Link>
        </NavigationMenu.Item> */}

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

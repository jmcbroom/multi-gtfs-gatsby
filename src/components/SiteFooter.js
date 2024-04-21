import React from "react";
import { Link, graphql } from "gatsby";
import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlane, faStar } from "@fortawesome/free-solid-svg-icons";

const SiteFooter = ({ data }) => {
  return (
    <footer className="mt-8 bg-primary-light dark:bg-primary-dark px-2 md:px-4 pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto gap-8 md:gap-0">
        <div className="flex flex-col justify-start gap-2">
          <h3>Local bus systems</h3>
          {data.allSanityAgency.edges
            .filter((e) => e.node.agencyType === "local-bus")
            .map((a) => (
              <Link to={`/${a.node.slug.current}`} key={a.node.slug.current}>
                <span className="">{a.node.name}</span>
              </Link>
            ))}
          <h3 className="mt-4">Downtown transit services</h3>
          {data.allSanityAgency.edges
            .filter(
              (e) =>
                e.node.agencyType !== "local-bus" &&
                e.node.agencyType !== "express-bus"
            )
            .map((a) => (
              <Link to={`/${a.node.slug.current}`} key={a.node.slug.current}>
                <span className="">{a.node.name}</span>
              </Link>
            ))}

          <h3 className="mt-4">Regional bus services</h3>
          {data.allSanityAgency.edges
            .filter((e) => e.node.agencyType === "express-bus")
            .map((a) => (
              <Link to={`/${a.node.slug.current}`} key={a.node.slug.current}>
                <span className="">{a.node.name}</span>
              </Link>
            ))}
          <Link to={`/dax`}>
            <span className="">DAX <FontAwesomeIcon icon={faPlane} size="1x" className="mx-1" /></span>
          </Link>
          <Link to={`/michigan-flyer`}>
            <span className="">Michigan Flyer</span>
          </Link>

          <h3 className="mt-4">Bikeshare</h3>
          <Link to={`/mogo`}>
            <span className="">MoGo</span>
          </Link>
        </div>

        <div className="flex flex-col justify-start gap-4">
          <div className="flex flex-col justify-start gap-2">
            <h3>Other pages</h3>
          <Link to={`/favorites`}>Favorite stops <FontAwesomeIcon icon={faStar} /></Link>
            <Link to={`/region-map`}>Regional transit map</Link>
            <Link to={`/nearme`}>Transit near me</Link>
          </div>
          <div className="flex flex-col justify-start gap-2">
            <h3>This site</h3>
            <Link to={`/about`}>About this site</Link>
            <Link to={`/contact-us`}>Feedback, comments, questions?</Link>
            <a
              href="https://github.com/jmcbroom/multi-gtfs-gatsby"
              className="flex items-center gap-2"
              target="_blank"
              rel="noreferrer"
            >
               <GitHubLogoIcon />
              multi-gtfs-gatsby
            </a>
          </div>
          <div className="flex flex-col justify-start gap-2">
            <h3>Other sites</h3>
            <a href="https://isthemetroaccessible.com/" className="flex items-center gap-2">
              is the metro accessible?
            </a>
            <a
              href="http://discord.det.city/"
              className="flex items-center gap-2"
            >
              <DiscordLogoIcon />
              Detroit Discord / #transit
            </a>
          </div>
        </div>
      </div>
      <div className="w-full text-center mt-12 mb-4 gap-6 text-gray-400 flex items-center justify-center border-t border-dotted pt-4 border-gray-400 dark:border-gray-200">
        {new Date().getFullYear()} - transit.det.city
      </div>
    </footer>
  );
};

export default SiteFooter;

import React from "react";

export const onRenderBody = ({ setHtmlAttributes, setHeadComponents }) => {
  setHtmlAttributes({ lang: "en" });

  setHeadComponents([
    <meta key="charset" charSet="utf-8" />,
    <meta key="viewport" name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover" />,

    // PWA Meta Tags
    <meta key="application-name" name="application-name" content="transit.det.city" />,
    <meta key="apple-mobile-web-app-capable" name="apple-mobile-web-app-capable" content="yes" />,
    <meta key="apple-mobile-web-app-status-bar-style" name="apple-mobile-web-app-status-bar-style" content="black-translucent" />,
    <meta key="apple-mobile-web-app-title" name="apple-mobile-web-app-title" content="transit.det.city" />,
    <meta key="format-detection" name="format-detection" content="telephone=no" />,
    <meta key="mobile-web-app-capable" name="mobile-web-app-capable" content="yes" />,
    <meta key="msapplication-config" name="msapplication-config" content="/icons/browserconfig.xml" />,
    <meta key="msapplication-TileColor" name="msapplication-TileColor" content="#1f2937" />,
    <meta key="msapplication-tap-highlight" name="msapplication-tap-highlight" content="no" />,
    <meta key="theme-color" name="theme-color" content="#1f2937" />,

    // Apple Touch Icons
    <link key="apple-touch-icon" rel="apple-touch-icon" href="/icons/touch-icon-iphone.png" />,
    <link key="apple-touch-icon-152" rel="apple-touch-icon" sizes="152x152" href="/icons/touch-icon-ipad.png" />,
    <link key="apple-touch-icon-180" rel="apple-touch-icon" sizes="180x180" href="/icons/touch-icon-iphone-retina.png" />,
    <link key="apple-touch-icon-167" rel="apple-touch-icon" sizes="167x167" href="/icons/touch-icon-ipad-retina.png" />,

    // Favicon
    <link key="icon-32" rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />,
    <link key="icon-16" rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />,
    <link key="shortcut-icon" rel="shortcut icon" href="/favicon.ico" />,

    // Splashscreens
    <link key="splash-2048" rel="apple-touch-startup-image" href="/icons/apple-splash-2048-2732.jpg" sizes="2048x2732" />,
    <link key="splash-1668" rel="apple-touch-startup-image" href="/icons/apple-splash-1668-2224.jpg" sizes="1668x2224" />,
    <link key="splash-1536" rel="apple-touch-startup-image" href="/icons/apple-splash-1536-2048.jpg" sizes="1536x2048" />,
    <link key="splash-1125" rel="apple-touch-startup-image" href="/icons/apple-splash-1125-2436.jpg" sizes="1125x2436" />,
    <link key="splash-1242" rel="apple-touch-startup-image" href="/icons/apple-splash-1242-2208.jpg" sizes="1242x2208" />,
    <link key="splash-750" rel="apple-touch-startup-image" href="/icons/apple-splash-750-1334.jpg" sizes="750x1334" />,
    <link key="splash-640" rel="apple-touch-startup-image" href="/icons/apple-splash-640-1136.jpg" sizes="640x1136" />,
  ]);
};

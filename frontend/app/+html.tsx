import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

// The base path the app is served from on GitHub Pages (see app.json experiments.baseUrl).
// PWA/icon links must be prefixed with it because they are static files, not bundled assets.
const BASE = "/cookbook";

/**
 * Root HTML document for every statically-rendered web page.
 *
 * The important part for PWAs: iOS "Add to Home Screen" ignores favicon.ico and
 * the web manifest icons. It only reads <link rel="apple-touch-icon">. Without it
 * iOS shows a generated letter tile instead of the real icon. Android/Windows
 * Chrome use the manifest ("icons") declared below.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* PWA manifest (Android / Windows / desktop Chrome install) */}
        <link rel="manifest" href={`${BASE}/manifest.json`} />
        <meta name="theme-color" content="#ffffff" />

        {/* Favicon is injected automatically by Expo from app.json web.favicon */}

        {/* iOS home-screen icon + standalone behaviour */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={`${BASE}/apple-touch-icon.png`}
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta name="apple-mobile-web-app-title" content="My Cookbook" />

        {/*
          Disable body scrolling on web so ScrollView components behave the same
          across native and web. Remove if global body scrolling is desired.
        */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}

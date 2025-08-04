import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ur" dir="rtl"> {/* Changed lang to Urdu + RTL */}
      <Head>
        {/* Preload Alvi Nastaleeq */}
        <link
          rel="preload"
          href="/fonts/Alvi-Nastaleeq-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* Font-face definition */}
        <style>{`
          @font-face {
            font-family: 'Alvi Nastaleeq';
            src: url('/fonts/Alvi-Nastaleeq-Regular.woff2') format('woff2');
            font-display: swap;
          }
        `}</style>

        {/* Keep all existing head elements */}
        <link rel="icon" href="/favicons.png" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#1a365d" />
      </Head>
      
      {/* Apply font ONLY to Urdu content */}
      <body className="antialiased" style={{ fontFamily: "'Alvi Nastaleeq', serif" }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
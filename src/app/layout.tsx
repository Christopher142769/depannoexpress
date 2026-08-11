import type { Metadata } from "next";
import { Providers } from "@/components/layout/providers";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_TAGLINE,
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className="h-full"
      data-theme="light"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-bg-base text-text-primary antialiased font-sans"
        suppressHydrationWarning
      >
        {/* Thème persisté avant hydratation React */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=localStorage.getItem("de-theme");if(r){var p=JSON.parse(r);var t=p&&p.state&&p.state.theme;if(t)document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dépannage Express — Assistance routière 24/7",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link
        rel="preconnect"
        href="https://api.fontshare.com"
      />
      <link
        href="https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&f[]=satoshi@400,500,700&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}

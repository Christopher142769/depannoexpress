import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dépannage Express · Assistance routière 24 h/24",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

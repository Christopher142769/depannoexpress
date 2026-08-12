import { ClientTabBar } from "@/components/mobile/client-tab-bar";

export default function ClientGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ClientTabBar />
    </>
  );
}

import { ProTabBar } from "@/components/mobile/pro-tab-bar";

export default function ProGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ProTabBar />
    </>
  );
}

import { PageTransition } from "@/components/layout/page-transition";

/** Template App Router — déclenche les transitions Framer Motion à chaque navigation */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}

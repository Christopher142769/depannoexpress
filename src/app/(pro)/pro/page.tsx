import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ProAppPage() {
  return (
    <div className="min-h-screen bg-bg-base p-6 pt-24">
      <div className="max-w-lg mx-auto text-center space-y-6">
        <Badge variant="success">Espace Dépanneur</Badge>
        <h1 className="font-display text-3xl font-bold">Tableau de bord pro</h1>
        <p className="text-text-secondary">
          Missions, portefeuille et disponibilité — module en construction.
        </p>
        <Button variant="primary" showArrow asChild>
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-bg-base p-6 pt-24">
      <div className="max-w-lg mx-auto text-center space-y-6">
        <Badge variant="warning">Administration</Badge>
        <h1 className="font-display text-3xl font-bold">Back-office</h1>
        <p className="text-text-secondary">
          Gestion des dépanneurs, commissions et analytics — module en construction.
        </p>
        <Button variant="ghost" asChild>
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  );
}

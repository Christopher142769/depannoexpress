import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ClientAppPage() {
  return (
    <div className="min-h-screen bg-bg-base p-6 pt-24">
      <div className="max-w-lg mx-auto text-center space-y-6">
        <Badge variant="brand">Espace Client</Badge>
        <h1 className="font-display text-3xl font-bold">Demande d&apos;assistance</h1>
        <p className="text-text-secondary">
          Module client en construction — géolocalisation, suivi live et chat à venir.
        </p>
        <Button variant="urgent" showArrow asChild>
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  );
}

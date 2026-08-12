import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientNotFound() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Page client introuvable</CardTitle>
          <CardDescription>Cette ressource n&apos;existe pas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/app">Retour au tableau de bord</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

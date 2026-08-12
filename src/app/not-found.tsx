import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Page introuvable</CardTitle>
          <CardDescription>
            Cette adresse n&apos;existe pas ou a été déplacée.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild showArrow>
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

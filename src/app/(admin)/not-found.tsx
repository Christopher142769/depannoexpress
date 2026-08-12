import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminNotFound() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Page admin introuvable</CardTitle>
          <CardDescription>Cette ressource n&apos;existe pas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/admin">Retour au back-office</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-10 w-48 mx-auto" />
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-12 w-full rounded-pill" />
      </div>
    </div>
  );
}

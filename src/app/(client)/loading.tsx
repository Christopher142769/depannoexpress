import { Skeleton } from "@/components/ui/skeleton";

export default function ClientLoading() {
  return (
    <div className="min-h-screen bg-bg-base p-6 pt-24">
      <div className="max-w-5xl mx-auto grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
        <Skeleton className="h-40 rounded-card lg:col-span-2" />
      </div>
    </div>
  );
}

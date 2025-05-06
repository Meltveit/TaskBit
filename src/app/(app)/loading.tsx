import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Skeleton className="h-9 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Skeleton className="h-60 rounded-lg" />
        <Skeleton className="h-60 rounded-lg" />
      </div>

      <div className="grid gap-6 md:grid-cols-1">
         <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

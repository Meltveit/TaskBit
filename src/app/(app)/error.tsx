"use client"; // Error components must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))] text-center p-6 bg-background">
      <AlertTriangle className="w-16 h-16 text-destructive mb-6" />
      <h2 className="text-3xl font-semibold text-foreground mb-4">
        Oops! Something went wrong.
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        We encountered an unexpected issue. Please try again, or if the problem persists, contact support.
      </p>
      <p className="text-sm text-destructive mb-6">
        Error: {error.message}
      </p>
      <Button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        Try again
      </Button>
    </div>
  );
}

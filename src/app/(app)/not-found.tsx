import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))] text-center p-6 bg-background">
      <SearchX className="w-20 h-20 text-primary mb-8" />
      <h1 className="text-4xl font-bold text-foreground mb-4">
        404 - Page Not Found
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link href="/dashboard">
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          Go to Dashboard
        </Button>
      </Link>
    </div>
  );
}

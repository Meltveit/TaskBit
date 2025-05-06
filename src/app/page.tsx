import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary to-secondary p-6 text-center">
      <div className="bg-background/90 backdrop-blur-md p-8 sm:p-12 rounded-xl shadow-2xl max-w-2xl w-full">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-20 h-20 text-primary mx-auto mb-6">
            <path d="M12 .75a8.25 8.25 0 00-8.25 8.25c0 1.886.646 3.599 1.707 4.954L2.97 22.441a.75.75 0 001.088.972l2.806-1.95A8.25 8.25 0 1012 .75zm0 15a6.75 6.75 0 110-13.5 6.75 6.75 0 010 13.5z" />
            <path d="M12 6.75a.75.75 0 00-.75.75v3.75H7.5a.75.75 0 000 1.5h3.75V18a.75.75 0 001.5 0v-5.25H16.5a.75.75 0 000-1.5h-3.75V7.5a.75.75 0 00-.75-.75z" />
        </svg>
        <h1 className="text-5xl font-bold text-foreground mb-4">
          Welcome to TaskBit
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Streamline your projects and invoicing. Effortlessly manage tasks, create professional invoices, and keep an overview of your work.
        </p>
        <Link href="/dashboard" legacyBehavior>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Go to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
      <footer className="mt-12 text-background/80 text-sm">
        <p>&copy; {new Date().getFullYear()} TaskBit. All rights reserved.</p>
      </footer>
    </div>
  );
}


import type { ReactNode } from 'react';
import Link from 'next/link';

// Simple TaskBit Logo for the client portal header
const TaskBitLogoWhite = () => (
  <div className="flex items-center gap-2">
    {/* Simple SVG logo using white color for visibility on blue background */}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
      <path d="M12 .75a8.25 8.25 0 00-8.25 8.25c0 1.886.646 3.599 1.707 4.954L2.97 22.441a.75.75 0 001.088.972l2.806-1.95A8.25 8.25 0 1012 .75zm0 15a6.75 6.75 0 110-13.5 6.75 6.75 0 010 13.5z" />
      <path d="M12 6.75a.75.75 0 00-.75.75v3.75H7.5a.75.75 0 000 1.5h3.75V18a.75.75 0 001.5 0v-5.25H16.5a.75.75 0 000-1.5h-3.75V7.5a.75.75 0 00-.75-.75z" />
    </svg>
    <h1 className="text-xl font-semibold text-white">TaskBit</h1>
  </div>
);


export default function ClientPortalLayout({ children }: { children: ReactNode }) {
  // Mock client name - replace with actual client data
  const clientName = "Acme Corp";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Client Portal Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" passHref>
             <TaskBitLogoWhite />
          </Link>
           <div className="text-lg font-medium text-white">
             {clientName} Portal
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 bg-background">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border text-center p-4 text-sm text-muted-foreground">
        TaskBit © {new Date().getFullYear()} | Powered by TaskBit
      </footer>
    </div>
  );
}

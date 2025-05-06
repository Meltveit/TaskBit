
import type { ReactNode } from 'react';
import Link from 'next/link';

// Simple TaskBit Logo for the auth header
const TaskBitLogoWhite = () => (
  <div className="flex items-center gap-2">
    {/* Simple SVG logo using white color for visibility on blue background */}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
      <path d="M12 .75a8.25 8.25 0 00-8.25 8.25c0 1.886.646 3.599 1.707 4.954L2.97 22.441a.75.75 0 001.088.972l2.806-1.95A8.25 8.25 0 1012 .75zm0 15a6.75 6.75 0 110-13.5 6.75 6.75 0 010 13.5z" />
      <path d="M12 6.75a.75.75 0 00-.75.75v3.75H7.5a.75.75 0 000 1.5h3.75V18a.75.75 0 001.5 0v-5.25H16.5a.75.75 0 000-1.5h-3.75V7.5a.75.75 0 00-.75-.75z" />
    </svg>
    <h1 className="text-2xl font-semibold text-white">TaskBit</h1>
  </div>
);

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary to-secondary p-4">
        {/* Logo above the card */}
        <div className="mb-8">
            <Link href="/" passHref>
             <TaskBitLogoWhite />
            </Link>
        </div>

        {/* Centered Card Content */}
        {children}

        {/* Footer Links */}
        <footer className="mt-8 text-center text-sm text-primary-foreground/80">
          <Link href="/privacy" className="hover:underline mx-2">Privacy Policy</Link>
          |
          <Link href="/terms" className="hover:underline mx-2">Terms of Service</Link>
        </footer>
    </div>
  );
}

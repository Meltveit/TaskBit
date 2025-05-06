
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Home, Briefcase, FileText, Settings, PanelLeft, Clock, Users, LogOut } from 'lucide-react'; // Added Clock, Users, LogOut
import { Button } from '@/components/ui/button';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input'; // Import Input
import { Search } from 'lucide-react'; // Import Search icon

// Updated nav items based on the prompt
const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/projects', icon: Briefcase, label: 'Projects' },
  { href: '/time-tracking', icon: Clock, label: 'Time Tracking' }, // Uncommented Time Tracking
  { href: '/invoices', icon: FileText, label: 'Invoices' },
  { href: '/clients', icon: Users, label: 'Clients' }, // Uncommented Clients link
];

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


export default function AppLayout({ children }: { children: ReactNode }) {
  // Mock user name - replace with actual user data from context/state
  const userName = "Jane Doe";

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible='icon' className="bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="p-4 border-b border-sidebar-border h-20 flex items-center">
          <TaskBitLogoWhite />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton className="justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground" tooltip={item.label}>
                    <item.icon className="text-sidebar-foreground group-hover:text-sidebar-accent-foreground group-data-[active=true]:text-sidebar-accent-foreground" />
                    <span className="text-sidebar-foreground group-hover:text-sidebar-accent-foreground group-data-[active=true]:text-sidebar-accent-foreground">{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border mt-auto">
           {/* Settings Link */}
           <SidebarMenu className="mb-2">
             <SidebarMenuItem>
                <Link href="/settings" legacyBehavior passHref>
                   <SidebarMenuButton className="justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" tooltip="Settings">
                      <Settings className="text-sidebar-foreground group-hover:text-sidebar-accent-foreground"/>
                      <span className="text-sidebar-foreground group-hover:text-sidebar-accent-foreground">Settings</span>
                   </SidebarMenuButton>
                </Link>
             </SidebarMenuItem>
           </SidebarMenu>

           {/* User Profile Dropdown/Button */}
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center justify-start w-full gap-2 p-2 h-auto text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://picsum.photos/40/40?random=user" alt="User Avatar" data-ai-hint="user avatar" />
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">{userName?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium group-data-[collapsible=icon]:hidden truncate">{userName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" sideOffset={10} className="w-56 bg-background text-foreground border-border">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border"/>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex items-center justify-between h-20 px-4 bg-background border-b border-border md:px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden"/>
              <h2 className="text-xl font-semibold text-primary hidden sm:block">Hi, {userName}!</h2>
            </div>
             <div className="relative flex-1 max-w-md ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search projects, tasks, invoices..."
                  className="w-full rounded-lg bg-input pl-10 pr-4 py-2 text-foreground placeholder:text-muted-foreground focus:ring-primary"
                />
             </div>
        </header>
        <main className="flex-1 p-4 overflow-auto md:p-6 bg-background">
          {children}
        </main>
         <footer className="mt-auto bg-muted/50 border-t border-border text-center p-4 text-sm text-muted-foreground">
            TaskBit © {new Date().getFullYear()}
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}


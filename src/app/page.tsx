
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle, Briefcase, Clock, FileText, Users, LayoutDashboard, MessageSquare, Menu, X, Linkedin, Mail } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TestimonialSlider } from '@/components/testimonial-slider';
import { PricingCard } from '@/components/pricing-card'; // Import the new client component
import type { Testimonial } from '@/components/testimonial-slider';
import type { PricingPlan } from '@/components/pricing-card'; // Import PricingPlan type

const features = [
  { title: 'Project Management', description: 'Organize projects, assign tasks, and track progress effortlessly.', icon: <Briefcase className="w-8 h-8 text-secondary" />, id: 'pm' },
  { title: 'Time Tracking', description: 'Log billable hours accurately and monitor team productivity.', icon: <Clock className="w-8 h-8 text-secondary" />, id: 'tt' },
  { title: 'Invoicing', description: 'Create professional invoices and get paid faster.', icon: <FileText className="w-8 h-8 text-secondary" />, id: 'inv' },
  { title: 'Client Portal', description: 'Share project updates and files securely with clients.', icon: <Users className="w-8 h-8 text-secondary" />, id: 'cp' },
  { title: 'Dashboard', description: 'Get a clear overview of your business performance at a glance.', icon: <LayoutDashboard className="w-8 h-8 text-secondary" />, id: 'db' },
  { title: 'Collaboration', description: 'Communicate with your team and clients seamlessly.', icon: <MessageSquare className="w-8 h-8 text-secondary" />, id: 'col' },
];

const pricingPlansData: PricingPlan[] = [
  { name: 'Free Tier', price: '$0', features: ['1 Project', 'Basic Task Management', 'Community Support'], id: 'free' },
  { name: 'Basic', price: '$10/month', features: ['5 Projects', 'Advanced Task Management', 'Time Tracking', 'Email Support'], id: 'basic' },
  { name: 'Pro', price: '$20/month', features: ['Unlimited Projects', 'All Basic Features', 'Invoicing', 'Client Portal', 'Priority Support'], id: 'pro' },
];

const testimonialsData: Testimonial[] = [
  { id: '1', name: 'Sarah L.', role: 'Freelance Designer', quote: 'TaskBit has revolutionized how I manage my projects. The invoicing feature alone saves me hours each month!' },
  { id: '2', name: 'John B.', role: 'Small Agency Owner', quote: 'Finally, a tool that combines project management and client communication so effectively. Highly recommended!' },
  { id: '3', name: 'Maria G.', role: 'Consultant', quote: 'I love the dashboard! It gives me a clear overview of my workload and finances. TaskBit is a game-changer.' },
];


// Mock API calls
const fetchPricingPlans = async (): Promise<PricingPlan[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));
  return pricingPlansData;
};

// This is moved to the client component
// const submitContactForm = async (formData: any) => { ... };
// const handleSubscription = (planId: string) => { ... };


export default async function LandingPage() {
  const currentPricingPlans = await fetchPricingPlans();

  const TaskBitLogo = () => (
    <div className="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary">
        <path d="M12 .75a8.25 8.25 0 00-8.25 8.25c0 1.886.646 3.599 1.707 4.954L2.97 22.441a.75.75 0 001.088.972l2.806-1.95A8.25 8.25 0 1012 .75zm0 15a6.75 6.75 0 110-13.5 6.75 6.75 0 010 13.5z" />
        <path d="M12 6.75a.75.75 0 00-.75.75v3.75H7.5a.75.75 0 000 1.5h3.75V18a.75.75 0 001.5 0v-5.25H16.5a.75.75 0 000-1.5h-3.75V7.5a.75.75 0 00-.75-.75z" />
      </svg>
      <span className="text-2xl font-semibold text-primary">TaskBit</span>
    </div>
  );

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#pricing', label: 'Pricing' },
    { href: '/auth/login', label: 'Login' }, // Updated Login link
  ];


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" passHref>
            <TaskBitLogo />
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map(link => (
              <Link key={link.label} href={link.href} className="text-foreground hover:text-primary transition-colors">
                {link.label}
              </Link>
            ))}
             <Link href="/auth/signup" passHref> {/* Updated Sign Up link */}
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg shadow hover:shadow-md">
                Sign Up
              </Button>
            </Link>
          </nav>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6 text-primary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px] bg-background">
                <nav className="flex flex-col space-y-4 pt-8">
                  {navLinks.map(link => (
                    <Link key={link.label} href={link.href} className="text-lg text-foreground hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  ))}
                   <Link href="/auth/signup" passHref> {/* Updated Sign Up link */}
                    <Button className="bg-accent hover:bg-accent/90 text-accent-foreground w-full rounded-lg shadow hover:shadow-md">
                      Sign Up
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-secondary text-primary-foreground py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            Simplify Your Freelance Work with TaskBit
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto text-balance">
            Manage projects, track time, and invoice clients in one place.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
             <Link href="/auth/signup" passHref> {/* Updated Sign Up link */}
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#features" passHref>
              <Button size="lg" variant="outline" className="text-secondary-foreground bg-background/20 hover:bg-background/30 border-secondary-foreground/50 rounded-lg shadow hover:shadow-md transition-all duration-300">
                See Features
              </Button>
            </Link>
          </div>
          <div className="mt-16 max-w-4xl mx-auto">
            <Image
              src="https://picsum.photos/1200/600?random=1"
              alt="TaskBit Dashboard Preview"
              width={1200}
              height={600}
              className="rounded-lg shadow-2xl"
              data-ai-hint="dashboard productivity"
              priority
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-16">
            Everything You Need to Succeed
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.id} className="bg-card border border-muted/50 shadow-lg hover:shadow-xl hover:border-secondary transition-all duration-300 transform hover:scale-105 rounded-lg">
                <CardHeader className="items-center text-center">
                  <div className="p-3 bg-secondary/10 rounded-full mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                  <p>{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser Section */}
      <section id="pricing" className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-16">
            Affordable Plans for Everyone
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {currentPricingPlans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} /> // Use the client component here
            ))}
          </div>
           <p className="text-center mt-8 text-muted-foreground">
            More details on our <Link href="/pricing" className="text-primary hover:underline">full pricing page</Link>.
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-16">
            Loved by Freelancers
          </h2>
          <TestimonialSlider testimonials={testimonialsData} />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <TaskBitLogo />
              <p className="text-muted-foreground mt-2 text-sm">
                Simplifying your freelance and small business operations.
              </p>
            </div>
            <div>
              <h5 className="font-semibold text-foreground mb-3">Quick Links</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
                <li><Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-foreground mb-3">Legal</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
              <div className="flex justify-center md:justify-start space-x-4 mt-6">
                <Link href="#" className="text-muted-foreground hover:text-secondary transition-colors"><X className="w-5 h-5" /></Link>
                <Link href="#" className="text-muted-foreground hover:text-secondary transition-colors"><Linkedin className="w-5 h-5" /></Link>
                <Link href="mailto:info@taskbit.com" className="text-muted-foreground hover:text-secondary transition-colors"><Mail className="w-5 h-5" /></Link>
              </div>
            </div>
          </div>
          <div className="text-center text-muted-foreground text-sm mt-10 border-t border-border pt-8">
            &copy; {new Date().getFullYear()} TaskBit. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

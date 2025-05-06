
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router

export interface PricingPlan {
  name: string;
  price: string;
  features: string[];
  id: string;
}

interface PricingCardProps {
  plan: PricingPlan;
}

export function PricingCard({ plan }: PricingCardProps) {
  const router = useRouter();

  const handleSubscription = (planId: string) => {
    console.log(`API Call: POST /subscribe with planId: ${planId}`); // For analytics/logging
    // In a real app, this would redirect to signup or a payment page
    // For now, just show an alert and redirect
    alert(`Redirecting to signup for plan: ${planId}`);
     router.push('/signup'); // Use router.push for navigation
  };

  return (
    <Card key={plan.id} className="bg-card border border-muted/50 shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col rounded-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-primary">{plan.name}</CardTitle>
        <p className="text-4xl font-bold text-foreground my-4">{plan.price}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-2">
          {plan.features.map((item, index) => (
            <li key={index} className="flex items-center text-muted-foreground">
              <CheckCircle className="w-5 h-5 text-secondary mr-2" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
      <div className="p-6 mt-auto">
        <Button
          onClick={() => handleSubscription(plan.id)}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg shadow hover:shadow-md"
        >
          Choose Plan
        </Button>
      </div>
    </Card>
  );
}

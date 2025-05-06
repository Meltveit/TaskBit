
"use client";

import type { ReactNode } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatar?: string; // Optional avatar image URL
}

interface TestimonialSliderProps {
  testimonials: Testimonial[];
  autoScrollInterval?: number; // in milliseconds
}

export function TestimonialSlider({ testimonials, autoScrollInterval = 5000 }: TestimonialSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (autoScrollInterval > 0 && testimonials.length > 1) {
      const timer = setInterval(nextSlide, autoScrollInterval);
      return () => clearInterval(timer);
    }
  }, [nextSlide, autoScrollInterval, testimonials.length]);

  if (!testimonials || testimonials.length === 0) {
    return <p className="text-center text-muted-foreground">No testimonials available yet.</p>;
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="w-full flex-shrink-0 px-2">
              <Card className="bg-card border border-muted/30 shadow-lg rounded-lg">
                <CardContent className="p-6 text-center">
                  {testimonial.avatar && (
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-2 border-primary"
                      data-ai-hint="user avatar"
                    />
                  )}
                  <blockquote className="text-lg text-foreground mb-4 italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <p className="font-semibold text-primary">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {testimonials.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-1/2 left-0 -translate-y-1/2 transform -translate-x-1/2 md:-translate-x-full bg-background/50 hover:bg-background/80 rounded-full shadow-md"
            onClick={prevSlide}
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-6 w-6 text-primary" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-1/2 right-0 -translate-y-1/2 transform translate-x-1/2 md:translate-x-full bg-background/50 hover:bg-background/80 rounded-full shadow-md"
            onClick={nextSlide}
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-6 w-6 text-primary" />
          </Button>
        </>
      )}
      
      {testimonials.length > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
            {testimonials.map((_, index) => (
            <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to testimonial ${index + 1}`}
                className={cn(
                'w-3 h-3 rounded-full transition-colors',
                currentIndex === index ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground/50'
                )}
            />
            ))}
        </div>
      )}
    </div>
  );
}

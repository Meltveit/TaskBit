"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import Link from 'next/link';
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// --- Schemas ---
const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;

interface AuthFormProps {
  defaultTab?: 'login' | 'signup';
}

export function AuthForm({ defaultTab = 'login' }: AuthFormProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultTab);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { login, signup, loginWithGoogle } = useAuth();

  // --- Forms ---
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  // --- Handlers ---
  async function onSubmitLogin(data: LoginFormValues) {
    setIsLoading(true);
    try {
      await login(data);
      
      toast({ 
        title: "Login Successful", 
        description: "Redirecting to your dashboard..." 
      });
      
      router.push('/dashboard');
    } catch (error) {
      console.error("Login Error:", error);
      toast({
        title: "Login Failed",
        description: error instanceof Error 
          ? error.message 
          : "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmitSignup(data: SignUpFormValues) {
    setIsLoading(true);
    try {
      await signup({
        name: data.name,
        email: data.email,
        password: data.password
      });
      
      toast({ 
        title: "Sign Up Successful", 
        description: "Your account has been created! Redirecting to dashboard..." 
      });
      
      router.push('/dashboard');
    } catch (error) {
      console.error("Signup Error:", error);
      toast({
        title: "Sign Up Failed",
        description: error instanceof Error 
          ? error.message 
          : "Could not create account. Email might be taken.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      
      toast({ 
        title: "Google Sign-In Successful", 
        description: "Redirecting to your dashboard..." 
      });
      
      router.push('/dashboard');
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      toast({
        title: "Google Sign-In Failed",
        description: error instanceof Error 
          ? error.message 
          : "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Navigate to forgot password page
    router.push('/auth/forgot-password');
  };

  return (
    <Card className="w-full max-w-md bg-card text-card-foreground shadow-xl border border-border/50">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')} className="w-full">
        <CardHeader className="pb-2">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
             <TabsTrigger value="login" className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Login</TabsTrigger>
             <TabsTrigger value="signup" className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          {/* --- Login Tab --- */}
          <TabsContent value="login" className="mt-0">
             <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onSubmitLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                   <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg shadow hover:shadow-md" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Login
                   </Button>
                </form>
             </Form>
             <div className="text-center mt-4">
                <Button variant="link" onClick={handleForgotPassword} className="text-sm text-secondary px-0 h-auto py-0" disabled={isLoading}>
                    Forgot Password?
                </Button>
             </div>
          </TabsContent>

          {/* --- Sign Up Tab --- */}
          <TabsContent value="signup" className="mt-0">
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(onSubmitSignup)} className="space-y-4">
                   <FormField
                    control={signUpForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Name" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Minimum 8 characters" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={signUpForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Re-enter password" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg shadow hover:shadow-md" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Sign Up
                  </Button>
                </form>
              </Form>
          </TabsContent>

           {/* --- Social Login & Switch --- */}
           <Separator className="my-6 bg-border/60"/>

           <Button 
             variant="outline" 
             className="w-full border-border hover:bg-muted/50" 
             onClick={handleGoogleSignIn} 
             disabled={isLoading}
           >
               {/* Google Icon SVG */}
              <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
               Sign {activeTab === 'login' ? 'in' : 'up'} with Google
           </Button>

           <div className="mt-4 text-center text-sm">
                {activeTab === 'login' ? (
                    <>
                    Don't have an account?{" "}
                    <Button variant="link" className="text-secondary px-1 h-auto py-0" onClick={() => setActiveTab('signup')} disabled={isLoading}>
                        Sign up
                    </Button>
                    </>
                ) : (
                    <>
                    Already have an account?{" "}
                    <Button variant="link" className="text-secondary px-1 h-auto py-0" onClick={() => setActiveTab('login')} disabled={isLoading}>
                        Log in
                    </Button>
                    </>
                )}
           </div>

        </CardContent>
      </Tabs>
    </Card>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation"; // Or appropriate router hook

// Define the schema for the account settings form
const accountSettingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  // Optional: Add password fields if implementing password change here
  // currentPassword: z.string().optional(),
  // newPassword: z.string().min(8, "Password must be at least 8 characters.").optional(),
  // confirmPassword: z.string().optional(),
}).refine(data => {
  // Add password confirmation validation if needed
  // if (data.newPassword && data.newPassword !== data.confirmPassword) {
  //   return false;
  // }
  return true;
}, {
  // message: "New passwords do not match",
  // path: ["confirmPassword"], // Set error path if validation fails
});

type AccountSettingsValues = z.infer<typeof accountSettingsSchema>;

export function AccountSettingsForm() {
  const { toast } = useToast();
  const router = useRouter(); // For potential navigation after save

  // Mock user data - replace with fetched data
  const currentUser = {
    name: "Jane Doe",
    email: "jane.doe@example.com",
  };

  const form = useForm<AccountSettingsValues>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      name: currentUser.name,
      email: currentUser.email,
      // currentPassword: "",
      // newPassword: "",
      // confirmPassword: "",
    },
  });

  // Placeholder submit handler
  async function onSubmit(data: AccountSettingsValues) {
    console.log("Submitting Account Settings:", data);
    // API Call Placeholder: PATCH /api/user with data
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Account Updated",
        description: "Your account information has been saved.",
      });
      // Optional: Refresh data or navigate
      // router.refresh();
    } catch (error) {
        toast({
            title: "Update Failed",
            description: "Could not update account settings. Please try again.",
            variant: "destructive",
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your.email@example.com" {...field} />
              </FormControl>
              <FormDescription>
                We'll send notifications and updates here.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Optional: Password Change Section */}
        {/* <div className="space-y-4 border-t pt-6 mt-6">
             <h3 className="text-lg font-medium text-foreground">Change Password</h3>
            <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                    <Input type="password" placeholder="Enter current password" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                    <Input type="password" placeholder="Enter new password" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                    <Input type="password" placeholder="Confirm new password" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div> */}

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

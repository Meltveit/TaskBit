
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

// Mock user preferences - replace with fetched data
const currentUserPreferences = {
  emailNotifications: true,
  darkMode: false,
  invoiceTemplate: "minimal",
};

export function PreferencesSettings() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState(currentUserPreferences);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleChange = (id: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectChange = (value: string) => {
     setPreferences(prev => ({ ...prev, invoiceTemplate: value }));
  };

  // Placeholder submit handler
  const handleSave = async () => {
    setIsSaving(true);
    console.log("Saving Preferences:", preferences);
    // API Call Placeholder: PATCH /api/preferences with preferences data
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Preferences Updated",
        description: "Your preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not save preferences. Please try again.",
        variant: "destructive",
      });
       // Optional: Revert state if API call fails
       // setPreferences(currentUserPreferences);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Card className="shadow-md border-border/60">
      <CardHeader>
        <CardTitle className="text-xl">Preferences</CardTitle>
        <CardDescription>Customize your TaskBit experience.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications Toggle */}
        <div className="flex items-center justify-between space-x-2 border-b pb-4">
          <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
            <span>Email Notifications</span>
            <span className="font-normal leading-snug text-muted-foreground">
              Receive updates about projects, tasks, and invoices via email.
            </span>
          </Label>
          <Switch
            id="email-notifications"
            checked={preferences.emailNotifications}
            onCheckedChange={() => handleToggleChange("emailNotifications")}
          />
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between space-x-2 border-b pb-4">
          <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
            <span>Dark Mode</span>
            <span className="font-normal leading-snug text-muted-foreground">
              Enable dark theme for the interface (requires page reload).
            </span>
          </Label>
          <Switch
            id="dark-mode"
            checked={preferences.darkMode}
            onCheckedChange={() => handleToggleChange("darkMode")}
            // Add logic here to apply dark mode class to <html> if needed
            // onClick={() => document.documentElement.classList.toggle('dark')}
          />
        </div>

        {/* Invoice Template Dropdown */}
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="invoice-template" className="flex flex-col space-y-1">
            <span>Invoice Template</span>
            <span className="font-normal leading-snug text-muted-foreground">
              Choose the default look for your generated invoices.
            </span>
          </Label>
          <Select
            value={preferences.invoiceTemplate}
            onValueChange={handleSelectChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minimal">Minimal</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
       <CardFooter className="flex justify-end border-t border-border/60 pt-4">
          <Button onClick={handleSave} disabled={isSaving} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
       </CardFooter>
    </Card>
  );
}

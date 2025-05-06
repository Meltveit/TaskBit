
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSettingsForm } from './_components/account-settings-form';
import { BillingSettings } from './_components/billing-settings';
import { PreferencesSettings } from './_components/preferences-settings';
import { User, CreditCard, Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">Settings</h1>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 bg-muted p-1 rounded-lg">
          <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <User className="h-4 w-4" /> Account
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <CreditCard className="h-4 w-4" /> Billing
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <SettingsIcon className="h-4 w-4" /> Preferences
          </TabsTrigger>
        </TabsList>

        {/* Account Tab Content */}
        <TabsContent value="account" className="mt-6">
          <Card className="shadow-md border-border/60">
            <CardHeader>
              <CardTitle className="text-xl">Account Information</CardTitle>
              <CardDescription>Manage your personal information and password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AccountSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab Content */}
        <TabsContent value="billing" className="mt-6">
            <BillingSettings />
        </TabsContent>

        {/* Preferences Tab Content */}
        <TabsContent value="preferences" className="mt-6">
            <PreferencesSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}


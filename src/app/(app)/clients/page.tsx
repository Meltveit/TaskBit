
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Users } from "lucide-react";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <h1 className="text-2xl font-bold tracking-tight text-primary">Clients</h1>
         <Link href="#"> {/* Link to /clients/new when available */}
           <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled> {/* Disabled until functionality exists */}
             <PlusCircle className="mr-2 h-4 w-4" /> New Client
           </Button>
         </Link>
       </div>

        <Card className="col-span-full text-center py-12 shadow-md">
          <CardContent>
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Client Management Coming Soon</h3>
            <p className="text-muted-foreground mb-4">This section is under construction. You'll soon be able to manage your clients here.</p>
            {/* <Link href="#">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Client
              </Button>
            </Link> */}
          </CardContent>
        </Card>
    </div>
  );
}

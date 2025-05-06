"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  PlusCircle, Users, Mail, Phone, Edit, Trash2, MoreHorizontal, 
  FileText, ExternalLink, Copy, CheckCircle 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  getClients, 
  deleteClient,
  generateClientPortalLink
} from "@/lib/client-service";
import type { Client } from "@/lib/db-models";

export default function ClientsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [portalLinkGenerating, setPortalLinkGenerating] = useState<string | null>(null);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsData = await getClients();
        setClients(clientsData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading clients:", error);
        toast({
          title: "Error Loading Clients",
          description: "Failed to load client data. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    loadClients();
  }, [toast]);

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("Are you sure you want to delete this client?")) {
      return;
    }

    try {
      await deleteClient(clientId);
      setClients(prev => prev.filter(client => client.id !== clientId));
      toast({
        title: "Client Deleted",
        description: "The client has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        title: "Error Deleting Client",
        description: "Failed to delete the client. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generatePortalLink = async (clientId: string) => {
    setPortalLinkGenerating(clientId);
    try {
      const link = await generateClientPortalLink(clientId);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(link);
      
      toast({
        title: "Client Portal Link Generated",
        description: "Link has been copied to clipboard!",
      });
    } catch (error) {
      console.error("Error generating portal link:", error);
      toast({
        title: "Error Generating Link",
        description: "Failed to generate client portal access link.",
        variant: "destructive",
      });
    } finally {
      setPortalLinkGenerating(null);
    }
  };

  // Helper to truncate long text
  const truncate = (text: string, length: number) => {
    if (!text) return "";
    return text.length > length ? `${text.substring(0, length)}...` : text;
  };

  // Render loading skeletons
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-7 w-40" />
          </CardHeader>
          <CardContent>
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-border last:border-0">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Clients</h1>
        <Link href="/clients/new">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Client
          </Button>
        </Link>
      </div>

      {clients.length > 0 ? (
        <Card className="shadow-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Invoices</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/20 text-secondary">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        {client.address && (
                          <div className="text-xs text-muted-foreground">
                            {truncate(client.address, 30)}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                          {client.email}
                        </a>
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{client.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-secondary/10 text-secondary-foreground">
                      0 Active
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 whitespace-nowrap">
                        $0.00 Outstanding
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Link href={`/clients/${client.id}`}>
                          <DropdownMenuItem>
                            <Users className="h-4 w-4 mr-2" />
                            View Client
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/clients/${client.id}/edit`}>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/invoices/new?clientId=${client.id}`}>
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            Create Invoice
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem 
                          onClick={() => generatePortalLink(client.id)}
                          disabled={portalLinkGenerating === client.id}
                        >
                          {portalLinkGenerating === client.id ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-secondary border-t-transparent"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Portal Access Link
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClient(client.id)} 
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="text-center py-12 shadow-md">
          <CardContent>
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">No Clients Yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your first client to start managing projects and invoices for them.
            </p>
            <Link href="/clients/new">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Client
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Client creation form dialog would be implemented as a separate component */}
    </div>
  );
}
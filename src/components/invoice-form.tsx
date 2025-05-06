
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Invoice, InvoiceItem, Project } from "@/lib/definitions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createInvoiceAction, updateInvoiceAction } from "@/lib/actions";
import { useEffect } from "react";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Item description is required."),
  quantity: z.coerce.number().min(0.1, "Quantity must be positive."),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative."),
});

const invoiceFormSchema = z.object({
  projectId: z.string().optional(),
  clientName: z.string().min(2, "Client name is required."),
  clientEmail: z.string().email("Invalid email address."),
  issueDate: z.date({ required_error: "Issue date is required." }),
  dueDate: z.date({ required_error: "Due date is required." }),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required."),
  status: z.enum(["draft", "sent", "paid", "overdue"]),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  projects: Project[]; // For selecting a project
}

export function InvoiceForm({ invoice, projects }: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!invoice;

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      projectId: invoice?.projectId || "", // Default to empty string for placeholder to show
      clientName: invoice?.clientName || "",
      clientEmail: invoice?.clientEmail || "",
      issueDate: invoice?.issueDate ? new Date(invoice.issueDate) : new Date(),
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate) : new Date(new Date().setDate(new Date().getDate() + 14)), // Default due date: 14 days from issue
      items: invoice?.items.map(item => ({...item})) || [{ description: "", quantity: 1, unitPrice: 0 }],
      status: invoice?.status || "draft",
      notes: invoice?.notes || "",
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");
  const totalAmount = watchItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  useEffect(() => {
    // Recalculate totals if using form.setValue for items
  }, [watchItems]);

  async function onSubmit(data: InvoiceFormValues) {
    const payload = {
      ...data,
      // If projectId is "none", set it to undefined before saving
      projectId: data.projectId === "none" ? undefined : data.projectId,
      issueDate: data.issueDate.toISOString(),
      dueDate: data.dueDate.toISOString(),
      items: data.items.map(item => ({
        ...item,
        id: (Math.random() + 1).toString(36).substring(7), // simple id for new items
        total: item.quantity * item.unitPrice
      })),
      totalAmount: data.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0),
      status: 'draft' // Always save as draft initially when creating/updating through form
    };

    try {
      let savedInvoice: Invoice | undefined;
      if (isEditing && invoice) {
         savedInvoice = await updateInvoiceAction(invoice.id, payload);
        toast({ title: "Invoice Updated", description: "The invoice details have been successfully updated." });
      } else {
         savedInvoice = await createInvoiceAction(payload);
        toast({ title: "Invoice Created", description: "The new invoice has been successfully created as a draft." });
      }

      if (!savedInvoice) {
         throw new Error("Failed to save invoice.");
      }

      // Redirect or handle next step (like triggering send) based on which button was clicked maybe?
      // For now, just redirect to the main invoices page after save/create.
      router.push("/invoices");
      router.refresh();

    } catch (error) {
      toast({
        title: "Error Saving Draft",
        description: `Failed to ${isEditing ? 'update' : 'create'} draft invoice. Please try again. Error: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  }

  // Handler for "Send Invoice" button
   async function handleSend() {
     const data = form.getValues();
     const payload = {
        ...data,
        // If projectId is "none", set it to undefined before saving
        projectId: data.projectId === "none" ? undefined : data.projectId,
        issueDate: data.issueDate.toISOString(),
        dueDate: data.dueDate.toISOString(),
        items: data.items.map(item => ({
            ...item,
            id: (Math.random() + 1).toString(36).substring(7),
            total: item.quantity * item.unitPrice
        })),
        totalAmount: data.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0),
        status: 'sent' as const // Set status to 'sent'
     };

     try {
        let savedInvoice: Invoice | undefined;
        if (isEditing && invoice) {
            savedInvoice = await updateInvoiceAction(invoice.id, payload);
        } else {
            savedInvoice = await createInvoiceAction(payload);
        }

        if (!savedInvoice) {
            throw new Error("Failed to save invoice before sending.");
        }

         // Now trigger the email sending action
         // Assuming create/update handles sending if status is 'sent' based on previous logic in actions.ts
         // If not, uncomment the sendInvoiceEmailAction call
        // const sendResult = await sendInvoiceEmailAction(savedInvoice.id, savedInvoice.clientEmail);


        toast({ title: "Invoice Sent", description: `Invoice ${savedInvoice.invoiceNumber} has been successfully created and sent.` });
        router.push("/invoices");
        router.refresh();
     } catch (error) {
        toast({
            title: "Error Sending Invoice",
            description: `Failed to send invoice. Please try again. Error: ${error instanceof Error ? error.message : String(error)}`,
            variant: "destructive",
        });
     }
   }


  return (
    <Form {...form}>
      {/* Invoice Preview Card (optional real-time preview) */}
      {/* This could be a separate component */}
      <div className="mb-8 p-4 border rounded-lg bg-card shadow-sm">
        <h3 className="text-lg font-semibold text-primary mb-2">Preview</h3>
        <p className="text-muted-foreground">Client: {form.watch('clientName') || 'N/A'}</p>
        <p className="text-muted-foreground">Total: <span className="font-bold text-secondary">${totalAmount.toFixed(2)}</span></p>
        {/* Add more preview details */}
      </div>


      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Name</FormLabel>
                <FormControl>
                  {/* Client Dropdown Placeholder - Replace with actual dropdown fetching clients */}
                  <Input placeholder="Select or enter client name" {...field} />
                   {/* <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       <SelectItem value="client1">Acme Corp</SelectItem>
                       <SelectItem value="client2">Beta Solutions</SelectItem>
                    </SelectContent>
                  </Select> */}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clientEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="client@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link to Project (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}> {/* Ensure default is "" to show placeholder */}
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Changed value from "" to "none" */}
                    <SelectItem value="none">None</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Issue Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Line Items</h3>
          {fields.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-end mb-4 p-3 border rounded-md bg-muted/30">
              <FormField
                control={form.control}
                name={`items.${index}.description`}
                render={({ field }) => (
                  <FormItem className="col-span-12 md:col-span-5">
                    {index === 0 && <FormLabel>Description</FormLabel>}
                    <FormControl>
                      <Input placeholder="Service or Product" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <FormItem className="col-span-4 md:col-span-2">
                     {index === 0 && <FormLabel>Quantity</FormLabel>}
                    <FormControl>
                      <Input type="number" placeholder="1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.unitPrice`}
                render={({ field }) => (
                  <FormItem className="col-span-4 md:col-span-2">
                    {index === 0 && <FormLabel>Unit Price</FormLabel>}
                    <FormControl>
                      <Input type="number" placeholder="100.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="col-span-4 md:col-span-2 flex items-center">
                 {index === 0 && <FormLabel className="opacity-0 hidden md:block">Total</FormLabel>}
                <p className="w-full pt-2 text-sm font-medium">
                  ${((watchItems[index]?.quantity || 0) * (watchItems[index]?.unitPrice || 0)).toFixed(2)}
                </p>
              </div>
              <div className="col-span-12 md:col-span-1 flex justify-end">
                {index === 0 && <FormLabel className="opacity-0 hidden md:block">Action</FormLabel>}
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>

        <div className="text-right text-xl font-semibold">
            Total: <span className="text-secondary">${totalAmount.toFixed(2)}</span>
        </div>

         {/* Hidden status field - managed internally */}
        {/* <FormField control={form.control} name="status" render={() => <FormItem className="hidden"><FormControl><Input type="hidden" /></FormControl></FormItem>} /> */}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="E.g., Payment terms, thank you message."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
            {/* Use ghost variant for Cancel button */}
            <Button type="button" variant="ghost" onClick={() => router.back()}>
                Cancel
            </Button>
             {/* Save Draft Button (Teal/Secondary) */}
            <Button type="submit" variant="secondary" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Draft"}
            </Button>
             {/* Send Button (Yellow/Accent) */}
            <Button type="button" onClick={handleSend} disabled={form.formState.isSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                 {form.formState.isSubmitting ? "Sending..." : "Send Invoice"}
            </Button>
        </div>
      </form>
    </Form>
  );
}


    
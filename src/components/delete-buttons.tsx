"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, ButtonProps } from "@/components/ui/button"; // Import ButtonProps
import { useToast } from "@/hooks/use-toast";
import { deleteProjectAction, deleteInvoiceAction, sendInvoiceEmailAction } from "@/lib/actions";
import { Trash2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        await deleteProjectAction(projectId);
        toast({ title: "Project Deleted", description: "The project has been successfully deleted." });
        router.refresh(); // Refresh the page to reflect changes
      } catch (error) {
        toast({
          title: "Error Deleting Project",
          description: "Failed to delete project. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isPending}>
          <Trash2 className="mr-1 h-4 w-4" /> {isPending ? "Deleting..." : "Delete"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the project and all its associated data (including tasks).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
            {isPending ? "Deleting..." : "Yes, delete project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


// Updated DeleteInvoiceButton to accept buttonProps
export function DeleteInvoiceButton({ invoiceId, buttonProps }: { invoiceId: string, buttonProps?: ButtonProps }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
     startTransition(async () => {
        try {
            await deleteInvoiceAction(invoiceId);
            toast({ title: "Invoice Deleted", description: "The invoice has been successfully deleted." });
            router.refresh();
        } catch (error) {
            toast({
            title: "Error Deleting Invoice",
            description: "Failed to delete invoice. Please try again.",
            variant: "destructive",
            });
        }
    });
  };

  // Merge default props with provided buttonProps
  const mergedButtonProps: ButtonProps = {
    variant: "destructive",
    size: "sm",
    disabled: isPending,
    ...buttonProps, // Override defaults if provided
  };

  const buttonContent = mergedButtonProps.size === "icon" ? (
    <>
      <Trash2 className="h-4 w-4" />
      <span className="sr-only">Delete</span>
    </>
  ) : (
    <>
      <Trash2 className="mr-1 h-4 w-4" /> {isPending ? "Deleting..." : "Delete"}
    </>
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button {...mergedButtonProps}>
          {buttonContent}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the invoice.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
             {isPending ? "Deleting..." : "Yes, delete invoice"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Updated SendInvoiceButton to accept buttonProps
export function SendInvoiceButton({
  invoiceId,
  clientEmail,
  isResend = false,
  buttonProps
}: {
  invoiceId: string,
  clientEmail: string,
  isResend?: boolean,
  buttonProps?: ButtonProps // Optional props for the Button
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);

  const handleSendInvoice = async () => {
    setIsSending(true);
    try {
      const result = await sendInvoiceEmailAction(invoiceId, clientEmail);
      if (result.success) {
        toast({
          title: `Invoice ${isResend ? 'Re-sent' : 'Sent'}`,
          description: `Invoice has been successfully ${isResend ? 're-sent' : 'sent'} to ${clientEmail}.`,
        });
        router.refresh(); // Refresh to update invoice status if changed
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: `Error ${isResend ? 'Re-sending' : 'Sending'} Invoice`,
        description: error instanceof Error ? error.message : "Failed to send invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

   // Merge default props with provided buttonProps
  const mergedButtonProps: ButtonProps = {
    variant: "default", // Yellow by default as per prompt
    size: "sm",
    onClick: handleSendInvoice,
    disabled: isSending,
    ...buttonProps, // Override defaults if provided
    className: buttonProps?.className ? `${buttonProps.className} bg-accent hover:bg-accent/90 text-accent-foreground` : `bg-accent hover:bg-accent/90 text-accent-foreground`, // Ensure accent color is applied if not overridden

  };

  const buttonContent = mergedButtonProps.size === "icon" ? (
     <>
      <Send className="h-4 w-4" />
      <span className="sr-only">{isSending ? (isResend ? "Re-sending..." : "Sending...") : (isResend ? "Re-send Invoice" : "Send Invoice")}</span>
     </>
   ) : (
     <>
      <Send className="mr-1 h-4 w-4" />
      {isSending ? (isResend ? "Re-sending..." : "Sending...") : (isResend ? "Re-send Invoice" : "Send Invoice")}
     </>
   );

  return (
    <Button {...mergedButtonProps}>
      {buttonContent}
    </Button>
  );
}


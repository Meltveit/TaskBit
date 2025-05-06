"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProject,
  updateProject,
  deleteProject as deleteProjectData,
  createTask,
  updateTask,
  deleteTask as deleteTaskData,
  createInvoice,
  updateInvoice,
  deleteInvoice as deleteInvoiceData,
  getInvoiceById,
  getProjectById,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry as deleteTimeEntryData,
  addActivityLog,
  type Project,
  type Task,
  type Invoice,
  type InvoiceItem,
  type TimeEntry,
  getProjects
} from "./db-models"; // Updated from definitions
import { sendEmail } from '@/services/email';

// Project Actions
export async function createProjectAction(data: Omit<Project, "id" | "createdAt" | "updatedAt" | "tasks" | "uid">) {
  try {
    const newProject = await createProject(data);
    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return newProject;
  } catch (error) {
    console.error("Failed to create project:", error);
    throw new Error("Failed to create project.");
  }
}

export async function updateProjectAction(id: string, data: Partial<Omit<Project, "id" | "createdAt" | "updatedAt" | "uid">>) {
  try {
    const updatedProject = await updateProject(id, data);
    if (!updatedProject) throw new Error("Project not found for update.");
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    revalidatePath("/dashboard");
    return updatedProject;
  } catch (error) {
    console.error("Failed to update project:", error);
    throw new Error("Failed to update project.");
  }
}

export async function deleteProjectAction(id: string) {
  try {
    // Fetch project name before deleting for logging
    const project = await getProjectById(id);
    
    const success = await deleteProjectData(id);
    if (!success) throw new Error("Failed to delete project or project not found.");

    revalidatePath("/projects");
    revalidatePath("/dashboard");
    // Invoices linked to this project might need handling logic if strict relations are enforced
  } catch (error) {
    console.error("Failed to delete project:", error);
    throw new Error("Failed to delete project.");
  }
}

// Task Actions
export async function createTaskAction(projectId: string, data: Omit<Task, "id" | "projectId" | "createdAt" | "updatedAt">) {
  try {
    const newTask = await createTask(projectId, data);
    if (!newTask) throw new Error("Project not found for task creation or task creation failed.");

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard"); // If dashboard shows task counts etc.
    return newTask;
  } catch (error) {
    console.error("Failed to create task:", error);
    throw new Error("Failed to create task.");
  }
}

export async function updateTaskAction(projectId: string, taskId: string, data: Partial<Omit<Task, "id" | "projectId" | "createdAt" | "updatedAt">>) {
  try {
    const updatedTask = await updateTask(projectId, taskId, data);
    if (!updatedTask) throw new Error("Task not found for update or update failed.");

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/time-tracking"); // Also update time tracking if tasks are listed
    revalidatePath("/client-portal"); // Update client portal if tasks are shown there
    revalidatePath("/dashboard");
    return updatedTask;
  } catch (error) {
    console.error("Failed to update task:", error);
    throw new Error("Failed to update task.");
  }
}

export async function deleteTaskAction(projectId: string, taskId: string) {
  try {
    const success = await deleteTaskData(projectId, taskId);
    if (!success) throw new Error("Failed to delete task or task not found.");

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");
    revalidatePath("/time-tracking"); // Update time tracking
    revalidatePath("/client-portal"); // Update client portal
  } catch (error) {
    console.error("Failed to delete task:", error);
    throw new Error("Failed to delete task.");
  }
}

// New Action: Approve Task (from Client Portal)
export async function approveTaskAction(projectId: string, taskId: string) {
    try {
        // Update task status to 'done' when client approves
        const updatedTask = await updateTask(projectId, taskId, { status: 'done' });
        if (!updatedTask) throw new Error("Failed to approve task.");

        // Add specific activity log for approval
        await addActivityLog({ type: 'task', action: 'approved', description: `Client approved Task: ${updatedTask.name}` });

        revalidatePath(`/projects/${projectId}`);
        revalidatePath("/client-portal");
        revalidatePath("/dashboard"); // Update dashboard task counts

        return { success: true, message: "Task approved successfully." };
    } catch (error) {
        console.error("Failed to approve task:", error);
        throw new Error(`Failed to approve task: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Invoice Actions
// Type for invoice creation payload, excluding fields generated by the server/DB
type CreateInvoicePayload = Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "updatedAt" | "uid"> & { status: Invoice['status'] };

export async function createInvoiceAction(data: CreateInvoicePayload) {
  try {
    const newInvoice = await createInvoice(data);

    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    // If the invoice was created with status 'sent', trigger the email sending immediately
    if (newInvoice && data.status === 'sent') {
       try {
         await sendInvoiceEmailAction(newInvoice.id, newInvoice.clientEmail);
         console.log(`Invoice ${newInvoice.invoiceNumber} created and email triggered.`);
       } catch (emailError) {
          console.error(`Invoice ${newInvoice.invoiceNumber} created, but failed to send email:`, emailError);
          // Decide if you want to revert the status or just log the error
       }
    }

    return newInvoice;
  } catch (error) {
    console.error("Failed to create invoice:", error);
    throw new Error(`Failed to create invoice: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Type for invoice update payload
type UpdateInvoicePayload = Partial<Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "updatedAt" | "uid">>;

export async function updateInvoiceAction(id: string, data: UpdateInvoicePayload) {
  try {
    const invoiceBeforeUpdate = await getInvoiceById(id);
    if (!invoiceBeforeUpdate) throw new Error("Invoice not found for update.");
    const originalStatus = invoiceBeforeUpdate.status;

    const updatedInvoice = await updateInvoice(id, data);
    if (!updatedInvoice) throw new Error("Invoice update failed internally.");

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${id}`);
    revalidatePath("/dashboard");
    revalidatePath("/client-portal"); // Update client portal

    // If the update changes status to 'sent', trigger email
    if (updatedInvoice && data.status === 'sent' && originalStatus !== 'sent') { // Only send if status changes *to* sent
        try {
         await sendInvoiceEmailAction(updatedInvoice.id, updatedInvoice.clientEmail);
         console.log(`Invoice ${updatedInvoice.invoiceNumber} updated and email triggered.`);
       } catch (emailError) {
          console.error(`Invoice ${updatedInvoice.invoiceNumber} updated, but failed to send email:`, emailError);
          // Log error, potentially update status back to draft if critical
       }
    }

    return updatedInvoice;
  } catch (error) {
    console.error("Failed to update invoice:", error);
    throw new Error(`Failed to update invoice: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function deleteInvoiceAction(id: string) {
  try {
     const invoice = await getInvoiceById(id);
     if (!invoice) throw new Error("Invoice not found for deletion.");

    const success = await deleteInvoiceData(id);
    if (!success) throw new Error("Failed to delete invoice.");

    revalidatePath("/invoices");
    revalidatePath("/dashboard");
    revalidatePath("/client-portal"); // Update client portal
  } catch (error) {
    console.error("Failed to delete invoice:", error);
    throw new Error("Failed to delete invoice.");
  }
}

export async function sendInvoiceEmailAction(invoiceId: string, clientEmail: string) {
  try {
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found.");
    }

    // Ensure invoice status is 'sent' or 'overdue' or 'draft' before sending/resending
     if (invoice.status !== 'sent' && invoice.status !== 'overdue' && invoice.status !== 'draft') {
       throw new Error(`Cannot send email for invoice with status: ${invoice.status}`);
     }

    // Simplified email content
    const emailSubject = `Invoice ${invoice.invoiceNumber} from TaskBit`;
    const emailHtml = `
      <h1>Invoice ${invoice.invoiceNumber}</h1>
      <p>Dear ${invoice.clientName},</p>
      <p>Please find your invoice attached (or view it online: <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/invoices/${invoice.id}">View Invoice</a>).</p>
      <p>Total Amount: $${invoice.totalAmount.toFixed(2)}</p>
      <p>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
      <p>Thank you for your business!</p>
      <br>
      <p>Best regards,</p>
      <p>TaskBit Team</p>
    `;

    await sendEmail({
      to: clientEmail,
      subject: emailSubject,
      html: emailHtml,
    });

     // Update invoice status to 'sent' if it was 'draft'
    if (invoice.status === 'draft') {
      await updateInvoice(invoiceId, { status: 'sent' });
       revalidatePath("/invoices");
       revalidatePath(`/invoices/${invoiceId}`);
       revalidatePath("/dashboard");
       revalidatePath("/client-portal"); // Update client portal
    }

    return { success: true, message: "Invoice sent successfully." };
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`Failed to send invoice: ${errorMessage}`);
  }
}

// Time Tracking Actions (Updated to work with subcollections)
export async function createTimeEntryAction(data: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt' | 'uid'>) {
  try {
    if (!data.projectId) {
      throw new Error("Project ID is required for time entries");
    }
    
    const newEntry = await createTimeEntry(data);
    
    revalidatePath("/time-tracking");
    revalidatePath("/dashboard"); // If dashboard shows hours tracked
    revalidatePath(`/projects/${data.projectId}`); // Revalidate the project page too
    return newEntry;
  } catch (error) {
    console.error("Failed to create time entry:", error);
    throw new Error("Failed to log time entry.");
  }
}

export async function updateTimeEntryAction(projectId: string, entryId: string, data: Partial<Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>>) {
  try {
    const updatedEntry = await updateTimeEntry(projectId, entryId, data);
    if (!updatedEntry) throw new Error("Time entry not found for update.");
    
    revalidatePath("/time-tracking");
    revalidatePath("/dashboard");
    revalidatePath(`/projects/${projectId}`);
    return updatedEntry;
  } catch (error) {
    console.error("Failed to update time entry:", error);
    throw new Error("Failed to update time entry.");
  }
}

export async function deleteTimeEntryAction(projectId: string, entryId: string) {
  try {
    const success = await deleteTimeEntryData(projectId, entryId);
    if (!success) throw new Error("Failed to delete time entry or entry not found.");
    
    revalidatePath("/time-tracking");
    revalidatePath("/dashboard");
    revalidatePath(`/projects/${projectId}`);
  } catch (error) {
    console.error("Failed to delete time entry:", error);
    throw new Error("Failed to delete time entry.");
  }
}
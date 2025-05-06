
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
  getProjectById, // Added to find project for task approval
  createTimeEntry, // Added
  updateTimeEntry, // Added
  deleteTimeEntry as deleteTimeEntryData, // Added
  addActivityLog, // Now correctly exported from definitions
  type Project,
  type Task,
  type Invoice,
  type InvoiceItem,
  type TimeEntry, // Added
  getProjects // Added import
} from "./definitions";
import { sendEmail } from '@/services/email'; // Assuming this service exists

// Project Actions
export async function createProjectAction(data: Omit<Project, "id" | "createdAt" | "updatedAt" | "tasks">) {
  try {
    const newProject = await createProject(data);
    addActivityLog({ type: 'project', action: 'created', description: `Created Project: ${newProject.name}` });
    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return newProject;
  } catch (error) {
    console.error("Failed to create project:", error);
    throw new Error("Failed to create project.");
  }
}

export async function updateProjectAction(id: string, data: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>) {
  try {
    const updatedProject = await updateProject(id, data);
    if (!updatedProject) throw new Error("Project not found for update.");
    addActivityLog({ type: 'project', action: 'updated', description: `Updated Project: ${updatedProject.name}` });
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
    const projectName = project ? project.name : `Project ID ${id}`;

    const success = await deleteProjectData(id);
    if (!success) throw new Error("Failed to delete project or project not found.");

    addActivityLog({ type: 'project', action: 'deleted', description: `Deleted Project: ${projectName}` });
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

    const project = await getProjectById(projectId); // Fetch project for name
    const projectName = project ? project.name : `Project ID ${projectId}`;
    addActivityLog({ type: 'task', action: 'created', description: `Created Task: ${newTask.name} in Project ${projectName}` });

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
    const project = await getProjectById(projectId);
    if (!project) throw new Error("Project not found for task update.");

    const taskIndex = project.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) throw new Error("Task not found for update.");

    const originalStatus = project.tasks[taskIndex].status;
    const taskName = project.tasks[taskIndex].name;

    const updatedTask = await updateTask(projectId, taskId, data);
    if (!updatedTask) throw new Error("Task update failed.");

    // Add activity log based on what changed
    if (data.status && data.status !== originalStatus) {
        addActivityLog({ type: 'task', action: 'updated', description: `Updated Task Status: ${taskName} to ${updatedTask.status}` });
        if (updatedTask.status === 'done') {
            addActivityLog({ type: 'task', action: 'completed', description: `Completed Task: ${taskName}` });
        }
    } else {
        addActivityLog({ type: 'task', action: 'updated', description: `Updated Task: ${taskName}` });
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/time-tracking"); // Also update time tracking if tasks are listed
    revalidatePath("/client-portal"); // Update client portal if tasks are shown there
    return updatedTask;
  } catch (error) {
    console.error("Failed to update task:", error);
    throw new Error("Failed to update task.");
  }
}

export async function deleteTaskAction(projectId: string, taskId: string) {
  try {
    // Fetch task/project name before deleting for logging
    const project = await getProjectById(projectId);
    const task = project?.tasks.find(t => t.id === taskId);
    const taskName = task ? task.name : `Task ID ${taskId}`;
    const projectName = project ? project.name : `Project ID ${projectId}`;

    const success = await deleteTaskData(projectId, taskId);
    if (!success) throw new Error("Failed to delete task or task not found.");

    addActivityLog({ type: 'task', action: 'deleted', description: `Deleted Task: ${taskName} from Project ${projectName}` });
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
export async function approveTaskAction(taskId: string) {
    // Need projectId to update the correct project store
    // In a real DB, you'd fetch the task directly and get projectId
    // For dummy data, we need to find the project containing the task
    let projectId: string | undefined;
    let taskToApprove: Task | undefined;

    for (const project of await getProjects()) {
        const foundTask = project.tasks.find(t => t.id === taskId);
        if (foundTask) {
            projectId = project.id;
            taskToApprove = foundTask;
            break;
        }
    }

    if (!projectId || !taskToApprove) {
        throw new Error("Task not found for approval.");
    }

    try {
        // Update task status to 'done' or a specific 'approved' status if needed
        // For simplicity, let's assume approval means 'done'
        const updatedTask = await updateTask(projectId, taskId, { status: 'done' });
        if (!updatedTask) throw new Error("Failed to approve task.");

        // Add specific activity log for approval
        addActivityLog({ type: 'task', action: 'approved', description: `Client approved Task: ${updatedTask.name}` });

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
// Include status here as the form might decide to send immediately
type CreateInvoicePayload = Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "updatedAt"> & { status: Invoice['status'] };

export async function createInvoiceAction(data: CreateInvoicePayload) {
  try {
    const newInvoice = await createInvoice(data);
    addActivityLog({ type: 'invoice', action: 'created', description: `Created Invoice: ${newInvoice.invoiceNumber}` });
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
          // For now, we'll leave the status as 'sent' but log the error
          // Optionally, update the invoice status back to 'draft' here
          // await updateInvoice(newInvoice.id, { status: 'draft', notes: `Failed to send initial email. ${newInvoice.notes || ''}` });
       }
    }

    return newInvoice;
  } catch (error) {
    console.error("Failed to create invoice:", error);
    throw new Error(`Failed to create invoice: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Type for invoice update payload
type UpdateInvoicePayload = Partial<Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "updatedAt">>;

export async function updateInvoiceAction(id: string, data: UpdateInvoicePayload) {
  try {
    const invoiceBeforeUpdate = await getInvoiceById(id);
    if (!invoiceBeforeUpdate) throw new Error("Invoice not found for update.");
    const originalStatus = invoiceBeforeUpdate.status;

    const updatedInvoice = await updateInvoice(id, data);
    if (!updatedInvoice) throw new Error("Invoice update failed internally.");

    // Log status change or general update
    if (data.status && data.status !== originalStatus) {
        addActivityLog({ type: 'invoice', action: 'updated', description: `Updated Invoice Status: ${updatedInvoice.invoiceNumber} to ${updatedInvoice.status}` });
    } else {
        addActivityLog({ type: 'invoice', action: 'updated', description: `Updated Invoice: ${updatedInvoice.invoiceNumber}` });
    }

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
     const invoiceNumber = invoice.invoiceNumber;

    const success = await deleteInvoiceData(id);
    if (!success) throw new Error("Failed to delete invoice.");

    addActivityLog({ type: 'invoice', action: 'deleted', description: `Deleted Invoice: ${invoiceNumber}` });
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
     if (invoice.status !== 'sent' && invoice.status !== 'overdue' && invoice.status !== 'draft') { // Allow sending from draft too
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

     // Add activity log for sending
     addActivityLog({ type: 'invoice', action: 'sent', description: `Sent Invoice: ${invoice.invoiceNumber} to ${clientEmail}` });

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
    // No need to return success:false here, the caller will catch the throw
    throw new Error(`Failed to send invoice: ${errorMessage}`);
  }
}

// Time Tracking Actions (New)
export async function createTimeEntryAction(data: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const newEntry = await createTimeEntry(data);
     // Format duration for log message
    const durationHours = Math.floor(newEntry.durationSeconds / 3600);
    const durationMinutes = Math.floor((newEntry.durationSeconds % 3600) / 60);
    const durationFormatted = `${durationHours}h ${durationMinutes}m`;
    addActivityLog({ type: 'time', action: 'stopped', description: `Logged time for ${newEntry.taskName || newEntry.projectName} (${durationFormatted})` });

    revalidatePath("/time-tracking");
    revalidatePath("/dashboard"); // If dashboard shows hours tracked
    return newEntry;
  } catch (error) {
    console.error("Failed to create time entry:", error);
    throw new Error("Failed to log time entry.");
  }
}

export async function updateTimeEntryAction(id: string, data: Partial<Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>>) {
  try {
    const updatedEntry = await updateTimeEntry(id, data);
    if (!updatedEntry) throw new Error("Time entry not found for update.");
    addActivityLog({ type: 'time', action: 'updated', description: `Updated time entry for ${updatedEntry.taskName || updatedEntry.projectName}` });
    revalidatePath("/time-tracking");
    revalidatePath("/dashboard");
    return updatedEntry;
  } catch (error) {
    console.error("Failed to update time entry:", error);
    throw new Error("Failed to update time entry.");
  }
}

export async function deleteTimeEntryAction(id: string) {
  try {
    // Fetch entry before deleting for logging
    // Need a getTimeEntryById function in definitions.ts for this, assuming it exists:
    // const entry = await getTimeEntryById(id);
    // const entryName = entry ? (entry.taskName || entry.projectName) : `Time Entry ID ${id}`;

    const success = await deleteTimeEntryData(id);
    if (!success) throw new Error("Failed to delete time entry or entry not found.");

    // Using a placeholder name if getTimeEntryById is not implemented yet
    const entryName = `Time Entry ID ${id}`; // Replace with actual fetch if possible
    addActivityLog({ type: 'time', action: 'deleted', description: `Deleted time entry: ${entryName}` });

    revalidatePath("/time-tracking");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Failed to delete time entry:", error);
    throw new Error("Failed to delete time entry.");
  }
}

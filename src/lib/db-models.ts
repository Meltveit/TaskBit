import { 
    collection, 
    doc,
    getDoc, 
    getDocs, 
    query, 
    where, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    serverTimestamp,
    orderBy,
    limit,
    Timestamp,
    DocumentReference,
    DocumentData,
    documentId,
    collectionGroup
  } from 'firebase/firestore';
  import { db } from './firebase';
  import { auth } from './firebase';
  
  // Define types
  export interface Project {
    id: string;
    uid: string; // Owner user ID
    name: string;
    description?: string;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    tasks: Task[];
    status: 'active' | 'completed' | 'archived';
    clientId?: string; // Added clientId to link projects to clients
    lastActivity?: string; // ISO date string
  }
  
  export interface Task {
    id: string;
    projectId: string;
    name: string;
    description?: string;
    status: 'todo' | 'inprogress' | 'done';
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    dueDate?: string; // ISO date string
  }
  
  export interface Invoice {
    id: string;
    uid: string; // Owner user ID
    projectId?: string; // Optional: invoice might not be tied to a project
    clientName: string;
    clientEmail: string;
    clientId?: string; // Added clientId to link invoices to clients
    invoiceNumber: string;
    issueDate: string; // ISO date string
    dueDate: string; // ISO date string
    items: InvoiceItem[];
    totalAmount: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    notes?: string;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    stripePaymentLinkId?: string; // For Stripe integration
    stripeInvoiceId?: string; // For Stripe integration
  }
  
  export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }
  
  export interface TimeEntry {
    id: string;
    uid: string; // Owner user ID
    projectId: string;
    projectName: string;
    taskId?: string;
    taskName?: string;
    startTime: string; // ISO date string
    endTime: string; // ISO date string
    durationSeconds: number;
    notes?: string;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
  }
  
  export interface ActivityLog {
    id: string;
    uid: string; // Owner user ID
    timestamp: string; // ISO date string
    type: 'project' | 'task' | 'invoice' | 'time' | 'client' | 'system';
    action: 'created' | 'updated' | 'deleted' | 'completed' | 'sent' | 'started' | 'stopped' | 'approved' | 'migration';
    description: string; // e.g., "Started timer for Task X"
  }
  
  export interface Client {
    id: string;
    uid: string; // Owner user ID
    name: string;
    email: string;
    phone?: string;
    address?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  // --- Helper functions ---
  
  // Convert Firestore timestamp to ISO string
  const timestampToISO = (timestamp: Timestamp): string => {
    return timestamp.toDate().toISOString();
  };
  
  // Convert Firestore data to our types
  const convertFirestoreData = <T>(data: DocumentData, id: string): T => {
    const result: any = { id, ...data };
    
    // Convert timestamps to ISO strings
    for (const key in result) {
      if (result[key] instanceof Timestamp) {
        result[key] = timestampToISO(result[key]);
      }
    }
    
    return result as T;
  };
  
  // Get current user ID or throw error
  const getCurrentUserId = (): string => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }
    return user.uid;
  };
  
  // --- PROJECTS ---
  
  export const getProjects = async (): Promise<Project[]> => {
    try {
      const uid = getCurrentUserId();
      const projectsCollection = collection(db, 'users', uid, 'projects');
      const projectsQuery = query(projectsCollection, orderBy('createdAt', 'desc'));
      const projectsSnapshot = await getDocs(projectsQuery);
      
      const projects: Project[] = [];
      
      // Skip metadata document
      const validProjects = projectsSnapshot.docs.filter(doc => doc.id !== '_metadata');
      
      for (const projectDoc of validProjects) {
        const projectData = projectDoc.data();
        const projectId = projectDoc.id;
        
        // Get tasks for this project
        const tasksCollection = collection(db, 'users', uid, 'projects', projectId, 'tasks');
        const tasksSnapshot = await getDocs(tasksCollection);
        const tasks = tasksSnapshot.docs.map(taskDoc => 
          convertFirestoreData<Task>(taskDoc.data(), taskDoc.id)
        );
        
        // Convert project data
        const project = convertFirestoreData<Project>(projectData, projectId);
        project.tasks = tasks;
        
        projects.push(project);
      }
      
      return projects;
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  };
  
  export const getProjectById = async (projectId: string): Promise<Project | undefined> => {
    try {
      const uid = getCurrentUserId();
      const projectDoc = await getDoc(doc(db, 'users', uid, 'projects', projectId));
      
      if (!projectDoc.exists()) {
        return undefined;
      }
      
      // Get tasks for this project
      const tasksCollection = collection(db, 'users', uid, 'projects', projectId, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollection);
      const tasks = tasksSnapshot.docs.map(taskDoc => 
        convertFirestoreData<Task>(taskDoc.data(), taskDoc.id)
      );
      
      // Convert project data
      const project = convertFirestoreData<Project>(projectDoc.data(), projectId);
      project.tasks = tasks;
      
      return project;
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  };
  
  export const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'uid'>): Promise<Project> => {
    try {
      const uid = getCurrentUserId();
      
      const projectsCollection = collection(db, 'users', uid, 'projects');
      const newProjectRef = await addDoc(projectsCollection, {
        ...projectData,
        uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
      });
      
      // Log activity
      await addActivityLog({
        type: 'project',
        action: 'created',
        description: `Created Project: ${projectData.name}`
      });
      
      // Get the new project
      const newProjectSnapshot = await getDoc(newProjectRef);
      const newProject = convertFirestoreData<Project>(newProjectSnapshot.data()!, newProjectRef.id);
      newProject.tasks = [];
      
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };
  
  export const updateProject = async (projectId: string, projectData: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Project | undefined> => {
    try {
      const uid = getCurrentUserId();
      const projectRef = doc(db, 'users', uid, 'projects', projectId);
      
      await updateDoc(projectRef, {
        ...projectData,
        updatedAt: serverTimestamp()
      });
      
      // Log activity
      await addActivityLog({
        type: 'project',
        action: 'updated',
        description: `Updated Project: ${projectData.name || projectId}`
      });
      
      // Get the updated project
      return await getProjectById(projectId);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };
  
  export const deleteProject = async (projectId: string): Promise<boolean> => {
    try {
      const uid = getCurrentUserId();
      const projectRef = doc(db, 'users', uid, 'projects', projectId);
      
      // Get project name for activity log
      const projectSnapshot = await getDoc(projectRef);
      if (!projectSnapshot.exists()) {
        return false;
      }
      
      const projectName = projectSnapshot.data().name || `Project ID ${projectId}`;
      
      // Delete all tasks in the project
      const tasksCollection = collection(db, 'users', uid, 'projects', projectId, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollection);
      
      // Delete all tasks in a batch
      const deleteTasks = tasksSnapshot.docs.map(taskDoc => 
        deleteDoc(doc(db, 'users', uid, 'projects', projectId, 'tasks', taskDoc.id))
      );
      
      await Promise.all(deleteTasks);
      
      // Delete all time entries in the project
      const timeEntriesCollection = collection(db, 'users', uid, 'projects', projectId, 'timeEntries');
      const timeEntriesSnapshot = await getDocs(timeEntriesCollection);
      
      // Delete all time entries in a batch
      const deleteTimeEntries = timeEntriesSnapshot.docs.map(entryDoc => 
        deleteDoc(doc(db, 'users', uid, 'projects', projectId, 'timeEntries', entryDoc.id))
      );
      
      await Promise.all(deleteTimeEntries);
      
      // Delete the project
      await deleteDoc(projectRef);
      
      // Log activity
      await addActivityLog({
        type: 'project',
        action: 'deleted',
        description: `Deleted Project: ${projectName}`
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };
  
  // --- TASKS ---
  
  export const getTasksByProjectId = async (projectId: string): Promise<Task[]> => {
    try {
      const uid = getCurrentUserId();
      const tasksCollection = collection(db, 'users', uid, 'projects', projectId, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollection);
      
      return tasksSnapshot.docs.map(taskDoc => 
        convertFirestoreData<Task>(taskDoc.data(), taskDoc.id)
      );
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  };
  
  export const createTask = async (projectId: string, taskData: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>): Promise<Task | undefined> => {
    try {
      const uid = getCurrentUserId();
      const projectRef = doc(db, 'users', uid, 'projects', projectId);
      
      // Check if project exists
      const projectSnapshot = await getDoc(projectRef);
      if (!projectSnapshot.exists()) {
        return undefined;
      }
      
      const projectName = projectSnapshot.data().name;
      
      // Create new task
      const tasksCollection = collection(db, 'users', uid, 'projects', projectId, 'tasks');
      const newTaskRef = await addDoc(tasksCollection, {
        ...taskData,
        projectId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Update project's updatedAt and lastActivity
      await updateDoc(projectRef, {
        updatedAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      });
      
      // Log activity
      await addActivityLog({
        type: 'task',
        action: 'created',
        description: `Created Task: ${taskData.name} in Project ${projectName}`
      });
      
      // Get the new task
      const newTaskSnapshot = await getDoc(newTaskRef);
      return convertFirestoreData<Task>(newTaskSnapshot.data()!, newTaskRef.id);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };
  
  export const updateTask = async (projectId: string, taskId: string, taskData: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>): Promise<Task | undefined> => {
    try {
      const uid = getCurrentUserId();
      const taskRef = doc(db, 'users', uid, 'projects', projectId, 'tasks', taskId);
      
      // Check if task exists
      const taskSnapshot = await getDoc(taskRef);
      if (!taskSnapshot.exists()) {
        return undefined;
      }
      
      const originalTask = taskSnapshot.data();
      const originalStatus = originalTask.status;
      const taskName = originalTask.name;
      
      // Update task
      await updateDoc(taskRef, {
        ...taskData,
        updatedAt: serverTimestamp()
      });
      
      // Update project's updatedAt and lastActivity
      await updateDoc(doc(db, 'users', uid, 'projects', projectId), {
        updatedAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      });
      
      // Log activity based on what changed
      if (taskData.status && taskData.status !== originalStatus) {
        await addActivityLog({
          type: 'task',
          action: 'updated',
          description: `Updated Task Status: ${taskName} to ${taskData.status}`
        });
        
        if (taskData.status === 'done') {
          await addActivityLog({
            type: 'task',
            action: 'completed',
            description: `Completed Task: ${taskName}`
          });
        }
      } else {
        await addActivityLog({
          type: 'task',
          action: 'updated',
          description: `Updated Task: ${taskName}`
        });
      }
      
      // Get the updated task
      const updatedTaskSnapshot = await getDoc(taskRef);
      return convertFirestoreData<Task>(updatedTaskSnapshot.data(), taskId);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };
  
  export const deleteTask = async (projectId: string, taskId: string): Promise<boolean> => {
    try {
      const uid = getCurrentUserId();
      const taskRef = doc(db, 'users', uid, 'projects', projectId, 'tasks', taskId);
      
      // Get task and project names for activity log
      const taskSnapshot = await getDoc(taskRef);
      if (!taskSnapshot.exists()) {
        return false;
      }
      
      const taskName = taskSnapshot.data().name || `Task ID ${taskId}`;
      
      const projectSnapshot = await getDoc(doc(db, 'users', uid, 'projects', projectId));
      const projectName = projectSnapshot.exists() ? projectSnapshot.data().name : `Project ID ${projectId}`;
      
      // Delete the task
      await deleteDoc(taskRef);
      
      // Update project's updatedAt and lastActivity
      await updateDoc(doc(db, 'users', uid, 'projects', projectId), {
        updatedAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      });
      
      // Log activity
      await addActivityLog({
        type: 'task',
        action: 'deleted',
        description: `Deleted Task: ${taskName} from Project ${projectName}`
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };
  
  // --- INVOICES ---
  
  export const getInvoices = async (): Promise<Invoice[]> => {
    try {
      const uid = getCurrentUserId();
      const invoicesCollection = collection(db, 'users', uid, 'invoices');
      const invoicesQuery = query(invoicesCollection, orderBy('createdAt', 'desc'));
      const invoicesSnapshot = await getDocs(invoicesQuery);
      
      // Skip metadata document
      const validInvoices = invoicesSnapshot.docs.filter(doc => doc.id !== '_metadata');
      
      return validInvoices.map(invoiceDoc => 
        convertFirestoreData<Invoice>(invoiceDoc.data(), invoiceDoc.id)
      );
    } catch (error) {
      console.error('Error getting invoices:', error);
      throw error;
    }
  };
  
  export const getInvoiceById = async (invoiceId: string): Promise<Invoice | undefined> => {
    try {
      const uid = getCurrentUserId();
      const invoiceDoc = await getDoc(doc(db, 'users', uid, 'invoices', invoiceId));
      
      if (!invoiceDoc.exists()) {
        return undefined;
      }
      
      return convertFirestoreData<Invoice>(invoiceDoc.data(), invoiceId);
    } catch (error) {
      console.error('Error getting invoice:', error);
      throw error;
    }
  };
  
  // Generate the next invoice number
  const getNextInvoiceNumber = async (uid: string): Promise<string> => {
    try {
      const currentYear = new Date().getFullYear();
      const invoicesCollection = collection(db, 'users', uid, 'invoices');
      const invoicesQuery = query(
        invoicesCollection, 
        where('invoiceNumber', '>=', `INV-${currentYear}-`),
        where('invoiceNumber', '<', `INV-${currentYear+1}-`),
        orderBy('invoiceNumber', 'desc'),
        limit(1)
      );
      
      const invoicesSnapshot = await getDocs(invoicesQuery);
      
      if (invoicesSnapshot.empty) {
        return `INV-${currentYear}-001`;
      }
      
      const lastInvoice = invoicesSnapshot.docs[0].data();
      const lastInvoiceNumber = lastInvoice.invoiceNumber;
      const lastNumber = parseInt(lastInvoiceNumber.split('-')[2], 10);
      const nextNumber = lastNumber + 1;
      
      return `INV-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      throw error;
    }
  };
  
  export const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'uid'>): Promise<Invoice> => {
    try {
      const uid = getCurrentUserId();
      const invoiceNumber = await getNextInvoiceNumber(uid);
      
      const invoicesCollection = collection(db, 'users', uid, 'invoices');
      const newInvoiceRef = await addDoc(invoicesCollection, {
        ...invoiceData,
        uid,
        invoiceNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Log activity
      await addActivityLog({
        type: 'invoice',
        action: 'created',
        description: `Created Invoice: ${invoiceNumber}`
      });
      
      // If this invoice is associated with a project, update project's lastActivity
      if (invoiceData.projectId) {
        await updateDoc(doc(db, 'users', uid, 'projects', invoiceData.projectId), {
          lastActivity: serverTimestamp()
        });
      }
      
      // Get the new invoice
      const newInvoiceSnapshot = await getDoc(newInvoiceRef);
      return convertFirestoreData<Invoice>(newInvoiceSnapshot.data()!, newInvoiceRef.id);
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  };
  
  export const updateInvoice = async (invoiceId: string, invoiceData: Partial<Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>>): Promise<Invoice | undefined> => {
    try {
      const uid = getCurrentUserId();
      const invoiceRef = doc(db, 'users', uid, 'invoices', invoiceId);
      
      // Check if invoice exists
      const invoiceSnapshot = await getDoc(invoiceRef);
      if (!invoiceSnapshot.exists()) {
        return undefined;
      }
      
      const originalInvoice = invoiceSnapshot.data();
      const originalStatus = originalInvoice.status;
      const invoiceNumber = originalInvoice.invoiceNumber;
      
      // Update invoice
      await updateDoc(invoiceRef, {
        ...invoiceData,
        updatedAt: serverTimestamp()
      });
      
      // Log activity based on what changed
      if (invoiceData.status && invoiceData.status !== originalStatus) {
        await addActivityLog({
          type: 'invoice',
          action: 'updated',
          description: `Updated Invoice Status: ${invoiceNumber} to ${invoiceData.status}`
        });
      } else {
        await addActivityLog({
          type: 'invoice',
          action: 'updated',
          description: `Updated Invoice: ${invoiceNumber}`
        });
      }
      
      // If this invoice is associated with a project, update project's lastActivity
      if (originalInvoice.projectId) {
        await updateDoc(doc(db, 'users', uid, 'projects', originalInvoice.projectId), {
          lastActivity: serverTimestamp()
        });
      }
      
      // Get the updated invoice
      const updatedInvoiceSnapshot = await getDoc(invoiceRef);
      return convertFirestoreData<Invoice>(updatedInvoiceSnapshot.data(), invoiceId);
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  };
  
  export const deleteInvoice = async (invoiceId: string): Promise<boolean> => {
    try {
      const uid = getCurrentUserId();
      const invoiceRef = doc(db, 'users', uid, 'invoices', invoiceId);
      
      // Get invoice number for activity log
      const invoiceSnapshot = await getDoc(invoiceRef);
      if (!invoiceSnapshot.exists()) {
        return false;
      }
      
      const invoiceData = invoiceSnapshot.data();
      const invoiceNumber = invoiceData.invoiceNumber;
      
      // Delete the invoice
      await deleteDoc(invoiceRef);
      
      // Log activity
      await addActivityLog({
        type: 'invoice',
        action: 'deleted',
        description: `Deleted Invoice: ${invoiceNumber}`
      });
      
      // If this invoice is associated with a project, update project's lastActivity
      if (invoiceData.projectId) {
        await updateDoc(doc(db, 'users', uid, 'projects', invoiceData.projectId), {
          lastActivity: serverTimestamp()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  };
  
  // --- TIME ENTRIES ---
  
  // Get time entries for a specific project
  export const getTimeEntriesForProject = async (projectId: string): Promise<TimeEntry[]> => {
    try {
      const uid = getCurrentUserId();
      const entriesCollection = collection(db, 'users', uid, 'projects', projectId, 'timeEntries');
      const entriesQuery = query(entriesCollection, orderBy('startTime', 'desc'));
      const entriesSnapshot = await getDocs(entriesQuery);
      
      return entriesSnapshot.docs.map(entryDoc => {
        const entry = convertFirestoreData<TimeEntry>(entryDoc.data(), entryDoc.id);
        // Ensure projectId is included
        entry.projectId = projectId;
        return entry;
      });
    } catch (error) {
      console.error('Error getting time entries for project:', error);
      throw error;
    }
  };
  
  // Get all time entries across all projects
  export const getTimeEntries = async (): Promise<TimeEntry[]> => {
    try {
      const uid = getCurrentUserId();
      const projectsCollection = collection(db, 'users', uid, 'projects');
      const projectsSnapshot = await getDocs(projectsCollection);
      
      // Skip metadata document
      const validProjects = projectsSnapshot.docs.filter(doc => doc.id !== '_metadata');
      
      const timeEntriesPromises = validProjects.map(async projectDoc => {
        const projectId = projectDoc.id;
        const entriesCollection = collection(db, 'users', uid, 'projects', projectId, 'timeEntries');
        const entriesSnapshot = await getDocs(entriesCollection);
        
        return entriesSnapshot.docs.map(entryDoc => {
          const entry = convertFirestoreData<TimeEntry>(entryDoc.data(), entryDoc.id);
          // Ensure projectId is included
          entry.projectId = projectId;
          return entry;
        });
      });
      
      const allTimeEntries = await Promise.all(timeEntriesPromises);
      // Flatten the array of arrays and sort by start time
      return allTimeEntries.flat().sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
    } catch (error) {
      console.error('Error getting time entries:', error);
      throw error;
    }
  };
  
  // Create a time entry for a project
  export const createTimeEntry = async (entryData: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt' | 'uid'>): Promise<TimeEntry> => {
    try {
      const uid = getCurrentUserId();
      const { projectId } = entryData;
      
      if (!projectId) {
        throw new Error('Project ID is required for time entries');
      }
      
      // Store time entry as subcollection of project
      const entriesCollection = collection(db, 'users', uid, 'projects', projectId, 'timeEntries');
      const newEntryRef = await addDoc(entriesCollection, {
        ...entryData,
        uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Format duration for log message
      const durationHours = Math.floor(entryData.durationSeconds / 3600);
      const durationMinutes = Math.floor((entryData.durationSeconds % 3600) / 60);
      const durationFormatted = `${durationHours}h ${durationMinutes}m`;
      
      // Log activity
      await addActivityLog({
        type: 'time',
        action: 'stopped',
        description: `Logged time for ${entryData.taskName || entryData.projectName} (${durationFormatted})`
      });
      
      // Update last activity timestamp on the project
      await updateDoc(doc(db, 'users', uid, 'projects', projectId), {
        lastActivity: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Get the new time entry
      const newEntrySnapshot = await getDoc(newEntryRef);
      const newEntry = convertFirestoreData<TimeEntry>(newEntrySnapshot.data()!, newEntryRef.id);
      // Ensure projectId is included
      newEntry.projectId = projectId;
      return newEntry;
    } catch (error) {
      console.error('Error creating time entry:', error);
      throw error;
    }
  };
  
  // Update a time entry
  export const updateTimeEntry = async (projectId: string, entryId: string, entryData: Partial<Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TimeEntry | undefined> => {
    try {
      const uid = getCurrentUserId();
      const entryRef = doc(db, 'users', uid, 'projects', projectId, 'timeEntries', entryId);
      
      // Check if entry exists
      const entrySnapshot = await getDoc(entryRef);
      if (!entrySnapshot.exists()) {
        return undefined;
      }
      
      const originalEntry = entrySnapshot.data();
      
      // Update time entry
      await updateDoc(entryRef, {
        ...entryData,
        updatedAt: serverTimestamp()
      });
      
      // Log activity
      await addActivityLog({
        type: 'time',
        action: 'updated',
        description: `Updated time entry for ${originalEntry.taskName || originalEntry.projectName}`
      });
      
      // Update last activity timestamp on the project
      await updateDoc(doc(db, 'users', uid, 'projects', projectId), {
        lastActivity: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Get the updated time entry
      const updatedEntrySnapshot = await getDoc(entryRef);
      const updatedEntry = convertFirestoreData<TimeEntry>(updatedEntrySnapshot.data(), entryId);
      // Ensure projectId is included
      updatedEntry.projectId = projectId;
      return updatedEntry;
    } catch (error) {
      console.error('Error updating time entry:', error);
      throw error;
    }
  };
  
  // Delete a time entry
  export const deleteTimeEntry = async (projectId: string, entryId: string): Promise<boolean> => {
    try {
      const uid = getCurrentUserId();
      const entryRef = doc(db, 'users', uid, 'projects', projectId, 'timeEntries', entryId);
      
      // Get entry details for activity log
      const entrySnapshot = await getDoc(entryRef);
      if (!entrySnapshot.exists()) {
        return false;
      }
      
      const entryData = entrySnapshot.data();
      const entryName = entryData.taskName || entryData.projectName || `Time Entry ID ${entryId}`;
      
      // Delete the time entry
      await deleteDoc(entryRef);
      
      // Log activity
      await addActivityLog({
        type: 'time',
        action: 'deleted',
        description: `Deleted time entry: ${entryName}`
      });
      
      // Update last activity timestamp on the project
      await updateDoc(doc(db, 'users', uid, 'projects', projectId), {
        lastActivity: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting time entry:', error);
      throw error;
    }
  };
  
  // --- ACTIVITY LOG ---
  
  export const getRecentActivity = async (limit: number = 5): Promise<ActivityLog[]> => {
    try {
      const uid = getCurrentUserId();
      const activityCollection = collection(db, 'users', uid, 'activityLog');
      const activityQuery = query(
        activityCollection, 
        orderBy('timestamp', 'desc'),
        limit(limit)
      );
      
      const activitySnapshot = await getDocs(activityQuery);
      
      return activitySnapshot.docs.map(logDoc => 
        convertFirestoreData<ActivityLog>(logDoc.data(), logDoc.id)
      );
    } catch (error) {
      console.error('Error getting activity logs:', error);
      throw error;
    }
  };
  
  export const addActivityLog = async (logData: Omit<ActivityLog, 'id' | 'timestamp' | 'uid'>): Promise<ActivityLog> => {
    try {
      const uid = getCurrentUserId();
      
      const activityCollection = collection(db, 'users', uid, 'activityLog');
      const newLogRef = await addDoc(activityCollection, {
        ...logData,
        uid,
        timestamp: serverTimestamp(),
      });
      
      // Get the new log entry
      const newLogSnapshot = await getDoc(newLogRef);
      return convertFirestoreData<ActivityLog>(newLogSnapshot.data()!, newLogRef.id);
    } catch (error) {
      console.error('Error adding activity log:', error);
      throw error;
    }
  };
  
  // --- CLIENT PORTAL SPECIFIC ---
  
  export const getProjectsForClient = async (clientId: string): Promise<Project[]> => {
    try {
      const uid = getCurrentUserId();
      const projectsCollection = collection(db, 'users', uid, 'projects');
      const projectsQuery = query(
        projectsCollection, 
        where('clientId', '==', clientId),
        where('status', '==', 'active')
      );
      
      const projectsSnapshot = await getDocs(projectsQuery);
      const projects: Project[] = [];
      
      for (const projectDoc of projectsSnapshot.docs) {
        const projectData = projectDoc.data();
        const projectId = projectDoc.id;
        
        // Get tasks for this project
        const tasksCollection = collection(db, 'users', uid, 'projects', projectId, 'tasks');
        const tasksSnapshot = await getDocs(tasksCollection);
        const tasks = tasksSnapshot.docs.map(taskDoc => 
          convertFirestoreData<Task>(taskDoc.data(), taskDoc.id)
        );
        
        // Convert project data
        const project = convertFirestoreData<Project>(projectData, projectId);
        project.tasks = tasks;
        
        projects.push(project);
      }
      
      return projects;
    } catch (error) {
      console.error('Error getting projects for client:', error);
      throw error;
    }
  };
  
  export const getInvoicesForClient = async (clientId: string): Promise<Invoice[]> => {
    try {
      const uid = getCurrentUserId();
      const invoicesCollection = collection(db, 'users', uid, 'invoices');
      const invoicesQuery = query(
        invoicesCollection, 
        where('clientId', '==', clientId),
        where('status', 'in', ['sent', 'paid', 'overdue'])
      );
      
      const invoicesSnapshot = await getDocs(invoicesQuery);
      
      return invoicesSnapshot.docs.map(invoiceDoc => 
        convertFirestoreData<Invoice>(invoiceDoc.data(), invoiceDoc.id)
      );
    } catch (error) {
      console.error('Error getting invoices for client:', error);
      throw error;
    }
  };
  
  // Additional helper functions
  
  export const getTasksForClient = async (clientId: string): Promise<Task[]> => {
    try {
      // First get all projects for this client
      const projects = await getProjectsForClient(clientId);
      
      // Extract all tasks from these projects
      return projects.flatMap(project => project.tasks);
    } catch (error) {
      console.error('Error getting tasks for client:', error);
      throw error;
    }
  };
  
  // --- DASHBOARD HELPER FUNCTIONS ---
  
  export const getWeeklyHoursTracked = async (): Promise<number> => {
    try {
      const uid = getCurrentUserId();
      
      // Calculate start of week (Sunday)
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Calculate end of week (Saturday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      // Get all projects to search for time entries
      const projectsCollection = collection(db, 'users', uid, 'projects');
      const projectsSnapshot = await getDocs(projectsCollection);
      
      // Skip metadata document
      const validProjects = projectsSnapshot.docs.filter(doc => doc.id !== '_metadata');
      
      let totalSeconds = 0;
      
      // For each project, get time entries within this week
      for (const projectDoc of validProjects) {
        const projectId = projectDoc.id;
        const entriesCollection = collection(db, 'users', uid, 'projects', projectId, 'timeEntries');
        
        // Query time entries for this week
        const entriesQuery = query(
          entriesCollection,
          where('startTime', '>=', startOfWeek.toISOString()),
          where('startTime', '<', endOfWeek.toISOString())
        );
        
        const entriesSnapshot = await getDocs(entriesQuery);
        
        // Calculate total hours for this project this week
        entriesSnapshot.docs.forEach(doc => {
          totalSeconds += doc.data().durationSeconds || 0;
        });
      }
      
      return totalSeconds / 3600; // Convert seconds to hours
    } catch (error) {
      console.error('Error calculating weekly hours:', error);
      throw error;
    }
  };
  
  export const getUpcomingTasks = async (limit: number = 3): Promise<Task[]> => {
    try {
      const uid = getCurrentUserId();
      const now = new Date();
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      
      // We'll need to query across all projects to find tasks with due dates
      const projects = await getProjects();
      
      // Extract all tasks, filter, sort, and limit
      const allTasks = projects.flatMap(p => p.tasks);
      
      const upcomingTasks = allTasks
        .filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return task.status !== 'done' && dueDate >= now && dueDate <= nextWeek;
        })
        .sort((a, b) => {
          // Sort by due date
          return new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime();
        })
        .slice(0, limit);
      
      return upcomingTasks;
    } catch (error) {
      console.error('Error getting upcoming tasks:', error);
      throw error;
    }
  };
  
  // --- REPORT DATA (TIME TRACKING) ---
  
  export const getTimeReport = async (filters: { fromDate?: string, toDate?: string, projectId?: string }): Promise<{ name: string, hours: number }[]> => {
    try {
      const uid = getCurrentUserId();
      
      // Get all projects or a specific project
      const projectsCollection = collection(db, 'users', uid, 'projects');
      const projectsQuery = filters.projectId 
        ? query(projectsCollection, where(documentId(), '==', filters.projectId))
        : query(projectsCollection);
      
      const projectsSnapshot = await getDocs(projectsQuery);
      
      // Skip metadata document and filter out invalid projects
      const validProjects = projectsSnapshot.docs.filter(doc => doc.id !== '_metadata');
      
      // Group by project and calculate hours
      const projectHours: Record<string, number> = {};
      
      for (const projectDoc of validProjects) {
        const projectId = projectDoc.id;
        const projectName = projectDoc.data().name || `Project ${projectId}`;
        
        // Query time entries for this project
        const entriesCollection = collection(db, 'users', uid, 'projects', projectId, 'timeEntries');
        let entriesQuery = query(entriesCollection);
        
        // Apply date filters if provided
        if (filters.fromDate) {
          entriesQuery = query(entriesQuery, where('startTime', '>=', filters.fromDate));
        }
        
        if (filters.toDate) {
          entriesQuery = query(entriesQuery, where('startTime', '<=', filters.toDate));
        }
        
        const entriesSnapshot = await getDocs(entriesQuery);
        
        // Calculate total hours for this project
        const projectTotalHours = entriesSnapshot.docs.reduce((total, doc) => {
          const data = doc.data();
          return total + (data.durationSeconds / 3600); // Convert seconds to hours
        }, 0);
        
        if (projectTotalHours > 0) {
          projectHours[projectName] = projectTotalHours;
        }
      }
      
      // Convert to array format for charts
      return Object.entries(projectHours).map(([name, hours]) => ({
        name,
        hours: Number(hours.toFixed(1)), // Round to 1 decimal place
      }));
    } catch (error) {
      console.error('Error generating time report:', error);
      throw error;
    }
  };
  
  // Check if migration is needed
  export const checkMigrationNeeded = async (): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return false;
      }
      
      const uid = user.uid;
      
      // Check if there's a legacy timeEntries collection with any documents
      const legacyCollection = collection(db, 'users', uid, 'timeEntries');
      const legacyQuery = query(legacyCollection, where('projectId', '!=', null));
      const legacySnapshot = await getDocs(legacyQuery);
      
      return !legacySnapshot.empty;
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  };
  
  // Migration function for legacy data
  export const migrateTimeEntriesToProjects = async (): Promise<{ success: boolean, migratedCount: number }> => {
    try {
      const uid = getCurrentUserId();
      
      // Check if there's a legacy timeEntries collection
      const legacyCollection = collection(db, 'users', uid, 'timeEntries');
      const legacyQuery = query(legacyCollection);
      const legacySnapshot = await getDocs(legacyQuery);
      
      if (legacySnapshot.empty) {
        console.log('No legacy time entries found, nothing to migrate');
        return { success: true, migratedCount: 0 };
      }
      
      console.log(`Found ${legacySnapshot.size} legacy time entries to migrate`);
      
      // Create a migration log
      const migrationLogRef = doc(db, 'users', uid, 'activityLog', `migration-${Date.now()}`);
      await setDoc(migrationLogRef, {
        type: 'system',
        action: 'migration',
        description: `Migrating ${legacySnapshot.size} time entries to project subcollections`,
        timestamp: serverTimestamp(),
        uid
      });
      
      // Migrate each entry to its project's timeEntries subcollection
      const migrationPromises = legacySnapshot.docs.map(async (entryDoc) => {
        const entryData = entryDoc.data() as TimeEntry;
        const entryId = entryDoc.id;
        const projectId = entryData.projectId;
        
        if (!projectId) {
          console.warn(`Time entry ${entryId} has no projectId, skipping migration`);
          return false;
        }
        
        // Create a new time entry in the project's timeEntries subcollection
        try {
          await setDoc(
            doc(db, 'users', uid, 'projects', projectId, 'timeEntries', entryId),
            {
              ...entryData,
              migratedAt: serverTimestamp()
            }
          );
          
          // Delete the old entry
          await deleteDoc(doc(db, 'users', uid, 'timeEntries', entryId));
          
          return true;
        } catch (error) {
          console.error(`Error migrating time entry ${entryId}:`, error);
          return false;
        }
      });
      
      const migrationResults = await Promise.all(migrationPromises);
      const migratedCount = migrationResults.filter(Boolean).length;
      
      // Update migration log with results
      await setDoc(migrationLogRef, {
        migrationCompleted: true,
        migratedCount,
        skippedCount: legacySnapshot.size - migratedCount,
        completedAt: serverTimestamp()
      }, { merge: true });
      
      console.log(`Migration completed: migrated ${migratedCount} of ${legacySnapshot.size} time entries`);
      
      return { success: true, migratedCount };
    } catch (error) {
      console.error('Error migrating time entries:', error);
      throw error;
    }
  };
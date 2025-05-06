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
    setDoc
  } from 'firebase/firestore';
  import { db, auth } from './firebase';
  import { Client } from './db-models';
  
  // Get current user ID or throw error
  const getCurrentUserId = (): string => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }
    return user.uid;
  };
  
  // Convert Firestore timestamp to ISO string
  const timestampToISO = (timestamp: any): string => {
    return timestamp.toDate().toISOString();
  };
  
  // Convert Firestore data to Client type
  const convertClientData = (data: any, id: string): Client => {
    const result: any = { id, ...data };
    
    // Convert timestamps to ISO strings
    if (result.createdAt) {
      result.createdAt = timestampToISO(result.createdAt);
    }
    if (result.updatedAt) {
      result.updatedAt = timestampToISO(result.updatedAt);
    }
    
    return result as Client;
  };
  
  /**
   * Get all clients for the current user
   */
  export const getClients = async (): Promise<Client[]> => {
    try {
      const uid = getCurrentUserId();
      const clientsCollection = collection(db, 'users', uid, 'clients');
      const clientsQuery = query(clientsCollection, orderBy('name', 'asc'));
      const clientsSnapshot = await getDocs(clientsQuery);
      
      return clientsSnapshot.docs.map(clientDoc => 
        convertClientData(clientDoc.data(), clientDoc.id)
      );
    } catch (error) {
      console.error('Error getting clients:', error);
      throw error;
    }
  };
  
  /**
   * Get a specific client by ID
   */
  export const getClientById = async (clientId: string): Promise<Client | null> => {
    try {
      const uid = getCurrentUserId();
      const clientDocRef = doc(db, 'users', uid, 'clients', clientId);
      const clientSnapshot = await getDoc(clientDocRef);
      
      if (!clientSnapshot.exists()) {
        return null;
      }
      
      return convertClientData(clientSnapshot.data(), clientId);
    } catch (error) {
      console.error('Error getting client:', error);
      throw error;
    }
  };
  
  /**
   * Create a new client
   */
  export const createClient = async (clientData: Omit<Client, 'id' | 'uid' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
    try {
      const uid = getCurrentUserId();
      
      // Add client to Firestore
      const clientsCollection = collection(db, 'users', uid, 'clients');
      const newClientRef = await addDoc(clientsCollection, {
        ...clientData,
        uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Get the created client
      const clientSnapshot = await getDoc(newClientRef);
      
      // Add a default portal settings document for this client
      const portalSettingsRef = doc(db, 'users', uid, 'clients', newClientRef.id, 'portalSettings', 'default');
      await setDoc(portalSettingsRef, {
        allowProjectView: true,
        allowTaskApproval: true,
        allowInvoiceView: true,
        allowInvoicePayment: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Add activity log
      const activityLogCollection = collection(db, 'users', uid, 'activityLog');
      await addDoc(activityLogCollection, {
        type: 'client',
        action: 'created',
        description: `Created Client: ${clientData.name}`,
        timestamp: serverTimestamp(),
        uid
      });
      
      return convertClientData(clientSnapshot.data(), newClientRef.id);
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  };
  
  /**
   * Update an existing client
   */
  export const updateClient = async (clientId: string, clientData: Partial<Omit<Client, 'id' | 'uid' | 'createdAt' | 'updatedAt'>>): Promise<Client> => {
    try {
      const uid = getCurrentUserId();
      const clientRef = doc(db, 'users', uid, 'clients', clientId);
      
      // Check if client exists
      const clientSnapshot = await getDoc(clientRef);
      if (!clientSnapshot.exists()) {
        throw new Error('Client not found');
      }
      
      // Update client
      await updateDoc(clientRef, {
        ...clientData,
        updatedAt: serverTimestamp()
      });
      
      // Get updated client
      const updatedClientSnapshot = await getDoc(clientRef);
      
      // Add activity log
      const activityLogCollection = collection(db, 'users', uid, 'activityLog');
      await addDoc(activityLogCollection, {
        type: 'client',
        action: 'updated',
        description: `Updated Client: ${clientData.name || clientSnapshot.data().name}`,
        timestamp: serverTimestamp(),
        uid
      });
      
      return convertClientData(updatedClientSnapshot.data(), clientId);
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  };
  
  /**
   * Delete a client
   */
  export const deleteClient = async (clientId: string): Promise<boolean> => {
    try {
      const uid = getCurrentUserId();
      const clientRef = doc(db, 'users', uid, 'clients', clientId);
      
      // Get client data for logging
      const clientSnapshot = await getDoc(clientRef);
      if (!clientSnapshot.exists()) {
        return false;
      }
      
      const clientName = clientSnapshot.data().name;
      
      // Delete the client's portal settings subcollection
      const portalSettingsRef = doc(db, 'users', uid, 'clients', clientId, 'portalSettings', 'default');
      await deleteDoc(portalSettingsRef);
      
      // Delete the client document
      await deleteDoc(clientRef);
      
      // Add activity log
      const activityLogCollection = collection(db, 'users', uid, 'activityLog');
      await addDoc(activityLogCollection, {
        type: 'client',
        action: 'deleted',
        description: `Deleted Client: ${clientName}`,
        timestamp: serverTimestamp(),
        uid
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  };
  
  /**
   * Get client portal settings
   */
  export const getClientPortalSettings = async (clientId: string): Promise<any> => {
    try {
      const uid = getCurrentUserId();
      const settingsRef = doc(db, 'users', uid, 'clients', clientId, 'portalSettings', 'default');
      const settingsSnapshot = await getDoc(settingsRef);
      
      if (!settingsSnapshot.exists()) {
        // Return default settings if none exist
        return {
          allowProjectView: true,
          allowTaskApproval: true,
          allowInvoiceView: true,
          allowInvoicePayment: true
        };
      }
      
      return settingsSnapshot.data();
    } catch (error) {
      console.error('Error getting client portal settings:', error);
      throw error;
    }
  };
  
  /**
   * Update client portal settings
   */
  export const updateClientPortalSettings = async (clientId: string, settings: any): Promise<boolean> => {
    try {
      const uid = getCurrentUserId();
      const settingsRef = doc(db, 'users', uid, 'clients', clientId, 'portalSettings', 'default');
      
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Add activity log
      const activityLogCollection = collection(db, 'users', uid, 'activityLog');
      await addDoc(activityLogCollection, {
        type: 'client',
        action: 'updated',
        description: `Updated Client Portal Settings`,
        timestamp: serverTimestamp(),
        uid
      });
      
      return true;
    } catch (error) {
      console.error('Error updating client portal settings:', error);
      throw error;
    }
  };
  
  /**
   * Generate client portal access link
   * Note: In a real implementation, this would create a secure token
   */
  export const generateClientPortalLink = async (clientId: string): Promise<string> => {
    try {
      const uid = getCurrentUserId();
      
      // Check if client exists
      const clientRef = doc(db, 'users', uid, 'clients', clientId);
      const clientSnapshot = await getDoc(clientRef);
      
      if (!clientSnapshot.exists()) {
        throw new Error('Client not found');
      }
      
      // In a real implementation, you would:
      // 1. Generate a secure token with expiry
      // 2. Store the token in Firestore
      // 3. Create a signed URL with the token
      
      // For now, we'll return a placeholder URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
      return `${baseUrl}/client-portal?clientId=${clientId}&uid=${uid}`;
    } catch (error) {
      console.error('Error generating client portal link:', error);
      throw error;
    }
  };
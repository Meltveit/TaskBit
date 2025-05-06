// src/lib/migration.ts

import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db, auth } from './firebase';
import type { TimeEntry } from './db-models';

export const migrateTimeEntriesToProjects = async (): Promise<{ success: boolean, migratedCount: number }> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be logged in to migrate data');
    }
    
    const uid = user.uid;
    
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

// Add a function to check if migration is needed
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

// Call this function when user logs in to check and run migration if needed
export const runMigrationsIfNeeded = async (): Promise<void> => {
  try {
    const migrationNeeded = await checkMigrationNeeded();
    
    if (migrationNeeded) {
      console.log('Migration needed, running migration...');
      const { success, migratedCount } = await migrateTimeEntriesToProjects();
      console.log(`Migration ${success ? 'completed' : 'failed'}: migrated ${migratedCount} time entries`);
    } else {
      console.log('No migration needed');
    }
  } catch (error) {
    console.error('Error running migrations:', error);
  }
};
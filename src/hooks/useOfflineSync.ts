import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, TABLES } from '@/lib/supabase';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import {
  addToQueue,
  getQueuedOperations,
  updateQueuedOperation,
  removeFromQueue,
  getSyncStatus,
  updateSyncStatus,
  QueuedOperation
} from '@/lib/indexedDB';
import { EventItem } from '@/lib/types';
import { toast } from 'react-hot-toast';

export function useOfflineSync() {
  const { isOnline, setIsSyncing, setLastSyncTime, refreshEventsCache } = useNetworkStatus();
  const [queueLength, setQueueLength] = useState(0);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Use refs to prevent race conditions
  const isSyncingRef = useRef(false);
  const processingQueueRef = useRef(false);

  // Update queue length when operations are added/removed
  const updateQueueLength = async () => {
    const operations = await getQueuedOperations();
    setQueueLength(operations.length);
  };

  // Process queued operations when coming back online
  const processQueue = useCallback(async () => {
    // Prevent multiple simultaneous sync operations
    if (!isOnline || isSyncingRef.current || processingQueueRef.current) return;

    processingQueueRef.current = true;
    isSyncingRef.current = true;
    setIsProcessingQueue(true);
    setIsSyncing(true);
    setSyncError(null);

    try {
      const pendingOperations = await getQueuedOperations('pending');

      if (pendingOperations.length === 0) {
        processingQueueRef.current = false;
        isSyncingRef.current = false;
        setIsProcessingQueue(false);
        setIsSyncing(false);
        return;
      }

      toast.success(`Processing ${pendingOperations.length} offline operations...`);

      for (const operation of pendingOperations) {
        try {
          await updateQueuedOperation(operation.id!, { status: 'processing' });

          await processOperation(operation);

          await updateQueuedOperation(operation.id!, { status: 'completed' });
          await removeFromQueue(operation.id!);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Failed to process operation:', operation?.id || 'unknown', errorMessage);

          // Non-recoverable errors - fail immediately and remove from queue
          const isNonRecoverable = errorMessage.includes('infinite recursion') ||
            errorMessage.includes('permission denied') ||
            errorMessage.includes('violates row-level security');

          if (isNonRecoverable) {
            console.warn('Non-recoverable error, removing from queue:', errorMessage);
            await removeFromQueue(operation.id!);
          } else {
            const retryCount = (operation.retryCount || 0) + 1;
            if (retryCount < 3) {
              await updateQueuedOperation(operation.id!, {
                status: 'pending',
                retryCount,
                error: errorMessage
              });
            } else {
              await updateQueuedOperation(operation.id!, {
                status: 'failed',
                error: errorMessage
              });
            }
          }
        }
      }

      const remainingFailed = await getQueuedOperations('failed');
      if (remainingFailed.length > 0) {
        setSyncError(`${remainingFailed.length} operations failed to sync`);
        toast.error(`${remainingFailed.length} operations failed to sync`);
      } else {
        toast.success('All offline operations synced successfully!');
        setLastSyncTime(new Date());
      }

      await updateQueueLength();

    } catch (error) {
      console.error('Queue processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      setSyncError(errorMessage);
      toast.error('Failed to sync offline operations');
    } finally {
      processingQueueRef.current = false;
      isSyncingRef.current = false;
      setIsProcessingQueue(false);
      setIsSyncing(false);
    }
  }, [isOnline, setIsSyncing, setLastSyncTime]);

  // Process a single operation
  const processOperation = async (operation: QueuedOperation) => {
    const { operation: opType, table, data } = operation;

    const throwSupabaseError = (error: any) => {
      const message = error?.message || error?.details || error?.hint || JSON.stringify(error) || 'Unknown database error';
      throw new Error(`${opType} on ${table} failed: ${message}`);
    };

    switch (opType) {
      case 'create':
        if (table === TABLES.EVENTS || table === TABLES.USERS) {
          const { error } = await supabase
            .from(table)
            .insert(data);
          if (error) throwSupabaseError(error);
        }
        break;

      case 'update':
        if (table === TABLES.EVENTS || table === TABLES.USERS) {
          const { error } = await supabase
            .from(table)
            .update(data)
            .eq('id', data.id);
          if (error) throwSupabaseError(error);
        }
        break;

      case 'delete':
        if (table === TABLES.EVENTS || table === TABLES.USERS) {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', data.id);
          if (error) throwSupabaseError(error);
        }
        break;

      default:
        throw new Error(`Unknown operation type: ${opType}`);
    }
  };

  // Queue an operation for offline processing
  const queueOperation = async (
    operation: 'create' | 'update' | 'delete',
    table: string,
    data: any
  ): Promise<void> => {
    if (isOnline) {
      // If online, process immediately
      try {
        await processOperation({ operation, table, data } as QueuedOperation);
        toast.success('Operation completed successfully');
      } catch (error) {
        console.error('Immediate operation failed:', error);
        // Fall back to queuing
        await addToQueue({ operation, table, data });
        await updateQueueLength();
        toast.error('Operation queued for later sync');
      }
    } else {
      // Queue for later
      await addToQueue({ operation, table, data });
      await updateQueueLength();
      toast.success('Operation queued for offline sync');
    }
  };

  // Manual sync trigger
  const syncNow = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    await processQueue();
  };

  // Initialize: update queue length and clean up stale failed operations
  useEffect(() => {
    const init = async () => {
      // Remove any stuck failed operations from previous sessions
      try {
        const failedOps = await getQueuedOperations('failed');
        for (const op of failedOps) {
          if (op.id) await removeFromQueue(op.id);
        }
      } catch (e) {
        console.warn('Failed to clean up stale queue operations:', e);
      }
      await updateQueueLength();
    };
    init();
  }, []);

  // Process queue when coming back online (if auto sync is enabled)
  useEffect(() => {
    if (isOnline && !isSyncingRef.current) {
      // Check auto sync preference
      const autoSyncEnabled = localStorage.getItem('autoSync') !== 'false';

      if (autoSyncEnabled) {
        // Small delay to ensure connection is stable
        const timeoutId = setTimeout(() => {
          processQueue();
        }, 2000);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [isOnline, processQueue]);

  return {
    queueLength,
    isProcessingQueue,
    queueOperation,
    syncNow,
    updateQueueLength
  };
}

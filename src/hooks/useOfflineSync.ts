import { useState, useEffect } from 'react';
import { supabase, TABLES } from '@/lib/supabase';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import {
  addToQueue,
  getQueuedOperations,
  updateQueuedOperation,
  removeFromQueue,
  QueuedOperation
} from '@/lib/indexedDB';
import { EventItem } from '@/lib/types';
import { toast } from 'react-hot-toast';

export function useOfflineSync() {
  const { isOnline, isSyncing, setIsSyncing } = useNetworkStatus();
  const [queueLength, setQueueLength] = useState(0);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Update queue length when operations are added/removed
  const updateQueueLength = async () => {
    const operations = await getQueuedOperations();
    setQueueLength(operations.length);
  };

  // Process queued operations when coming back online
  const processQueue = async () => {
    if (!isOnline || isSyncing || isProcessingQueue) return;

    setIsProcessingQueue(true);
    setIsSyncing(true);

    try {
      const pendingOperations = await getQueuedOperations('pending');

      if (pendingOperations.length === 0) {
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
          console.error('Failed to process operation:', operation, error);

          const retryCount = (operation.retryCount || 0) + 1;
          if (retryCount < 3) {
            await updateQueuedOperation(operation.id!, {
              status: 'pending',
              retryCount,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          } else {
            await updateQueuedOperation(operation.id!, {
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }

      const remainingFailed = await getQueuedOperations('failed');
      if (remainingFailed.length > 0) {
        toast.error(`${remainingFailed.length} operations failed to sync`);
      } else {
        toast.success('All offline operations synced successfully!');
      }

      await updateQueueLength();

    } catch (error) {
      console.error('Queue processing error:', error);
      toast.error('Failed to sync offline operations');
    } finally {
      setIsProcessingQueue(false);
      setIsSyncing(false);
    }
  };

  // Process a single operation
  const processOperation = async (operation: QueuedOperation) => {
    const { operation: opType, table, data } = operation;

    switch (opType) {
      case 'create':
        if (table === TABLES.EVENTS || table === TABLES.USERS) {
          const { error } = await supabase
            .from(table)
            .insert(data);
          if (error) throw error;
        }
        break;

      case 'update':
        if (table === TABLES.EVENTS || table === TABLES.USERS) {
          const { error } = await supabase
            .from(table)
            .upsert(data);
          if (error) throw error;
        }
        break;

      case 'delete':
        if (table === TABLES.EVENTS || table === TABLES.USERS) {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', data.id);
          if (error) throw error;
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

  // Initialize queue length
  useEffect(() => {
    updateQueueLength();
  }, []);

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline && !isSyncing) {
      // Small delay to ensure connection is stable
      const timeoutId = setTimeout(() => {
        processQueue();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [isOnline, isSyncing]);

  return {
    queueLength,
    isProcessingQueue,
    queueOperation,
    syncNow,
    updateQueueLength
  };
}

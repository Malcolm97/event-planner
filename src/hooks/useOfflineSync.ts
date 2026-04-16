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
import { toast } from 'react-hot-toast';

type RefreshTarget = 'events' | 'users' | 'saved-events' | 'all';

interface QueueOperationOptions {
  refreshTargets?: RefreshTarget[];
  successMessage?: string;
  queuedMessage?: string;
  fallbackQueuedMessage?: string;
  suppressSuccessToast?: boolean;
}

type QueueOperationResult = 'completed' | 'queued';

const OFFLINE_QUEUE_UPDATED_EVENT = 'offline-queue-updated';

function devWarn(...args: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args);
  }
}

function devError(...args: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  }
}

export function useOfflineSync() {
  const { isOnline, setIsSyncing, setLastSyncTime, setSyncError, refreshEventsCache, syncError } = useNetworkStatus();
  const [queueLength, setQueueLength] = useState(0);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [failedOperationsCount, setFailedOperationsCount] = useState(0);

  // Use refs to prevent race conditions
  const isSyncingRef = useRef(false);
  const processingQueueRef = useRef(false);

  // Update queue length when operations are added/removed
  const updateQueueLength = async () => {
    const operations = await getQueuedOperations();
    setQueueLength(operations.length);

    const failedOperations = operations.filter((operation) => operation.status === 'failed');
    setFailedOperationsCount(failedOperations.length);
  };

  const broadcastQueueUpdated = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OFFLINE_QUEUE_UPDATED_EVENT));
    }
  }, []);

  const emitRefreshTargets = useCallback((targets: RefreshTarget[]) => {
    if (typeof window === 'undefined') {
      return;
    }

    const uniqueTargets = Array.from(new Set(targets));
    uniqueTargets.forEach((target) => {
      window.dispatchEvent(new CustomEvent('cache-refreshed', { detail: { type: target } }));
    });
  }, []);

  const refreshAffectedData = useCallback(async (targets: RefreshTarget[]) => {
    const uniqueTargets = Array.from(new Set(targets));

    if (uniqueTargets.includes('all') || uniqueTargets.includes('events')) {
      try {
        await refreshEventsCache();
      } catch (error) {
        devWarn('Failed to refresh events cache after sync:', error);
      }
    }

    emitRefreshTargets(uniqueTargets);
  }, [emitRefreshTargets, refreshEventsCache]);

  const getDefaultRefreshTargets = useCallback((table: string): RefreshTarget[] => {
    switch (table) {
      case TABLES.EVENTS:
        return ['events'];
      case TABLES.USERS:
        return ['users'];
      case TABLES.SAVED_EVENTS:
        return ['saved-events'];
      default:
        return [];
    }
  }, []);

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
      const [pendingOperations, failedOperations] = await Promise.all([
        getQueuedOperations('pending'),
        getQueuedOperations('failed')
      ]);
      const retryableOperations = [...pendingOperations, ...failedOperations]
        .sort((left, right) => left.timestamp - right.timestamp);

      if (retryableOperations.length === 0) {
        processingQueueRef.current = false;
        isSyncingRef.current = false;
        setIsProcessingQueue(false);
        setIsSyncing(false);
        await updateSyncStatus({
          lastSync: Date.now(),
          inProgress: false,
          error: undefined,
        });
        return;
      }

      await updateSyncStatus({
        lastSync: Date.now(),
        inProgress: true,
        error: undefined,
      });

      toast.success(`Processing ${retryableOperations.length} offline operations...`);

      const touchedTargets = new Set<RefreshTarget>();

      for (const operation of retryableOperations) {
        try {
          await updateQueuedOperation(operation.id!, { status: 'processing' });

          await processOperation(operation);

          const refreshTargets = operation.refreshTargets?.length
            ? operation.refreshTargets as RefreshTarget[]
            : getDefaultRefreshTargets(operation.table);
          refreshTargets.forEach((target) => touchedTargets.add(target));

          await updateQueuedOperation(operation.id!, { status: 'completed' });
          await removeFromQueue(operation.id!);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          devError('Failed to process operation:', operation?.id || 'unknown', errorMessage);

          // Non-recoverable errors - fail immediately and remove from queue
          const isNonRecoverable = errorMessage.includes('infinite recursion') ||
            errorMessage.includes('permission denied') ||
            errorMessage.includes('violates row-level security');

          if (isNonRecoverable) {
            devWarn('Non-recoverable error, removing from queue:', errorMessage);
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

      if (touchedTargets.size > 0) {
        await refreshAffectedData(Array.from(touchedTargets));
      }

      const remainingFailed = await getQueuedOperations('failed');
      if (remainingFailed.length > 0) {
        setSyncError(`${remainingFailed.length} operations failed to sync`);
        toast.error(`${remainingFailed.length} operations failed to sync`);
        await updateSyncStatus({
          lastSync: Date.now(),
          inProgress: false,
          error: `${remainingFailed.length} operations failed to sync`,
        });
      } else {
        toast.success('All offline operations synced successfully!');
        setLastSyncTime(new Date());
        await updateSyncStatus({
          lastSync: Date.now(),
          inProgress: false,
          error: undefined,
        });
      }

      await updateQueueLength();
      broadcastQueueUpdated();

    } catch (error) {
      devError('Queue processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      setSyncError(errorMessage);
      toast.error('Failed to sync offline operations');
      await updateSyncStatus({
        lastSync: Date.now(),
        inProgress: false,
        error: errorMessage,
      });
    } finally {
      processingQueueRef.current = false;
      isSyncingRef.current = false;
      setIsProcessingQueue(false);
      setIsSyncing(false);
    }
  }, [broadcastQueueUpdated, getDefaultRefreshTargets, isOnline, refreshAffectedData, setIsSyncing, setLastSyncTime, setSyncError]);

  // Process a single operation
  const processOperation = async (operation: QueuedOperation) => {
    const { operation: opType, table, data } = operation;

    const throwSupabaseError = (error: unknown) => {
      const message =
        (error as { message?: string })?.message ||
        (error as { details?: string })?.details ||
        (error as { hint?: string })?.hint ||
        JSON.stringify(error) ||
        'Unknown database error';
      throw new Error(`${opType} on ${table} failed: ${message}`);
    };

    switch (opType) {
      case 'create':
        if (table === TABLES.EVENTS || table === TABLES.USERS) {
          const { error } = await supabase
            .from(table)
            .insert(data);
          if (error) throwSupabaseError(error);
        } else if (table === TABLES.SAVED_EVENTS) {
          const { error } = await supabase
            .from(table)
            .upsert(data, { onConflict: 'user_id,event_id' });
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
        if (table === TABLES.EVENTS) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token || typeof data.id !== 'string') {
            throw new Error('Delete on events failed: authentication session expired');
          }

          const response = await fetch(`/api/events/${data.id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (!response.ok) {
            const responseData = await response.json().catch(() => null);
            throw new Error(
              responseData?.userMessage ||
              responseData?.error ||
              `Delete on ${table} failed: HTTP ${response.status}`
            );
          }
        } else if (table === TABLES.USERS) {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', data.id);
          if (error) throwSupabaseError(error);
        } else if (table === TABLES.SAVED_EVENTS) {
          const { error } = await supabase
            .from(table)
            .delete()
            .match({
              user_id: data.user_id,
              event_id: data.event_id,
            });
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
    data: Record<string, unknown>,
    options: QueueOperationOptions = {}
  ): Promise<QueueOperationResult> => {
    const refreshTargets = options.refreshTargets?.length
      ? options.refreshTargets
      : getDefaultRefreshTargets(table);

    if (isOnline) {
      // If online, process immediately
      try {
        await processOperation({ operation, table, data, refreshTargets } as QueuedOperation);
        await refreshAffectedData(refreshTargets);

        if (!options.suppressSuccessToast) {
          toast.success(options.successMessage || 'Operation completed successfully');
        }

        await updateQueueLength();
        broadcastQueueUpdated();
        return 'completed';
      } catch (error) {
        devError('Immediate operation failed:', error);
        // Fall back to queuing
        await addToQueue({ operation, table, data, refreshTargets });
        await updateQueueLength();

        if (!options.suppressSuccessToast) {
          toast.error(options.fallbackQueuedMessage || 'Operation queued for later sync');
        }

        broadcastQueueUpdated();
        return 'queued';
      }
    } else {
      // Queue for later
      await addToQueue({ operation, table, data, refreshTargets });
      await updateQueueLength();

      if (!options.suppressSuccessToast) {
        toast.success(options.queuedMessage || 'Operation queued for offline sync');
      }

      broadcastQueueUpdated();
      return 'queued';
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
      try {
        const stuckOperations = await getQueuedOperations('processing');
        for (const operation of stuckOperations) {
          if (operation.id) {
            await updateQueuedOperation(operation.id, { status: 'pending' });
          }
        }
      } catch (e) {
        devWarn('Failed to recover stale queue operations:', e);
      }
      await updateQueueLength();
    };
    init();
  }, []);

  useEffect(() => {
    const handleQueueUpdated = () => {
      updateQueueLength().catch((error) => {
        devWarn('Failed to refresh queue state after broadcast:', error);
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(OFFLINE_QUEUE_UPDATED_EVENT, handleQueueUpdated);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(OFFLINE_QUEUE_UPDATED_EVENT, handleQueueUpdated);
      }
    };
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
    failedOperationsCount,
    isProcessingQueue,
    syncError,
    queueOperation,
    syncNow,
    updateQueueLength
  };
}

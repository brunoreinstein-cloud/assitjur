import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number; // milliseconds, null for persistent
  createdAt: Date;
  read: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  clearRead: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNotification: Notification = {
          ...notification,
          id,
          createdAt: new Date(),
          read: false,
          duration: notification.duration ?? 5000 // Default 5 seconds
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }));

        // Auto-remove after duration (if not persistent)
        if (newNotification.duration) {
          setTimeout(() => {
            get().removeNotification(id);
          }, newNotification.duration);
        }

        return id;
      },

      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          const wasUnread = notification && !notification.read;
          
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount
          };
        });
      },

      markAsRead: (id) => {
        set((state) => {
          const notifications = state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          );
          const unreadCount = notifications.filter(n => !n.read).length;
          
          return { notifications, unreadCount };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0
        }));
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      clearRead: () => {
        set((state) => ({
          notifications: state.notifications.filter(n => !n.read),
          unreadCount: state.unreadCount // Unchanged since we're only removing read ones
        }));
      }
    }),
    {
      name: 'assistjur-notifications',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50) // Keep only last 50
      })
    }
  )
);

// Utility functions for common notification types
export const useNotifications = () => {
  const { addNotification, ...rest } = useNotificationStore();

  return {
    ...rest,
    success: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'success', title, message, ...options }),
    
    error: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'error', title, message, duration: undefined, ...options }),
    
    warning: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'warning', title, message, ...options }),
    
    info: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'info', title, message, ...options }),
    
    addNotification
  };
};
import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  type: 'order' | 'promo' | 'system';
}

interface NotificationStore {
  items: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'date' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  items: [],
  addNotification: (item) => set((state) => {
    const newItem: NotificationItem = {
      ...item,
      id: Math.random().toString(36).substring(7),
      date: new Date(),
      read: false,
    };
    return { items: [newItem, ...state.items] };
  }),
  markAsRead: (id) => set((state) => ({
    items: state.items.map(item => item.id === id ? { ...item, read: true } : item)
  })),
  markAllAsRead: () => set((state) => ({
    items: state.items.map(item => ({ ...item, read: true }))
  })),
  clearNotifications: () => set({ items: [] }),
  unreadCount: () => get().items.filter(i => !i.read).length
}));


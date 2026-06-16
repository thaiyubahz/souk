/**
 * Notifications Page
 * Mirrors Flutter's notifications_page.dart
 * Real-time notification list with filter, swipe-to-delete, mark as read
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellSlash,
  Checks,
  CaretLeft,
  Megaphone,
  ArrowsClockwise,
  GearSix,
  Trash,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { useNotificationStore } from '../stores/notification.store';
import {
  NOTIFICATION_TYPE_CONFIG,
  formatRelativeTime,
  type NotificationItem,
  type NotificationType,
} from '../types/notification.types';

const ICON_MAP: Record<string, Icon> = {
  Settings: GearSix,
  RefreshCw: ArrowsClockwise,
  Megaphone,
  Bell,
};

const FILTER_OPTIONS: Array<{ value: NotificationType | null; label: string }> = [
  { value: null, label: 'All' },
  { value: 'general', label: 'General' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'update', label: 'Updates' },
  { value: 'system', label: 'System' },
];

export function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    selectedFilter,
    isLoading,
    error,
    initialize,
    dispose,
    setFilter,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    initialize();
    return () => dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialize/dispose are stable zustand actions; subscribe once on mount
  }, []);

  return (
    <div className="h-dvh bg-transparent flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-[#F5E8C7]/[0.08] transition-colors"
            >
              <CaretLeft size={20} className="text-[#F5E8C7]" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#F5E8C7]">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-[#8A8270] text-xs">{unreadCount} unread</p>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5E8C7]/[0.04] hover:bg-[#F5E8C7]/[0.08] text-[#C9C0A8] hover:text-[#F5E8C7] text-sm transition-colors"
            >
              <Checks size={16} />
              <span>Read all</span>
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value ?? 'all'}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedFilter === opt.value
                  ? 'bg-[#D4A853]/20 text-[#D4A853] border border-[#D4A853]/30'
                  : 'bg-[#F5E8C7]/[0.04] text-[#8A8270] border border-[#F5E8C7]/10 hover:bg-[#F5E8C7]/[0.08]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <NotificationList
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
          />
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3 pt-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-[#F5E8C7]/[0.04] animate-pulse" />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <BellSlash size={48} className="text-red-400/60 mb-4" />
      <p className="text-red-400 text-sm">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Bell size={64} className="text-[#4A4639] mb-4" />
      <h3 className="text-lg font-semibold text-[#C9C0A8] mb-2">No notifications yet</h3>
      <p className="text-[#8A8270] text-sm">You'll see your notifications here</p>
    </div>
  );
}

function NotificationList({
  notifications,
  onMarkAsRead,
  onDelete,
}: {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 pt-2">
      <AnimatePresence>
        {notifications.map((n) => (
          <NotificationTile
            key={n.id}
            notification={n}
            onMarkAsRead={() => onMarkAsRead(n.id)}
            onDelete={() => onDelete(n.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function NotificationTile({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: NotificationItem;
  onMarkAsRead: () => void;
  onDelete: () => void;
}) {
  const config = NOTIFICATION_TYPE_CONFIG[notification.type];
  const IconComponent = ICON_MAP[config.icon] ?? Bell;
  const startX = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const diff = startX.current - e.clientX;
    if (diff > 100) {
      onDelete();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -200, transition: { duration: 0.2 } }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={onMarkAsRead}
      className="relative flex items-start gap-3 p-3 rounded-xl bg-[#F5E8C7]/[0.04] border border-[#F5E8C7]/10 hover:bg-[#F5E8C7]/[0.04] cursor-pointer transition-colors group"
    >
      {/* Icon */}
      <div className={`mt-0.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.bgColor}`}>
        <IconComponent size={20} className={config.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-[#F5E8C7] truncate">{notification.title}</h4>
          <span className="text-[11px] text-[#8A8270] whitespace-nowrap shrink-0">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
        <p className="text-xs text-[#8A8270] mt-0.5 line-clamp-2">{notification.body}</p>
      </div>

      {/* Delete button (visible on hover) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
      >
        <Trash size={14} className="text-red-400" />
      </button>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-3 left-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
      )}
    </motion.div>
  );
}

export default NotificationsPage;

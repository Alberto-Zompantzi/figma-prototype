import { notificationTypeLabel } from '../utils/labels';
import type { Notification } from '../types';

interface Props {
  notification: Notification;
}

export function NotificationCard({ notification }: Props) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-[rgba(255,107,53,0.35)] bg-[#FFFBF7] shadow-none">
      <div className="border-b border-[rgba(255,107,53,0.2)] px-5 py-3">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D85A00" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <h2 className="font-jakarta text-sm font-medium leading-[22px] text-[#D85A00]">
            Notificación generada
          </h2>
        </div>
      </div>
      <div className="space-y-2 px-5 py-4">
        {notification.type && (
          <p className="font-jakarta text-[13px] font-medium leading-5 text-[#D85A00]">
            {notificationTypeLabel(notification.type)}
          </p>
        )}
        {notification.message && (
          <p className="font-jakarta text-[13px] font-normal leading-5 text-[#1A1A1A]">
            {notification.message}
          </p>
        )}
      </div>
    </div>
  );
}

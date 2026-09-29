import { Bell, CheckCheck, Clock3, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { View } from "../../app/types";
import type { Profile } from "../../lib/types";
import { formatDate } from "../../lib/format";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  target: View;
  createdAt?: string;
  tone?: "blue" | "orange" | "green";
};

type NotificationBellProps = {
  profile: Profile;
  notifications: AppNotification[];
  onNavigate: (view: View) => void;
};

const readStorageKey = (profileId: string) => `iraq-jobs-read-notifications:${profileId}`;

function NotificationIcon({ tone = "blue" }: { tone?: AppNotification["tone"] }) {
  if (tone === "orange") return <Clock3 size={15} />;
  if (tone === "green") return <CheckCheck size={15} />;
  return <FileText size={15} />;
}

export function NotificationBell({ profile, notifications, onNavigate }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);

  useEffect(() => {
    setOpen(false);
    try {
      const stored = window.localStorage.getItem(readStorageKey(profile.id));
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      setReadIds(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
    } catch {
      setReadIds([]);
    }
  }, [profile.id]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !readIds.includes(notification.id)).length,
    [notifications, readIds],
  );

  const persistReadIds = (nextIds: string[]) => {
    setReadIds(nextIds);
    try {
      window.localStorage.setItem(readStorageKey(profile.id), JSON.stringify(nextIds));
    } catch {
      // Notifications still work for the current session if storage is unavailable.
    }
  };

  const markAsRead = (notificationId: string) => {
    if (readIds.includes(notificationId)) return;
    persistReadIds([...readIds, notificationId]);
  };

  const markAllAsRead = () => {
    persistReadIds(Array.from(new Set([...readIds, ...notifications.map((notification) => notification.id)])));
  };

  return (
    <div className="notification-center">
      <button
        type="button"
        className={`notification-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-label={`الإشعارات${unreadCount ? `، ${unreadCount} غير مقروءة` : ""}`}
        aria-expanded={open}
      >
        <span className="notification-trigger-icon">
          <Bell size={17} />
          {unreadCount > 0 && <em>{unreadCount > 99 ? "99+" : unreadCount}</em>}
        </span>
        <b>الإشعارات</b>
      </button>

      {open && (
        <div className="notification-panel" role="dialog" aria-label="الإشعارات">
          <div className="notification-panel-heading">
            <div>
              <b>الإشعارات</b>
              <small>{unreadCount ? `${unreadCount} غير مقروءة` : "لا توجد إشعارات جديدة"}</small>
            </div>
            {unreadCount > 0 && (
              <button type="button" className="notification-mark-all" onClick={markAllAsRead}>
                <CheckCheck size={14} /> تحديد الكل كمقروء
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length ? notifications.map((notification) => {
              const unread = !readIds.includes(notification.id);
              return (
                <button
                  type="button"
                  className={`notification-item ${unread ? "unread" : ""}`}
                  key={notification.id}
                  onClick={() => {
                    markAsRead(notification.id);
                    setOpen(false);
                    onNavigate(notification.target);
                  }}
                >
                  <span className={`notification-item-icon ${notification.tone || "blue"}`}>
                    <NotificationIcon tone={notification.tone} />
                  </span>
                  <span className="notification-item-copy">
                    <b>{notification.title}</b>
                    <small>{notification.body}</small>
                    {notification.createdAt && <time>{formatDate(notification.createdAt)}</time>}
                  </span>
                  {unread && <i aria-label="غير مقروءة" />}
                </button>
              );
            }) : (
              <div className="notification-empty">
                <span><Bell size={19} /></span>
                <b>لا توجد إشعارات حاليًا</b>
                <small>ستظهر هنا آخر التحديثات الخاصة بحسابك.</small>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
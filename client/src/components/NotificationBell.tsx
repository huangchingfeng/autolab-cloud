import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Bell, Info, AlertTriangle, CheckCircle, XCircle, Check } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { toast } from "sonner";

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const { data: unreadData, refetch: refetchUnread } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: notifications, refetch: refetchNotifications } = trpc.notifications.getUserNotifications.useQuery(
    { limit: 5, offset: 0 },
    { enabled: isAuthenticated && isOpen }
  );

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetchUnread();
      refetchNotifications();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success("已標記所有通知為已讀");
      refetchUnread();
      refetchNotifications();
    },
  });

  const handleMarkAsRead = (notificationId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markAsReadMutation.mutate({ notificationId });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const unreadCount = unreadData?.count || 0;

  // 不顯示給未登入用戶
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">通知</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              全部標為已讀
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>目前沒有通知</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    !notification.isRead ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                  }`}
                >
                  {notification.link ? (
                    <Link href={notification.link}>
                      <a className="block">
                        <NotificationContent
                          notification={notification}
                          getTypeIcon={getTypeIcon}
                          onMarkAsRead={handleMarkAsRead}
                        />
                      </a>
                    </Link>
                  ) : (
                    <NotificationContent
                      notification={notification}
                      getTypeIcon={getTypeIcon}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface NotificationContentProps {
  notification: any;
  getTypeIcon: (type: string) => React.ReactElement;
  onMarkAsRead: (id: number, e: React.MouseEvent) => void;
}

function NotificationContent({ notification, getTypeIcon, onMarkAsRead }: NotificationContentProps) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 mt-1">
        {getTypeIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm leading-tight">{notification.title}</h4>
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={(e) => onMarkAsRead(notification.id, e)}
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {notification.content}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {format(new Date(notification.createdAt), "yyyy/MM/dd HH:mm", {
            locale: zhTW,
          })}
        </p>
      </div>
    </div>
  );
}

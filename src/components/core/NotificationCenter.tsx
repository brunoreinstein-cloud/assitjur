import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
} from "lucide-react";
import { useNotifications, Notification } from "@/stores/useNotificationStore";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const notificationIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const notificationColors = {
  success: "text-green-600 bg-green-50 border-green-200",
  error: "text-red-600 bg-red-50 border-red-200",
  warning: "text-amber-600 bg-amber-50 border-amber-200",
  info: "text-blue-600 bg-blue-50 border-blue-200",
};

function NotificationItem({ notification }: { notification: Notification }) {
  const { markAsRead, removeNotification } = useNotifications();
  const Icon = notificationIcons[notification.type];

  return (
    <Card
      className={`mb-3 transition-all ${
        !notification.read ? "border-l-4 border-l-primary bg-primary/5" : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-1 rounded-full ${notificationColors[notification.type]}`}
          >
            <Icon className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4
                className={`text-sm font-medium ${!notification.read ? "font-semibold" : ""}`}
              >
                {notification.title}
              </h4>
              <div className="flex items-center gap-1">
                {!notification.read && (
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => removeNotification(notification.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {notification.message && (
              <p className="text-sm text-muted-foreground mb-2">
                {notification.message}
              </p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(notification.createdAt, {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>

              <div className="flex gap-1">
                {notification.action && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={notification.action.onClick}
                  >
                    {notification.action.label}
                  </Button>
                )}

                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Marcar como lida
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead, clearAll, clearRead } =
    useNotifications();

  const recentNotifications = notifications.slice(0, 10); // Show only last 10

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-96 p-0 bg-background border shadow-lg z-50"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <CardHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Notificações</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} não lidas
              </Badge>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="flex gap-2 pt-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Marcar todas como lidas
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={clearRead}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Limpar lidas
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs text-destructive"
                onClick={clearAll}
              >
                <X className="w-3 h-3 mr-1" />
                Limpar todas
              </Button>
            </div>
          )}
        </CardHeader>

        <ScrollArea className="max-h-96">
          <div className="p-4">
            {recentNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="space-y-0">
                {recentNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))}

                {notifications.length > 10 && (
                  <div className="text-center pt-4">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Ver todas as notificações
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

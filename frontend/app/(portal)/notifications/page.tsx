"use client";

import { useEffect, useState } from "react";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type InAppNotification,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

export default function NotificationsPage() {
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const data = await getNotifications(50);
      setItems(data.items);
      setUnreadCount(data.unread_count);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar notificações.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleRead(id: number) {
    await markNotificationAsRead(id);
    await loadData();
  }

  async function handleReadAll() {
    await markAllNotificationsAsRead();
    await loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhe novos leads, comissões e mudanças de status dos imóveis.
          </p>
        </div>
        <Button onClick={handleReadAll} disabled={unreadCount === 0}>
          Marcar todas como lidas
        </Button>
      </div>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">{error}</div>
      )}

      <Card className="bg-card border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Não lidas: {unreadCount}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!loading && items.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma notificação encontrada.</p>
          )}
          {!loading &&
            items.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg border p-4 ${
                  notification.read_at ? "bg-card border-border" : "bg-primary/5 border-primary/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{notification.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
                    <p className="text-xs text-muted-foreground/80 mt-2">{formatDate(notification.created_at)}</p>
                  </div>
                  {!notification.read_at && (
                    <Button size="sm" variant="outline" onClick={() => void handleRead(notification.id)}>
                      Marcar lida
                    </Button>
                  )}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}

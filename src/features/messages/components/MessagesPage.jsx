import React from "react";
import { useAppStore } from "../../../app/store";
import { useMessagesQuery } from "../../../services/hooks";
import Card from "../../../shared/ui/Card";
import MessageThread from "./MessageThread";

export default function MessagesPage() {
  const pros = useAppStore((s) => s.pros);
  const { data: messages = [], isLoading } = useMessagesQuery();
  const threadIds = Array.from(new Set(messages.map((m) => m.threadId)));

  return (
    <div className="space-y-4">
      <Card title="메시지 인박스">
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {isLoading && <p className="text-sm text-slate-600">메시지를 불러오는 중...</p>}
          {threadIds.map((id) => {
            const pro = pros.find((p) => p.id === id);
            return (
              <li key={id} className="rounded border border-slate-100 p-3">
                <p className="text-sm font-semibold">{pro?.name || id}</p>
                <p className="text-xs text-slate-500">{pro?.title}</p>
              </li>
            );
          })}
          {threadIds.length === 0 && <p className="text-sm text-slate-600">받은 메시지가 없습니다.</p>}
        </ul>
      </Card>

      {threadIds.map((id) => (
        <MessageThread key={id} proId={id} messages={messages.filter((m) => m.threadId === id)} />
      ))}
    </div>
  );
}

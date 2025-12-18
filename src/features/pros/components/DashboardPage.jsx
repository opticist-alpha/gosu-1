import React from "react";
import Card from "../../../shared/ui/Card";
import Tag from "../../../shared/ui/Tag";
import { useAppStore } from "../../../app/store";
import { formatDateTime } from "../../../shared/lib/format";

export default function DashboardPage() {
  const requests = useAppStore((s) => s.requests);
  const messages = useAppStore((s) => s.messages);
  const orders = useAppStore((s) => s.orders);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card title="들어온 요청">
        <ul className="space-y-2 text-sm">
          {requests.map((req) => (
            <li key={req.id} className="flex items-center justify-between rounded border border-slate-100 p-2">
              <span className="font-medium">{req.description}</span>
              <Tag tone="info">{req.status}</Tag>
            </li>
          ))}
          {requests.length === 0 && <p className="text-slate-600">요청이 없습니다.</p>}
        </ul>
      </Card>

      <Card title="메시지 응답" action={<span className="text-xs text-slate-500">{formatDateTime()}</span>}>
        <ul className="space-y-2 text-sm">
          {messages.map((msg) => (
            <li key={msg.id} className="rounded border border-slate-100 p-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{msg.from}</span>
                <span>{msg.createdAt}</span>
              </div>
              <p className="text-slate-800">{msg.text}</p>
            </li>
          ))}
          {messages.length === 0 && <p className="text-slate-600">메시지가 없습니다.</p>}
        </ul>
      </Card>

      <Card title="예약 현황" className="md:col-span-2">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-slate-500">
              <th className="py-2">주문</th>
              <th className="py-2">상태</th>
              <th className="py-2">예약일</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-slate-100">
                <td className="py-2 font-medium">{order.title}</td>
                <td className="py-2">
                  <Tag tone={order.status === "완료" ? "success" : "warning"}>{order.status}</Tag>
                </td>
                <td className="py-2 text-slate-500">{order.scheduledAt}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={3} className="py-3 text-slate-600">
                  예약이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

import React from "react";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import { useAppStore } from "../../../app/store";
import { useOrdersQuery, useUpdateOrderStatusMutation } from "../../../services/hooks";

const STATUS_OPTIONS = ["견적 중", "예약 확정", "완료"];

export default function OrdersPage() {
  const pros = useAppStore((s) => s.pros);
  const { data: orders = [], isLoading } = useOrdersQuery();
  const updateStatus = useUpdateOrderStatusMutation();

  return (
    <Card title="주문 / 예약 관리">
      {isLoading ? (
        <p className="text-sm text-slate-600">주문을 불러오는 중...</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const pro = pros.find((p) => p.id === order.proId);
            return (
              <li key={order.id} className="rounded border border-slate-100 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{order.title}</p>
                    <p className="text-xs text-slate-500">{pro?.name}</p>
                  </div>
                  <span className="text-xs text-slate-500">{order.scheduledAt}</span>
                </div>
                <p className="mt-1 text-xs text-blue-700">현재 상태: {order.status}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <Button
                      key={status}
                      variant={status === order.status ? "primary" : "secondary"}
                      onClick={() => updateStatus.mutate({ id: order.id, status })}
                      disabled={updateStatus.isPending}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </li>
            );
          })}
          {orders.length === 0 && <p className="text-sm text-slate-600">아직 주문이 없습니다.</p>}
        </ul>
      )}
    </Card>
  );
}

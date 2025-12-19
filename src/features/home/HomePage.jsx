import React from "react";
import { Link } from "react-router-dom";
import Card from "../../shared/ui/Card";
import Button from "../../shared/ui/Button";
import { useAppStore } from "../../app/store";
import { formatKRW } from "../../shared/lib/format";
import { useRequestsQuery } from "../../services/hooks";

export default function HomePage() {
  const pros = useAppStore((s) => s.pros);
  const { data: requests = [], isLoading } = useRequestsQuery();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card title="빠른 시작" className="md:col-span-2" action={<Link className="text-sm text-blue-600" to="/pros">고수 둘러보기</Link>}>
        <div className="flex flex-wrap gap-3">
          <Button as={Link} to="/requests">
            요청 관리
          </Button>
          <Button variant="secondary" as={Link} to="/messages">
            메시지 보기
          </Button>
          <Button variant="ghost" as={Link} to="/dashboard">
            프로 대시보드
          </Button>
        </div>
      </Card>

      <Card title="추천 고수" action={<Link className="text-sm text-blue-600" to="/pros">더보기</Link>}>
        <ul className="space-y-3">
          {pros.slice(0, 3).map((pro) => (
            <li key={pro.id} className="rounded border border-slate-100 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{pro.name}</p>
                  <p className="text-xs text-slate-500">{pro.title}</p>
                </div>
                <span className="text-sm font-medium text-blue-600">★ {pro.rating}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">최소 {formatKRW(pro.minPrice)}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="최근 요청" action={<Link className="text-sm text-blue-600" to="/requests">전체 보기</Link>}>
        {isLoading ? (
          <p className="text-sm text-slate-600">요청을 불러오는 중...</p>
        ) : (
          <ul className="space-y-2">
            {requests.map((req) => (
              <li key={req.id} className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{req.description}</span>
                  <span className="text-xs text-slate-500">{req.createdAt}</span>
                </div>
                <p className="text-xs text-slate-600">{req.region} · 상태: {req.status}</p>
              </li>
            ))}
            {requests.length === 0 && <p className="text-sm text-slate-600">최근 요청이 없습니다.</p>}
          </ul>
        )}
      </Card>
    </div>
  );
}

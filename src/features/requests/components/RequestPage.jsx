import React, { useState } from "react";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import { useAppStore } from "../../../app/store";
import { useCreateRequestMutation, useRequestsQuery } from "../../../services/hooks";

export default function RequestPage() {
  const categories = useAppStore((s) => s.categories);
  const { data: requests = [], isLoading } = useRequestsQuery();
  const createRequest = useCreateRequestMutation();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description) return;
    createRequest.mutate({ categoryId, description, region });
    setDescription("");
    setRegion("");
  };

  return (
    <div className="space-y-4">
      <Card title="견적 요청 만들기">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="font-medium text-slate-900">카테고리</span>
            <select
              className="rounded border border-slate-200 px-3 py-2 text-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="요청 내용"
            placeholder="원룸 포장이사..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input label="지역" placeholder="서울" value={region} onChange={(e) => setRegion(e.target.value)} />
          <div className="md:col-span-3">
            <Button type="submit">등록</Button>
          </div>
        </form>
      </Card>

      <Card title="요청 목록">
        {isLoading ? (
          <p className="text-sm text-slate-600">불러오는 중...</p>
        ) : (
          <ul className="space-y-3">
            {requests.map((req) => (
              <li key={req.id} className="rounded border border-slate-100 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{req.description}</span>
                  <span className="text-xs text-slate-500">{req.createdAt}</span>
                </div>
                <p className="text-xs text-slate-600">{req.region || "지역 미지정"}</p>
                <p className="text-xs text-blue-700">상태: {req.status}</p>
              </li>
            ))}
            {requests.length === 0 && <p className="text-sm text-slate-600">등록된 요청이 없습니다.</p>}
          </ul>
        )}
      </Card>
    </div>
  );
}

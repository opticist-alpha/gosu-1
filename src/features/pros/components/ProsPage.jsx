import React, { useMemo, useState } from "react";
import Input from "../../../shared/ui/Input";
import ProCard from "./ProCard";
import { useAppStore } from "../../../app/store";
import { scoreMatch } from "../../../shared/lib/match";
import Card from "../../../shared/ui/Card";

export default function ProsPage() {
  const pros = useAppStore((s) => s.pros);
  const categories = useAppStore((s) => s.categories);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [region, setRegion] = useState("");
  const addMessage = useAppStore((s) => s.addMessage);

  const sortedPros = useMemo(() => {
    const base = pros.map((pro) => ({ pro, score: scoreMatch({ pro, categoryId, query, region }) }));
    return base
      .filter((item) => (categoryId ? item.pro.categories.includes(categoryId) : true))
      .filter((item) =>
        query ? `${item.pro.name} ${item.pro.title} ${item.pro.bio}`.toLowerCase().includes(query.toLowerCase()) : true
      )
      .sort((a, b) => b.score - a.score)
      .map((item) => item.pro);
  }, [pros, categoryId, query, region]);

  const handleMessage = (pro) => addMessage(pro.id, "견적 문의 드려요!");

  return (
    <div className="space-y-4">
      <Card title="필터">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input label="키워드" placeholder="이사, 레슨 등" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Input label="지역" placeholder="서울" value={region} onChange={(e) => setRegion(e.target.value)} />
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="font-medium text-slate-900">카테고리</span>
            <select
              className="rounded border border-slate-200 px-3 py-2 text-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">전체</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>
      <div className="space-y-3">
        {sortedPros.map((pro) => (
          <ProCard key={pro.id} pro={pro} onMessage={handleMessage} />
        ))}
        {sortedPros.length === 0 && <p className="text-sm text-slate-600">조건에 맞는 고수가 없습니다.</p>}
      </div>
    </div>
  );
}

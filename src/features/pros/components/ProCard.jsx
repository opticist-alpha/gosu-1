import React from "react";
import Card from "../../../shared/ui/Card";
import Tag from "../../../shared/ui/Tag";
import Button from "../../../shared/ui/Button";
import { formatKRW } from "../../../shared/lib/format";

export default function ProCard({ pro, onMessage }) {
  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <span className="text-lg">{pro.name}</span>
          {pro.verified && <Tag tone="success">본인 인증</Tag>}
        </div>
      }
      action={<Button onClick={() => onMessage?.(pro)}>메시지</Button>}
    >
      <p className="text-sm text-slate-700">{pro.title}</p>
      <p className="mt-1 text-xs text-slate-500">{pro.region}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {pro.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-slate-700">
        <span>평점 {pro.rating} · 리뷰 {pro.reviewCount}개</span>
        <span>최소 {formatKRW(pro.minPrice)}</span>
      </div>
      <p className="mt-2 text-sm text-slate-700">{pro.bio}</p>
    </Card>
  );
}

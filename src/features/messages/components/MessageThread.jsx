import React from "react";
import Card from "../../../shared/ui/Card";
import Input from "../../../shared/ui/Input";
import Button from "../../../shared/ui/Button";
import { useAppStore } from "../../../app/store";

export default function MessageThread({ proId }) {
  const [text, setText] = React.useState("");
  const threadMessages = useAppStore((s) => s.getThreadMessages(proId));
  const addMessage = useAppStore((s) => s.addMessage);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text) return;
    addMessage(proId, text);
    setText("");
  };

  return (
    <Card title={`메시지 · ${proId}`}>
      <div className="space-y-2 text-sm">
        {threadMessages.map((msg) => (
          <div key={msg.id} className="rounded border border-slate-100 p-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{msg.from}</span>
              <span>{msg.createdAt}</span>
            </div>
            <p className="text-slate-800">{msg.text}</p>
          </div>
        ))}
        {threadMessages.length === 0 && <p className="text-slate-500">메시지가 없습니다.</p>}
      </div>
      <form onSubmit={handleSend} className="mt-3 flex items-end gap-2">
        <Input
          label="보낼 내용"
          placeholder="메시지를 입력하세요"
          className="flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button type="submit">전송</Button>
      </form>
    </Card>
  );
}

import React from "react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import Button from "../shared/ui/Button";

function ErrorFallback({ title, detail }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold text-slate-900">{title || "예기치 못한 오류"}</h1>
      {detail && <p className="text-sm text-slate-600">{detail}</p>}
      <Button onClick={() => window.location.assign("/")}>홈으로 이동</Button>
    </div>
  );
}

export default function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return <ErrorFallback title={`오류 ${error.status}`} detail={error.statusText} />;
  }
  return <ErrorFallback detail={error?.message} />;
}

import { useEffect, useRef } from "react";

export function useEventListener(target, type, handler, options) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const element = target?.current || target || window;
    if (!element?.addEventListener) return;
    const listener = (event) => handlerRef.current(event);
    element.addEventListener(type, listener, options);
    return () => element.removeEventListener(type, listener, options);
  }, [target, type, options]);
}

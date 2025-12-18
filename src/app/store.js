import { create } from "zustand";
import { CATEGORIES, SAMPLE_PROS } from "../features/pros/data/mockPros";
import { formatDateTime } from "../shared/lib/format";
import { uid } from "../shared/lib/utils";

const initialRequests = [
  {
    id: "req_demo_1",
    categoryId: "move",
    description: "원룸 포장이사 견적을 알고 싶어요",
    region: "서울",
    status: "견적 진행 중",
    createdAt: formatDateTime(Date.now() - 1000 * 60 * 60),
  },
];

const initialMessages = [
  {
    id: "msg_1",
    threadId: "pro_neo_move",
    from: "프로 네오",
    text: "안녕하세요! 사진 공유 주시면 내역 확인 후 견적 드릴게요.",
    createdAt: formatDateTime(Date.now() - 1000 * 60 * 45),
  },
];

const initialOrders = [
  {
    id: "order_1",
    proId: "pro_yuna_clean",
    title: "입주 청소",
    status: "예약 확정",
    scheduledAt: formatDateTime(Date.now() + 1000 * 60 * 60 * 24),
  },
];

export const useAppStore = create((set, get) => ({
  categories: CATEGORIES,
  pros: SAMPLE_PROS,
  requests: initialRequests,
  messages: initialMessages,
  orders: initialOrders,
  addRequest: (input) =>
    set((state) => ({
      requests: [
        {
          id: uid("req"),
          createdAt: formatDateTime(),
          status: "접수됨",
          ...input,
        },
        ...state.requests,
      ],
    })),
  addMessage: (threadId, text) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: uid("msg"),
          threadId,
          from: "나",
          text,
          createdAt: formatDateTime(),
        },
      ],
    })),
  updateOrderStatus: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((order) => (order.id === orderId ? { ...order, status } : order)),
    })),
  getThreadMessages: (threadId) => get().messages.filter((m) => m.threadId === threadId),
}));

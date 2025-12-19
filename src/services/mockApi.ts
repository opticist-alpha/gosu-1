import { formatDateTime } from "../shared/lib/format";
import { sleep, uid } from "../shared/lib/utils";
import { type ApiClient } from "./api";
import {
  MessageInputSchema,
  MessageSchema,
  MetaSchema,
  OrderInputSchema,
  OrderSchema,
  ProfileInputSchema,
  ProfileSchema,
  QuoteInputSchema,
  QuoteSchema,
  RequestInputSchema,
  RequestSchema,
} from "./schemas";

type MockDb = {
  version: number;
  requests: Array<ReturnType<typeof RequestSchema.parse>>;
  quotes: Array<ReturnType<typeof QuoteSchema.parse>>;
  messages: Array<ReturnType<typeof MessageSchema.parse>>;
  orders: Array<ReturnType<typeof OrderSchema.parse>>;
  profiles: Array<ReturnType<typeof ProfileSchema.parse>>;
};

const now = Date.now();

const INITIAL_DB: MockDb = {
  version: 1,
  requests: [
    RequestSchema.parse({
      id: "req_demo_1",
      categoryId: "move",
      description: "원룸 포장이사 견적을 알고 싶어요",
      region: "서울",
      status: "견적 진행 중",
      createdAt: formatDateTime(now - 1000 * 60 * 60),
    }),
  ],
  quotes: [
    QuoteSchema.parse({
      id: "quote_demo_1",
      requestId: "req_demo_1",
      proId: "pro_yuna_clean",
      price: 180000,
      message: "사진 공유 주시면 정확히 안내드릴게요!",
      createdAt: formatDateTime(now - 1000 * 60 * 40),
    }),
  ],
  messages: [
    MessageSchema.parse({
      id: "msg_demo_1",
      threadId: "pro_yuna_clean",
      from: "프로 유나",
      text: "안녕하세요! 문의 주셔서 감사합니다.",
      createdAt: formatDateTime(now - 1000 * 60 * 45),
    }),
  ],
  orders: [
    OrderSchema.parse({
      id: "order_demo_1",
      proId: "pro_yuna_clean",
      title: "입주 청소",
      status: "예약 확정",
      scheduledAt: formatDateTime(now + 1000 * 60 * 60 * 24),
    }),
  ],
  profiles: [
    ProfileSchema.parse({
      id: "profile_customer_1",
      role: "customer",
      name: "데모 고객",
      phone: "010-0000-0000",
      region: "서울",
      createdAt: formatDateTime(now - 1000 * 60 * 60 * 24 * 30),
    }),
    ProfileSchema.parse({
      id: "pro_yuna_clean",
      role: "pro",
      name: "유나",
      region: "서울/경기",
      bio: "입주/이사 전문 청소",
      createdAt: formatDateTime(now - 1000 * 60 * 60 * 24 * 60),
    }),
  ],
};

export function createMockApiClient(latency = 120): ApiClient {
  let db: MockDb = { ...INITIAL_DB };

  const persist = async () => sleep(latency);

  return {
    listRequests: async () => {
      await sleep(latency);
      return db.requests;
    },
    createRequest: async (input) => {
      const parsed = RequestInputSchema.parse(input);
      const next = RequestSchema.parse({
        ...parsed,
        id: uid("req"),
        status: parsed.status || "접수됨",
        createdAt: formatDateTime(),
      });
      db.requests = [next, ...db.requests];
      await persist();
      return next;
    },
    updateRequest: async (id, input) => {
      const parsed = RequestInputSchema.merge(RequestSchema.pick({ status: true }).partial()).parse(input);
      const existing = db.requests.find((r) => r.id === id);
      if (!existing) throw new Error("요청을 찾을 수 없습니다.");
      const next = RequestSchema.parse({ ...existing, ...parsed });
      db.requests = db.requests.map((r) => (r.id === id ? next : r));
      await persist();
      return next;
    },
    deleteRequest: async (id) => {
      db.requests = db.requests.filter((r) => r.id !== id);
      await persist();
    },

    listQuotes: async (requestId) => {
      await sleep(latency);
      return requestId ? db.quotes.filter((q) => q.requestId === requestId) : db.quotes;
    },
    createQuote: async (input) => {
      const parsed = QuoteInputSchema.parse(input);
      const next = QuoteSchema.parse({ ...parsed, id: uid("quote"), createdAt: formatDateTime() });
      db.quotes = [next, ...db.quotes];
      await persist();
      return next;
    },

    listMessages: async (threadId) => {
      await sleep(latency);
      return threadId ? db.messages.filter((m) => m.threadId === threadId) : db.messages;
    },
    sendMessage: async (input) => {
      const parsed = MessageInputSchema.parse(input);
      const next = MessageSchema.parse({
        ...parsed,
        id: uid("msg"),
        createdAt: formatDateTime(),
      });
      db.messages = [...db.messages, next];
      await persist();
      return next;
    },

    listOrders: async () => {
      await sleep(latency);
      return db.orders;
    },
    updateOrderStatus: async (id, status) => {
      const parsed = OrderInputSchema.pick({ status: true }).parse({ status });
      const existing = db.orders.find((o) => o.id === id);
      if (!existing) throw new Error("주문을 찾을 수 없습니다.");
      const next = OrderSchema.parse({ ...existing, ...parsed });
      db.orders = db.orders.map((o) => (o.id === id ? next : o));
      await persist();
      return next;
    },

    listProfiles: async () => {
      await sleep(latency);
      return db.profiles;
    },
    getProfile: async (id) => {
      await sleep(latency);
      const profile = db.profiles.find((p) => p.id === id);
      if (!profile) throw new Error("프로필을 찾을 수 없습니다.");
      return profile;
    },
    upsertProfile: async (profile) => {
      const parsed = ProfileInputSchema.parse(profile);
      const existing = db.profiles.find((p) => p.id === parsed.id);
      const next = ProfileSchema.parse({
        ...parsed,
        createdAt: existing?.createdAt || formatDateTime(),
      });
      if (existing) {
        db.profiles = db.profiles.map((p) => (p.id === parsed.id ? next : p));
      } else {
        db.profiles = [...db.profiles, next];
      }
      await persist();
      return next;
    },

    getMeta: async () => {
      await sleep(latency / 2);
      return MetaSchema.parse({ version: db.version });
    },
  };
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient, apiSource } from "./client";

export function useMetaQuery() {
  return useQuery({
    queryKey: ["meta"],
    queryFn: () => apiClient.getMeta(),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
}

export function useRequestsQuery() {
  return useQuery({
    queryKey: ["requests"],
    queryFn: () => apiClient.listRequests(),
    placeholderData: (prev) => prev,
  });
}

export function useCreateRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) => apiClient.createRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast.success("요청이 등록되었습니다.");
    },
    onError: (error) => toast.error(error?.message || "요청 등록에 실패했습니다."),
  });
}

export function useMessagesQuery(threadId) {
  return useQuery({
    queryKey: threadId ? ["messages", threadId] : ["messages"],
    queryFn: () => apiClient.listMessages(threadId),
    placeholderData: (prev) => prev,
  });
}

export function useSendMessageMutation(threadId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) => apiClient.sendMessage(input),
    onSuccess: () => {
      const key = threadId ? ["messages", threadId] : ["messages"];
      queryClient.invalidateQueries({ queryKey: key });
      toast.success("메시지를 보냈어요.");
    },
    onError: (error) => toast.error(error?.message || "메시지 전송에 실패했습니다."),
  });
}

export function useOrdersQuery() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => apiClient.listOrders(),
    placeholderData: (prev) => prev,
  });
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => apiClient.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("주문 상태를 변경했어요.");
    },
    onError: (error) => toast.error(error?.message || "상태 변경에 실패했습니다."),
  });
}

export function useProfilesQuery() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: () => apiClient.listProfiles(),
    placeholderData: (prev) => prev,
  });
}

export const usingMockService = apiSource === "mock";

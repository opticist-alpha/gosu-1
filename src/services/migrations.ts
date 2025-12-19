import { formatDateTime } from "../shared/lib/format";

export const TARGET_DATA_VERSION = 2;

export const MIGRATIONS: Record<number, (queryClient: any) => void> = {
  1: (queryClient) => {
    const requests = queryClient.getQueryData(["requests"]);
    if (Array.isArray(requests)) {
      queryClient.setQueryData(
        ["requests"],
        requests.map((req) => ({
          ...req,
          status: req.status || "접수됨",
          createdAt: req.createdAt || formatDateTime(),
        }))
      );
    }
  },
};

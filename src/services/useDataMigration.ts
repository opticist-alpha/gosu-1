import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useMetaQuery } from "./hooks";

type MigrationMap = Record<number, (queryClient: ReturnType<typeof useQueryClient>) => void>;

export function useDataMigration(targetVersion: number, migrations: MigrationMap) {
  const queryClient = useQueryClient();
  const { data: meta, error } = useMetaQuery();

  useEffect(() => {
    if (error) {
      toast.error("메타데이터를 불러오지 못했어요. 캐시 데이터를 사용합니다.");
    }
  }, [error]);

  useEffect(() => {
    if (!meta?.version && meta?.version !== 0) return;
    let version = meta.version;
    while (version < targetVersion) {
      const migrate = migrations[version];
      if (migrate) {
        migrate(queryClient);
      }
      version += 1;
    }

    if (version !== meta.version) {
      queryClient.setQueryData(["meta"], { version });
      toast.success(`데이터 스키마를 v${version}로 마이그레이션했습니다.`);
    }
  }, [meta, migrations, queryClient, targetVersion]);
}

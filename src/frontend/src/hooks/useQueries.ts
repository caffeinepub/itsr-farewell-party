import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob, MediaType } from "../backend";
import type { MediaEntry } from "../backend";
import { useActor } from "./useActor";

export function useListMedia() {
  const { actor, isFetching } = useActor();
  return useQuery<MediaEntry[]>({
    queryKey: ["media"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMedia();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMedia() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      mediaType,
      file,
      group,
      onProgress,
    }: {
      title: string;
      mediaType: MediaType;
      file: File;
      group: string;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      const bytes = new Uint8Array(await file.arrayBuffer());
      let blob = ExternalBlob.fromBytes(bytes);
      if (onProgress) {
        blob = blob.withUploadProgress(onProgress);
      }
      return actor.addMedia(title, mediaType, blob, group);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useDeleteMedia() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteMedia(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export { MediaType };

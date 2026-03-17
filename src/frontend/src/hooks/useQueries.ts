import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob, MediaType } from "../backend";
import type { MediaEntry } from "../backend";
import { useActor } from "./useActor";

// Push all media URLs to the service worker so they are pre-cached in background
function precacheMediaUrls(items: MediaEntry[]) {
  if (!navigator.serviceWorker?.controller) return;
  const urls: string[] = [];
  for (const item of items) {
    try {
      const url = item.file.getDirectURL();
      if (url) urls.push(url);
    } catch {
      // skip
    }
  }
  if (urls.length > 0) {
    navigator.serviceWorker.controller.postMessage({
      type: "PRECACHE_URLS",
      urls,
    });
  }
}

export function useListMedia() {
  const { actor, isFetching } = useActor();
  return useQuery<MediaEntry[]>({
    queryKey: ["media"],
    queryFn: async () => {
      if (!actor) return [];
      const items = await actor.listMedia();
      // Pre-cache all media in background once online
      precacheMediaUrls(items);
      return items;
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
      try {
        return await actor.isCallerAdmin();
      } catch {
        // If the call fails, treat as non-admin to avoid breaking the UI
        return false;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export { MediaType };

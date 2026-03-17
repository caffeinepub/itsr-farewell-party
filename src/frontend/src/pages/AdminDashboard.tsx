import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Camera,
  Film,
  Loader2,
  LogOut,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { MediaEntry } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  MediaType,
  useAddMedia,
  useDeleteMedia,
  useIsAdmin,
  useListMedia,
} from "../hooks/useQueries";

const SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6", "sk7", "sk8"];

const GROUP_OPTIONS = [
  { value: "2nd_pg", label: "2nd PG" },
  { value: "3rd_bcom", label: "3rd B.Com" },
  { value: "3rd_ba", label: "3rd B.A" },
];

function UploadButton({
  label,
  icon: Icon,
  accept,
  mediaType,
  group,
  "data-ocid": ocid,
}: {
  label: string;
  icon: React.ElementType;
  accept: string;
  mediaType: MediaType;
  group: string;
  "data-ocid": string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const addMedia = useAddMedia();
  const [progress, setProgress] = useState<number | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!group) {
      toast.error("Please select a group first.");
      return;
    }
    const title = file.name.replace(/\.[^.]+$/, "");
    setProgress(0);
    try {
      await addMedia.mutateAsync({
        title,
        mediaType,
        file,
        group,
        onProgress: (pct) => setProgress(pct),
      });
      toast.success(
        `${mediaType === MediaType.photo ? "Photo" : "Video"} uploaded!`,
      );
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFile}
      />
      <Button
        data-ocid={ocid}
        onClick={() => fileRef.current?.click()}
        disabled={addMedia.isPending || !group}
        className="flex items-center gap-2 font-body font-semibold px-6 py-5 rounded-xl"
        style={{ background: "oklch(52% 0.13 148)", color: "white" }}
      >
        {addMedia.isPending && progress !== null ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
        {label}
      </Button>
      {progress !== null && (
        <Progress
          value={progress}
          className="h-1.5"
          data-ocid="upload.loading_state"
        />
      )}
    </div>
  );
}

const GROUP_LABEL: Record<string, string> = {
  "2nd_pg": "2nd PG",
  "3rd_bcom": "3rd B.Com",
  "3rd_ba": "3rd B.A",
};

function MediaCard({
  item,
  index,
  onDelete,
}: {
  item: MediaEntry;
  index: number;
  onDelete: (id: string) => void;
}) {
  const isVideo = item.mediaType === MediaType.video;

  return (
    <motion.div
      data-ocid={`media.item.${index}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group relative rounded-xl overflow-hidden"
      style={{
        background: "oklch(99% 0.006 145)",
        border: "1.5px solid oklch(88% 0.04 145)",
      }}
    >
      <div className="aspect-video relative">
        {isVideo ? (
          <video
            src={item.file.getDirectURL()}
            className="w-full h-full object-cover"
            muted
          />
        ) : (
          <img
            src={item.file.getDirectURL()}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        )}
        {isVideo && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "oklch(20% 0.04 148 / 0.25)" }}
          >
            <Film className="w-8 h-8 text-white/80" />
          </div>
        )}
      </div>
      <div className="p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isVideo ? (
            <Film
              className="w-4 h-4 shrink-0"
              style={{ color: "oklch(52% 0.13 148)" }}
            />
          ) : (
            <Camera
              className="w-4 h-4 shrink-0"
              style={{ color: "oklch(52% 0.13 148)" }}
            />
          )}
          <div className="min-w-0">
            <p
              className="font-body text-sm truncate"
              style={{ color: "oklch(28% 0.08 155)" }}
            >
              {item.title}
            </p>
            {item.group && (
              <span
                className="font-body text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  background: "oklch(88% 0.07 148 / 0.6)",
                  color: "oklch(40% 0.1 148)",
                }}
              >
                {GROUP_LABEL[item.group] ?? item.group}
              </span>
            )}
          </div>
        </div>
        <Button
          data-ocid={`media.delete_button.${index}`}
          variant="ghost"
          size="icon"
          className="shrink-0 w-8 h-8 hover:bg-red-50 hover:text-red-500"
          style={{ color: "oklch(65% 0.05 148)" }}
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { identity, clear } = useInternetIdentity();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const { data: media, isLoading, isError } = useListMedia();
  const deleteMedia = useDeleteMedia();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("2nd_pg");

  if (!identity && !checkingAdmin) {
    navigate({ to: "/admin" });
    return null;
  }

  if (checkingAdmin) {
    return (
      <div
        data-ocid="dashboard.loading_state"
        className="min-h-screen flex items-center justify-center"
        style={{ background: "oklch(96% 0.018 145)" }}
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: "oklch(52% 0.13 148)" }}
        />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div
        data-ocid="dashboard.error_state"
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: "oklch(96% 0.018 145)" }}
      >
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2
            className="font-display text-2xl font-bold mb-2"
            style={{ color: "oklch(28% 0.08 155)" }}
          >
            Access Denied
          </h2>
          <p
            className="font-body text-sm mb-6"
            style={{ color: "oklch(55% 0.07 148)" }}
          >
            You don't have admin privileges.
          </p>
          <Button
            data-ocid="dashboard.primary_button"
            onClick={() => navigate({ to: "/" })}
            style={{ background: "oklch(52% 0.13 148)", color: "white" }}
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    clear();
    navigate({ to: "/" });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMedia.mutateAsync(confirmDelete);
      toast.success("Deleted successfully");
    } catch {
      toast.error("Delete failed. Please try again.");
    } finally {
      setConfirmDelete(null);
    }
  };

  const photos = media?.filter((m) => m.mediaType === MediaType.photo) ?? [];
  const videos = media?.filter((m) => m.mediaType === MediaType.video) ?? [];

  return (
    <div
      className="min-h-screen"
      style={{ background: "oklch(96% 0.018 145)" }}
    >
      <header
        className="sticky top-0 z-40 backdrop-blur-md"
        style={{
          borderBottom: "1px solid oklch(85% 0.04 145)",
          background: "oklch(97% 0.012 145 / 0.9)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div
              className="font-display font-bold text-xl"
              style={{ color: "oklch(38% 0.12 148)" }}
            >
              ITSR Admin
            </div>
            <p
              className="font-body text-xs"
              style={{ color: "oklch(58% 0.07 148)" }}
            >
              Farewell Dashboard
            </p>
          </div>
          <Button
            data-ocid="dashboard.secondary_button"
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="font-body"
            style={{
              borderColor: "oklch(80% 0.07 148)",
              color: "oklch(42% 0.12 148)",
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl p-8 mb-10"
          style={{
            background: "oklch(99% 0.006 145)",
            border: "1.5px solid oklch(88% 0.04 145)",
          }}
        >
          <h2
            className="font-display text-2xl font-semibold mb-1"
            style={{ color: "oklch(28% 0.1 155)" }}
          >
            Upload Media
          </h2>
          <p
            className="font-body text-sm mb-6"
            style={{ color: "oklch(58% 0.07 148)" }}
          >
            Select a group and upload photos or videos to the gallery.
          </p>

          {/* Group selector */}
          <div className="mb-5">
            <p
              className="font-body text-sm font-medium block mb-2"
              style={{ color: "oklch(38% 0.09 155)" }}
            >
              Group
            </p>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger
                data-ocid="upload.select"
                className="w-48 font-body"
                style={{
                  borderColor: "oklch(80% 0.07 148)",
                  color: "oklch(35% 0.09 155)",
                }}
              >
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {GROUP_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="font-body"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-4">
            <UploadButton
              data-ocid="upload.photo_button"
              label="Upload Photo"
              icon={Camera}
              accept="image/*"
              mediaType={MediaType.photo}
              group={selectedGroup}
            />
            <UploadButton
              data-ocid="upload.video_button"
              label="Upload Video"
              icon={Film}
              accept="video/*"
              mediaType={MediaType.video}
              group={selectedGroup}
            />
          </div>
        </motion.div>

        {isLoading ? (
          <div
            data-ocid="media.loading_state"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {SKELETON_KEYS.map((k) => (
              <Skeleton key={k} className="aspect-video rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div data-ocid="media.error_state" className="text-center py-20">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <p
              className="font-body text-sm"
              style={{ color: "oklch(58% 0.07 148)" }}
            >
              Failed to load media. Please refresh.
            </p>
          </div>
        ) : media && media.length > 0 ? (
          <div>
            {photos.length > 0 && (
              <div className="mb-10">
                <h3
                  className="font-display text-xl font-semibold mb-4 flex items-center gap-2"
                  style={{ color: "oklch(28% 0.1 155)" }}
                >
                  <Camera
                    className="w-5 h-5"
                    style={{ color: "oklch(52% 0.13 148)" }}
                  />
                  Photos
                  <span
                    className="text-sm font-body font-normal"
                    style={{ color: "oklch(58% 0.07 148)" }}
                  >
                    ({photos.length})
                  </span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((item, i) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      index={i + 1}
                      onDelete={(id) => setConfirmDelete(id)}
                    />
                  ))}
                </div>
              </div>
            )}
            {videos.length > 0 && (
              <div>
                <h3
                  className="font-display text-xl font-semibold mb-4 flex items-center gap-2"
                  style={{ color: "oklch(28% 0.1 155)" }}
                >
                  <Film
                    className="w-5 h-5"
                    style={{ color: "oklch(52% 0.13 148)" }}
                  />
                  Videos
                  <span
                    className="text-sm font-body font-normal"
                    style={{ color: "oklch(58% 0.07 148)" }}
                  >
                    ({videos.length})
                  </span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {videos.map((item, i) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      index={i + 1}
                      onDelete={(id) => setConfirmDelete(id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            data-ocid="media.empty_state"
            className="text-center py-24 rounded-2xl"
            style={{
              background: "oklch(99% 0.006 145)",
              border: "1.5px solid oklch(88% 0.04 145)",
            }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Camera
                className="w-10 h-10"
                style={{ color: "oklch(78% 0.08 148)" }}
              />
              <Film
                className="w-10 h-10"
                style={{ color: "oklch(78% 0.08 148)" }}
              />
            </div>
            <p
              className="font-display text-xl"
              style={{ color: "oklch(55% 0.07 148)" }}
            >
              No media uploaded yet
            </p>
            <p
              className="font-body text-sm mt-1"
              style={{ color: "oklch(65% 0.05 148)" }}
            >
              Use the buttons above to add photos and videos.
            </p>
          </div>
        )}
      </main>

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <AlertDialogContent
          data-ocid="delete.dialog"
          style={{
            background: "oklch(99% 0.006 145)",
            borderColor: "oklch(85% 0.04 145)",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle
              className="font-display"
              style={{ color: "oklch(28% 0.1 155)" }}
            >
              Delete Media?
            </AlertDialogTitle>
            <AlertDialogDescription
              className="font-body"
              style={{ color: "oklch(55% 0.07 148)" }}
            >
              This will permanently delete the item from the gallery. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="delete.cancel_button"
              className="font-body"
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="delete.confirm_button"
              className="font-body bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              {deleteMedia.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

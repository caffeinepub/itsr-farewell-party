import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Camera, Film, Play, Volume2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MediaType } from "../backend";
import type { MediaEntry } from "../backend";
import { useListMedia } from "../hooks/useQueries";

const GROUP_META: Record<
  string,
  { label: string; emoji: string; desc: string }
> = {
  "2nd_pg": { label: "2nd PG", emoji: "🎓", desc: "Postgraduate Batch" },
  "3rd_bcom": { label: "3rd B.Com", emoji: "📊", desc: "Bachelor of Commerce" },
  "3rd_ba": { label: "3rd B.A", emoji: "📚", desc: "Bachelor of Arts" },
};

const SKELETON_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6"];

const SPINNER_CSS = "@keyframes spin { to { transform: rotate(360deg); } }";

const INITIAL_LOAD_TIMEOUT_MS = 25000;
const STALL_TIMEOUT_MS = 30000;

// ─── Fullscreen Intro Video ───────────────────────────────────────────────────

function IntroVideo({
  video,
  onDone,
}: { video: MediaEntry; onDone: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fading, setFading] = useState(false);
  const [waitingForTap, setWaitingForTap] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const fadingRef = useRef(false);
  const progressHiddenRef = useRef(false);
  const videoStartedRef = useRef(false);

  const triggerSkip = useCallback(() => {
    if (fadingRef.current) return;
    fadingRef.current = true;
    if (initialLoadTimerRef.current) {
      clearTimeout(initialLoadTimerRef.current);
      initialLoadTimerRef.current = null;
    }
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
    if (videoRef.current) videoRef.current.pause();
    setFading(true);
    setTimeout(onDone, 900);
  }, [onDone]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    // Hard timeout as safety net
    initialLoadTimerRef.current = setTimeout(
      triggerSkip,
      INITIAL_LOAD_TIMEOUT_MS,
    );

    vid.muted = false;
    vid.play().catch(() => {
      setWaitingForTap(true);
    });

    return () => {
      if (initialLoadTimerRef.current) {
        clearTimeout(initialLoadTimerRef.current);
        initialLoadTimerRef.current = null;
      }
      if (stallTimerRef.current) {
        clearTimeout(stallTimerRef.current);
        stallTimerRef.current = null;
      }
    };
  }, [triggerSkip]);

  const handleEnd = () => triggerSkip();

  const handleCanPlay = () => {
    setIsVideoLoading(false);
    if (initialLoadTimerRef.current) {
      clearTimeout(initialLoadTimerRef.current);
      initialLoadTimerRef.current = null;
    }
    const vid = videoRef.current;
    if (!vid) return;
    vid.play().catch(() => setWaitingForTap(true));
  };

  const handleLoadedData = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.play().catch(() => setWaitingForTap(true));
  };

  const handleProgress = () => {
    if (progressHiddenRef.current) return;
    const vid = videoRef.current;
    if (vid && vid.buffered.length > 0) {
      progressHiddenRef.current = true;
      setIsVideoLoading(false);
      if (initialLoadTimerRef.current) {
        clearTimeout(initialLoadTimerRef.current);
        initialLoadTimerRef.current = null;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (initialLoadTimerRef.current) {
      clearTimeout(initialLoadTimerRef.current);
      initialLoadTimerRef.current = null;
    }
    const vid = videoRef.current;
    if (!vid) return;
    vid.play().catch(() => setWaitingForTap(true));
  };

  const handleWaiting = () => {
    setIsBuffering(true);
    if (videoStartedRef.current) {
      if (stallTimerRef.current) {
        clearTimeout(stallTimerRef.current);
        stallTimerRef.current = null;
      }
      stallTimerRef.current = setTimeout(triggerSkip, STALL_TIMEOUT_MS);
    }
  };

  const handlePlaying = () => {
    videoStartedRef.current = true;
    setIsBuffering(false);
    setIsVideoLoading(false);
    if (initialLoadTimerRef.current) {
      clearTimeout(initialLoadTimerRef.current);
      initialLoadTimerRef.current = null;
    }
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  };

  const handleTapToPlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = false;
    vid.play();
    setWaitingForTap(false);
  };

  return (
    <motion.div
      data-ocid="intro.panel"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      animate={{ opacity: fading ? 0 : 1, y: fading ? "100vh" : 0 }}
      transition={{ duration: 0.9, ease: "easeInOut" }}
    >
      <style>{SPINNER_CSS}</style>

      <div
        className="relative w-full"
        style={{ aspectRatio: "16/9", maxHeight: "100vh" }}
      >
        {/* biome-ignore lint/a11y/useMediaCaption: user-uploaded intro video */}
        <video
          ref={videoRef}
          src={video.file.getDirectURL()}
          onEnded={handleEnd}
          onError={handleEnd}
          onCanPlay={handleCanPlay}
          onLoadedData={handleLoadedData}
          onProgress={handleProgress}
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={handleWaiting}
          onStalled={handleWaiting}
          onPlaying={handlePlaying}
          autoPlay
          playsInline
          preload="auto"
          {...({ fetchpriority: "high" } as object)}
          className="w-full h-full object-contain bg-black"
          style={{ display: "block" }}
        />

        {/* Simple spinner while loading */}
        {isVideoLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div
              className="w-12 h-12 rounded-full border-4"
              style={{
                borderColor: "rgba(255,255,255,0.15)",
                borderTopColor: "rgba(255,255,255,0.85)",
                animation: "spin 1s linear infinite",
              }}
            />
            <span
              style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}
            >
              tap Skip if slow
            </span>
          </div>
        )}

        {/* Simple buffering pill */}
        {!isVideoLoading && isBuffering && (
          <div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: "rgba(0,0,0,0.65)" }}
          >
            <div
              className="w-4 h-4 rounded-full border-2"
              style={{
                borderColor: "rgba(255,255,255,0.25)",
                borderTopColor: "white",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span
              style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.75rem" }}
            >
              Buffering…
            </span>
          </div>
        )}

        {waitingForTap && (
          <button
            type="button"
            data-ocid="intro.canvas_target"
            onClick={handleTapToPlay}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: "rgba(0,0,0,0.55)" }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "2px solid rgba(255,255,255,0.5)",
              }}
            >
              <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
            </div>
            <div
              className="flex items-center gap-2"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              <Volume2 className="w-4 h-4" />
              <span style={{ fontSize: "0.875rem" }}>
                Tap to play with sound
              </span>
            </div>
          </button>
        )}

        <button
          type="button"
          data-ocid="intro.skip_button"
          onClick={triggerSkip}
          className="absolute bottom-8 right-6 text-sm px-4 py-2 rounded-full transition-colors"
          style={{
            background: "rgba(0,0,0,0.5)",
            color: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          Skip ›
        </button>
      </div>
    </motion.div>
  );
}

// ─── Half-Screen Viewer ──────────────────────────────────────────────────────

function HalfScreenViewer({
  media,
  onClose,
}: { media: MediaEntry; onClose: () => void }) {
  const isVideo = media.mediaType === MediaType.video;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.72)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Sheet — exactly 50vh */}
        <motion.div
          data-ocid="viewer.sheet"
          className="relative w-full flex flex-col rounded-t-2xl overflow-hidden"
          style={{
            height: "50vh",
            background: "oklch(100% 0 0)",
            borderTop: "1.5px solid oklch(72% 0.1 148 / 0.3)",
            boxShadow: "0 -8px 60px oklch(40% 0.15 148 / 0.15)",
          }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
        >
          {/* Header bar */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: "1px solid oklch(75% 0.08 148 / 0.5)" }}
          >
            <p
              style={{
                color: "oklch(28% 0.07 155)",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
              className="truncate pr-4"
            >
              {media.title}
            </p>
            <button
              type="button"
              data-ocid="viewer.close_button"
              onClick={onClose}
              className="shrink-0 rounded-full p-1.5 transition-colors"
              style={{
                background: "oklch(90% 0.04 148 / 0.8)",
                color: "oklch(35% 0.1 148)",
                border: "1px solid oklch(65% 0.1 148 / 0.4)",
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Media content */}
          <div className="flex-1 overflow-hidden flex items-center justify-center bg-black">
            {isVideo ? (
              // biome-ignore lint/a11y/useMediaCaption: user-uploaded party video
              <video
                src={media.file.getDirectURL()}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={media.file.getDirectURL()}
                alt={media.title}
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─── Floating Gallery ────────────────────────────────────────────────────────

interface FloatingItemProps {
  media: MediaEntry;
  index: number;
  onClick: () => void;
}

function FloatingItem({ media, index, onClick }: FloatingItemProps) {
  const isVideo = media.mediaType === MediaType.video;
  const seed = index * 137 + 42;
  const left = ((seed * 31) % 80) + 5;
  const top = index * 220 + ((seed * 17) % 120);
  const size = 150 + ((seed * 7) % 60);
  const duration = 3 + ((seed * 3) % 3.5);
  const delay = (seed * 0.13) % 2;
  const rotateRange = ((seed % 7) - 3) * 2;

  return (
    <motion.div
      data-ocid={`media.item.${index + 1}`}
      onClick={onClick}
      className="absolute cursor-pointer rounded-2xl overflow-hidden"
      style={{
        left: `min(${left}%, calc(100% - ${size}px - 8px))`,
        top: `${top}px`,
        width: `${size}px`,
        maxWidth: "calc(100% - 16px)",
        height: `${size}px`,
        border: "1.5px solid oklch(72% 0.14 148 / 0.4)",
        boxShadow:
          "0 4px 24px oklch(60% 0.1 148 / 0.15), 0 0 40px oklch(65% 0.12 148 / 0.08)",
      }}
      initial={{ opacity: 0, scale: 0.6, y: 30 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -18, 0],
        rotate: [0, rotateRange, 0],
      }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
        y: {
          duration,
          delay,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          ease: "easeInOut",
        },
        rotate: {
          duration: duration * 1.3,
          delay,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          ease: "easeInOut",
        },
      }}
      whileHover={{
        scale: 1.12,
        zIndex: 10,
        boxShadow:
          "0 8px 40px oklch(62% 0.14 148 / 0.3), 0 0 60px oklch(65% 0.12 148 / 0.15)",
      }}
    >
      {isVideo ? (
        <>
          {/* preload="none" so thumbnails don't compete with the intro video for bandwidth */}
          <video
            src={media.file.getDirectURL()}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="none"
          />
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.38)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: "oklch(55% 0.2 148 / 0.9)",
                boxShadow: "0 0 20px oklch(60% 0.22 148 / 0.6)",
              }}
            >
              <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
            </div>
          </div>
        </>
      ) : (
        <img
          src={media.file.getDirectURL()}
          alt={media.title}
          className="w-full h-full object-cover"
        />
      )}
    </motion.div>
  );
}

function FloatingGallery({ items }: { items: MediaEntry[] }) {
  const [selected, setSelected] = useState<MediaEntry | null>(null);

  if (items.length === 0) return null;

  const containerHeight = Math.max(items.length * 220 + 400, 800);

  return (
    <>
      <div
        data-ocid="gallery.canvas_target"
        className="relative w-full overflow-visible"
        style={{ height: `${containerHeight}px` }}
      >
        {items.map((item, i) => (
          <FloatingItem
            key={item.id}
            media={item}
            index={i}
            onClick={() => setSelected(item)}
          />
        ))}
      </div>

      {selected && (
        <HalfScreenViewer media={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

// ─── Standard grids (other groups) ──────────────────────────────────────────

function PhotoLightbox({
  media,
  onClose,
}: { media: MediaEntry; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        data-ocid="photo.dialog"
        className="max-w-4xl w-full p-0 border-0 shadow-none"
        style={{ background: "transparent" }}
      >
        <button
          type="button"
          onClick={onClose}
          data-ocid="photo.close_button"
          className="absolute top-4 right-4 z-50 rounded-full p-2 transition-colors"
          style={{
            background: "oklch(20% 0.06 148 / 0.85)",
            color: "white",
            border: "1px solid oklch(40% 0.1 148 / 0.4)",
          }}
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={media.file.getDirectURL()}
          alt={media.title}
          className="w-full h-full object-contain rounded-xl"
          style={{ maxHeight: "85vh" }}
        />
        <p
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm px-4 py-1.5 rounded-full"
          style={{
            background: "oklch(20% 0.06 148 / 0.85)",
            color: "rgba(255,255,255,0.9)",
          }}
        >
          {media.title}
        </p>
      </DialogContent>
    </Dialog>
  );
}

function VideoModal({
  media,
  onClose,
}: { media: MediaEntry; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        data-ocid="video.dialog"
        className="max-w-4xl w-full p-4 border"
        style={{
          background: "oklch(100% 0 0)",
          borderColor: "oklch(78% 0.08 148 / 0.4)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          data-ocid="video.close_button"
          className="absolute top-4 right-4 z-50 rounded-full p-2 transition-colors"
          style={{
            background: "oklch(90% 0.04 148 / 0.8)",
            color: "oklch(35% 0.1 148)",
            border: "1px solid oklch(65% 0.1 148 / 0.4)",
          }}
        >
          <X className="w-5 h-5" />
        </button>
        <p
          className="font-display font-semibold mb-3"
          style={{ color: "oklch(42% 0.13 148)" }}
        >
          {media.title}
        </p>
        {/* biome-ignore lint/a11y/useMediaCaption: user-uploaded party videos */}
        <video
          src={media.file.getDirectURL()}
          controls
          autoPlay
          className="w-full rounded-lg bg-black"
          style={{ maxHeight: "75vh" }}
        />
      </DialogContent>
    </Dialog>
  );
}

function PhotoGrid({ photos }: { photos: MediaEntry[] }) {
  const [selected, setSelected] = useState<MediaEntry | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((photo, i) => (
          <motion.div
            key={photo.id}
            data-ocid={`photos.item.${i + 1}`}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: (i % 8) * 0.05 }}
            whileHover={{ scale: 1.04 }}
            className="relative group aspect-square overflow-hidden rounded-xl cursor-pointer"
            style={{
              border: "1.5px solid oklch(72% 0.12 148 / 0.3)",
              boxShadow: "0 2px 16px oklch(50% 0.08 148 / 0.15)",
            }}
            onClick={() => setSelected(photo)}
          >
            <img
              src={photo.file.getDirectURL()}
              alt={photo.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div
              className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background:
                  "linear-gradient(to top, oklch(20% 0.08 148 / 0.75), transparent)",
              }}
            >
              <p
                style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.75rem" }}
                className="truncate"
              >
                {photo.title}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {selected && (
          <PhotoLightbox media={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

function VideoGrid({ videos }: { videos: MediaEntry[] }) {
  const [selected, setSelected] = useState<MediaEntry | null>(null);

  if (videos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video, i) => (
          <motion.div
            key={video.id}
            data-ocid={`videos.item.${i + 1}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: (i % 6) * 0.07 }}
            whileHover={{ scale: 1.03, y: -4 }}
            className="relative group aspect-video overflow-hidden rounded-xl cursor-pointer"
            style={{
              border: "1.5px solid oklch(72% 0.12 148 / 0.3)",
              boxShadow: "0 2px 20px oklch(50% 0.1 148 / 0.15)",
            }}
            onClick={() => setSelected(video)}
          >
            {/* preload="none" so thumbnails don't compete with the intro video for bandwidth */}
            <video
              src={video.file.getDirectURL()}
              className="w-full h-full object-cover"
              muted
              preload="none"
            />
            <div
              className="absolute inset-0 flex items-center justify-center transition-colors"
              style={{ background: "oklch(10% 0.04 148 / 0.25)" }}
            >
              <motion.div
                whileHover={{ scale: 1.15 }}
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background: "oklch(55% 0.2 148 / 0.92)",
                  boxShadow: "0 0 24px oklch(60% 0.22 148 / 0.55)",
                }}
              >
                <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
              </motion.div>
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <p
                style={{
                  color: "rgba(255,255,255,0.92)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
                className="truncate drop-shadow"
              >
                {video.title}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {selected && (
          <VideoModal media={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function GroupPage() {
  const { groupId } = useParams({ from: "/group/$groupId" });
  const isFloatingGroup =
    groupId === "2nd_pg" || groupId === "3rd_ba" || groupId === "3rd_bcom";

  const meta = GROUP_META[groupId] ?? {
    label: groupId,
    emoji: "📁",
    desc: "Group Gallery",
  };

  const { data: allMedia, isLoading } = useListMedia();
  const groupMedia = allMedia?.filter((m) => m.group === groupId) ?? [];
  const photos = groupMedia.filter((m) => m.mediaType === MediaType.photo);
  const videos = groupMedia.filter((m) => m.mediaType === MediaType.video);
  const hasMedia = photos.length > 0 || videos.length > 0;

  const allGroupItems = [...photos, ...videos];

  const introVideo = isFloatingGroup && videos.length > 0 ? videos[0] : null;
  const introVideoUrl = introVideo?.file?.getDirectURL?.() ?? "";
  const [introDoneGroups, setIntroDoneGroups] = useState<Set<string>>(
    new Set(),
  );
  const introDone = introDoneGroups.has(groupId);
  const markIntroDone = () =>
    setIntroDoneGroups((prev) => new Set([...prev, groupId]));
  const showIntro = !!introVideo && !!introVideoUrl && !introDone && !isLoading;

  return (
    <div
      className="min-h-screen grain-overlay"
      style={{
        background:
          "linear-gradient(160deg, oklch(100% 0 0) 0%, oklch(98% 0.01 148) 50%, oklch(99% 0.008 152) 100%)",
      }}
    >
      {/* Fullscreen intro for floating groups */}
      {showIntro && <IntroVideo video={introVideo} onDone={markIntroDone} />}

      {/* Background orbs */}
      <div
        className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(80% 0.12 148 / 0.08) 0%, transparent 70%)",
          filter: "blur(70px)",
          transform: "translate(-30%, -30%)",
        }}
      />
      <div
        className="fixed bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(85% 0.1 75 / 0.06) 0%, transparent 70%)",
          filter: "blur(60px)",
          transform: "translate(30%, 30%)",
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md"
        style={{
          borderBottom: "1px solid oklch(70% 0.08 148 / 0.25)",
          background: "oklch(100% 0 0 / 0.92)",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link
            to="/"
            data-ocid="group.back.button"
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full transition-all hover:scale-105"
            style={{
              color: "oklch(42% 0.13 148)",
              background: "oklch(95% 0.02 148 / 0.8)",
              border: "1px solid oklch(60% 0.12 148 / 0.4)",
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{meta.emoji}</span>
            <div>
              <h1
                className="font-display font-bold text-lg leading-none"
                style={{ color: "oklch(28% 0.07 155)" }}
              >
                {meta.label}
              </h1>
              <p
                className="font-body text-xs"
                style={{ color: "oklch(48% 0.12 148)" }}
              >
                {meta.desc}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-10">
        {isLoading ? (
          <div data-ocid="group.loading_state">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {SKELETON_KEYS.map((k) => (
                <Skeleton
                  key={k}
                  className="aspect-square rounded-xl"
                  style={{ background: "oklch(90% 0.04 148 / 0.6)" }}
                />
              ))}
            </div>
          </div>
        ) : !hasMedia ? (
          <motion.div
            data-ocid="group.empty_state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="text-6xl mb-6">{meta.emoji}</div>
            <h2
              className="font-display text-2xl font-semibold mb-2"
              style={{ color: "oklch(35% 0.1 148)" }}
            >
              No memories yet
            </h2>
            <p
              className="font-body text-sm"
              style={{ color: "oklch(48% 0.1 148)" }}
            >
              Photos and videos for {meta.label} will appear here soon!
            </p>
          </motion.div>
        ) : isFloatingGroup ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <span className="text-2xl">✨</span>
              <h2
                className="font-display text-2xl font-semibold"
                style={{ color: "oklch(28% 0.07 155)" }}
              >
                Memories
              </h2>
              <span
                className="font-body text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: "oklch(92% 0.05 148 / 0.8)",
                  color: "oklch(42% 0.14 148)",
                  border: "1px solid oklch(62% 0.12 148 / 0.4)",
                }}
              >
                {allGroupItems.length}
              </span>
            </div>
            <FloatingGallery items={allGroupItems} />
          </motion.div>
        ) : (
          <div className="space-y-14">
            {photos.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Camera
                    className="w-5 h-5"
                    style={{ color: "oklch(52% 0.2 148)" }}
                  />
                  <h2
                    className="font-display text-2xl font-semibold"
                    style={{ color: "oklch(28% 0.07 155)" }}
                  >
                    Photos
                  </h2>
                  <span
                    className="font-body text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "oklch(92% 0.05 148 / 0.8)",
                      color: "oklch(42% 0.14 148)",
                      border: "1px solid oklch(62% 0.12 148 / 0.4)",
                    }}
                  >
                    {photos.length}
                  </span>
                </div>
                <PhotoGrid photos={photos} />
              </motion.section>
            )}

            {videos.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Film
                    className="w-5 h-5"
                    style={{ color: "oklch(52% 0.2 148)" }}
                  />
                  <h2
                    className="font-display text-2xl font-semibold"
                    style={{ color: "oklch(28% 0.07 155)" }}
                  >
                    Videos
                  </h2>
                  <span
                    className="font-body text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "oklch(92% 0.05 148 / 0.8)",
                      color: "oklch(42% 0.14 148)",
                      border: "1px solid oklch(62% 0.12 148 / 0.4)",
                    }}
                  >
                    {videos.length}
                  </span>
                </div>
                <VideoGrid videos={videos} />
              </motion.section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

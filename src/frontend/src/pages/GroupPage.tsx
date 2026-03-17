import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Camera, Film, Play, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MediaType } from "../backend";
import type { MediaEntry } from "../backend";
import { useListMedia } from "../hooks/useQueries";

// TODO: Replace with actual intro video URL
const INTRO_VIDEO_URL_2ND_PG = "https://www.w3schools.com/html/mov_bbb.mp4";

const GROUP_META: Record<
  string,
  { label: string; emoji: string; desc: string }
> = {
  "2nd_pg": { label: "2nd PG", emoji: "🎓", desc: "Postgraduate Batch" },
  "3rd_bcom": { label: "3rd B.Com", emoji: "📊", desc: "Bachelor of Commerce" },
  "3rd_ba": { label: "3rd B.A", emoji: "📚", desc: "Bachelor of Arts" },
};

const SKELETON_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6"];

// ─── Intro Video Overlay (2nd PG only) ──────────────────────────────────────

function IntroVideoOverlay({ onDone }: { onDone: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [exiting, setExiting] = useState(false);

  const handleDone = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    // Let the CSS transition run (1.2s), then call onDone
    setTimeout(onDone, 1200);
  }, [exiting, onDone]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.play().catch(() => {
      // Autoplay blocked — skip straight to gallery
      handleDone();
    });
  }, [handleDone]);

  return (
    <div
      data-ocid="intro.video"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      style={{
        transition: exiting
          ? "opacity 1.2s ease-in, transform 1.2s ease-in"
          : "none",
        opacity: exiting ? 0 : 1,
        transform: exiting ? "scale(2.5)" : "scale(1)",
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      {/* biome-ignore lint/a11y/useMediaCaption: intro cinematic video */}
      <video
        ref={videoRef}
        src={INTRO_VIDEO_URL_2ND_PG}
        className="w-full h-full object-cover"
        playsInline
        onEnded={handleDone}
      />

      {/* Skip button */}
      {!exiting && (
        <button
          type="button"
          data-ocid="intro.skip_button"
          onClick={handleDone}
          className="absolute bottom-8 right-8 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body text-white/80 hover:text-white transition-colors"
          style={{
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          Skip <span className="opacity-60">›</span>
        </button>
      )}
    </div>
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
          style={{ background: "rgba(0,0,0,0.6)" }}
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
            background: "oklch(12% 0.04 145)",
            borderTop: "1px solid oklch(40% 0.08 148 / 0.5)",
          }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
        >
          {/* Header bar */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: "1px solid oklch(30% 0.06 145 / 0.5)" }}
          >
            <p className="font-body text-sm font-medium text-white/90 truncate pr-4">
              {media.title}
            </p>
            <button
              type="button"
              data-ocid="viewer.close_button"
              onClick={onClose}
              className="shrink-0 rounded-full p-1.5 text-white/70 hover:text-white transition-colors"
              style={{ background: "oklch(25% 0.06 145)" }}
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

// ─── Floating Gallery (2nd PG) ───────────────────────────────────────────────

interface FloatingItemProps {
  media: MediaEntry;
  index: number;
  onClick: () => void;
}

function FloatingItem({ media, index, onClick }: FloatingItemProps) {
  const isVideo = media.mediaType === MediaType.video;
  // Deterministic pseudo-random positions from index
  const seed = index * 137 + 42;
  const left = ((seed * 31) % 80) + 5; // 5–85 vw
  const top = index * 220 + ((seed * 17) % 120); // spread down the tall container
  const size = 150 + ((seed * 7) % 60); // 150–210px
  const duration = 3 + ((seed * 3) % 3.5); // 3–6.5s
  const delay = (seed * 0.13) % 2; // 0–2s
  const rotateRange = ((seed % 7) - 3) * 2; // -6 to +6 deg

  return (
    <motion.div
      data-ocid={`media.item.${index + 1}`}
      onClick={onClick}
      className="absolute cursor-pointer rounded-2xl overflow-hidden shadow-xl"
      style={{
        left: `${left}%`,
        top: `${top}px`,
        width: `${size}px`,
        height: `${size}px`,
        border: "2px solid oklch(75% 0.12 148 / 0.4)",
      }}
      initial={{ opacity: 0, scale: 0.6, y: 30 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -18, 0],
        rotate: [0, rotateRange, 0],
      }}
      transition={{
        opacity: { duration: 0.5, delay: delay },
        scale: { duration: 0.5, delay: delay },
        y: {
          duration: duration,
          delay: delay,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          ease: "easeInOut",
        },
        rotate: {
          duration: duration * 1.3,
          delay: delay,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          ease: "easeInOut",
        },
      }}
      whileHover={{ scale: 1.1, zIndex: 10 }}
    >
      {isVideo ? (
        <>
          {/* biome-ignore lint/a11y/useMediaCaption: thumbnail preview */}
          <video
            src={media.file.getDirectURL()}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.35)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "oklch(65% 0.15 148 / 0.9)" }}
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

  // Container height: enough to spread all items with 220px per row
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
          className="absolute top-4 right-4 z-50 text-white rounded-full p-2 transition-colors"
          style={{ background: "oklch(20% 0.04 145 / 0.6)" }}
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
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white font-body text-sm px-4 py-1.5 rounded-full"
          style={{ background: "oklch(20% 0.04 145 / 0.6)" }}
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
          background: "oklch(98% 0.008 145)",
          borderColor: "oklch(85% 0.05 145)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          data-ocid="video.close_button"
          className="absolute top-4 right-4 z-50 rounded-full p-2 transition-colors"
          style={{ background: "oklch(20% 0.04 145 / 0.5)", color: "white" }}
        >
          <X className="w-5 h-5" />
        </button>
        <p
          className="font-display font-semibold mb-3"
          style={{ color: "oklch(30% 0.08 148)" }}
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
            whileHover={{ scale: 1.03 }}
            className="relative group aspect-square overflow-hidden rounded-xl cursor-pointer"
            style={{ border: "1.5px solid oklch(85% 0.06 148 / 0.5)" }}
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
                  "linear-gradient(to top, oklch(30% 0.08 148 / 0.7), transparent)",
              }}
            >
              <p className="text-white text-xs font-body truncate">
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
            style={{ border: "1.5px solid oklch(85% 0.06 148 / 0.5)" }}
            onClick={() => setSelected(video)}
          >
            {/* biome-ignore lint/a11y/useMediaCaption: user-uploaded party videos */}
            <video
              src={video.file.getDirectURL()}
              className="w-full h-full object-cover"
              muted
            />
            <div
              className="absolute inset-0 flex items-center justify-center transition-colors"
              style={{ background: "oklch(20% 0.06 148 / 0.3)" }}
            >
              <motion.div
                whileHover={{ scale: 1.15 }}
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: "oklch(65% 0.13 148 / 0.92)" }}
              >
                <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
              </motion.div>
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white text-sm font-body font-medium truncate drop-shadow">
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
  const is2ndPG = groupId === "2nd_pg";

  const meta = GROUP_META[groupId] ?? {
    label: groupId,
    emoji: "📁",
    desc: "Group Gallery",
  };

  const [introPlaying, setIntroPlaying] = useState(is2ndPG);

  const { data: allMedia, isLoading } = useListMedia();
  const groupMedia = allMedia?.filter((m) => m.group === groupId) ?? [];
  const photos = groupMedia.filter((m) => m.mediaType === MediaType.photo);
  const videos = groupMedia.filter((m) => m.mediaType === MediaType.video);
  const hasMedia = photos.length > 0 || videos.length > 0;

  // For 2nd PG, merge photos + videos into a single floating list
  const allGroupItems = [...photos, ...videos];

  return (
    <div
      className="min-h-screen grain-overlay"
      style={{ background: "oklch(96% 0.018 145)" }}
    >
      {/* Intro video overlay — 2nd PG only */}
      {is2ndPG && introPlaying && (
        <IntroVideoOverlay onDone={() => setIntroPlaying(false)} />
      )}

      {/* Background orb */}
      <div
        className="fixed top-0 left-0 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(65% 0.13 148 / 0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
          transform: "translate(-30%, -30%)",
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md"
        style={{
          borderBottom: "1px solid oklch(85% 0.04 145)",
          background: "oklch(97% 0.012 145 / 0.85)",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link
            to="/"
            data-ocid="group.back.button"
            className="flex items-center gap-2 font-body text-sm px-3 py-1.5 rounded-full transition-all hover:scale-105"
            style={{
              color: "oklch(42% 0.12 148)",
              background: "oklch(88% 0.06 145 / 0.6)",
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
                style={{ color: "oklch(28% 0.1 155)" }}
              >
                {meta.label}
              </h1>
              <p
                className="font-body text-xs"
                style={{ color: "oklch(55% 0.07 148)" }}
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
                <Skeleton key={k} className="aspect-square rounded-xl" />
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
              style={{ color: "oklch(35% 0.1 155)" }}
            >
              No memories yet
            </h2>
            <p
              className="font-body text-sm"
              style={{ color: "oklch(58% 0.07 148)" }}
            >
              Photos and videos for {meta.label} will appear here soon!
            </p>
          </motion.div>
        ) : is2ndPG ? (
          /* ── 2nd PG: Floating gallery ── */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <span className="text-2xl">✨</span>
              <h2
                className="font-display text-2xl font-semibold"
                style={{ color: "oklch(28% 0.1 155)" }}
              >
                Memories
              </h2>
              <span
                className="font-body text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: "oklch(85% 0.08 148 / 0.5)",
                  color: "oklch(40% 0.1 148)",
                }}
              >
                {allGroupItems.length}
              </span>
            </div>
            <FloatingGallery items={allGroupItems} />
          </motion.div>
        ) : (
          /* ── Other groups: Standard grid layout ── */
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
                    style={{ color: "oklch(52% 0.13 148)" }}
                  />
                  <h2
                    className="font-display text-2xl font-semibold"
                    style={{ color: "oklch(28% 0.1 155)" }}
                  >
                    Photos
                  </h2>
                  <span
                    className="font-body text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "oklch(85% 0.08 148 / 0.5)",
                      color: "oklch(40% 0.1 148)",
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
                    style={{ color: "oklch(52% 0.13 148)" }}
                  />
                  <h2
                    className="font-display text-2xl font-semibold"
                    style={{ color: "oklch(28% 0.1 155)" }}
                  >
                    Videos
                  </h2>
                  <span
                    className="font-body text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "oklch(85% 0.08 148 / 0.5)",
                      color: "oklch(40% 0.1 148)",
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

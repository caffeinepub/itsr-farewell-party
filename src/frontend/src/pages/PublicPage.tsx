import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { MediaType } from "../backend";
import { useListMedia } from "../hooks/useQueries";

const GROUPS = [
  {
    id: "2nd_pg",
    label: "2nd PG",
    emoji: "🎓",
    desc: "Postgraduate Batch",
    delay: 0.5,
    floatDelay: "0s",
  },
  {
    id: "3rd_bcom",
    label: "3rd B.Com",
    emoji: "📊",
    desc: "Bachelor of Commerce",
    delay: 0.65,
    floatDelay: "1.5s",
  },
  {
    id: "3rd_ba",
    label: "3rd B.A",
    emoji: "📚",
    desc: "Bachelor of Arts",
    delay: 0.8,
    floatDelay: "3s",
  },
];

// All cards: identical white glass with soft floating light green glow
const CARD_STYLE = {
  background: "oklch(100% 0 0 / 0.82)",
  border: "1.5px solid oklch(68% 0.14 148 / 0.4)",
  boxShadow:
    "0 8px 32px oklch(60% 0.14 148 / 0.18), inset 0 1px 0 oklch(92% 0.08 148 / 0.5)",
  hoverShadow:
    "0 14px 50px oklch(55% 0.17 148 / 0.28), 0 0 40px oklch(62% 0.16 148 / 0.18)",
  hoverBorder: "oklch(58% 0.18 148 / 0.6)",
};

// Stars for sparkle layer
const STARS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 5) % 95}%`,
  top: `${(i * 53 + 8) % 90}%`,
  size: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
  delay: (i * 0.3) % 4,
  dur: 2 + (i % 3),
}));

// Orbs: light pastel colors, low opacity
const ORBS = [
  {
    size: 420,
    x: "5%",
    y: "10%",
    hue: 148,
    lum: "75%",
    chroma: "0.15",
    opacity: 0.15,
    delay: 0,
  },
  {
    size: 280,
    x: "76%",
    y: "6%",
    hue: 75,
    lum: "82%",
    chroma: "0.12",
    opacity: 0.18,
    delay: 2,
  },
  {
    size: 200,
    x: "58%",
    y: "52%",
    hue: 148,
    lum: "75%",
    chroma: "0.13",
    opacity: 0.12,
    delay: 4,
  },
  {
    size: 320,
    x: "12%",
    y: "66%",
    hue: 155,
    lum: "78%",
    chroma: "0.11",
    opacity: 0.14,
    delay: 1.5,
  },
  {
    size: 150,
    x: "86%",
    y: "72%",
    hue: 80,
    lum: "80%",
    chroma: "0.13",
    opacity: 0.16,
    delay: 3,
  },
  {
    size: 100,
    x: "48%",
    y: "20%",
    hue: 148,
    lum: "76%",
    chroma: "0.14",
    opacity: 0.12,
    delay: 5,
  },
];

function FloatingOrb({
  size,
  x,
  y,
  hue,
  lum,
  chroma,
  opacity,
  delay,
}: {
  size: number;
  x: string;
  y: string;
  hue: number;
  lum: string;
  chroma: string;
  opacity: number;
  delay: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: `radial-gradient(circle, oklch(${lum} ${chroma} ${hue}) 0%, oklch(${lum} ${chroma} ${hue} / 0.2) 55%, transparent 80%)`,
        opacity,
        filter: "blur(60px)",
      }}
      animate={{ y: [0, -24, 0], scale: [1, 1.07, 1] }}
      transition={{
        duration: 9 + delay,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

function FloatingLeaves() {
  const leaves = [
    { x: "10%", delay: 0, dur: 12 },
    { x: "25%", delay: 2, dur: 15 },
    { x: "45%", delay: 4, dur: 11 },
    { x: "65%", delay: 1, dur: 14 },
    { x: "80%", delay: 3, dur: 13 },
    { x: "92%", delay: 5, dur: 16 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {leaves.map((leaf, i) => (
        <motion.div
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative elements
          key={i}
          className="absolute text-2xl select-none"
          style={{ left: leaf.x, top: "-40px" }}
          animate={{
            y: ["0vh", "110vh"],
            x: ["0px", `${(i % 2 === 0 ? 1 : -1) * 60}px`],
            rotate: [0, 360],
            opacity: [0, 0.4, 0.4, 0],
          }}
          transition={{
            duration: leaf.dur,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: leaf.delay,
            times: [0, 0.1, 0.9, 1],
          }}
        >
          🍃
        </motion.div>
      ))}
    </div>
  );
}

// Hidden component that preloads intro video URLs while user is on homepage
function VideoPreloader() {
  const { data: allMedia } = useListMedia();

  useEffect(() => {
    if (!allMedia) return;
    const introGroups = ["2nd_pg", "3rd_bcom", "3rd_ba"];
    const injected: HTMLLinkElement[] = [];

    for (const groupId of introGroups) {
      const videos = allMedia.filter(
        (m) => m.group === groupId && m.mediaType === MediaType.video,
      );
      if (videos.length === 0) continue;
      const url = videos[0].file?.getDirectURL?.();
      if (!url) continue;

      // Inject <link rel="preload" as="video"> so browser starts fetching immediately
      const existing = document.querySelector(`link[href="${url}"]`);
      if (existing) continue;

      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "video";
      link.href = url;
      document.head.appendChild(link);
      injected.push(link);
    }

    // Clean up on unmount
    return () => {
      for (const link of injected) {
        try {
          document.head.removeChild(link);
        } catch {
          /* already removed */
        }
      }
    };
  }, [allMedia]);

  return null;
}

export default function PublicPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 0.8,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -Math.random() * 0.5 - 0.15,
      alpha: Math.random() * 0.3 + 0.15,
      isGold: Math.random() > 0.7,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        if (p.isGold) {
          ctx.fillStyle = `rgba(180, 140, 40, ${p.alpha * 0.6})`;
        } else {
          ctx.fillStyle = `rgba(60, 160, 90, ${p.alpha})`;
        }
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      className="relative min-h-screen overflow-hidden grain-overlay"
      style={{
        background:
          "linear-gradient(135deg, oklch(97% 0.012 145) 0%, oklch(94% 0.025 148) 40%, oklch(96% 0.018 155) 100%)",
      }}
    >
      {/* Preload intro videos in background while user is on homepage */}
      <VideoPreloader />

      {/* Canvas particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
      />

      {/* Sparkle star dots */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {STARS.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              background: "rgba(60, 130, 80, 0.4)",
            }}
            animate={{ opacity: [0.1, 0.5, 0.1] }}
            transition={{
              duration: star.dur,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: star.delay,
            }}
          />
        ))}
      </div>

      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {ORBS.map((orb, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative elements
          <FloatingOrb key={i} {...orb} />
        ))}
      </div>

      {/* Floating leaves */}
      <div className="absolute inset-0 z-0">
        <FloatingLeaves />
      </div>

      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5">
        <div
          className="font-display font-bold text-xl tracking-wider"
          style={{
            color: "oklch(55% 0.16 75)",
            textShadow:
              "0 0 16px oklch(70% 0.15 75 / 0.35), 0 1px 6px oklch(65% 0.14 75 / 0.2)",
          }}
        >
          ITSR
        </div>
        <Link
          to="/admin"
          data-ocid="nav.link"
          className="font-body text-sm px-4 py-1.5 rounded-full transition-all hover:scale-105"
          style={{
            color: "oklch(42% 0.13 148)",
            background: "oklch(95% 0.02 148 / 0.8)",
            border: "1px solid oklch(60% 0.12 148 / 0.4)",
          }}
        >
          Admin
        </Link>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 pb-16">
        {/* #HOME title card */}
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl px-10 py-5 mb-5 shadow-lg"
          style={{
            background: "oklch(99% 0.006 145 / 0.8)",
            border: "1px solid oklch(70% 0.12 75 / 0.4)",
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 8px 40px oklch(70% 0.15 75 / 0.25), inset 0 1px 0 oklch(80% 0.15 75 / 0.2)",
          }}
        >
          <h1
            className="font-display text-5xl md:text-6xl font-bold tracking-tight text-center"
            style={{
              color: "oklch(62% 0.18 75)",
              textShadow:
                "0 0 30px oklch(70% 0.17 75 / 0.5), 0 2px 14px oklch(65% 0.16 75 / 0.3)",
            }}
          >
            #HOME
          </h1>
        </motion.div>

        {/* Tagline card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-xl px-8 py-4 mb-14 max-w-xl text-center shadow-md"
          style={{
            background: "oklch(98% 0.01 148 / 0.75)",
            border: "1px solid oklch(72% 0.1 148 / 0.3)",
            backdropFilter: "blur(16px)",
          }}
        >
          <p
            className="font-body text-base md:text-lg leading-relaxed italic"
            style={{ color: "oklch(35% 0.06 155)" }}
          >
            "It was never the college, It is the people who made it feel like{" "}
            <span
              style={{
                color: "oklch(62% 0.18 75)",
                fontStyle: "normal",
                fontWeight: 700,
                textShadow: "0 0 10px oklch(70% 0.16 75 / 0.4)",
              }}
            >
              HOME
            </span>
            "
          </p>
        </motion.div>

        {/* Group cards */}
        <div className="flex flex-col sm:flex-row gap-5 md:gap-8 items-center justify-center w-full max-w-3xl">
          {GROUPS.map((group) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.8,
                delay: group.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="w-full sm:w-56"
              style={{
                animation: "float-slow 7s ease-in-out infinite",
                animationDelay: group.floatDelay,
              }}
            >
              <Link
                to="/group/$groupId"
                params={{ groupId: group.id }}
                data-ocid={`group.${group.id}.button`}
                className="block"
              >
                <motion.div
                  whileHover={{ scale: 1.07, y: -8 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="rounded-2xl p-8 text-center cursor-pointer transition-all"
                  style={{
                    background: CARD_STYLE.background,
                    border: CARD_STYLE.border,
                    backdropFilter: "blur(20px)",
                    boxShadow: CARD_STYLE.boxShadow,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      CARD_STYLE.hoverShadow;
                    (e.currentTarget as HTMLElement).style.borderColor =
                      CARD_STYLE.hoverBorder;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      CARD_STYLE.boxShadow;
                    (e.currentTarget as HTMLElement).style.borderColor = "";
                    (e.currentTarget as HTMLElement).style.border =
                      CARD_STYLE.border;
                  }}
                >
                  <div className="text-4xl mb-3">{group.emoji}</div>
                  <h2
                    className="font-display text-2xl font-bold mb-1"
                    style={{ color: "oklch(28% 0.07 155)" }}
                  >
                    {group.label}
                  </h2>
                  <p
                    className="font-body text-xs tracking-wider uppercase"
                    style={{ color: "oklch(48% 0.12 148)" }}
                  >
                    {group.desc}
                  </p>
                  <div
                    className="mt-4 mx-auto w-10 h-0.5 rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, oklch(55% 0.16 148 / 0.5), transparent)",
                    }}
                  />
                  <p
                    className="mt-3 font-body text-xs"
                    style={{ color: "oklch(52% 0.14 148)" }}
                  >
                    View Gallery →
                  </p>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 py-6 text-center border-t"
        style={{ borderColor: "oklch(75% 0.08 148 / 0.4)" }}
      >
        <p
          className="font-body text-xs mb-1 font-medium tracking-wide"
          style={{ color: "oklch(52% 0.1 148)" }}
        >
          powered by ksu union itsr 2k25-26
        </p>
        <p
          className="font-body text-sm"
          style={{ color: "oklch(52% 0.1 148)" }}
        >
          © {new Date().getFullYear()} ITSR Farewell ·{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: "oklch(52% 0.14 148)" }}
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

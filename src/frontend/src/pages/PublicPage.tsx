import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";

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

// Floating background orbs data
const ORBS = [
  { size: 340, x: "8%", y: "12%", opacity: 0.22, delay: 0 },
  { size: 220, x: "78%", y: "8%", opacity: 0.18, delay: 2 },
  { size: 180, x: "60%", y: "55%", opacity: 0.14, delay: 4 },
  { size: 260, x: "15%", y: "68%", opacity: 0.16, delay: 1.5 },
  { size: 120, x: "88%", y: "75%", opacity: 0.2, delay: 3 },
  { size: 80, x: "50%", y: "22%", opacity: 0.12, delay: 5 },
];

function FloatingOrb({
  size,
  x,
  y,
  opacity,
  delay,
}: {
  size: number;
  x: string;
  y: string;
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
        background:
          "radial-gradient(circle, oklch(65% 0.15 148) 0%, oklch(80% 0.08 148 / 0.3) 60%, transparent 80%)",
        opacity,
        filter: "blur(40px)",
      }}
      animate={{
        y: [0, -20, 0],
        scale: [1, 1.06, 1],
      }}
      transition={{
        duration: 8 + delay,
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
            opacity: [0, 0.6, 0.6, 0],
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

    // Tiny floating particles
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3 + 1,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `oklch(58% 0.14 148 / ${p.alpha})`;
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
      style={{ background: "oklch(96% 0.018 145)" }}
    >
      {/* Canvas particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
      />

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
          className="font-display font-bold text-lg"
          style={{ color: "oklch(42% 0.13 148)" }}
        >
          ITSR
        </div>
        <Link
          to="/admin"
          data-ocid="nav.link"
          className="font-body text-sm px-4 py-1.5 rounded-full border transition-all"
          style={{
            color: "oklch(42% 0.13 148)",
            borderColor: "oklch(75% 0.1 148)",
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
          className="glass-card rounded-2xl px-10 py-5 mb-5 shadow-lg"
        >
          <h1
            className="font-display text-5xl md:text-6xl font-bold tracking-tight text-center"
            style={{
              color: "oklch(72% 0.17 75)",
              textShadow: "0 2px 20px oklch(75% 0.17 75 / 0.3)",
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
          className="glass-card rounded-xl px-8 py-4 mb-14 max-w-xl text-center shadow-md"
        >
          <p
            className="font-body text-base md:text-lg leading-relaxed italic"
            style={{ color: "oklch(32% 0.06 155)" }}
          >
            "It was never the college, It is the people who made it feel like{" "}
            <span
              style={{
                color: "oklch(72% 0.17 75)",
                fontStyle: "normal",
                fontWeight: 700,
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
                  whileHover={{ scale: 1.06, y: -6 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="glass-card-green rounded-2xl p-8 text-center cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
                  style={{
                    boxShadow:
                      "0 8px 32px oklch(52% 0.13 148 / 0.18), 0 2px 8px oklch(52% 0.13 148 / 0.1)",
                  }}
                >
                  <div className="text-4xl mb-3">{group.emoji}</div>
                  <h2
                    className="font-display text-2xl font-bold mb-1"
                    style={{ color: "oklch(30% 0.1 155)" }}
                  >
                    {group.label}
                  </h2>
                  <p
                    className="font-body text-xs tracking-wider uppercase"
                    style={{ color: "oklch(55% 0.08 148)" }}
                  >
                    {group.desc}
                  </p>
                  <div
                    className="mt-4 mx-auto w-10 h-0.5 rounded-full"
                    style={{ background: "oklch(65% 0.13 148 / 0.5)" }}
                  />
                  <p
                    className="mt-3 font-body text-xs"
                    style={{ color: "oklch(52% 0.1 148)" }}
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
        style={{ borderColor: "oklch(85% 0.04 145)" }}
      >
        <p
          className="font-body text-xs mb-1 font-medium tracking-wide"
          style={{ color: "oklch(48% 0.1 148)" }}
        >
          powered by ksu union itsr 2k25-26
        </p>
        <p
          className="font-body text-sm"
          style={{ color: "oklch(58% 0.06 148)" }}
        >
          © {new Date().getFullYear()} ITSR Farewell ·{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { Logo } from "@/components/brand/Logo";

const stations = [
  { label: "Jobs found", detail: "Every board you follow, polled for you" },
  { label: "Matched", detail: "Scored against your resume" },
  { label: "Applied", detail: "Answers prepared from your profile" },
  { label: "Reached", detail: "The right people, contacted politely" },
  { label: "Replies", detail: "Tracked until someone writes back" },
];

interface AuthLayoutProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-[#0d1530] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 10%, rgba(112,144,255,0.35), transparent 70%), radial-gradient(40% 40% at 90% 90%, rgba(255,148,82,0.25), transparent 70%)",
          }}
          aria-hidden
        />
        <Link to="/" className="relative w-fit rounded-md [&_span]:text-white">
          <Logo />
        </Link>
        <div className="relative">
          <h2 className="max-w-md font-display text-4xl leading-tight font-semibold">
            From job posting to a real conversation.
          </h2>
          <ol className="mt-10 flex flex-col">
            {stations.map((station, index) => (
              <motion.li
                key={station.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.1 + index * 0.08,
                  type: "spring",
                  stiffness: 260,
                  damping: 26,
                }}
                className="relative flex gap-4 pb-6 last:pb-0"
              >
                <span className="relative flex flex-col items-center">
                  <span
                    className={
                      index === stations.length - 1
                        ? "relative z-10 mt-1 size-3 rounded-full bg-[#ff9452]"
                        : "relative z-10 mt-1 size-3 rounded-full border-2 border-[#7090ff] bg-[#0d1530]"
                    }
                  >
                    {index === stations.length - 1 ? (
                      <span className="absolute inset-0 animate-pulse-ring rounded-full bg-[#ff9452]" />
                    ) : null}
                  </span>
                  {index < stations.length - 1 ? (
                    <span className="absolute top-4 bottom-[-4px] w-px bg-white/20" />
                  ) : null}
                </span>
                <span>
                  <span className="block font-medium">{station.label}</span>
                  <span className="block text-sm text-white/60">{station.detail}</span>
                </span>
              </motion.li>
            ))}
          </ol>
        </div>
        <p className="relative text-xs text-white/40">
          AutoReach never automates LinkedIn. You stay in control of every connection.
        </p>
      </aside>

      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-10 inline-flex rounded-md lg:hidden">
            <Logo />
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <h1 className="font-display text-2xl font-semibold">{title}</h1>
            {description ? <p className="mt-2 text-sm text-ink-2">{description}</p> : null}
            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-8 text-sm text-ink-2">{footer}</div> : null}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

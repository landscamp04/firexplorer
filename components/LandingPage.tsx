"use client";

import Link from "next/link"

interface LandingPageProps {
  onSelectTab?: (tab: "resources" | "about" | "home" | "storymap") => void;
}

const NAV_ITEMS = [
  { label: "resources", href: "/resources", external: false },
  { label: "about", href: "/about", external: false },
  { label: "home", href: "/", external: false },
  {
    label: "storymap",
    href: "https://storymaps.arcgis.com/stories/6ef09b9cb4d6480ea4826a7dfd557635",
    external: true,
  },
] as const;

export default function LandingPage({ onSelectTab }: LandingPageProps) {
  return (
    <section className="font-coolvetica relative min-h-screen w-full overflow-hidden bg-[#4d4d4d] text-[#f07012]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(76.08%_40.78%_at_50%_95.72%,rgba(45,19,0,0.76)_0%,rgba(0,0,0,0.74)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl -translate-y-4 flex-col px-6 py-10">
        <nav className="mx-auto mt-[30px] grid w-full max-w-[1120px] grid-cols-4 place-items-center">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onSelectTab?.(item.label)}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className="whitespace-nowrap text-[24px] leading-normal text-[#c05c13] opacity-95 transition-opacity hover:opacity-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 flex-col items-center justify-center pb-20 pt-8">
          <h1
            className="select-none text-center"
            style={{
              width: "495px",
              height: "142px",
              fontFamily: '"Coolvetica Rg", Arial, Helvetica, sans-serif',
              fontSize: "120px",
              fontStyle: "normal",
              fontWeight: 400,
              lineHeight: "normal",
              background:
                "radial-gradient(629.77% 84.55% at 36.66% 50%, #ED721A 0%, #D55900 60.1%, #FF6A00 74.83%, #363636 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            firexplorer
          </h1>
          <Link href="/explore"
            className="mt-7 rounded-full border border-[#f26f1280] px-8 py-2 text-xs tracking-wide text-[#f26f12d1] transition-all hover:border-[#f4822f] hover:text-[#ff963f]"
          >
            launch map
          </Link>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";

const NAV_ITEMS = [
  { label: "home", href: "/", external: false },
  { label: "resources", href: "/resources", external: false },
  { label: "about", href: "/about", external: false },
  {
    label: "storymap",
    href: "https://storymaps.arcgis.com/stories/6ef09b9cb4d6480ea4826a7dfd557635",
    external: true,
  },
  
] as const;

interface TopNavProps {
  activePath: "/" | "/about" | "/resources";
}

export default function TopNav({ activePath }: TopNavProps) {
  return (
    <nav className="relative z-20 flex w-full items-center justify-center gap-8 px-6 pb-2 pt-6 sm:gap-20">
      {NAV_ITEMS.map((item) =>
        item.external ? (
          <Link
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[20px] text-[#c9a08a] opacity-70 transition-all hover:text-[#e8854a] hover:opacity-100"
          >
            {item.label}
          </Link>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={`text-[20px] transition-all hover:text-[#e8854a] hover:opacity-100 ${
              item.href === activePath
                ? "text-[#e8854a] underline underline-offset-4 opacity-100"
                : "text-[#c9a08a] opacity-70"
            }`}
          >
            {item.label}
          </Link>
        )
      )}
    </nav>
  );
}

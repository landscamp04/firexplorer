"use client";

import Link from "next/link"


interface LandingPageProps {
  onSelectTab?: (tab: "resources" | "about" | "home" | "storymap") => void;
}

  const NAV_ITEMS = [
    { label: "resources", href: "/resources", external: false},
    { label: "about", href: "/about", external: false},
    { label: "home", href: "/", external: false},
    { label: "storymap", href: "https://storymaps.arcgis.com/stories/6ef09b9cb4d6480ea4826a7dfd557635", external: true},
    ] as const;

export default function AboutPage( { onSelectTab }: LandingPageProps ) {
    return (

<section className="font-coolvetica relative min-h-screen w-full overflow-hidden bg-[#4d4d4d] text-[#f07012]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(76.08%_40.78%_at_50%_95.72%,rgba(45,19,0,0.76)_0%,rgba(0,0,0,0.74)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl -translate-y-4 flex-col px-6 py-10">
        <nav className="mx-auto mt-[30px] grid w-full max-w-[1120px] grid-cols-4 place-items-center">
          {NAV_ITEMS.map((item) => 
            item.external ? (
                <Link
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap text-[24px] leading-normal text-[#c05c13] opacity-95 transition-opacity hover:opacity-100"
              >
                {item.label}
              </Link>
            ) : (
            <Link 
            key={item.href}
            href={item.href}
            onClick={() => onSelectTab?.(item.label)}
            className={`whitespace-nowrap text-[24px] leading-normal text-[#c05c13] opacity-95 transition-opacity hover:opacity-100 ${item.href === window.location.pathname ? "opacity-100" : "opacity-95"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 flex-col items-center justify-center pb-20 pt-8">
          
        </div>
      </div>
    </section>
);
}
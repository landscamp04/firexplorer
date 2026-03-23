"use client";

import Link from "next/link";
import TopNav from "@/components/TopNav";
import SiteFooter from "@/components/SiteFooter";

export default function LandingPage() {

  return (
    <section className="font-coolvetica relative min-h-screen w-full overflow-hidden bg-[#1a1210] text-[#f07012]">
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(76.08%_40.78%_at_50%_95.72%,rgba(45,19,0,0.76)_0%,rgba(0,0,0,0.74)_100%)]" />
      </div>

      <TopNav activePath="/" />

      {/* Main content */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-60px)] w-full max-w-6xl flex-col items-center justify-center px-6 pb-20">
        <h1
          className="text-[#e8854a] text-[80px] md:text-[110px] font-bold leading-none tracking-[0.03em]"
        >
          firexplorer
        </h1>

        <p className="mt-4 max-w-lg text-center text-[15px] leading-relaxed text-[#c9a08a] opacity-80">
          Explore wildfire exposure around any community in California using
          real perimeter data and proximity analysis.
        </p>

        <div className="mt-8 flex items-center gap-5">
          <Link
            href="/explore"
            className="rounded-full bg-[#e8854a] px-8 py-3 text-[13px] font-bold uppercase tracking-[0.15em] text-[#1a1210] transition-all hover:bg-[#f09a60] hover:scale-105"
          >
            Launch Explorer
          </Link>
          <Link
            href="/about"
            className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.15em] text-[#c9a08a] transition-all hover:text-[#e8854a]"
          >
            Learn More
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-px">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
    
  );
}
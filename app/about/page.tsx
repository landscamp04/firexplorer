"use client";

import Link from "next/link";
import Image from "next/image";
import TopNav from "@/components/TopNav";
import SiteFooter from "@/components/SiteFooter";
import lineFireTerrainImage from "@/app/assets/images/line-fire-terrain.png";
import firexplorerMapPreviewImage from "@/app/assets/images/firexplorer-map-preview.png";

export default function AboutPage() {
  return (
    <section className="font-coolvetica relative h-screen w-full overflow-y-auto bg-[#1a1210] text-white">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(76.08%_40.78%_at_50%_95.72%,rgba(45,19,0,0.76)_0%,rgba(0,0,0,0.74)_100%)]" />
      </div>

      <TopNav activePath="/about" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-6 pb-10">

        {/* ── Hero ── */}
        <div className="flex flex-col items-center mt-16 mb-20">
          <Link href="/" className="text-[#e8854a] text-[80px] md:text-[110px] font-bold leading-none tracking-[0.03em]">
            firexplorer
          </Link>
          <p className="mt-3 text-[#c9a08a] text-sm tracking-[0.3em] font-mono">
            /fir • iks • plor • er/
          </p>
          <div className="mt-3 w-8 h-[3px] rounded-full bg-[#e8854a]" />
        </div>

        {/* ── Section: Where It Started ── */}
        <div className="grid md:grid-cols-2 gap-10 items-center mb-28">
          {/* Left — text */}
          <div>
            <p className="text-[#e8854a] text-xs font-semibold tracking-[0.25em] uppercase mb-3">
              Origin
            </p>
            <h2 className="text-white text-[36px] md:text-[42px] font-bold leading-tight mb-6">
              Where It Started
            </h2>
            <div className="bg-[#2a1f1a] border border-[#3d2e24] rounded-xl p-6">
              <p className="text-[#c9a08a] text-[15px] leading-relaxed mb-5">
                On September 5, 2024, the{" "}
                <span className="text-white font-normal">Line Fire</span> sparked
                in Highland, CA, less than a minute from my home. It burned over{" "}
                <span className="text-[#e8854a] font-normal">43,000 acres</span>{" "}
                and left my community with one question: how exposed are we?
              </p>
              <p className="text-[#e8854a] text-[20px] font-semibold">
                That question became this app.
              </p>
            </div>
          </div>

          {/* Right — image */}
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#2a1f1a]">
            <Image
              src={lineFireTerrainImage}
              alt="Satellite view of the Line Fire burn area near Highland, CA"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>

        {/* ── Section: What It Does ── */}
        <div className="grid md:grid-cols-2 gap-10 items-center mb-28">
          {/* Left — map screenshot */}
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#2a1f1a] border border-[#3d2e24]">
            {/*firexplorer map preview */}
            <Image
              src={firexplorerMapPreviewImage}
              alt="Firexplorer app interface showing real-time perimeter data"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Overlay label */}
            <div className="absolute bottom-4 left-4 bg-[#1a1210]/80 backdrop-blur-sm border border-[#3d2e24] rounded-lg px-3 py-2">
              <p className="text-[#e8854a] text-[10px] font-semibold tracking-wider uppercase">
                Live Interface
              </p>
              <p className="text-white text-sm font-medium">
                Real-time Perimeter Data
              </p>
            </div>
            {/* Fallback gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#3d2e24] to-[#1a1210] -z-10" />
          </div>

          {/* Right — text */}
          <div>
            <p className="text-[#e8854a] text-xs font-semibold tracking-[0.25em] uppercase mb-3">
              Capability
            </p>
            <h2 className="text-white text-[36px] md:text-[42px] font-bold leading-tight mb-5">
              What It Does
            </h2>
            <p className="text-[#c9a08a] text-[15px] leading-relaxed mb-6">
              Firexplorer lets you search any California city and instantly see{" "}
              <span className="text-white font-normal underline underline-offset-2 decoration-[#e8854a]">
                25 years of nearby wildfire activity.
              </span>
            </p>

            <ul className="list-disc space-y-3 pl-5 text-[#c9a08a] text-[14px] leading-relaxed marker:text-[#e8854a]">
              <li>Adjust proximity radius for localized risk assessment.</li>
              <li>Explore granular fire details and historical impact.</li>
              <li>Pan the map to watch data update in real time.</li>
            </ul>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#3d2e24] to-transparent mb-20" />

        {/* ── CTA Section ── */}
        <div className="flex flex-col items-center mb-20">
          <h3 className="text-white text-[24px] md:text-[28px] font-bold text-center mb-6">
            Ready to explore?
          </h3>
          <Link
            href="/explore"
            className="rounded-full bg-[#e8854a] px-10 py-3 text-[15px] font-bold uppercase tracking-[0.15em] text-[#1a1210] transition-all hover:bg-[#f09a60] hover:scale-105"
          >
            Launch Explorer
          </Link>
        </div>

      </div>
      <SiteFooter />
    </section>
  );
}
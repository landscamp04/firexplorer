"use client";

import Image from "next/image";
import TopNav from "@/components/TopNav";
import SiteFooter from "@/components/SiteFooter";
import arcgisSdkIcon from "@/app/assets/images/arcgis-js-sdk-icon (1).png";
import calfireIcon from "@/app/assets/images/calfire-icon.png";
import censusIcon from "@/app/assets/images/seal-census-bureau-icon.png";
import esriIcon from "@/app/assets/images/esri-icon.png";

const RESOURCES = [
  {
    src: arcgisSdkIcon,
    alt: "ArcGIS JS SDK icon",
    title: "ArcGIS Maps SDK",
    subtitle: "GEOSPATIAL ENGINE",
    description:
      "Used to render the interactive map, display wildfire perimeter layers, perform client-side proximity analysis, and power the real-time pan-to-update functionality.",
  },
  {
    src: calfireIcon,
    alt: "CAL FIRE icon",
    title: "CAL FIRE",
    subtitle: "WILDFIRE PERIMETER DATA",
    description:
      "Source of the wildfire perimeter dataset. Over 8,000 mapped fire boundaries across California from 2000–2025 were processed and published as hosted feature layers for this application.",
  },
  {
    src: censusIcon,
    alt: "US Census Bureau seal icon",
    title: "U.S. Census Bureau",
    subtitle: "DEMOGRAPHIC SOURCE",
    description:
      "Provided the populated places dataset used to locate California cities and communities, enabling the search and proximity analysis features.",
  },
  {
    src: esriIcon,
    alt: "Esri icon",
    title: "Esri",
    subtitle: "CLOUD PLATFORM",
    description:
      "The platform powering this application. ArcGIS Online hosts the spatial data layers, and the ArcGIS Maps SDK for JavaScript enables the mapping and geospatial analysis throughout the app.",
  },
] as const;

export default function ResourcesPage() {
  return (
    <section className="font-coolvetica relative flex h-screen w-full flex-col overflow-y-auto overflow-x-hidden bg-[#1a1210] text-white">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(76.08%_40.78%_at_50%_95.72%,rgba(45,19,0,0.76)_0%,rgba(0,0,0,0.74)_100%)]" />
      </div>

      <TopNav activePath="/resources" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pt-10 pb-20">
        {/* ── Header ── */}
        <div className="mb-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#3d2e24] bg-[#2a1f1a] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e8854a] mb-5">
            <span className="h-2 w-2 rounded-full bg-[#e8854a]" />
            Infrastructure &amp; Data
          </span>
          <h1 className="text-[48px] md:text-[64px] font-bold leading-[1.05] text-white">
            The <span className="italic text-[#e8854a]">tools</span> behind the
            <br />
            insights.
          </h1>
        </div>

        {/* ── Resource Rows ── */}
        <div className="flex flex-col gap-16 md:gap-20">
          {RESOURCES.map((resource, i) => {
            const isEven = i % 2 === 0;
            return (
              <div
                key={resource.title}
                className={`flex flex-col md:flex-row items-center gap-8 md:gap-14 ${
                  isEven ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Icon */}
                <div className="flex h-28 w-28 shrink-0 items-center justify-center md:h-32 md:w-32">
                  <Image
                    src={resource.src}
                    alt={resource.alt}
                    className="h-full w-full object-contain"
                    priority
                  />
                </div>

                {/* Text */}
                <div className={`flex flex-col ${isEven ? "md:text-left" : "md:text-right"} text-center`}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#e8854a] mb-1.5 md:text-[11px]">
                    {resource.subtitle}
                  </p>
                  <h3 className="text-[24px] font-bold text-white md:text-[28px] mb-3">
                    {resource.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[#c9a08a] max-w-lg">
                    {resource.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <SiteFooter />
    </section>
  );
}
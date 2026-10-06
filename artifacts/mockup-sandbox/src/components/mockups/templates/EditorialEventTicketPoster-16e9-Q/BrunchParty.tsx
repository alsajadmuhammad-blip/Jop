import './fonts.css';
import React from "react";
import { Ticket, Clock, MapPin, Wine, CalendarDays } from "lucide-react";

export function BrunchParty() {
  return (
    <div
      style={{ width: "100%", height: "100%" }}
      className="relative overflow-hidden bg-[#F2F0E6] flex flex-col justify-between"
    >
      {/* Noise Texture */}
      <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-[0.25] z-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <filter id="noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="4"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>

      {/* Giant Typography */}
      <div className="absolute top-[40px] left-[-20px] flex flex-col leading-[0.75] text-[#0A1E4A] opacity-95 select-none pointer-events-none z-0">
        <span className="text-[200px] font-['Playfair_Display'] italic tracking-tighter">
          Ocean
        </span>
        <span className="text-[220px] font-['Playfair_Display'] font-black tracking-tighter ml-12">
          CLUB
        </span>
        <span className="text-[200px] font-['Playfair_Display'] italic tracking-tighter ml-24">
          Soirée
        </span>
      </div>

      {/* Aesthetic grid lines */}
      <div className="absolute inset-0 pointer-events-none z-0 border-[16px] border-[#0A1E4A]"></div>
      <div className="absolute top-[80px] left-0 w-full border-t border-[#0A1E4A]/20 z-0"></div>
      <div className="absolute top-[80px] left-[80px] h-full border-l border-[#0A1E4A]/20 z-0"></div>

      {/* Floating Ticket */}
      <div className="absolute bottom-16 right-12 z-20 w-[440px] rotate-[-2deg] shadow-[24px_24px_0px_rgba(10,30,74,0.15)] transition-transform hover:rotate-0 duration-500">
        <div className="bg-[#FFFCF5] border-[3px] border-[#0A1E4A] flex flex-col relative overflow-hidden">
          
          {/* Ticket Header */}
          <div className="bg-[#0A1E4A] text-[#F2F0E6] p-6 pb-8 flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-['Playfair_Display'] font-black uppercase tracking-widest">
                Admit One
              </h2>
              <p className="font-['Space_Mono'] text-xs tracking-widest uppercase mt-2 opacity-80">
                Exclusive Guest Access
              </p>
            </div>
            <Ticket className="w-10 h-10 opacity-50" />
          </div>

          {/* Ticket Body */}
          <div className="p-8 pb-4 font-['Space_Mono'] uppercase flex flex-col gap-6 text-[#0A1E4A]">
            
            {/* Cutout circles */}
            <div className="absolute top-[100px] -left-4 w-8 h-8 rounded-full bg-[#F2F0E6] border-r-[3px] border-[#0A1E4A]"></div>
            <div className="absolute top-[100px] -right-4 w-8 h-8 rounded-full bg-[#F2F0E6] border-l-[3px] border-[#0A1E4A]"></div>

            {/* Dashed separator */}
            <div className="absolute top-[116px] left-8 right-8 border-t-[3px] border-dashed border-[#0A1E4A]/20"></div>

            <div className="grid grid-cols-2 gap-y-8 gap-x-6 mt-4">
              <div>
                <div className="flex items-center gap-2 mb-2 opacity-60">
                  <CalendarDays className="w-4 h-4" />
                  <p className="text-[10px] font-bold tracking-widest">Date</p>
                </div>
                <p className="text-xl font-bold tracking-tight">SEP 15</p>
                <p className="text-sm font-medium opacity-80">2024</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2 opacity-60">
                  <Clock className="w-4 h-4" />
                  <p className="text-[10px] font-bold tracking-widest">Time</p>
                </div>
                <p className="text-xl font-bold tracking-tight">7:00 PM</p>
                <p className="text-sm font-medium opacity-80">LATE</p>
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-2 mb-2 opacity-60">
                  <MapPin className="w-4 h-4" />
                  <p className="text-[10px] font-bold tracking-widest">Location</p>
                </div>
                <p className="text-xl font-bold tracking-tight">The Pier 14</p>
                <p className="text-sm font-medium opacity-80 mt-1">2900 Ocean Blvd</p>
              </div>

              <div className="col-span-2 border-t-[3px] border-dashed border-[#0A1E4A]/20 pt-6">
                <div className="flex items-center gap-2 mb-2 opacity-60">
                  <Wine className="w-4 h-4" />
                  <p className="text-[10px] font-bold tracking-widest">Dress Code</p>
                </div>
                <p className="text-lg font-bold tracking-tight">Summer Evening Chic</p>
              </div>
            </div>
          </div>

          {/* Ticket Footer / Barcode */}
          <div className="p-8 pt-0 flex items-end justify-between">
            <div className="flex h-12 gap-1 items-end opacity-90">
              <div className="w-1.5 h-12 bg-[#0A1E4A]"></div>
              <div className="w-1 h-12 bg-[#0A1E4A]"></div>
              <div className="w-3 h-12 bg-[#0A1E4A]"></div>
              <div className="w-1 h-12 bg-[#0A1E4A]"></div>
              <div className="w-2 h-12 bg-[#0A1E4A]"></div>
              <div className="w-1.5 h-12 bg-[#0A1E4A]"></div>
              <div className="w-4 h-12 bg-[#0A1E4A]"></div>
              <div className="w-1 h-12 bg-[#0A1E4A]"></div>
              <div className="w-2 h-12 bg-[#0A1E4A]"></div>
              <div className="w-1.5 h-12 bg-[#0A1E4A]"></div>
              <div className="w-1 h-12 bg-[#0A1E4A]"></div>
              <div className="w-2 h-12 bg-[#0A1E4A]"></div>
              <div className="w-1.5 h-12 bg-[#0A1E4A]"></div>
              <div className="w-2 h-12 bg-[#0A1E4A]"></div>
            </div>
            <div className="text-right">
              <p className="font-['Space_Mono'] text-sm tracking-widest text-[#0A1E4A]/50 mb-1">
                TICKET NO.
              </p>
              <p className="font-['Space_Mono'] text-2xl font-black text-[#0A1E4A] tracking-widest">
                001
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

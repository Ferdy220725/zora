"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { channelName, EVENT_NAME, PresentasiEvent } from "@/lib/presentasiChannel";
import { ChevronLeft, ChevronRight, Radar } from "lucide-react";

export default function RemoteControl({
  params,
}: {
  params: Promise<{ kode: string; itemId: string }>;
}) {
  const { kode } = use(params);
  const supabase = createClient();

  const [slide, setSlide] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const channel = supabase.channel(channelName(kode));
    channelRef.current = channel;

    channel
      .on("broadcast", { event: EVENT_NAME }, ({ payload }) => {
        const ev = payload as PresentasiEvent;
        if (ev.type === "state_sync" || ev.type === "slide_change") {
          if ("slide" in ev) setSlide(ev.slide);
          if ("totalPages" in ev) setTotalPages(ev.totalPages);
        }
      })
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          channel.send({
            type: "broadcast",
            event: EVENT_NAME,
            payload: { type: "join" },
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kode]);

  const nav = (direction: 1 | -1) => {
    channelRef.current?.send({
      type: "broadcast",
      event: EVENT_NAME,
      payload: { type: "nav", direction },
    });
  };

  const sendPointer = (clientX: number, clientY: number) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    channelRef.current?.send({
      type: "broadcast",
      event: EVENT_NAME,
      payload: { type: "pointer_move", x, y },
    });
  };

  const hidePointer = () => {
    channelRef.current?.send({
      type: "broadcast",
      event: EVENT_NAME,
      payload: { type: "pointer_hide" },
    });
  };

  return (
    <div className="fixed inset-0 bg-[#111] text-white flex flex-col">
      <div className="p-4 text-center border-b border-white/10">
        <p className="text-white/50 text-sm">Remote presentasi</p>
        <p className="font-bold text-lg">
          {slide ?? "-"} / {totalPages ?? "-"}
        </p>
      </div>

      {/* Area laser pointer */}
      <div
        ref={padRef}
        className="flex-1 flex items-center justify-center gap-2 text-white/30 select-none touch-none"
        onTouchMove={(e) => {
          const t = e.touches[0];
          sendPointer(t.clientX, t.clientY);
        }}
        onTouchEnd={hidePointer}
        onMouseMove={(e) => {
          if (e.buttons === 1) sendPointer(e.clientX, e.clientY);
        }}
        onMouseUp={hidePointer}
        onMouseLeave={hidePointer}
      >
        <Radar size={28} />
        <span>Tahan &amp; geser di sini buat laser pointer</span>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pb-8">
        <button
          onClick={() => nav(-1)}
          className="flex items-center justify-center gap-2 bg-white/10 py-5 rounded-2xl font-bold text-lg"
        >
          <ChevronLeft /> Sebelumnya
        </button>
        <button
          onClick={() => nav(1)}
          className="flex items-center justify-center gap-2 bg-[#800020] py-5 rounded-2xl font-bold text-lg"
        >
          Berikutnya <ChevronRight />
        </button>
      </div>
    </div>
  );
}

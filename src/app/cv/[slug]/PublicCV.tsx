"use client";
import { useEffect, useRef, useState } from "react";
import CVDocument from "@/components/cv/CVDocument";
import type { CVData } from "@/lib/cv/types";

export default function PublicCV({ data }: { data: CVData }) {
  const ref = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [h, setH] = useState(1122);
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (ref.current) setScale(Math.min(1, (ref.current.clientWidth - 24) / 793.7));
      if (inner.current) setH(inner.current.offsetHeight);
    });
    if (ref.current) ro.observe(ref.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, []);
  return (
    <>
      <div className="container no-print" style={{ display: "flex", justifyContent: "flex-end", maxWidth: 840, marginBottom: 14 }}>
        <button className="btn btn-outline btn-sm" onClick={() => window.print()}>⬇ Télécharger en PDF</button>
      </div>
      <div ref={ref} className="container no-print" style={{ maxWidth: 840, display: "flex", justifyContent: "center" }}>
        <div style={{ width: 793.7 * scale, height: h * scale }}>
          <div ref={inner} style={{ width: 793.7, transform: `scale(${scale})`, transformOrigin: "top left", boxShadow: "0 10px 40px rgba(15,23,42,.15)" }}>
            <CVDocument data={data} />
          </div>
        </div>
      </div>
      <div className="print-only print-area"><CVDocument data={data} /></div>
    </>
  );
}

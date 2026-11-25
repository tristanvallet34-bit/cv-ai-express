import CVDocument from "./CVDocument";
import type { CVData } from "@/lib/cv/types";

const A4_W = 793.7; // 210mm en px (96 dpi)
const A4_H = 1122.5;

export default function CVThumb({ data, width = 240, lock }: { data: CVData; width?: number; lock?: boolean }) {
  const scale = width / A4_W;
  return (
    <div className="cv-thumb" style={{ width, height: A4_H * scale }}>
      <div className="cv-thumb-inner" style={{ transform: `scale(${scale})`, width: A4_W }}>
        <CVDocument data={data} premiumLock={lock} />
      </div>
    </div>
  );
}

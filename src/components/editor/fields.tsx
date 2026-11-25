"use client";
import type { ReactNode } from "react";

export function Field({ label, value, onChange, placeholder, type = "text", textarea, rows = 4, hint }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
  rows?: number;
  hint?: ReactNode;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {textarea ? (
        <textarea className="textarea" rows={rows} value={value} placeholder={placeholder} spellCheck lang="fr" onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="input" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <small className="muted" style={{ fontSize: ".78rem" }}>{hint}</small>}
    </div>
  );
}

export function ItemCard({ title, subtitle, open, onToggle, onRemove, onUp, onDown, children }: {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onUp?: () => void;
  onDown?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="ed-item">
      <div className="ed-item-head" onClick={onToggle}>
        <div style={{ minWidth: 0 }}>
          <strong>{title || "Sans titre"}</strong>
          {subtitle && <div className="muted ed-ellipsis">{subtitle}</div>}
        </div>
        <div className="ed-item-tools" onClick={(e) => e.stopPropagation()}>
          {onUp && <button className="ed-icon" title="Monter" onClick={onUp}>↑</button>}
          {onDown && <button className="ed-icon" title="Descendre" onClick={onDown}>↓</button>}
          <button className="ed-icon danger" title="Supprimer" onClick={onRemove}>✕</button>
          <button className="ed-icon" onClick={onToggle}>{open ? "▴" : "▾"}</button>
        </div>
      </div>
      {open && <div className="ed-item-body">{children}</div>}
    </div>
  );
}

export function move<T>(arr: T[], i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

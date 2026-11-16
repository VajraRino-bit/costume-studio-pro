import { useState } from "react";
import { nearestColorName } from "./colorNames";

export const palette = [
  ["black", "黒", "#000000"], ["white", "白", "#ffffff"],
  ["red", "赤", "#dc2626"], ["blue", "青", "#2563eb"],
  ["purple", "紫", "#9333ea"], ["pink", "ピンク", "#f472b6"],
  ["green", "緑", "#16a34a"], ["gold", "ゴールド", "#d4af37"],
  ["silver", "シルバー", "#c0c0c0"], ["navy", "ネイビー", "#1e3a5f"],
  ["burgundy", "ボルドー", "#800020"], ["ivory", "アイボリー", "#fffff0"],
  ["beige", "ベージュ", "#d8c3a5"], ["brown", "茶", "#8b4513"],
  ["gray", "グレー", "#808080"], ["yellow", "黄", "#facc15"],
  ["orange", "オレンジ", "#f97316"], ["teal", "ティール", "#008080"],
  ["lavender", "ラベンダー", "#c4b5fd"], ["mint green", "ミント", "#a7f3d0"],
] as const;

export function normalizeHex(value: string): string | null {
  const hex = value.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(hex)) return "#" + [...hex].map(c => c + c).join("").toUpperCase();
  return /^[0-9a-f]{6}$/i.test(hex) ? "#" + hex.toUpperCase() : null;
}

export default function ColorPicker({ id, label, value, onChange }: {
  id: string; label: string; value: string; onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(normalizeHex(value) || "");
  const [error, setError] = useState(false);
  const preset = palette.find(([name]) => name === value);
  const hex = normalizeHex(value);
  const custom = value !== "指定なし" && !preset;
  const applyHex = () => {
    const next = normalizeHex(draft);
    setError(!next);
    if (next) { setDraft(next); onChange(next); }
  };
  return <fieldset className="color-picker">
    <legend>{label}の色</legend>
    <label htmlFor={`${id}-preset`}>パレット
      <select id={`${id}-preset`} value={custom ? "custom" : value} onChange={e => {
        setError(false);
        if (e.target.value === "custom") { const next = hex || "#808080"; setDraft(next); onChange(next); }
        else onChange(e.target.value);
      }}>
        <option value="指定なし">指定なし</option>
        {palette.map(([name, title]) => <option key={name} value={name}>{title} / {name}</option>)}
        <option value="custom">カスタムカラー</option>
      </select>
    </label>
    <div className="swatches" role="group" aria-label={`${label}の色見本`}>
      {palette.map(([name, title, color]) => <button type="button" key={name}
        className="swatch" style={{ backgroundColor: color }} title={title}
        aria-label={title} aria-pressed={value === name}
        onClick={() => { setError(false); onChange(name); }} />)}
    </div>
    <div className="custom-color">
      <label>自由に選ぶ<input type="color" aria-label={`${label}のカラーピッカー`}
        value={hex || preset?.[2] || "#808080"} onChange={e => {
          const next = e.target.value.toUpperCase(); setDraft(next); setError(false); onChange(next);
        }}/></label>
      <label htmlFor={`${id}-hex`}>HEXコード<input id={`${id}-hex`} type="text"
        value={draft} placeholder="#AABBCC" maxLength={7} spellCheck={false}
        aria-invalid={error} aria-describedby={error ? `${id}-error` : undefined}
        onChange={e => { setDraft(e.target.value); setError(false); }}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyHex(); } }}/></label>
      <button type="button" className="secondary" onClick={applyHex}>適用</button>
    </div>
    {error && <p id={`${id}-error`} className="color-error" role="alert">3桁または6桁のHEXコードを入力してください。</p>}
    <p className="color-value">選択中: {preset ? preset[1] : value}{custom && hex ? `（プロンプトでは「${nearestColorName(hex)}」になります）` : ""}</p>
  </fieldset>;
}

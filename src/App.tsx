import { useEffect, useState } from "react";
import ColorPicker from "./ColorPicker";
import { promptColorName } from "./colorNames";

type Part = { id: string; label: string; options: string[] };
type Setting = { value: string; color: string; material: string };
type Design = { theme: string; settings: Record<string, Setting>; decorations: string[]; notes: string };
const parts: Part[] = [
  { id: "outer", label: "アウター", options: ["なし", "jacket", "long coat", "cape", "cloak", "bolero"] },
  { id: "top", label: "トップス", options: ["なし", "blouse", "corset", "shirt", "bodysuit", "crop top"] },
  { id: "collar", label: "襟", options: ["なし", "stand collar", "sailor collar", "ruffled collar", "high neck"] },
  { id: "sleeves", label: "袖", options: ["なし", "long sleeves", "short sleeves", "puff sleeves", "bell sleeves", "sleeveless"] },
  { id: "bottom", label: "ボトムス", options: ["なし", "pleated skirt", "mini skirt", "long skirt", "shorts", "slim pants"] },
  { id: "legwear", label: "レッグウェア", options: ["なし", "thigh-high stockings", "knee-high socks", "tights", "leggings"] },
  { id: "shoes", label: "靴", options: ["なし", "knee-high boots", "ankle boots", "platform boots", "pumps", "sneakers"] },
  { id: "head", label: "頭飾り", options: ["なし", "headdress", "headband", "hat", "hair ribbon", "tiara"] },
  { id: "neck", label: "首元", options: ["なし", "choker", "necktie", "bow tie", "necklace"] }
];
const themes = ["gothic", "fantasy", "cyberpunk", "Japanese-inspired", "military", "idol", "lolita", "maid", "streetwear", "sci-fi"];
const materials = ["指定なし", "lace", "leather", "silk", "satin", "velvet", "denim", "chiffon"];
const decorations = ["frills", "ribbons", "embroidery", "chains", "gemstones", "buckles", "floral motifs"];
const initial: Design = { theme: "gothic", settings: Object.fromEntries(parts.map(p => [p.id, { value: p.options[0], color: "指定なし", material: "指定なし" }])), decorations: ["frills"], notes: "" };
function restore(): Design {
  try {
    const raw = localStorage.getItem("costume-studio-design");
    if (raw) {
      const parsed = JSON.parse(raw) as Design;
      if (parsed && parsed.settings && typeof parsed.theme === "string") return parsed;
    }
  } catch { /* Unavailable storage */ }
  return initial;
}
function restorePreference<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    if (value && allowed.includes(value as T)) return value as T;
  } catch { /* Storage unavailable */ }
  return fallback;
}
function naturalNotes(input: string): string {
  const note = input.trim();
  if (!note) return "";
  const ending = /[.!?。！？]$/.test(note) ? "" : /[。！？\u3040-\u30ff\u3400-\u9fff]$/.test(note) ? "。" : ".";
  return "\\nAdditional design details: " + note + ending;
}
export default function App() {
  const [design, setDesign] = useState<Design>(restore);
  const [mode, setMode] = useState<"simple" | "advanced">(() => restorePreference("costume-studio-mode", ["simple", "advanced"], "simple"));
  const [format, setFormat] = useState<"natural" | "tags" | "compact">(() => restorePreference("costume-studio-format", ["natural", "tags", "compact"], "natural"));
  const [copied, setCopied] = useState(false);
  useEffect(() => { try { localStorage.setItem("costume-studio-design", JSON.stringify(design)); } catch { /* Unavailable storage */ } }, [design]);
  useEffect(() => { try { localStorage.setItem("costume-studio-mode", mode); } catch { /* Storage unavailable */ } }, [mode]);
  useEffect(() => { try { localStorage.setItem("costume-studio-format", format); } catch { /* Storage unavailable */ } }, [format]);
  const update = (id: string, key: keyof Setting, value: string) =>
    setDesign(d => ({ ...d, settings: { ...d.settings, [id]: { ...d.settings[id], [key]: value } } }));
  const selected = parts.flatMap(p => {
    const s = design.settings[p.id];
    if (!s || s.value === "なし") return [];
    return [s];
  });
  const phrases = selected.map(s => [promptColorName(s.color), s.material, s.value].filter(x => x !== "" && x !== "指定なし").join(" "));
  const tags = [design.theme + " outfit", ...phrases, ...design.decorations, "full body", design.notes].filter(Boolean).join(", ");
  const prompt = format === "natural"
    ? `Design a detailed ${design.theme} costume featuring ${phrases.join(", ") || "a coordinated outfit"}. ${design.decorations.length ? "Add " + design.decorations.join(", ") + ". " : ""}Keep each garment's specified colors and materials. Show the complete outfit from head to toe.${naturalNotes(design.notes)}`.trim()
    : format === "compact" ? [design.theme + " costume", ...phrases, ...design.decorations, design.notes].filter(Boolean).join(", ") : tags;
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(design, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "costume-design.json"; a.click(); URL.revokeObjectURL(url);
  };
  const copy = async () => { try { await navigator.clipboard.writeText(prompt); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch { setCopied(false); } };
  return <main className="app">
    <header><div><p className="eyebrow">MULTI-AI COSTUME PROMPT BUILDER</p><h1>Costume Studio Pro</h1><p>衣装を選んで、組み合わせて、プロンプトに。</p></div><span className="version">v0.2.1</span></header>
    <nav className="modes" aria-label="編集モード"><button className={mode === "simple" ? "active" : ""} onClick={() => setMode("simple")}>簡単モード</button><button className={mode === "advanced" ? "active" : ""} onClick={() => setMode("advanced")}>詳細モード</button></nav>
    <section className="panel"><h2>衣装テーマ</h2><div className="themes">{themes.map(t => <button key={t} className={design.theme === t ? "selected" : ""} onClick={() => setDesign(d => ({ ...d, theme: t }))}>{t}</button>)}</div></section>
    <section className="panel"><h2>{mode === "simple" ? "基本パーツ" : "詳細パーツ・配色・素材"}</h2><div className="parts">{parts.filter(p => mode === "advanced" || ["outer", "top", "bottom", "shoes"].includes(p.id)).map(p => <div className="part" key={p.id}><h3>{p.label}</h3><label>形状<select value={design.settings[p.id]?.value || "なし"} onChange={e => update(p.id, "value", e.target.value)}>{p.options.map(o => <option key={o}>{o}</option>)}</select></label>{mode === "advanced" && <div className="two"><ColorPicker id={p.id} label={p.label} value={design.settings[p.id]?.color || "指定なし"} onChange={value => update(p.id, "color", value)}/><label>素材<select value={design.settings[p.id]?.material || "指定なし"} onChange={e => update(p.id, "material", e.target.value)}>{materials.map(m => <option key={m}>{m}</option>)}</select></label></div>}</div>)}</div>{mode === "simple" && <button className="secondary" onClick={() => setMode("advanced")}>さらに細かく設定する →</button>}</section>
    <section className="panel"><h2>装飾・追加指定</h2><div className="checks">{decorations.map(d => <label key={d}><input type="checkbox" checked={design.decorations.includes(d)} onChange={e => setDesign(s => ({ ...s, decorations: e.target.checked ? [...s.decorations, d] : s.decorations.filter(x => x !== d) }))}/>{d}</label>)}</div><label>自由入力<textarea value={design.notes} onChange={e => setDesign(d => ({ ...d, notes: e.target.value }))} placeholder="例: asymmetrical gold trim, butterfly motifs"/></label></section>
    <section className="panel output"><h2>プロンプト出力</h2><label>出力形式<select value={format} onChange={e => setFormat(e.target.value as typeof format)}><option value="natural">自然文（ChatGPT画像生成など）</option><option value="tags">タグ形式（NovelAI / SD系の基本形）</option><option value="compact">汎用・短文</option></select></label><textarea readOnly aria-label="生成プロンプト" value={prompt} rows={7}/><div className="actions"><button onClick={copy}>{copied ? "コピーしました ✓" : "プロンプトをコピー"}</button><button className="secondary" onClick={exportJSON}>設定をJSON保存</button></div><p className="hint">衣装設定・編集モード・出力形式はこのブラウザに自動保存されます。詳細モードでは色見本・カラーピッカー・HEXコードで配色を指定できます。カスタムカラーは、生成AIが理解しやすいよう最も近い色名に変換して出力されます。タグ形式は汎用版で、モデル固有の最適化は今後追加予定です。</p></section>
  </main>;
}

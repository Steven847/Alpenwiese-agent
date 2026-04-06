// app/page.tsx — Alpenwiese Social Media Agent Dashboard v2

"use client";

import { useState } from "react";

type Scene = {
  scene: number;
  prompt: string;
  overlay: string;
  duration: number;
  videoUrl?: string;
  status?: "pending" | "generating" | "done" | "error";
  feedback?: string;
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("generate");
  const [contentType, setContentType] = useState("post");
  const [tone, setTone] = useState("witzig");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  // Reel Builder state
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [reelTheme, setReelTheme] = useState("");
  const [reelCaption, setReelCaption] = useState<string | null>(null);
  const [buildingReel, setBuildingReel] = useState(false);

  const C = {
    forest: "#1B5E20", meadow: "#4CAF50", alpine: "#81C784",
    snow: "#F1F8E9", gold: "#FFD54F", bark: "#3E2723",
    stone: "#5D4037", cream: "#FAFDF6",
  };

  const generate = async () => {
    setLoading(true); setResult(null); setStatus("Generiere Content...");
    try {
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentType, tone, topic }) });
      const data = await res.json();
      setResult(data.content || data.error); setStatus(null);
    } catch (e: any) { setResult("Fehler: " + e.message); setStatus(null); }
    setLoading(false);
  };

  const generateImage = async () => {
    setLoading(true); setImagePreview(null); setStatus("Generiere Bild mit Nano Banana 2...");
    try {
      const res = await fetch("/api/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: topic || "Swiss Alpine meadow with Alpenwiese branding", aspectRatio: "1:1" }) });
      const data = await res.json();
      if (data.success) { setImagePreview(data.image.dataUrl); setStatus("Bild generiert!"); }
      else { setStatus("Fehler: " + data.error); }
    } catch (e: any) { setStatus("Fehler: " + e.message); }
    setLoading(false);
  };

  const publishToInstagram = async () => {
    if (!result) return; setStatus("Veröffentliche auf Instagram...");
    try {
      const res = await fetch("/api/instagram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "publish_image", imageUrl: imagePreview, caption: result }) });
      const data = await res.json();
      setStatus(data.success ? "Erfolgreich gepostet!" : "Fehler: " + data.error);
    } catch (e: any) { setStatus("Fehler: " + e.message); }
  };

  const generateSingleVideo = async () => {
    setLoading(true); setStatus("Generiere Video mit Veo 2... (1-3 Min)"); setResult(null);
    try {
      const res = await fetch("/api/video", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: topic, aspectRatio: "9:16", duration: 8 }) });
      const data = await res.json();
      if (data.success && data.video?.url) { setResult(data.video.url); setStatus("Video generiert!"); }
      else { setStatus("Fehler: " + (data.error || "Kein Video")); }
    } catch (e: any) { setStatus("Fehler: " + e.message); }
    setLoading(false);
  };

  // ─── REEL BUILDER FUNCTIONS ───

  const planScenes = async () => {
    if (!reelTheme.trim()) return;
    setBuildingReel(true); setStatus("KI plant Szenen..."); setScenes([]);
    try {
      const res = await fetch("/api/reel-builder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "plan_scenes", theme: reelTheme, clipCount: 3 }) });
      const data = await res.json();
      if (data.success && data.scenes) {
        setScenes(data.scenes.map((s: any) => ({ ...s, status: "pending" })));
        setStatus("3 Szenen geplant! Passe sie an oder starte die Generierung.");
      } else { setStatus("Fehler: " + (data.error || "Planung fehlgeschlagen")); }
    } catch (e: any) { setStatus("Fehler: " + e.message); }
    setBuildingReel(false);
  };

  const generateClip = async (index: number) => {
    const scene = scenes[index];
    if (!scene) return;
    const updated = [...scenes];
    updated[index] = { ...scene, status: "generating" };
    setScenes(updated);
    setStatus(`Generiere Szene ${index + 1}... (1-3 Min)`);
    try {
      const res = await fetch("/api/reel-builder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "generate_clip", prompt: scene.prompt, sceneIndex: index }) });
      const data = await res.json();
      const updated2 = [...scenes];
      if (data.success && data.video?.url) {
        updated2[index] = { ...updated2[index], videoUrl: data.video.url, status: "done" };
        setStatus(`Szene ${index + 1} fertig!`);
      } else {
        updated2[index] = { ...updated2[index], status: "error" };
        setStatus("Fehler bei Szene " + (index + 1));
      }
      setScenes(updated2);
    } catch (e: any) {
      const updated2 = [...scenes];
      updated2[index] = { ...updated2[index], status: "error" };
      setScenes(updated2);
      setStatus("Fehler: " + e.message);
    }
  };

  const generateAllClips = async () => {
    for (let i = 0; i < scenes.length; i++) {
      if (scenes[i].status !== "done") {
        await generateClip(i);
      }
    }
    setStatus("Alle Szenen generiert!");
  };

  const refineClip = async (index: number) => {
    const scene = scenes[index];
    if (!scene || !scene.feedback?.trim()) return;
    const updated = [...scenes];
    updated[index] = { ...scene, status: "generating" };
    setScenes(updated);
    setStatus(`Verfeinere Szene ${index + 1}...`);
    try {
      const res = await fetch("/api/reel-builder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "refine_clip", originalPrompt: scene.prompt, feedback: scene.feedback, sceneIndex: index }) });
      const data = await res.json();
      const updated2 = [...scenes];
      if (data.success && data.video?.url) {
        updated2[index] = { ...updated2[index], prompt: data.improvedPrompt || scene.prompt, videoUrl: data.video.url, status: "done", feedback: "" };
        setStatus(`Szene ${index + 1} verfeinert!`);
      } else {
        updated2[index] = { ...updated2[index], status: "done" };
        setStatus("Verfeinerung fehlgeschlagen");
      }
      setScenes(updated2);
    } catch (e: any) {
      const updated2 = [...scenes];
      updated2[index] = { ...updated2[index], status: "done" };
      setScenes(updated2);
      setStatus("Fehler: " + e.message);
    }
  };

  const generateReelCaption = async () => {
    setStatus("Generiere Caption...");
    try {
      const res = await fetch("/api/reel-builder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "generate_caption", scenes, theme: reelTheme }) });
      const data = await res.json();
      if (data.success) { setReelCaption(data.caption); setStatus("Caption generiert!"); }
      else { setStatus("Fehler: " + data.error); }
    } catch (e: any) { setStatus("Fehler: " + e.message); }
  };

  const videoProxy = (url: string) => "/api/video-download?url=" + encodeURIComponent(url);

  const tabs = [
    { id: "generate", icon: "🌿", label: "Content" },
    { id: "image", icon: "📸", label: "Bilder" },
    { id: "video", icon: "🎬", label: "Video" },
    { id: "reelbuilder", icon: "🎞️", label: "Reel-Builder" },
    { id: "autopilot", icon: "🤖", label: "Autopilot" },
    { id: "insights", icon: "📊", label: "Insights" },
  ];

  const btn = (bg: string, extra?: any) => ({ padding: 14, borderRadius: 12, border: "none", background: bg, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", ...extra });
  const card = { background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #81C78433" };
  const statusBox = (s: string | null) => s ? { marginTop: 12, padding: "8px 14px", borderRadius: 10, background: s.includes("Fehler") ? "#FFF3E0" : C.snow, fontSize: 12, color: s.includes("Fehler") ? "#E65100" : C.forest, fontWeight: 600 as const } : null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", minHeight: "100vh", background: C.cream }}>
      <div style={{ background: "linear-gradient(135deg, #1B5E20, #4CAF50)", padding: "20px", borderRadius: "0 0 24px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#fff", padding: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", flexShrink: 0 }}>
            <img src="/alpenwiese-logo.jpeg" alt="Alpenwiese" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 12 }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, color: "#fff", fontFamily: "'Playfair Display', serif" }}>Alpenwiese</h1>
            <div style={{ color: "#FFD54F", fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const }}>Social Media Agent</div>
          </div>
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 12, color: "#fffc" }}>KI-gesteuert: Gemini + Meta + Autopilot + Reel-Builder</p>
      </div>

      <div style={{ display: "flex", overflow: "auto", padding: "8px 12px", gap: 2, borderBottom: "1px solid #81C78433", background: "#fffc", position: "sticky" as const, top: 0, zIndex: 10 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); if (t.id !== "reelbuilder") { setResult(null); setStatus(null); } }} style={{ padding: "8px 12px", border: "none", cursor: "pointer", borderBottom: activeTab === t.id ? "3px solid #1B5E20" : "3px solid transparent", background: activeTab === t.id ? C.snow : "transparent", color: activeTab === t.id ? C.forest : C.stone, fontWeight: activeTab === t.id ? 700 : 500, fontSize: 11, borderRadius: "8px 8px 0 0", whiteSpace: "nowrap" as const, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>

        {/* ─── CONTENT TAB ─── */}
        {activeTab === "generate" && (
          <div style={card}>
            <h2 style={{ margin: "0 0 16px", fontSize: 17, color: C.forest, fontFamily: "'Playfair Display', serif" }}>🌿 Content Generator</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.stone, textTransform: "uppercase" as const, letterSpacing: 1 }}>Content-Typ</label>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" as const }}>
                {[{ id: "post", icon: "📸", l: "Post" }, { id: "story", icon: "📱", l: "Story" }, { id: "reel", icon: "🎬", l: "Reel" }, { id: "comment", icon: "💬", l: "Kommentar" }].map(t => (
                  <button key={t.id} onClick={() => setContentType(t.id)} style={{ padding: "8px 16px", borderRadius: 24, border: contentType === t.id ? "2px solid #1B5E20" : "1px solid #81C78466", background: contentType === t.id ? "#1B5E20" : "#fff", color: contentType === t.id ? "#fff" : "#1B5E20", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{t.icon} {t.l}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.stone, textTransform: "uppercase" as const, letterSpacing: 1 }}>Tonalität</label>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" as const }}>
                {["witzig", "informativ", "frech", "herzlich"].map(t => (
                  <button key={t} onClick={() => setTone(t)} style={{ padding: "8px 14px", borderRadius: 24, border: tone === t ? "2px solid #4CAF50" : "1px solid #81C78444", background: tone === t ? "#4CAF5022" : "#fff", color: "#1B5E20", cursor: "pointer", fontSize: 12, fontWeight: tone === t ? 700 : 500 }}>{t === "witzig" ? "😄" : t === "informativ" ? "🔬" : t === "frech" ? "😏" : "💚"} {t}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.stone, textTransform: "uppercase" as const, letterSpacing: 1 }}>Thema</label>
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="z.B. Brokkoli-Insider, Lidl-Vergleich..." style={{ width: "100%", padding: "10px 14px", borderRadius: 12, marginTop: 8, border: "1px solid #81C78444", fontSize: 14, background: C.snow, boxSizing: "border-box" as const }} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              <button onClick={generate} disabled={loading} style={{ ...btn("linear-gradient(135deg, #1B5E20, #4CAF50)"), flex: 1, minWidth: 200 }}>{loading ? "Generiert..." : "🌿 Caption generieren"}</button>
              <button onClick={generateImage} disabled={loading} style={{ ...btn("linear-gradient(135deg, #FF9800, #F57C00)"), width: "auto", padding: "14px 20px" }}>📸 Bild</button>
            </div>
            {status && <div style={statusBox(status)!}>{status}</div>}
            {imagePreview && <div style={{ marginTop: 16, textAlign: "center" as const }}><img src={imagePreview} alt="Generated" style={{ maxWidth: "100%", borderRadius: 12, border: "2px solid #81C78444" }} /></div>}
            {result && (
              <div style={{ marginTop: 16, padding: 20, borderRadius: 12, background: C.snow, border: "1px solid #81C78444" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap" as const, gap: 6 }}>
                  <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "#FFD54F44", color: C.forest }}>Generiert</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => navigator.clipboard?.writeText(result)} style={{ padding: "4px 12px", borderRadius: 8, border: "1px solid #81C784", background: "#fff", fontSize: 11, cursor: "pointer", color: C.forest }}>Kopieren</button>
                    <button onClick={publishToInstagram} style={{ padding: "4px 12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #E1306C, #C13584)", fontSize: 11, cursor: "pointer", color: "#fff", fontWeight: 700 }}>Auf Instagram posten</button>
                  </div>
                </div>
                <pre style={{ whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const, fontSize: 13, lineHeight: 1.6, color: C.bark, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{result}</pre>
              </div>
            )}
          </div>
        )}

        {/* ─── IMAGE TAB ─── */}
        {activeTab === "image" && (
          <div style={card}>
            <h2 style={{ margin: "0 0 12px", fontSize: 17, color: C.forest, fontFamily: "'Playfair Display', serif" }}>📸 Bild-Generator (Nano Banana 2)</h2>
            <p style={{ fontSize: 12, color: C.stone, margin: "0 0 16px" }}>Fotorealistische Bilder mit Alpenwiese-Logo und Brokkoli-Element.</p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: C.stone, textTransform: "uppercase" as const }}>Bild-Beschreibung</label>
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="z.B. Schweizer Apotheke mit Bergpanorama, Produkt auf Holztisch..." style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #81C78444", fontSize: 14, marginTop: 4, boxSizing: "border-box" as const }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: C.stone, textTransform: "uppercase" as const }}>Format</label>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {[{ v: "1:1", l: "Quadrat (Feed)" }, { v: "9:16", l: "Hochformat (Story/Reel)" }, { v: "16:9", l: "Querformat" }].map(f => (
                  <button key={f.v} onClick={() => setTopic(topic)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #81C78444", background: "#fff", fontSize: 11, cursor: "pointer", color: C.forest }}>{f.l}</button>
                ))}
              </div>
            </div>
            <button onClick={generateImage} disabled={loading} style={btn("linear-gradient(135deg, #FF9800, #F57C00)")}>{loading ? "Nano Banana 2 generiert..." : "📸 Bild generieren"}</button>
            {status && <div style={statusBox(status)!}>{status}</div>}
            {imagePreview && (
              <div style={{ marginTop: 16 }}>
                <img src={imagePreview} alt="Generated" style={{ width: "100%", borderRadius: 12, border: "2px solid #81C78444" }} />
                <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: "#FFF8E1", border: "1px solid #FFD54F44" }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "#F57F17", textTransform: "uppercase" as const }}>Bild verfeinern</label>
                  <input type="text" value={result && !result.startsWith("http") ? "" : (result || "")} onChange={e => setResult(e.target.value)} placeholder="z.B. Mehr Sonnenlicht, Brokkoli grösser, Logo oben rechts, weniger KI-Look..." style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #FFD54F66", fontSize: 12, marginTop: 4, boxSizing: "border-box" as const }} />
                  <button onClick={async () => {
                    if (!result?.trim()) return;
                    setLoading(true); setStatus("Verfeinere Bild...");
                    try {
                      const res = await fetch("/api/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "refine", originalPrompt: topic, feedback: result }) });
                      const data = await res.json();
                      if (data.success) { setImagePreview(data.image.dataUrl); setTopic(data.improvedPrompt || topic); setResult(""); setStatus("Bild verfeinert!"); }
                      else { setStatus("Fehler: " + data.error); }
                    } catch (e: any) { setStatus("Fehler: " + e.message); }
                    setLoading(false);
                  }} disabled={loading} style={{ marginTop: 6, padding: "8px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #FF9800, #F57C00)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", width: "100%" }}>
                    Bild mit Feedback verfeinern
                  </button>
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                  <a href={imagePreview} download="alpenwiese-post.png" style={{ flex: 1, padding: "8px 14px", borderRadius: 8, background: "#1B5E20", color: "#fff", fontSize: 11, fontWeight: 700, textDecoration: "none", textAlign: "center" as const }}>Bild herunterladen</a>
                  <button onClick={generateImage} style={{ flex: 1, padding: "8px 14px", borderRadius: 8, border: "1px solid #81C784", background: "#fff", fontSize: 11, cursor: "pointer", color: C.forest }}>Komplett neu generieren</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── SINGLE VIDEO TAB ─── */}
        {activeTab === "video" && (
          <div style={card}>
            <h2 style={{ margin: "0 0 12px", fontSize: 17, color: C.forest, fontFamily: "'Playfair Display', serif" }}>🎬 Einzel-Video (Veo 2)</h2>
            <p style={{ fontSize: 12, color: C.stone, margin: "0 0 16px" }}>Ein einzelnes 8-Sekunden Video im Hochformat (9:16).</p>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Beschreibe das Video..." style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #81C78444", fontSize: 14, marginBottom: 12, boxSizing: "border-box" as const }} />
            <button onClick={generateSingleVideo} disabled={loading} style={btn("linear-gradient(135deg, #9C27B0, #7B1FA2)")}>{loading ? "Veo generiert... (1-3 Min)" : "🎬 Video generieren"}</button>
            {status && <div style={statusBox(status)!}>{status}</div>}
            {result && result.startsWith("http") && (
              <div style={{ marginTop: 16 }}>
                <video controls autoPlay loop playsInline style={{ width: "100%", maxWidth: 400, borderRadius: 12, border: "2px solid #81C78444", display: "block", margin: "0 auto" }}>
                  <source src={videoProxy(result)} type="video/mp4" />
                </video>
                <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center" }}>
                  <a href={videoProxy(result)} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 16px", borderRadius: 8, background: "linear-gradient(135deg, #9C27B0, #7B1FA2)", color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Herunterladen</a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── REEL BUILDER TAB ─── */}
        {activeTab === "reelbuilder" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
            {/* Theme Input */}
            <div style={{ ...card, boxShadow: "0 0 20px #81C78444" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 17, color: C.forest, fontFamily: "'Playfair Display', serif" }}>🎞️ Reel-Builder (Multi-Clip)</h2>
              <p style={{ fontSize: 12, color: C.stone, margin: "0 0 16px" }}>Gib ein Thema ein — die KI plant 3 Szenen die du anpassen und einzeln verfeinern kannst.</p>
              <input type="text" value={reelTheme} onChange={e => setReelTheme(e.target.value)} placeholder="z.B. Schweizer Alpen-Qualität trifft Discounter-Preis" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #81C78444", fontSize: 14, marginBottom: 12, boxSizing: "border-box" as const }} />
              <button onClick={planScenes} disabled={buildingReel || !reelTheme.trim()} style={btn("linear-gradient(135deg, #1B5E20, #4CAF50)")}>{buildingReel ? "KI plant Szenen..." : "🎬 Szenen planen lassen"}</button>
              {status && <div style={statusBox(status)!}>{status}</div>}
            </div>

            {/* Scene Cards */}
            {scenes.length > 0 && (
              <>
                {scenes.map((scene, i) => (
                  <div key={i} style={{ ...card, border: scene.status === "done" ? "2px solid #4CAF50" : scene.status === "generating" ? "2px solid #FF9800" : "1px solid #81C78433" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: scene.status === "done" ? "#4CAF50" : scene.status === "generating" ? "#FF9800" : "#1B5E20", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700 }}>{i + 1}</div>
                        <h3 style={{ margin: 0, fontSize: 15, color: C.forest }}>Szene {i + 1}</h3>
                      </div>
                      <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: scene.status === "done" ? "#4CAF5022" : scene.status === "generating" ? "#FF980022" : "#f5f5f5", color: scene.status === "done" ? "#2E7D32" : scene.status === "generating" ? "#E65100" : "#999" }}>
                        {scene.status === "done" ? "Fertig" : scene.status === "generating" ? "Generiert..." : "Bereit"}
                      </span>
                    </div>

                    {/* Editable Prompt */}
                    <label style={{ fontSize: 10, fontWeight: 600, color: C.stone, textTransform: "uppercase" as const }}>Video-Prompt (anpassbar)</label>
                    <textarea value={scene.prompt} onChange={e => { const u = [...scenes]; u[i] = { ...u[i], prompt: e.target.value }; setScenes(u); }} rows={3} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #81C78444", fontSize: 12, marginTop: 4, marginBottom: 8, boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif", resize: "vertical" as const }} />

                    {/* Text Overlay */}
                    <label style={{ fontSize: 10, fontWeight: 600, color: C.stone, textTransform: "uppercase" as const }}>Text-Overlay</label>
                    <input type="text" value={scene.overlay} onChange={e => { const u = [...scenes]; u[i] = { ...u[i], overlay: e.target.value }; setScenes(u); }} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #81C78444", fontSize: 12, marginTop: 4, marginBottom: 10, boxSizing: "border-box" as const }} />

                    {/* Generate / Regenerate Button */}
                    {scene.status !== "generating" && (
                      <button onClick={() => generateClip(i)} style={{ ...btn("linear-gradient(135deg, #9C27B0, #7B1FA2)"), fontSize: 12, padding: 10 }}>
                        {scene.status === "done" ? "🔄 Neu generieren" : "🎬 Szene generieren"}
                      </button>
                    )}
                    {scene.status === "generating" && (
                      <div style={{ padding: 10, borderRadius: 10, background: "#FF980011", textAlign: "center" as const, fontSize: 12, color: "#E65100" }}>Wird generiert... (1-3 Min)</div>
                    )}

                    {/* Video Preview */}
                    {scene.videoUrl && scene.status === "done" && (
                      <div style={{ marginTop: 12 }}>
                        <video controls playsInline style={{ width: "100%", maxWidth: 300, borderRadius: 10, border: "2px solid #81C78444", display: "block", margin: "0 auto" }}>
                          <source src={videoProxy(scene.videoUrl)} type="video/mp4" />
                        </video>
                        <div style={{ marginTop: 8, display: "flex", gap: 6, justifyContent: "center" }}>
                          <a href={videoProxy(scene.videoUrl)} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", borderRadius: 8, background: "#9C27B0", color: "#fff", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>Download Szene {i + 1}</a>
                        </div>

                        {/* Refinement Feedback */}
                        <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: "#FFF8E1", border: "1px solid #FFD54F44" }}>
                          <label style={{ fontSize: 10, fontWeight: 600, color: "#F57F17", textTransform: "uppercase" as const }}>Feedback / Verfeinerung</label>
                          <input type="text" value={scene.feedback || ""} onChange={e => { const u = [...scenes]; u[i] = { ...u[i], feedback: e.target.value }; setScenes(u); }} placeholder="z.B. Mehr Nebel, langsamere Kamerafahrt, wärmere Farben..." style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #FFD54F66", fontSize: 12, marginTop: 4, boxSizing: "border-box" as const }} />
                          <button onClick={() => refineClip(i)} disabled={!scene.feedback?.trim()} style={{ marginTop: 6, padding: "8px 14px", borderRadius: 8, border: "none", background: scene.feedback?.trim() ? "linear-gradient(135deg, #FF9800, #F57C00)" : "#eee", color: scene.feedback?.trim() ? "#fff" : "#999", fontSize: 11, fontWeight: 700, cursor: scene.feedback?.trim() ? "pointer" : "default", width: "100%" }}>
                            Szene verfeinern
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Generate All & Caption */}
                <div style={card}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                    <button onClick={generateAllClips} disabled={loading} style={{ ...btn("linear-gradient(135deg, #1B5E20, #4CAF50)"), flex: 1, minWidth: 200 }}>
                      🎬 Alle {scenes.filter(s => s.status !== "done").length} offenen Szenen generieren
                    </button>
                    <button onClick={generateReelCaption} style={{ ...btn("linear-gradient(135deg, #FF9800, #F57C00)"), width: "auto", padding: "14px 20px" }}>
                      ✍️ Caption
                    </button>
                  </div>

                  {/* Download All */}
                  {scenes.every(s => s.status === "done") && (
                    <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "#E8F5E9", border: "1px solid #4CAF5033", textAlign: "center" as const }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#2E7D32", marginBottom: 8 }}>Alle 3 Szenen fertig!</div>
                      <p style={{ fontSize: 11, color: C.stone, margin: "0 0 10px" }}>Lade die Clips herunter und fuge sie in CapCut (kostenlos) zusammen.</p>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" as const }}>
                        {scenes.map((s, i) => s.videoUrl ? (
                          <a key={i} href={videoProxy(s.videoUrl)} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 14px", borderRadius: 8, background: "#9C27B0", color: "#fff", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>Szene {i + 1}</a>
                        ) : null)}
                      </div>
                    </div>
                  )}

                  {/* Caption Result */}
                  {reelCaption && (
                    <div style={{ marginTop: 14, padding: 16, borderRadius: 12, background: C.snow, border: "1px solid #81C78444" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "#FFD54F44", color: C.forest }}>Reel-Caption</span>
                        <button onClick={() => navigator.clipboard?.writeText(reelCaption)} style={{ padding: "4px 12px", borderRadius: 8, border: "1px solid #81C784", background: "#fff", fontSize: 11, cursor: "pointer", color: C.forest }}>Kopieren</button>
                      </div>
                      <pre style={{ whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const, fontSize: 12, lineHeight: 1.6, color: C.bark, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{reelCaption}</pre>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── AUTOPILOT TAB ─── */}
        {activeTab === "autopilot" && (
          <div style={card}>
            <h2 style={{ margin: "0 0 12px", fontSize: 17, color: C.forest, fontFamily: "'Playfair Display', serif" }}>🤖 Autopilot</h2>
            <p style={{ fontSize: 12, color: C.stone, margin: "0 0 16px" }}>Cron-Job auf Vercel (1x täglich um 12:00).</p>
            <div style={{ padding: 16, borderRadius: 12, background: C.snow, border: "1px solid #81C78433" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.forest, marginBottom: 8 }}>Status: Aktiv</div>
              <div style={{ fontSize: 12, color: C.stone }}>Keywords: Cannabis (9), Brokkoli (5), Gemüse (9), Lidl (3)</div>
            </div>
            <button onClick={async () => { const s = window.prompt("CRON_SECRET:"); if (!s) return; setStatus("Autopilot läuft..."); try { const r = await fetch("/api/cron", { headers: { Authorization: "Bearer " + s } }); const d = await r.json(); setResult(JSON.stringify(d, null, 2)); setStatus((d.actions || 0) + " Aktionen"); } catch (e: any) { setStatus("Fehler: " + e.message); } }} style={{ ...btn("linear-gradient(135deg, #1B5E20, #4CAF50)"), marginTop: 12 }}>Jetzt ausführen</button>
            {status && <div style={{ marginTop: 10, fontSize: 12, color: C.forest }}>{status}</div>}
            {result && <pre style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "#f5f5f5", fontSize: 11, overflow: "auto", maxHeight: 300 }}>{result}</pre>}
          </div>
        )}

        {/* ─── INSIGHTS TAB ─── */}
        {activeTab === "insights" && (
          <div style={card}>
            <h2 style={{ margin: "0 0 12px", fontSize: 17, color: C.forest, fontFamily: "'Playfair Display', serif" }}>📊 Live Insights</h2>
            <button onClick={async () => { setLoading(true); try { const r = await fetch("/api/instagram"); const d = await r.json(); setResult(JSON.stringify(d, null, 2)); } catch (e: any) { setResult("Fehler: " + e.message); } setLoading(false); }} style={btn("linear-gradient(135deg, #1B5E20, #4CAF50)")}>📊 Insights laden</button>
            {result && <pre style={{ marginTop: 16, padding: 16, borderRadius: 12, background: C.snow, fontSize: 11, overflow: "auto", maxHeight: 400, border: "1px solid #81C78433" }}>{result}</pre>}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 16px 30px", textAlign: "center" as const, fontSize: 11, color: C.alpine }}>Alpenwiese Social Media Agent v2.0 — Reel-Builder Edition</div>
    </div>
  );
}

// app/page.tsx — Alpenwiese Social Media Agent Dashboard

"use client";

import { useState } from "react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("generate");
  const [contentType, setContentType] = useState("post");
  const [tone, setTone] = useState("witzig");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setResult(null);
    setStatus("Generiere Content...");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, tone, topic }),
      });
      const data = await res.json();
      setResult(data.content || data.error);
      setStatus(null);
    } catch (e: any) {
      setResult("Fehler: " + e.message);
      setStatus(null);
    }
    setLoading(false);
  };

  const generateImage = async () => {
    setLoading(true);
    setImagePreview(null);
    setStatus("Generiere Bild mit Nano Banana 2...");
    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: topic || "Swiss Alpine meadow with Alpenwiese branding, clean medical aesthetic, mountain landscape",
          aspectRatio: "1:1",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setImagePreview(data.image.dataUrl);
        setStatus("Bild generiert!");
      } else {
        setStatus("Fehler: " + data.error);
      }
    } catch (e: any) {
      setStatus("Fehler: " + e.message);
    }
    setLoading(false);
  };

  const publishToInstagram = async () => {
    if (!result) return;
    setStatus("Veröffentliche auf Instagram...");
    try {
      const res = await fetch("/api/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish_image",
          imageUrl: imagePreview,
          caption: result,
        }),
      });
      const data = await res.json();
      setStatus(data.success ? "Erfolgreich gepostet!" : "Fehler: " + data.error);
    } catch (e: any) {
      setStatus("Fehler: " + e.message);
    }
  };

  const C = {
    forest: "#1B5E20", meadow: "#4CAF50", alpine: "#81C784",
    snow: "#F1F8E9", gold: "#FFD54F", bark: "#3E2723",
    stone: "#5D4037", lidl: "#0050AA", cream: "#FAFDF6",
  };

  const tabs = [
    { id: "generate", icon: "🌿", label: "Content" },
    { id: "image", icon: "📸", label: "Bilder" },
    { id: "video", icon: "🎬", label: "Videos" },
    { id: "autopilot", icon: "🤖", label: "Autopilot" },
    { id: "insights", icon: "📊", label: "Insights" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", minHeight: "100vh", background: C.cream }}>
      <div style={{
        background: `linear-gradient(135deg, ${C.forest}, ${C.meadow})`,
        padding: "20px", borderRadius: "0 0 24px 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: "#fff",
            padding: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            flexShrink: 0,
          }}>
            <img src="/alpenwiese-logo.jpeg" alt="Alpenwiese" style={{
              width: "100%", height: "100%", objectFit: "contain", borderRadius: 12,
            }} />
          </div>
          <div>
            <h1 style={{
              margin: 0, fontSize: 24, color: "#fff",
              fontFamily: "'Playfair Display', serif",
            }}>Alpenwiese</h1>
            <div style={{
              color: C.gold, fontSize: 12, fontWeight: 700,
              letterSpacing: 3, textTransform: "uppercase",
            }}>Social Media Agent</div>
          </div>
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 12, color: "#fffc" }}>
          KI-gesteuert: Gemini + Meta + Autopilot
        </p>
      </div>

      <div style={{
        display: "flex", overflow: "auto", padding: "8px 16px",
        gap: 4, borderBottom: `1px solid ${C.alpine}33`,
        background: "#fffc", position: "sticky", top: 0, zIndex: 10,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "8px 14px", border: "none", cursor: "pointer",
            borderBottom: activeTab === t.id ? `3px solid ${C.forest}` : "3px solid transparent",
            background: activeTab === t.id ? C.snow : "transparent",
            color: activeTab === t.id ? C.forest : C.stone,
            fontWeight: activeTab === t.id ? 700 : 500,
            fontSize: 12, borderRadius: "8px 8px 0 0", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 4,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <span style={{ fontSize: 15 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {activeTab === "generate" && (
          <div style={{
            background: "#fff", borderRadius: 16, padding: 20,
            boxShadow: `0 0 20px ${C.alpine}44`,
            border: `1px solid ${C.alpine}33`,
          }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 17, color: C.forest,
              fontFamily: "'Playfair Display', serif" }}>
              🌿 Content Generator
            </h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.stone,
                textTransform: "uppercase", letterSpacing: 1 }}>Content-Typ</label>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {[
                  { id: "post", icon: "📸", l: "Post" },
                  { id: "story", icon: "📱", l: "Story" },
                  { id: "reel", icon: "🎬", l: "Reel" },
                  { id: "comment", icon: "💬", l: "Kommentar" },
                ].map(t => (
                  <button key={t.id} onClick={() => setContentType(t.id)} style={{
                    padding: "8px 16px", borderRadius: 24,
                    border: contentType === t.id ? `2px solid ${C.forest}` : `1px solid ${C.alpine}66`,
                    background: contentType === t.id ? C.forest : "#fff",
                    color: contentType === t.id ? "#fff" : C.forest,
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                  }}>{t.icon} {t.l}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.stone,
                textTransform: "uppercase", letterSpacing: 1 }}>Tonalität</label>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {["witzig", "informativ", "frech", "herzlich"].map(t => (
                  <button key={t} onClick={() => setTone(t)} style={{
                    padding: "8px 14px", borderRadius: 24,
                    border: tone === t ? `2px solid ${C.meadow}` : `1px solid ${C.alpine}44`,
                    background: tone === t ? C.meadow + "22" : "#fff",
                    color: C.forest, cursor: "pointer", fontSize: 12,
                    fontWeight: tone === t ? 700 : 500,
                  }}>{t === "witzig" ? "😄" : t === "informativ" ? "🔬" : t === "frech" ? "😏" : "💚"} {t}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.stone,
                textTransform: "uppercase", letterSpacing: 1 }}>Thema</label>
              <input
                type="text" value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="z.B. Schweizer Qualität, Brokkoli-Insider, Lidl-Vergleich..."
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 12, marginTop: 8,
                  border: `1px solid ${C.alpine}44`, fontSize: 14, background: C.snow,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={generate} disabled={loading} style={{
                flex: 1, padding: 14, borderRadius: 12, border: "none",
                background: loading ? C.alpine : `linear-gradient(135deg, ${C.forest}, ${C.meadow})`,
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer",
                boxShadow: `0 4px 12px ${C.forest}44`, minWidth: 200,
              }}>
                {loading ? "Generiert..." : "🌿 Caption generieren"}
              </button>
              <button onClick={generateImage} disabled={loading} style={{
                padding: "14px 20px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #FF9800, #F57C00)",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer",
              }}>
                📸 Bild (Nano Banana 2)
              </button>
            </div>
            {status && (
              <div style={{
                marginTop: 12, padding: "8px 14px", borderRadius: 10,
                background: status.includes("Fehler") ? "#FFF3E0" : C.snow,
                fontSize: 12, color: status.includes("Fehler") ? "#E65100" : C.forest,
                fontWeight: 600,
              }}>
                {status}
              </div>
            )}
            {imagePreview && (
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <img src={imagePreview} alt="Generated" style={{
                  maxWidth: "100%", borderRadius: 12, border: `2px solid ${C.alpine}44`,
                }} />
              </div>

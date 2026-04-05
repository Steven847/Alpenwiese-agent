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
          imageUrl: imagePreview, // In production: hosted URL
          caption: result,
        }),
      });
      const data = await res.json();
      setStatus(data.success ? "Erfolgreich gepostet! 🎉" : "Fehler: " + data.error);
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
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.forest}, ${C.meadow})`,
        padding: "20px", borderRadius: "0 0 24px 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}>🏔️</div>
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
          🤖 Echte API-Anbindung — Gemini + Meta + Autopilot
        </p>
      </div>

      {/* Tabs */}
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
          }}>
            <span style={{ fontSize: 15 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {/* GENERATE TAB */}
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

            {/* Content Type */}
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

            {/* Tone */}
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

            {/* Topic */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.stone,
                textTransform: "uppercase", letterSpacing: 1 }}>Thema</label>
              <input
                type="text" value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="z.B. Schweizer Qualität, Brokkoli-Insider, Lidl-Vergleich..."
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 12, marginTop: 8,
                  border: `1px solid ${C.alpine}44`, fontSize: 14, background: C.snow,
                }}
              />
            </div>

            {/* Generate Buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={generate} disabled={loading} style={{
                flex: 1, padding: 14, borderRadius: 12, border: "none",
                background: loading ? C.alpine : `linear-gradient(135deg, ${C.forest}, ${C.meadow})`,
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer",
                boxShadow: `0 4px 12px ${C.forest}44`, minWidth: 200,
              }}>
                {loading ? "⏳ Generiert..." : "🌿 Caption generieren"}
              </button>
              <button onClick={generateImage} disabled={loading} style={{
                padding: "14px 20px", borderRadius: 12, border: "none",
                background: `linear-gradient(135deg, #FF9800, #F57C00)`,
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer",
              }}>
                📸 Bild (Nano Banana 2)
              </button>
            </div>

            {/* Status */}
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

            {/* Image Preview */}
            {imagePreview && (
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <img src={imagePreview} alt="Generated" style={{
                  maxWidth: "100%", borderRadius: 12,
                  border: `2px solid ${C.alpine}44`,
                }} />
              </div>
            )}

            {/* Result */}
            {result && (
              <div style={{
                marginTop: 16, padding: 20, borderRadius: 12,
                background: `linear-gradient(135deg, ${C.snow}, #fff)`,
                border: `1px solid ${C.alpine}44`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 11,
                    fontWeight: 600, background: C.gold + "44", color: C.forest,
                  }}>✨ Generiert</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => navigator.clipboard?.writeText(result)} style={{
                      padding: "4px 12px", borderRadius: 8, border: `1px solid ${C.alpine}`,
                      background: "#fff", fontSize: 11, cursor: "pointer", color: C.forest,
                    }}>📋 Kopieren</button>
                    <button onClick={publishToInstagram} style={{
                      padding: "4px 12px", borderRadius: 8, border: "none",
                      background: `linear-gradient(135deg, #E1306C, #C13584)`,
                      fontSize: 11, cursor: "pointer", color: "#fff", fontWeight: 700,
                    }}>📱 Auf Instagram posten</button>
                  </div>
                </div>
                <pre style={{
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                  fontSize: 13, lineHeight: 1.6, color: C.bark, margin: 0,
                  fontFamily: "'DM Sans', sans-serif",
                }}>{result}</pre>
              </div>
            )}
          </div>
        )}

        {/* IMAGE TAB */}
        {activeTab === "image" && (
          <div style={{
            background: "#fff", borderRadius: 16, padding: 20,
            border: `1px solid ${C.alpine}33`,
          }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 17, color: C.forest,
              fontFamily: "'Playfair Display', serif" }}>
              📸 Bild-Generator (Nano Banana 2)
            </h2>
            <p style={{ fontSize: 12, color: C.stone, margin: "0 0 16px" }}>
              Generiere Instagram-Grafiken mit der Google Gemini API.
            </p>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="Beschreibe das Bild..."
              style={{
                width: "100%", padding: 12, borderRadius: 12,
                border: `1px solid ${C.alpine}44`, fontSize: 14, marginBottom: 12,
              }}
            />
            <button onClick={generateImage} disabled={loading} style={{
              width: "100%", padding: 14, borderRadius: 12, border: "none",
              background: `linear-gradient(135deg, #FF9800, #F57C00)`,
              color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
            }}>
              {loading ? "⏳ Nano Banana 2 generiert..." : "📸 Bild generieren"}
            </button>
            {imagePreview && (
              <img src={imagePreview} alt="Generated" style={{
                width: "100%", marginTop: 16, borderRadius: 12,
              }} />
            )}
          </div>
        )}

        {/* VIDEO TAB */}
        {activeTab === "video" && (
          <div style={{
            background: "#fff", borderRadius: 16, padding: 20,
            border: `1px solid ${C.alpine}33`,
          }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 17, color: C.forest,
              fontFamily: "'Playfair Display', serif" }}>
              🎬 Video/Reel-Generator (Veo 2)
            </h2>
            <p style={{ fontSize: 12, color: C.stone, margin: "0 0 16px" }}>
              Generiere Instagram Reels mit Google Veo. 8 Sekunden, Hochformat (9:16).
            </p>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="Beschreibe das Video/Reel..."
              style={{
                width: "100%", padding: 12, borderRadius: 12,
                border: `1px solid ${C.alpine}44`, fontSize: 14, marginBottom: 12,
              }}
            />
            <button onClick={async () => {
              setLoading(true);
              setStatus("Generiere Video mit Veo 2... (kann bis zu 2 Min dauern)");
              try {
                const res = await fetch("/api/video", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ prompt: topic, aspectRatio: "9:16", duration: 8 }),
                });
                const data = await res.json();
                setStatus(data.success ? "Video generiert! 🎬" : "Fehler: " + data.error);
              } catch (e: any) { setStatus("Fehler: " + e.message); }
              setLoading(false);
            }} disabled={loading} style={{
              width: "100%", padding: 14, borderRadius: 12, border: "none",
              background: `linear-gradient(135deg, #9C27B0, #7B1FA2)`,
              color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
            }}>
              {loading ? "⏳ Veo generiert..." : "🎬 Reel generieren"}
            </button>
            {status && (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 10,
                background: C.snow, fontSize: 12, color: C.forest }}>
                {status}
              </div>
            )}
          </div>
        )}

        {/* AUTOPILOT TAB */}
        {activeTab === "autopilot" && (
          <div style={{
            background: "#fff", borderRadius: 16, padding: 20,
            border: `1px solid ${C.alpine}33`,
          }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 17, color: C.forest,
              fontFamily: "'Playfair Display', serif" }}>
              🤖 Autopilot
            </h2>
            <p style={{ fontSize: 12, color: C.stone, margin: "0 0 16px" }}>
              Der Autopilot läuft als Cron-Job auf Vercel — alle 30 Minuten.
              Er sucht automatisch nach Cannabis-, Brokkoli- und Gemüse-Posts und kommentiert on-brand.
            </p>
            <div style={{
              padding: 16, borderRadius: 12, background: C.snow,
              border: `1px solid ${C.alpine}33`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.forest, marginBottom: 8 }}>
                ⚙️ Status: Aktiv auf Vercel (Cron alle 30 Min)
              </div>
              <div style={{ fontSize: 12, color: C.stone }}>
                Keywords überwacht: Cannabis ({7}), Brokkoli ({5}), Gemüse ({9}), Lidl ({3})
              </div>
            </div>
            <button onClick={async () => {
              setStatus("Manueller Autopilot-Run...");
              try {
                const res = await fetch("/api/cron", {
                  headers: { Authorization: `Bearer ${prompt("CRON_SECRET eingeben:")}` },
                });
                const data = await res.json();
                setResult(JSON.stringify(data, null, 2));
                setStatus(`${data.actions || 0} Aktionen durchgeführt`);
              } catch (e: any) { setStatus("Fehler: " + e.message); }
            }} style={{
              marginTop: 12, width: "100%", padding: 14, borderRadius: 12,
              border: "none", background: `linear-gradient(135deg, ${C.forest}, ${C.meadow})`,
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>
              ▶ Jetzt manuell ausführen
            </button>
            {status && <div style={{ marginTop: 10, fontSize: 12, color: C.forest }}>{status}</div>}
            {result && activeTab === "autopilot" && (
              <pre style={{
                marginTop: 12, padding: 12, borderRadius: 10,
                background: "#f5f5f5", fontSize: 11, overflow: "auto",
                maxHeight: 300,
              }}>{result}</pre>
            )}
          </div>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === "insights" && (
          <div style={{
            background: "#fff", borderRadius: 16, padding: 20,
            border: `1px solid ${C.alpine}33`,
          }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 17, color: C.forest,
              fontFamily: "'Playfair Display', serif" }}>
              📊 Live Insights
            </h2>
            <button onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch("/api/instagram");
                const data = await res.json();
                setResult(JSON.stringify(data, null, 2));
              } catch (e: any) { setResult("Fehler: " + e.message); }
              setLoading(false);
            }} style={{
              width: "100%", padding: 14, borderRadius: 12, border: "none",
              background: `linear-gradient(135deg, ${C.forest}, ${C.meadow})`,
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>
              📊 Insights laden
            </button>
            {result && activeTab === "insights" && (
              <pre style={{
                marginTop: 16, padding: 16, borderRadius: 12,
                background: C.snow, fontSize: 11, overflow: "auto",
                maxHeight: 400, border: `1px solid ${C.alpine}33`,
              }}>{result}</pre>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "20px 16px 30px", textAlign: "center", fontSize: 11, color: C.alpine }}>
        🏔️ Alpenwiese Social Media Agent v1.0 💙🥦
        <br />Echte API-Anbindung: Gemini + Meta + Autopilot
      </div>
    </div>
  );
}

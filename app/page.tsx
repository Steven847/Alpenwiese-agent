/ app/page.tsx — Alpenwiese Social Media Agent Dashboard v3

"use client";

import { useState } from "react";

type Scene = { scene: number; prompt: string; overlay: string; duration: number; videoUrl?: string; status?: "pending" | "generating" | "done" | "error"; feedback?: string; };
type DayPlan = { day: string; theme: string; type: string; caption: string; imagePrompt: string; time: string; imageUrl?: string; };
type CommentSuggestion = { style: string; comment: string; };
type ProfileSuggestion = { category: string; searchTerms: string[]; reason: string; engagementTip: string; };

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("generate");
  const [contentType, setContentType] = useState("post");
  const [tone, setTone] = useState("witzig");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [imageFeedback, setImageFeedback] = useState("");
  const [lastImagePrompt, setLastImagePrompt] = useState("");
  const [videoFeedback, setVideoFeedback] = useState("");
  const [lastVideoPrompt, setLastVideoPrompt] = useState("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [reelTheme, setReelTheme] = useState("");
  const [reelCaption, setReelCaption] = useState<string | null>(null);
  const [buildingReel, setBuildingReel] = useState(false);
  // Wochenplan
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  // Engagement
  const [hashtagSearch, setHashtagSearch] = useState("");
  const [hashtagResults, setHashtagResults] = useState<any[]>([]);
  const [commentSuggestions, setCommentSuggestions] = useState<CommentSuggestion[]>([]);
  const [profileSuggestions, setProfileSuggestions] = useState<ProfileSuggestion[]>([]);
  const [suggestedHashtags, setSuggestedHashtags] = useState<any>(null);
  const [commentContext, setCommentContext] = useState("");

  const C = { forest: "#1B5E20", meadow: "#4CAF50", alpine: "#81C784", snow: "#F1F8E9", gold: "#FFD54F", bark: "#3E2723", stone: "#5D4037", cream: "#FAFDF6" };

  const generate = async () => {
    setLoading(true); setResult(null); setStatus("Generiere Content...");
    try { const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentType, tone, topic }) }); const data = await res.json(); setResult(data.content || data.error); setStatus(null); } catch (e: any) { setResult("Fehler: " + e.message); setStatus(null); }
    setLoading(false);
  };
  const generateImage = async () => {
    setLoading(true); setImagePreview(null); setStatus("Generiere Bild...");
    try { const res = await fetch("/api/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: topic || "Swiss Alpine meadow with Alpenwiese branding", aspectRatio: "1:1" }) }); const data = await res.json(); if (data.success) { setImagePreview(data.image.dataUrl); setLastImagePrompt(topic); setImageFeedback(""); setStatus("Bild generiert!"); } else { setStatus("Fehler: " + data.error); } } catch (e: any) { setStatus("Fehler: " + e.message); }
    setLoading(false);
  };
  const refineImageFn = async () => {
    if (!imageFeedback.trim() || !imagePreview) return;
    setLoading(true); setStatus("Verfeinere Bild...");
    try { let oB64: any = undefined; let oMT: any = undefined; if (imagePreview.startsWith("data:")) { const m = imagePreview.match(/^data:([^;]+);base64,(.+)$/); if (m) { oMT = m[1]; oB64 = m[2]; } } const res = await fetch("/api/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "refine", originalPrompt: lastImagePrompt || topic, feedback: imageFeedback, originalBase64: oB64, originalMimeType: oMT }) }); const data = await res.json(); if (data.success) { setImagePreview(data.image.dataUrl); setLastImagePrompt(data.improvedPrompt || lastImagePrompt); setImageFeedback(""); setStatus("Bild verfeinert!"); } else { setStatus("Fehler: " + data.error); } } catch (e: any) { setStatus("Fehler: " + e.message); }
    setLoading(false);
  };
  const publishToInstagram = async () => {
    if (!result) return; setStatus("Veroeffentliche auf Instagram...");
    try { const res = await fetch("/api/instagram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "publish_image", imageUrl: imagePreview, caption: result }) }); const data = await res.json(); setStatus(data.success ? "Erfolgreich gepostet!" : "Fehler: " + data.error); } catch (e: any) { setStatus("Fehler: " + e.message); }
  };
  const generateSingleVideo = async (customPrompt?: string) => {
    const vp = customPrompt || topic; setLoading(true); setStatus("Generiere Video... (1-3 Min)"); setResult(null);
    try { const res = await fetch("/api/video", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: vp, aspectRatio: "9:16", duration: 8 }) }); const data = await res.json(); if (data.success && data.video?.url) { setResult(data.video.url); setLastVideoPrompt(vp); setVideoFeedback(""); setStatus("Video generiert!"); } else { setStatus("Fehler: " + (data.error || "Kein Video")); } } catch (e: any) { setStatus("Fehler: " + e.message); }
    setLoading(false);
  };
  const refineVideoFn = async () => {
    if (!videoFeedback.trim()) return;
    setLoading(true); setStatus("Verfeinere Video...");
    try { await generateSingleVideo(lastVideoPrompt + ". Additional: " + videoFeedback); } catch (e: any) { setStatus("Fehler: " + e.message); setLoading(false); }
  };
  const planScenes = async () => {
    if (!reelTheme.trim()) return; setBuildingReel(true); setStatus("KI plant Szenen..."); setScenes([]);
    try { const res = await fetch("/api/reelbuilder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "plan_scenes", theme: reelTheme, clipCount: 3 }) }); const data = await res.json(); if (data.success && data.scenes) { setScenes(data.scenes.map((s: any) => ({ ...s, status: "pending" }))); setStatus("3 Szenen geplant!"); } else { setStatus("Fehler: " + (data.error || "Planung fehlgeschlagen")); } } catch (e: any) { setStatus("Fehler: " + e.message); }
    setBuildingReel(false);
  };
  const generateClip = async (index: number) => {
    const scene = scenes[index]; if (!scene) return; const u = [...scenes]; u[index] = { ...scene, status: "generating" }; setScenes(u); setStatus("Generiere Szene " + (index+1) + "...");
    try { const res = await fetch("/api/reelbuilder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "generate_clip", prompt: scene.prompt, sceneIndex: index }) }); const data = await res.json(); const u2 = [...scenes]; if (data.success && data.video?.url) { u2[index] = { ...u2[index], videoUrl: data.video.url, status: "done" }; setStatus("Szene " + (index+1) + " fertig!"); } else { u2[index] = { ...u2[index], status: "error" }; } setScenes(u2); } catch (e: any) { const u2 = [...scenes]; u2[index] = { ...u2[index], status: "error" }; setScenes(u2); setStatus("Fehler: " + e.message); }
  };
  const generateAllClips = async () => { for (let i = 0; i < scenes.length; i++) { if (scenes[i].status !== "done") await generateClip(i); } setStatus("Alle Szenen generiert!"); };
  const refineClip = async (index: number) => {
    const scene = scenes[index]; if (!scene || !scene.feedback?.trim()) return; const u = [...scenes]; u[index] = { ...scene, status: "generating" }; setScenes(u);
    try { const res = await fetch("/api/reelbuilder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "refine_clip", originalPrompt: scene.prompt, feedback: scene.feedback, sceneIndex: index }) }); const data = await res.json(); const u2 = [...scenes]; if (data.success && data.video?.url) { u2[index] = { ...u2[index], prompt: data.improvedPrompt || scene.prompt, videoUrl: data.video.url, status: "done", feedback: "" }; } else { u2[index] = { ...u2[index], status: "done" }; } setScenes(u2); } catch (e: any) { const u2 = [...scenes]; u2[index] = { ...u2[index], status: "done" }; setScenes(u2); }
  };
  const generateReelCaption = async () => {
    setStatus("Generiere Caption...");
    try { const res = await fetch("/api/reelbuilder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "generate_caption", scenes, theme: reelTheme }) }); const data = await res.json(); if (data.success) { setReelCaption(data.caption); setStatus("Caption generiert!"); } else { setStatus("Fehler: " + data.error); } } catch (e: any) { setStatus("Fehler: " + e.message); }
  };
  // Wochenplan
  const generateWeekPlan = async () => {
    setPlanLoading(true); setStatus("Generiere Wochenplan...");
    try { const res = await fetch("/api/wochenplan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "generate_week" }) }); const data = await res.json(); if (data.success) { setWeekPlan(data.plan); setStatus("Wochenplan erstellt!"); } else { setStatus("Fehler: " + data.error); } } catch (e: any) { setStatus("Fehler: " + e.message); }
    setPlanLoading(false);
  };
  const generateDayImage = async (index: number) => {
    const day = weekPlan[index]; if (!day) return; setStatus("Generiere Bild fuer " + day.day + "...");
    try { const res = await fetch("/api/wochenplan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "generate_day_image", imagePrompt: day.imagePrompt }) }); const data = await res.json(); if (data.success) { const u = [...weekPlan]; u[index] = { ...u[index], imageUrl: data.image.dataUrl }; setWeekPlan(u); setStatus("Bild fuer " + day.day + " generiert!"); } else { setStatus("Fehler: " + data.error); } } catch (e: any) { setStatus("Fehler: " + e.message); }
  };
  const regenerateCaption = async (index: number) => {
    const day = weekPlan[index]; if (!day) return; setStatus("Generiere neue Caption fuer " + day.day + "...");
    try { const res = await fetch("/api/wochenplan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "regenerate_caption", day: day.day, theme: day.theme, currentCaption: day.caption }) }); const data = await res.json(); if (data.success) { const u = [...weekPlan]; u[index] = { ...u[index], caption: data.caption }; setWeekPlan(u); setStatus("Neue Caption fuer " + day.day + "!"); } else { setStatus("Fehler: " + data.error); } } catch (e: any) { setStatus("Fehler: " + e.message); }
  };
  const exportCSV = async () => {
    try { const res = await fetch("/api/wochenplan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "export_csv", plan: weekPlan }) }); const data = await res.json(); if (data.success) { const blob = new Blob([data.csv], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "alpenwiese-wochenplan.csv"; a.click(); URL.revokeObjectURL(url); setStatus("CSV exportiert!"); } } catch (e: any) { setStatus("Fehler: " + e.message); }
  };
  // Engagement
  const searchHashtags = async () => {
    if (!hashtagSearch.trim()) return; setStatus("Suche Hashtag...");
    try { const res = await fetch("/api/engagement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "search_hashtag", hashtag: hashtagSearch }) }); const data = await res.json(); if (data.success) { setHashtagResults(data.posts || []); setStatus(data.posts?.length + " Posts gefunden"); } else { setStatus("Fehler: " + data.error); } } catch (e: any) { setStatus("Fehler: " + e.message); }
  };
  const suggestComments = async () => {
    setStatus("Generiere Kommentar-Vorschlaege...");
    try { const res = await fetch("/api/engagement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "suggest_comments", postCaption: commentContext || hashtagSearch, postContext: "Cannabis Community Post" }) }); const data = await res.json(); if (data.success) { setCommentSuggestions(data.comments || []); setStatus("Kommentare generiert!"); } else { setStatus("Fehler: " + data.error); } } catch (e: any) { setStatus("Fehler: " + e.message); }
  };
  const suggestProfiles = async () => {
    setStatus("Generiere Profil-Vorschlaege...");
    try { const res = await fetch("/api/engagement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "suggest_profiles" }) }); const data = await res.json(); if (data.success) { setProfileSuggestions(data.profiles || []); setStatus("Profile vorgeschlagen!"); } else { setStatus("Fehler: " + data.error); } } catch (e: any) { setStatus("Fehler: " + e.message); }
  };
  const loadHashtags = async () => {
    setStatus("Lade Hashtag-Empfehlungen...");
    try { const res = await fetch("/api/engagement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "suggest_hashtags" }) }); const data = await res.json(); if (data.success) { setSuggestedHashtags(data.hashtags); setStatus("Hashtags geladen!"); } else { setStatus("Fehler: " + data.error); } } catch (e: any) { setStatus("Fehler: " + e.message); }
  };

  const videoProxy = (url: string) => "/api/video-download?url=" + encodeURIComponent(url);
  const tabs = [
    { id: "generate", icon: "🌿", label: "Content" },
    { id: "image", icon: "📸", label: "Bilder" },
    { id: "video", icon: "🎬", label: "Video" },
    { id: "reelbuilder", icon: "🎞️", label: "Reels" },
    { id: "wochenplan", icon: "📅", label: "Wochenplan" },
    { id: "engagement", icon: "💬", label: "Engagement" },
    { id: "insights", icon: "📊", label: "Insights" },
  ];
  const btn = (bg: string, extra?: any) => ({ padding: 14, borderRadius: 12, border: "none" as const, background: bg, color: "#fff", fontSize: 14, fontWeight: 700 as const, cursor: "pointer" as const, width: "100%" as const, ...extra });
  const card = { background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #81C78433" };
  const stBox = (s: string | null) => s ? { marginTop: 12, padding: "8px 14px", borderRadius: 10, background: s.includes("Fehler") ? "#FFF3E0" : C.snow, fontSize: 12, color: s.includes("Fehler") ? "#E65100" : C.forest, fontWeight: 600 as const } : null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", minHeight: "100vh", background: C.cream }}>
      <div style={{ background: "linear-gradient(135deg, #1B5E20, #4CAF50)", padding: "20px", borderRadius: "0 0 24px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#fff", padding: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", flexShrink: 0 }}>
            <img src="/alpenwiese-logo.jpeg" alt="Alpenwiese" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 12 }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, color: "#fff", fontFamily: "'Playfair Display', serif" }}>Alpenwiese</h1>
            <div style={{ color: "#FFD54F", fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const }}>Social Media Agent v3</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", overflow: "auto", padding: "8px 8px", gap: 2, borderBottom: "1px solid #81C78433", background: "#fffc", position: "sticky" as const, top: 0, zIndex: 10 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setStatus(null); }} style={{ padding: "6px 10px", border: "none", cursor: "pointer", borderBottom: activeTab === t.id ? "3px solid #1B5E20" : "3px solid transparent", background: activeTab === t.id ? C.snow : "transparent", color: activeTab === t.id ? C.forest : C.stone, fontWeight: activeTab === t.id ? 700 : 500, fontSize: 10, borderRadius: "8px 8px 0 0", whiteSpace: "nowrap" as const, display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 13 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>

        {/* CONTENT TAB */}
        {activeTab === "generate" && (
          <div style={{ ...card, boxShadow: "0 0 20px #81C78444" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 17, color: C.forest }}>🌿 Content Generator</h2>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: C.stone, textTransform: "uppercase" as const }}>Content-Typ</label>
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" as const }}>
                {[{ id: "post", l: "📸 Post" }, { id: "story", l: "📱 Story" }, { id: "reel", l: "🎬 Reel" }, { id: "comment", l: "💬 Kommentar" }].map(t => (
                  <button key={t.id} onClick={() => setContentType(t.id)} style={{ padding: "6px 14px", borderRadius: 20, border: contentType === t.id ? "2px solid #1B5E20" : "1px solid #81C78466", background: contentType === t.id ? "#1B5E20" : "#fff", color: contentType === t.id ? "#fff" : "#1B5E20", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{t.l}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: C.stone, textTransform: "uppercase" as const }}>Tonalitaet</label>
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" as const }}>
                {["witzig", "informativ", "frech", "herzlich"].map(t => (
                  <button key={t} onClick={() => setTone(t)} style={{ padding: "6px 12px", borderRadius: 20, border: tone === t ? "2px solid #4CAF50" : "1px solid #81C78444", background: tone === t ? "#4CAF5022" : "#fff", color: "#1B5E20", cursor: "pointer", fontSize: 11, fontWeight: tone === t ? 700 : 500 }}>{t}</button>
                ))}
              </div>
            </div>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Thema eingeben..." style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #81C78444", fontSize: 14, background: C.snow, boxSizing: "border-box" as const, marginBottom: 12 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={generate} disabled={loading} style={{ ...btn("linear-gradient(135deg, #1B5E20, #4CAF50)"), flex: 1 }}>{loading ? "..." : "🌿 Caption"}</button>
              <button onClick={generateImage} disabled={loading} style={{ ...btn("linear-gradient(135deg, #FF9800, #F57C00)"), width: "auto", padding: "14px 20px" }}>📸 Bild</button>
            </div>
            {status && <div style={stBox(status)!}>{status}</div>}
            {imagePreview && <div style={{ marginTop: 16, textAlign: "center" as const }}><img src={imagePreview} alt="" style={{ maxWidth: "100%", borderRadius: 12, border: "2px solid #81C78444" }} /></div>}
            {result && (<div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: C.snow, border: "1px solid #81C78444" }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap" as const, gap: 6 }}><span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "#FFD54F44", color: C.forest }}>Generiert</span><div style={{ display: "flex", gap: 6 }}><button onClick={() => navigator.clipboard?.writeText(result)} style={{ padding: "4px 12px", borderRadius: 8, border: "1px solid #81C784", background: "#fff", fontSize: 11, cursor: "pointer", color: C.forest }}>Kopieren</button></div></div><pre style={{ whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const, fontSize: 13, lineHeight: 1.6, color: C.bark, margin: 0 }}>{result}</pre></div>)}
          </div>
        )}

        {/* IMAGE TAB */}
        {activeTab === "image" && (
          <div style={card}>
            <h2 style={{ margin: "0 0 12px", fontSize: 17, color: C.forest }}>📸 Bild-Generator</h2>
            <p style={{ fontSize: 12, color: C.stone, margin: "0 0 12px" }}>Fotorealistische Bilder mit Alpenwiese-Branding.</p>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Bild beschreiben..." style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #81C78444", fontSize: 14, marginBottom: 12, boxSizing: "border-box" as const }} />
            <button onClick={generateImage} disabled={loading} style={btn("linear-gradient(135deg, #FF9800, #F57C00)")}>{loading ? "Generiert..." : "📸 Bild generieren"}</button>
            {status && <div style={stBox(status)!}>{status}</div>}
            {imagePreview && (<div style={{ marginTop: 16 }}><img src={imagePreview} alt="" style={{ width: "100%", borderRadius: 12, border: "2px solid #81C78444" }} /><div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: "#FFF8E1", border: "1px solid #FFD54F44" }}><label style={{ fontSize: 10, fontWeight: 600, color: "#F57F17", textTransform: "uppercase" as const }}>Bild verfeinern</label><input type="text" value={imageFeedback} onChange={e => setImageFeedback(e.target.value)} placeholder="z.B. Mehr Sonnenlicht, Brokkoli groesser..." style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #FFD54F66", fontSize: 12, marginTop: 4, boxSizing: "border-box" as const }} /><button onClick={refineImageFn} disabled={loading || !imageFeedback.trim()} style={{ marginTop: 6, width: "100%", padding: "8px 14px", borderRadius: 8, border: "none", background: imageFeedback.trim() ? "linear-gradient(135deg, #FF9800, #F57C00)" : "#eee", color: imageFeedback.trim() ? "#fff" : "#999", fontSize: 11, fontWeight: 700, cursor: imageFeedback.trim() ? "pointer" : "default" }}>Verfeinern</button></div><div style={{ marginTop: 8, display: "flex", gap: 6 }}><a href={imagePreview} download="alpenwiese-post.png" style={{ flex: 1, padding: "8px 14px", borderRadius: 8, background: "#1B5E20", color: "#fff", fontSize: 11, fontWeight: 700, textDecoration: "none", textAlign: "center" as const }}>Herunterladen</a><button onClick={generateImage} style={{ flex: 1, padding: "8px 14px", borderRadius: 8, border: "1px solid #81C784", background: "#fff", fontSize: 11, cursor: "pointer", color: C.forest }}>Komplett neu</button></div></div>)}
          </div>
        )}

        {/* VIDEO TAB */}
        {activeTab === "video" && (
          <div style={card}>
            <h2 style={{ margin: "0 0 12px", fontSize: 17, color: C.forest }}>🎬 Einzel-Video (Veo 2)</h2>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Video beschreiben..." style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #81C78444", fontSize: 14, marginBottom: 12, boxSizing: "border-box" as const }} />
            <button onClick={() => generateSingleVideo()} disabled={loading} style={btn("linear-gradient(135deg, #9C27B0, #7B1FA2)")}>{loading ? "Veo generiert... (1-3 Min)" : "🎬 Video generieren"}</button>
            {status && <div style={stBox(status)!}>{status}</div>}
            {result && result.startsWith("http") && (<div style={{ marginTop: 16 }}><video controls autoPlay loop playsInline style={{ width: "100%", maxWidth: 400, borderRadius: 12, border: "2px solid #81C78444", display: "block", margin: "0 auto" }}><source src={videoProxy(result)} type="video/mp4" /></video><div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center" }}><a href={videoProxy(result)} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 16px", borderRadius: 8, background: "#9C27B0", color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Herunterladen</a></div><div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: "#FFF8E1", border: "1px solid #FFD54F44" }}><label style={{ fontSize: 10, fontWeight: 600, color: "#F57F17", textTransform: "uppercase" as const }}>Video verfeinern</label><input type="text" value={videoFeedback} onChange={e => setVideoFeedback(e.target.value)} placeholder="z.B. Langsamere Kamera, mehr Nebel..." style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #FFD54F66", fontSize: 12, marginTop: 4, boxSizing: "border-box" as const }} /><button onClick={refineVideoFn} disabled={loading || !videoFeedback.trim()} style={{ marginTop: 6, width: "100%", padding: "8px 14px", borderRadius: 8, border: "none", background: videoFeedback.trim() ? "linear-gradient(135deg, #FF9800, #F57C00)" : "#eee", color: videoFeedback.trim() ? "#fff" : "#999", fontSize: 11, fontWeight: 700, cursor: videoFeedback.trim() ? "pointer" : "default" }}>Video verfeinern</button></div></div>)}
          </div>
        )}

        {/* REEL BUILDER TAB */}
        {activeTab === "reelbuilder" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
            <div style={{ ...card, boxShadow: "0 0 20px #81C78444" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 17, color: C.forest }}>🎞️ Reel-Builder</h2>
              <p style={{ fontSize: 12, color: C.stone, margin: "0 0 12px" }}>3 Szenen mit visueller Konsistenz und Story-Aufbau.</p>
              <input type="text" value={reelTheme} onChange={e => setReelTheme(e.target.value)} placeholder="Reel-Thema eingeben..." style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #81C78444", fontSize: 14, marginBottom: 12, boxSizing: "border-box" as const }} />
              <button onClick={planScenes} disabled={buildingReel} style={btn("linear-gradient(135deg, #1B5E20, #4CAF50)")}>{buildingReel ? "Plant..." : "🎬 Szenen planen"}</button>
              {status && <div style={stBox(status)!}>{status}</div>}
            </div>
            {scenes.map((scene, i) => (
              <div key={i} style={{ ...card, border: scene.status === "done" ? "2px solid #4CAF50" : scene.status === "generating" ? "2px solid #FF9800" : "1px solid #81C78433" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 14, color: C.forest }}>Szene {i+1}</h3>
                  <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: scene.status === "done" ? "#4CAF5022" : "#f5f5f5", color: scene.status === "done" ? "#2E7D32" : "#999" }}>{scene.status === "done" ? "Fertig" : scene.status === "generating" ? "..." : "Bereit"}</span>
                </div>
                <textarea value={scene.prompt} onChange={e => { const u = [...scenes]; u[i] = { ...u[i], prompt: e.target.value }; setScenes(u); }} rows={2} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #81C78444", fontSize: 11, marginBottom: 6, boxSizing: "border-box" as const, resize: "vertical" as const }} />
                <input type="text" value={scene.overlay} onChange={e => { const u = [...scenes]; u[i] = { ...u[i], overlay: e.target.value }; setScenes(u); }} placeholder="Text-Overlay" style={{ width: "100%", padding: 6, borderRadius: 8, border: "1px solid #81C78444", fontSize: 11, marginBottom: 8, boxSizing: "border-box" as const }} />
                {scene.status !== "generating" && <button onClick={() => generateClip(i)} style={{ ...btn("#9C27B0"), fontSize: 12, padding: 8 }}>{scene.status === "done" ? "Neu" : "🎬 Generieren"}</button>}
                {scene.status === "generating" && <div style={{ padding: 8, textAlign: "center" as const, fontSize: 11, color: "#E65100" }}>Generiert... (1-3 Min)</div>}
                {scene.videoUrl && scene.status === "done" && (<div style={{ marginTop: 10 }}><video controls playsInline style={{ width: "100%", maxWidth: 280, borderRadius: 10, display: "block", margin: "0 auto" }}><source src={videoProxy(scene.videoUrl)} type="video/mp4" /></video><a href={videoProxy(scene.videoUrl)} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 6, padding: "6px 12px", borderRadius: 8, background: "#9C27B0", color: "#fff", fontSize: 11, fontWeight: 700, textDecoration: "none", textAlign: "center" as const }}>Download</a><div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: "#FFF8E1" }}><input type="text" value={scene.feedback || ""} onChange={e => { const u = [...scenes]; u[i] = { ...u[i], feedback: e.target.value }; setScenes(u); }} placeholder="Feedback..." style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #FFD54F66", fontSize: 11, boxSizing: "border-box" as const }} /><button onClick={() => refineClip(i)} disabled={!scene.feedback?.trim()} style={{ marginTop: 4, width: "100%", padding: 6, borderRadius: 6, border: "none", background: scene.feedback?.trim() ? "#FF9800" : "#eee", color: scene.feedback?.trim() ? "#fff" : "#999", fontSize: 10, fontWeight: 700, cursor: scene.feedback?.trim() ? "pointer" : "default" }}>Verfeinern</button></div></div>)}
              </div>
            ))}
            {scenes.length > 0 && (<div style={card}><div style={{ display: "flex", gap: 8 }}><button onClick={generateAllClips} style={{ ...btn("#1B5E20"), flex: 1 }}>Alle generieren</button><button onClick={generateReelCaption} style={{ ...btn("#FF9800"), width: "auto", padding: "14px 16px" }}>Caption</button></div>{scenes.every(s => s.status === "done") && (<div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "#E8F5E9", textAlign: "center" as const }}><div style={{ fontSize: 13, fontWeight: 700, color: "#2E7D32", marginBottom: 6 }}>Alle fertig!</div><div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" as const }}>{scenes.map((s, i) => s.videoUrl ? <a key={i} href={videoProxy(s.videoUrl)} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", borderRadius: 8, background: "#9C27B0", color: "#fff", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>Szene {i+1}</a> : null)}</div></div>)}{reelCaption && (<div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: C.snow }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 11, fontWeight: 600, color: C.forest }}>Reel-Caption</span><button onClick={() => navigator.clipboard?.writeText(reelCaption)} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid #81C784", background: "#fff", fontSize: 10, cursor: "pointer", color: C.forest }}>Kopieren</button></div><pre style={{ whiteSpace: "pre-wrap" as const, fontSize: 12, lineHeight: 1.5, color: C.bark, margin: 0 }}>{reelCaption}</pre></div>)}</div>)}
          </div>
        )}

        {/* WOCHENPLAN TAB */}
        {activeTab === "wochenplan" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
            <div style={{ ...card, boxShadow: "0 0 20px #81C78444" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 17, color: C.forest }}>📅 Wochenplan</h2>
              <p style={{ fontSize: 12, color: C.stone, margin: "0 0 12px" }}>KI erstellt 7 Tage Content. Bilder generieren, dann als CSV fuer Meta Business Suite exportieren.</p>
              <button onClick={generateWeekPlan} disabled={planLoading} style={btn("linear-gradient(135deg, #1B5E20, #4CAF50)")}>{planLoading ? "Generiert Wochenplan..." : "📅 Wochenplan generieren"}</button>
              {status && <div style={stBox(status)!}>{status}</div>}
            </div>
            {weekPlan.map((day, i) => (
              <div key={i} style={{ ...card, border: day.imageUrl ? "2px solid #4CAF50" : "1px solid #81C78433" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 14, color: C.forest }}>{day.day}</h3>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <span style={{ padding: "2px 10px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: day.type === "reel" ? "#9C27B022" : day.type === "story" ? "#2196F322" : "#FF980022", color: day.type === "reel" ? "#7B1FA2" : day.type === "story" ? "#1565C0" : "#E65100" }}>{day.type}</span>
                    <span style={{ fontSize: 10, color: C.stone }}>{day.time}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.stone, marginBottom: 8 }}>{day.theme}</div>
                <div style={{ padding: 12, borderRadius: 10, background: C.snow, border: "1px solid #81C78422", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: C.forest, textTransform: "uppercase" as const }}>Caption</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => navigator.clipboard?.writeText(day.caption)} style={{ padding: "2px 8px", borderRadius: 6, border: "1px solid #81C784", background: "#fff", fontSize: 9, cursor: "pointer", color: C.forest }}>Kopieren</button>
                      <button onClick={() => regenerateCaption(i)} style={{ padding: "2px 8px", borderRadius: 6, border: "none", background: "#FF9800", fontSize: 9, cursor: "pointer", color: "#fff", fontWeight: 700 }}>Neu</button>
                    </div>
                  </div>
                  <pre style={{ whiteSpace: "pre-wrap" as const, fontSize: 11, lineHeight: 1.5, color: C.bark, margin: 0 }}>{day.caption}</pre>
                </div>
                {day.imageUrl && <img src={day.imageUrl} alt="" style={{ width: "100%", borderRadius: 10, marginBottom: 8, border: "1px solid #81C78444" }} />}
                <div style={{ display: "flex", gap: 6 }}>
                  {!day.imageUrl && <button onClick={() => generateDayImage(i)} style={{ ...btn("linear-gradient(135deg, #FF9800, #F57C00)"), fontSize: 12, padding: 10, flex: 1 }}>📸 Bild generieren</button>}
                  {day.imageUrl && <a href={day.imageUrl} download={"alpenwiese-" + day.day.toLowerCase() + ".png"} style={{ flex: 1, padding: "8px 14px", borderRadius: 8, background: "#1B5E20", color: "#fff", fontSize: 11, fontWeight: 700, textDecoration: "none", textAlign: "center" as const }}>Bild herunterladen</a>}
                  {day.imageUrl && <button onClick={() => generateDayImage(i)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #81C784", background: "#fff", fontSize: 11, cursor: "pointer", color: C.forest }}>Neues Bild</button>}
                </div>
              </div>
            ))}
            {weekPlan.length > 0 && (
              <div style={card}>
                <button onClick={exportCSV} style={btn("linear-gradient(135deg, #0050AA, #1565C0)")}>📋 CSV fuer Meta Business Suite exportieren</button>
                <p style={{ fontSize: 10, color: C.stone, marginTop: 8, textAlign: "center" as const }}>Importiere die CSV in Meta Business Suite unter "Planer" um Posts vorzuplanen.</p>
              </div>
            )}
          </div>
        )}

        {/* ENGAGEMENT TAB */}
        {activeTab === "engagement" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
            <div style={{ ...card, boxShadow: "0 0 20px #81C78444" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 17, color: C.forest }}>💬 Engagement Dashboard</h2>
              <p style={{ fontSize: 12, color: C.stone, margin: "0 0 12px" }}>Finde relevante Posts, generiere Kommentare, entdecke Profile zum Folgen.</p>
            </div>

            {/* Hashtag Search */}
            <div style={card}>
              <h3 style={{ margin: "0 0 10px", fontSize: 14, color: C.forest }}>🔍 Hashtag-Suche</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="text" value={hashtagSearch} onChange={e => setHashtagSearch(e.target.value)} placeholder="z.B. medizinalcannabis, brokkoli, swissmade..." style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #81C78444", fontSize: 13, boxSizing: "border-box" as const }} />
                <button onClick={searchHashtags} style={{ ...btn("#1B5E20"), width: "auto", padding: "10px 16px", fontSize: 12 }}>Suchen</button>
              </div>
              {status && <div style={stBox(status)!}>{status}</div>}
              {hashtagResults.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  {hashtagResults.slice(0, 5).map((post: any, i: number) => (
                    <div key={i} style={{ padding: 10, borderRadius: 8, background: i % 2 === 0 ? C.snow : "#fff", marginBottom: 4, fontSize: 11 }}>
                      <div style={{ color: C.bark }}>{(post.caption || "Kein Text").slice(0, 120)}...</div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <span style={{ color: C.stone, fontSize: 10 }}>{post.media_type} | {new Date(post.timestamp).toLocaleDateString("de")}</span>
                        {post.permalink && <a href={post.permalink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#0050AA" }}>Oeffnen</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comment Generator */}
            <div style={card}>
              <h3 style={{ margin: "0 0 10px", fontSize: 14, color: C.forest }}>✍️ Kommentar-Generator</h3>
              <p style={{ fontSize: 11, color: C.stone, margin: "0 0 8px" }}>Beschreibe den Post den du kommentieren willst:</p>
              <input type="text" value={commentContext} onChange={e => setCommentContext(e.target.value)} placeholder="z.B. Post ueber Cannabis-Legalisierung in Deutschland..." style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #81C78444", fontSize: 12, marginBottom: 8, boxSizing: "border-box" as const }} />
              <button onClick={suggestComments} style={btn("linear-gradient(135deg, #FF9800, #F57C00)")}>💬 Kommentare generieren</button>
              {commentSuggestions.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  {commentSuggestions.map((c, i) => (
                    <div key={i} style={{ padding: 12, borderRadius: 10, background: C.snow, marginBottom: 8, border: "1px solid #81C78422" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: C.stone, textTransform: "uppercase" as const }}>{c.style}</span>
                        <button onClick={() => navigator.clipboard?.writeText(c.comment)} style={{ padding: "2px 10px", borderRadius: 6, border: "1px solid #81C784", background: "#fff", fontSize: 10, cursor: "pointer", color: C.forest }}>Kopieren</button>
                      </div>
                      <div style={{ fontSize: 12, color: C.bark, lineHeight: 1.5 }}>{c.comment}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Suggestions */}
            <div style={card}>
              <h3 style={{ margin: "0 0 10px", fontSize: 14, color: C.forest }}>👥 Profil-Empfehlungen</h3>
              <p style={{ fontSize: 11, color: C.stone, margin: "0 0 8px" }}>Welchen Profil-Typen sollte Alpenwiese folgen?</p>
              <button onClick={suggestProfiles} style={btn("linear-gradient(135deg, #1B5E20, #4CAF50)")}>👥 Profile vorschlagen</button>
              {profileSuggestions.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  {profileSuggestions.map((p, i) => (
                    <div key={i} style={{ padding: 12, borderRadius: 10, background: C.snow, marginBottom: 8, border: "1px solid #81C78422" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.forest, marginBottom: 4 }}>{p.category}</div>
                      <div style={{ fontSize: 11, color: C.bark, marginBottom: 4 }}>{p.reason}</div>
                      <div style={{ fontSize: 11, color: C.stone }}>Suchbegriffe: {(p.searchTerms || []).join(", ")}</div>
                      <div style={{ fontSize: 11, color: "#FF9800", marginTop: 4 }}>Tipp: {p.engagementTip}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hashtag Recommendations */}
            <div style={card}>
              <h3 style={{ margin: "0 0 10px", fontSize: 14, color: C.forest }}>#️ Hashtag-Empfehlungen</h3>
              <button onClick={loadHashtags} style={btn("linear-gradient(135deg, #9C27B0, #7B1FA2)")}>#️ Hashtags laden</button>
              {suggestedHashtags && (
                <div style={{ marginTop: 12 }}>
                  {Object.entries(suggestedHashtags).map(([group, tags]: [string, any]) => (
                    <div key={group} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.forest, textTransform: "uppercase" as const, marginBottom: 4 }}>{group}</div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
                        {(tags || []).map((tag: string, i: number) => (
                          <button key={i} onClick={() => navigator.clipboard?.writeText(tag)} style={{ padding: "4px 10px", borderRadius: 12, border: "1px solid #81C78444", background: "#fff", fontSize: 11, cursor: "pointer", color: C.forest }}>{tag}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { const all = Object.values(suggestedHashtags).flat().join(" "); navigator.clipboard?.writeText(all); setStatus("Alle Hashtags kopiert!"); }} style={{ marginTop: 8, ...btn("#1B5E20"), fontSize: 12, padding: 10 }}>Alle Hashtags kopieren</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === "insights" && (
          <div style={card}>
            <h2 style={{ margin: "0 0 12px", fontSize: 17, color: C.forest }}>📊 Insights</h2>
            <button onClick={async () => { setLoading(true); try { const r = await fetch("/api/instagram"); const d = await r.json(); setResult(JSON.stringify(d, null, 2)); } catch (e: any) { setResult("Fehler: " + e.message); } setLoading(false); }} style={btn("linear-gradient(135deg, #1B5E20, #4CAF50)")}>📊 Laden</button>
            {result && <pre style={{ marginTop: 16, padding: 16, borderRadius: 12, background: C.snow, fontSize: 11, overflow: "auto", maxHeight: 400 }}>{result}</pre>}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 16px 30px", textAlign: "center" as const, fontSize: 11, color: C.alpine }}>Alpenwiese Social Media Agent v3.0</div>
    </div>
  );
}

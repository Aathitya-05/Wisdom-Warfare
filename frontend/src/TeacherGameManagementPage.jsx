// src/TeacherGameManagementPage.js
import React, { useEffect, useRef, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000";

/* ================= TopPlayers (global) ================= */
function TopPlayersModal({ players, onClose }) {
  if (!players) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border-2 border-red-600 rounded-xl p-6 max-w-lg w-full relative shadow-3xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-rose-300 hover:text-rose-100 text-3xl font-bold transition-colors duration-200"
        >
          &times;
        </button>
        <h2 className="text-3xl font-extrabold text-rose-300 mb-4 text-center">🏆 Global Top Players</h2>
        <div className="text-gray-200 text-sm leading-relaxed max-h-80 overflow-y-auto">
          <ol className="list-decimal list-inside space-y-2">
            {players.map((p, i) => (
              <li key={i} className="flex justify-between items-center bg-gray-700 p-2 rounded-lg">
                <span className="font-semibold text-rose-200">{p.display_name || p.username || "Unknown"}</span>
                <span className="text-gray-300 text-sm">{p.score ?? 0} points</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/* ================= Manual Add Question (one by one) ================= */
function ManualQuestionModal({ gameTitle, onClose, onAdded }) {
  const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"]; // <-- dropdown options

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleOptionChange = (i, v) => {
    const temp = [...options];
    temp[i] = v;
    setOptions(temp);
  };

  const clearForm = () => {
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrect("");
    setDifficulty("Medium");
    setErr("");
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setErr("");

    if (!question || options.some((o) => !o) || !correct) {
      setErr("Please fill all fields and select the correct answer.");
      return;
    }
    if (!options.includes(correct)) {
      setErr("Correct answer must exactly match one of the options.");
      return;
    }
    if (!DIFFICULTY_OPTIONS.includes(difficulty)) {
      setErr("Please pick a valid difficulty.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: question,
          option_a: options[0],
          option_b: options[1],
          option_c: options[2],
          option_d: options[3],
          correct,
          difficulty, // now guaranteed from dropdown
          // add game_id/game_code if your backend supports it
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);

      if (typeof onAdded === "function") onAdded(data);
      alert("✅ Question added");
      clearForm();
    } catch (e2) {
      setErr(e2.message || "Server error while adding question.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border-2 border-red-600 rounded-xl p-6 w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-rose-300 hover:text-rose-100 text-3xl font-bold"
        >
          &times;
        </button>
        <h2 className="text-2xl font-extrabold text-rose-300 mb-4 text-center">
          ➕ Add Question — {gameTitle}
        </h2>

        {err && <div className="text-red-400 mb-3">{err}</div>}

        <form onSubmit={handleSave} className="space-y-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter question"
            className="w-full p-3 bg-gray-700 border-2 border-red-600 rounded-lg text-white"
            rows={3}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((opt, i) => (
              <input
                key={i}
                value={opt}
                onChange={(e) => handleOptionChange(i, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + i)} (A/B/C/D)`}
                className="w-full p-2 bg-gray-700 border-2 border-red-600 rounded-lg text-white"
                required
              />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <input
              value={correct}
              onChange={(e) => setCorrect(e.target.value)}
              placeholder="Correct answer (paste exact option text)"
              className="w-full p-2 bg-gray-700 border-2 border-red-600 rounded-lg text-white md:col-span-2"
              required
            />

            {/* ---- DROPDOWN instead of typing ---- */}
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full p-2 bg-gray-700 border-2 border-red-600 rounded-lg text-white"
              aria-label="Select difficulty"
            >
              {DIFFICULTY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between mt-2">
            <button
              type="button"
              onClick={clearForm}
              className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
              disabled={saving}
            >
              Clear
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================= CSV Upload ================= */
function UploadQsModal({ gameTitle, onClose, onInserted }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef();

  const reset = () => {
    setFile(null);
    setLoading(false);
    setErrorMsg("");
  };

  useEffect(() => () => reset(), []);

  const handleFile = (f) => {
    setErrorMsg("");
    if (!f) return setFile(null);
    if (!f.name.toLowerCase().endsWith(".csv") && f.type !== "text/csv") {
      setErrorMsg("Please upload a CSV file.");
      return;
    }
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const onSelectClicked = () => inputRef.current?.click();

  const handleUpload = async (e) => {
    e?.preventDefault?.();
    setErrorMsg("");
    if (!file) return setErrorMsg("No file selected.");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("game_name", gameTitle || "Wisdom Warfare");

      const endpoints = [
        `${API_BASE}/questions/bulk`,
        `${API_BASE}/api/questions/bulk`,
        `${API_BASE}/questions/upload`,
        `${API_BASE}/api/questions/upload`,
      ];

      let data = null;
      let lastErr = null;

      for (const url of endpoints) {
        try {
          const res = await fetch(url, { method: "POST", body: formData });
          const text = await res.text();
          let parsed = {};
          try {
            parsed = text ? JSON.parse(text) : {};
          } catch {
            parsed = { raw: text };
          }
          if (res.ok) {
            data = parsed;
            break;
          } else {
            lastErr = parsed?.error || parsed?.message || parsed?.raw || `HTTP ${res.status}`;
          }
        } catch (err) {
          lastErr = err.message || String(err);
        }
      }

      if (!data) {
        setErrorMsg(`Upload failed: ${lastErr || "No working endpoint found"}`);
        setLoading(false);
        return;
      }

      const inserted = data.inserted ?? data.insertedCount ?? 0;
      const skipped = data.skippedCount ?? data.skipped ?? 0;

      if (typeof onInserted === "function") onInserted({ inserted, skipped, raw: data });

      alert(`✅ Upload succeeded. Inserted: ${inserted}. Skipped: ${skipped}.`);
      setLoading(false);
      onClose();
    } catch (err) {
      console.error("CSV upload error:", err);
      setErrorMsg("Network or server error while uploading. See console for details.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border-2 border-red-600 rounded-xl p-6 max-w-2xl w-full relative shadow-3xl">
        <button
          onClick={() => {
            reset();
            onClose();
          }}
          className="absolute top-4 right-4 text-rose-300 hover:text-rose-100 text-3xl font-bold"
        >
          &times;
        </button>

        <h2 className="text-2xl font-extrabold text-rose-300 mb-4 text-center">
          Upload Questions — {gameTitle}
        </h2>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`w-full p-6 mb-4 rounded-lg border-2 border-dashed ${
            dragOver ? "border-rose-400 bg-gray-700" : "border-gray-600 bg-gray-800"
          } text-center`}
          style={{ cursor: "pointer" }}
          onClick={onSelectClicked}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files && e.target.files[0])}
          />
          {file ? (
            <div>
              <div className="text-white font-semibold">{file.name}</div>
              <div className="text-sm text-gray-300 mt-1">{(file.size / 1024).toFixed(1)} KB</div>
              <div className="text-xs text-gray-400 mt-2">Click or drag another file to replace</div>
            </div>
          ) : (
            <div>
              <div className="text-rose-200 font-medium">Click or drag a CSV file here</div>
              <div className="text-sm text-gray-400 mt-2">
                CSV must include columns like: <code>question,a,b,c,d,correct</code> (header names are flexible).
              </div>
            </div>
          )}
        </div>

        {errorMsg && <div className="text-red-400 mb-3">{errorMsg}</div>}

        <div className="flex justify-between gap-4">
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold"
          >
            {loading ? "Uploading..." : "Upload & Insert"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= Per-game leaderboard ================= */
function ViewRankModal({ gameTitle, ranks, onClose }) {
  if (!ranks) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border-2 border-red-600 rounded-xl p-6 max-w-lg w-full relative shadow-3xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-rose-300 hover:text-rose-100 text-3xl font-bold"
        >
          &times;
        </button>
        <h2 className="text-3xl font-extrabold text-rose-300 mb-4 text-center">Ranks for {gameTitle}</h2>
        <ol className="text-gray-200 text-sm leading-relaxed max-h-80 overflow-y-auto">
          {ranks.length > 0 ? (
            ranks.map((p, i) => (
              <li key={i} className="flex justify-between items-center bg-gray-700 p-2 rounded-lg mb-1">
                <span>{p.display_name || p.username || "Unknown"}</span>
                <span>{p.score ?? 0} pts</span>
              </li>
            ))
          ) : (
            <p>No ranks yet.</p>
          )}
        </ol>
      </div>
    </div>
  );
}

/* ================= Card ================= */
function TeacherGameCard({
  title,
  icon,
  gameCode,
  onGenerateCode,
  onUploadQs,
  onManualAdd,
  onEmptyQuestions,
  onViewRank,
  onDownloadResult,
}) {
  return (
    <div className="bg-gray-900 rounded-3xl p-6 border-2 border-red-600">
      <h3 className="text-3xl font-extrabold text-rose-300 mb-4 text-center">
        {icon} {title}
      </h3>

      {/* game code block (only shows for Wisdom Warfare) */}
      {title === "Wisdom Warfare" && (
        <div className="bg-gray-800 rounded-xl p-3 border border-red-500/40 mb-4">
          <div className="text-sm text-rose-200 mb-1">Your Game Code</div>
          <div className="flex items-center justify-between">
            <div className="text-xl font-black tracking-widest text-white">
              {gameCode || "— — — — — —"}
            </div>
            <button
              onClick={onGenerateCode}
              className="ml-3 px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-sm"
            >
              {gameCode ? "Refresh Code" : "Generate Code"}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-4">
        {title === "Wisdom Warfare" && (
          <>
            <button
              onClick={onManualAdd}
              className="col-span-2 py-2 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400"
            >
              ✍️ Add Question (Manual)
            </button>
            <button
              onClick={onUploadQs}
              className="col-span-2 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500"
            >
              ⬆ Upload CSV
            </button>
            <button
              onClick={onEmptyQuestions}
              className="col-span-2 py-2 rounded-xl bg-gray-700 text-rose-300 hover:bg-gray-600"
              title="Remove all questions linked to this code"
            >
              🧹 Empty Questions (this code)
            </button>
          </>
        )}
        <button
          onClick={onViewRank}
          className="py-2 rounded-xl bg-gray-700 text-rose-300 hover:bg-gray-600"
        >
          📊 View Rank
        </button>
        <button
          onClick={onDownloadResult}
          className="py-2 rounded-xl bg-gray-700 text-rose-300 hover:bg-gray-600"
        >
          ⬇ Download Result
        </button>
      </div>
    </div>
  );
}

/* ================= Main Page ================= */
export default function TeacherGameManagementPage() {
  const [showTopPlayersModal, setShowTopPlayersModal] = useState(false);
  const [showUploadQsModal, setShowUploadQsModal] = useState(false);
  const [showManualQsModal, setShowManualQsModal] = useState(false);
  const [showViewRankModal, setShowViewRankModal] = useState(false);

  const [currentTeacherGameTitle, setCurrentTeacherGameTitle] = useState("");
  const [topPlayers, setTopPlayers] = useState([]);
  const [ranks, setRanks] = useState([]);

  // Unique code for this teacher's Wisdom Warfare session
  const [wwGameCode, setWwGameCode] = useState("");

  const games = [
    { name: "Wisdom Warfare", icon: "🧠" },
    { name: "Mystery Spinner", icon: "🎡" },
    { name: "Escape Room", icon: "🗝" },
    { name: "A. Crossword", icon: "📝" },
  ];

  /* --------------- helpers to identify teacher --------------- */
  const getTeacherIdOrUid = () => {
    // we try multiple keys to be resilient
    return (
      localStorage.getItem("user_id") ||
      localStorage.getItem("uid") ||
      sessionStorage.getItem("user_id") ||
      sessionStorage.getItem("uid") ||
      null
    );
  };

  /* --------------- load global top players --------------- */
  useEffect(() => {
    if (!showTopPlayersModal) return;
    fetch(`${API_BASE}/leaderboard?limit=10`)
      .then((r) => r.json())
      .then(setTopPlayers)
      .catch((err) => {
        console.error("Error loading global leaderboard:", err);
        setTopPlayers([]);
      });
  }, [showTopPlayersModal]);

  /* --------------- fetch existing or create new WW code --------------- */
  const fetchOrCreateWwCode = async () => {
    const teacher = getTeacherIdOrUid();
    if (!teacher) {
      console.warn("No teacher id/uid in storage.");
      return;
    }

    try {
      // 1) try to find latest session
      const q = new URLSearchParams({ game_name: "Wisdom Warfare" }).toString();
      const res = await fetch(`${API_BASE}/teacher/my-games?${q}`);
      if (res.ok) {
        const arr = await res.json().catch(() => []);
        if (Array.isArray(arr) && arr.length > 0) {
          // pick most recent
          const latest = arr[0];
          if (latest?.game_code) {
            setWwGameCode(latest.game_code);
            return;
          }
        }
      }

      // 2) otherwise, create a new one
      const createRes = await fetch(`${API_BASE}/teacher/new-game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher: teacher, game_name: "Wisdom Warfare" }),
      });
      const data = await createRes.json().catch(() => ({}));
      if (!createRes.ok) throw new Error(data?.error || data?.message || "Failed to create game code");
      if (data?.game_code) setWwGameCode(data.game_code);
    } catch (err) {
      console.error("fetchOrCreateWwCode error:", err);
    }
  };

  useEffect(() => {
    fetchOrCreateWwCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------- actions --------------- */
  const handleGenerateCode = async () => {
    const teacher = getTeacherIdOrUid();
    if (!teacher) return alert("No teacher identity found. Please sign in as a teacher.");
    try {
      const res = await fetch(`${API_BASE}/teacher/new-game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher, game_name: "Wisdom Warfare" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "Failed to create/refresh game code");
      setWwGameCode(data?.game_code || "");
      alert(`🎟️ Game code: ${data?.game_code || "(none)"}`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not generate code.");
    }
  };

  const handleUploadQsClick = (gameTitle) => {
    setCurrentTeacherGameTitle(gameTitle);
    setShowUploadQsModal(true);
  };

  const handleManualAddClick = (gameTitle) => {
    setCurrentTeacherGameTitle(gameTitle);
    setShowManualQsModal(true);
  };

  const handleEmptyQuestions = async () => {
    if (!wwGameCode) return alert("No game code yet.");
    const teacher = getTeacherIdOrUid();
    if (!teacher) return alert("No teacher identity found.");

    if (!window.confirm(`This will delete ALL questions linked to code ${wwGameCode}. Continue?`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/teacher/wipe-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher, game_code: wwGameCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "Failed to wipe questions");
      alert("🧹 Questions cleared for this code.");
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not wipe questions.");
    }
  };

  const handleViewRankClick = async (gameTitle) => {
    setCurrentTeacherGameTitle(gameTitle);
    try {
      // per your earlier server, this returns per-game (by name) leaderboard
      const res = await fetch(`${API_BASE}/leaderboard?game_name=${encodeURIComponent(gameTitle)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRanks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching ranks:", err);
      setRanks([]);
    }
    setShowViewRankModal(true);
  };

  const handleUploadInserted = ({ inserted, skipped }) => {
    console.log(`Inserted ${inserted} questions, skipped ${skipped}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-rose-950 flex flex-col items-center p-4">
      <h1 className="text-5xl font-black text-rose-400 mb-10 text-center">
        ⚔ INTERACTIVE GAMIFIED LEARNING SYSTEM
      </h1>

      {/* Top players button */}
      <div className="mb-8">
        <button
          onClick={() => setShowTopPlayersModal(true)}
          className="px-8 py-3 rounded-lg bg-gray-700 text-rose-300 hover:bg-gray-600 font-bold text-lg"
        >
          🏆 View Global Top Players
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full">
        {[
          { name: "Wisdom Warfare", icon: "🧠" },
          { name: "Mystery Spinner", icon: "🎡" },
          { name: "Escape Room", icon: "🗝" },
          { name: "A. Crossword", icon: "📝" },
        ].map((g) => (
          <TeacherGameCard
            key={g.name}
            title={g.name}
            icon={g.icon}
            gameCode={g.name === "Wisdom Warfare" ? wwGameCode : undefined}
            onGenerateCode={g.name === "Wisdom Warfare" ? handleGenerateCode : undefined}
            onManualAdd={() => handleManualAddClick(g.name)}
            onUploadQs={() => handleUploadQsClick(g.name)}
            onEmptyQuestions={g.name === "Wisdom Warfare" ? handleEmptyQuestions : undefined}
            onViewRank={() => handleViewRankClick(g.name)}
            onDownloadResult={() => alert("Downloading result...")}
          />
        ))}
      </div>

      {/* Logout button */}
      <div className="w-full flex justify-center mt-12 mb-6">
        <button
          onClick={() => (window.location.href = "/")}
          className="px-10 py-4 rounded-xl bg-red-600 text-white hover:bg-red-500 font-bold text-xl"
        >
          🚪 Logout
        </button>
      </div>

      {showTopPlayersModal && (
        <TopPlayersModal
          players={topPlayers}
          onClose={() => setShowTopPlayersModal(false)}
        />
      )}

      {showUploadQsModal && (
        <UploadQsModal
          gameTitle={currentTeacherGameTitle}
          onClose={() => setShowUploadQsModal(false)}
          onInserted={handleUploadInserted}
        />
      )}

      {showManualQsModal && (
        <ManualQuestionModal
          gameTitle={currentTeacherGameTitle}
          onClose={() => setShowManualQsModal(false)}
          onAdded={() => {}}
        />
      )}

      {showViewRankModal && (
        <ViewRankModal
          gameTitle={currentTeacherGameTitle}
          ranks={ranks}
          onClose={() => setShowViewRankModal(false)}
        />
      )}
    </div>
  );
}

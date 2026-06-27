import { useState, useEffect, useRef } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const LOCATIONS = ["Mandir Marg","Anand Vihar","Wazirpur","Jahangirpuri","Dwarka","Rohini","Okhla","Punjabi Bagh"];
const AGE_GROUPS = ["Child","Adult","Elderly"];
const HEALTH_CONDITIONS = ["Healthy","Respiratory","Cardiovascular"];
const DURATION_OPTIONS = [0.5,1,2,3,4,6,8];

const RISK_META = {
  Low:      { color: "#4ade80", bg: "#052e16", bar: 20,  hex: "4ADE80" },
  Moderate: { color: "#fbbf24", bg: "#1c1207", bar: 45,  hex: "FBBF24" },
  High:     { color: "#fb923c", bg: "#1c0e05", bar: 70,  hex: "FB923C" },
  Severe:   { color: "#f87171", bg: "#1c0505", bar: 95,  hex: "F87171" },
};

// ── Utilities ─────────────────────────────────────────────────────────────────
const pad2 = n => String(n).padStart(2, "0");
const fmtHour = h => {
  const s = h >= 12 ? "PM" : "AM";
  return `${pad2(h % 12 || 12)}:00 ${s}`;
};
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
};

// ── Ticker ────────────────────────────────────────────────────────────────────
function Ticker({ value, suffix = "", decimals = 1 }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = Number(value) || 0;
    const dur = 900;
    const step = ts => {
      const p = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * ease);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <>{display.toFixed(decimals)}{suffix}</>;
}

// ── Scanline overlay ──────────────────────────────────────────────────────────
function Scanlines() {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1, pointerEvents:"none",
      background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px)",
    }}/>
  );
}

// ── Corner bracket decoration ─────────────────────────────────────────────────
function Bracket({ style={}, size=10, color="#16a34a" }) {
  const b = `2px solid ${color}`;
  return (
    <>
      <div style={{ position:"absolute", top:0, left:0,   width:size, height:size, borderTop:b, borderLeft:b,  ...style }}/>
      <div style={{ position:"absolute", top:0, right:0,  width:size, height:size, borderTop:b, borderRight:b, ...style }}/>
      <div style={{ position:"absolute", bottom:0, left:0,  width:size, height:size, borderBottom:b, borderLeft:b,  ...style }}/>
      <div style={{ position:"absolute", bottom:0, right:0, width:size, height:size, borderBottom:b, borderRight:b, ...style }}/>
    </>
  );
}

// ── Panel wrapper ─────────────────────────────────────────────────────────────
function Panel({ label, children, accent="#16a34a", style={} }) {
  return (
    <div style={{ position:"relative", border:`1px solid ${accent}30`, borderRadius:2, padding:"20px 20px 18px", background:"rgba(0,12,4,0.85)", ...style }}>
      <Bracket color={accent} size={8}/>
      {label && (
        <div style={{ position:"absolute", top:-10, left:16, background:"#010b04", padding:"0 8px", fontSize:10, fontFamily:"'Space Mono', monospace", color:accent, letterSpacing:"0.15em", textTransform:"uppercase" }}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Label + Control row ───────────────────────────────────────────────────────
function CtrlRow({ label, children }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"130px 1fr", alignItems:"center", gap:12 }}>
      <span style={{ fontSize:10, fontFamily:"'Space Mono',monospace", color:"#4b7c52", letterSpacing:"0.12em", textTransform:"uppercase" }}>{label}</span>
      {children}
    </div>
  );
}

const selectStyle = {
  width:"100%", padding:"8px 10px",
  background:"rgba(22,163,74,0.08)", border:"1px solid #16a34a40",
  borderRadius:2, color:"#86efac", fontSize:12,
  fontFamily:"'Space Mono',monospace", outline:"none", cursor:"pointer",
  appearance:"none", letterSpacing:"0.04em",
};

const inputStyle = {
  ...selectStyle,
  colorScheme:"dark",
};

// ── PEVI ring gauge ───────────────────────────────────────────────────────────
function PeviGauge({ pevi, risk }) {
  const meta = RISK_META[risk] || RISK_META.Low;
  const max = 300;
  const pct = Math.min(pevi / max, 1);
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
      <svg width={128} height={128} viewBox="0 0 128 128">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#0d2e14" strokeWidth={10}/>
        {/* fill */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={meta.color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cy})`}
          filter="url(#glow)"
          style={{ transition:"stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }}
        />
        {/* tick marks */}
        {[0,25,50,75,100].map(p => {
          const a = (p/100)*360 - 90;
          const rad = a * Math.PI / 180;
          const x1 = cx + (r+6)*Math.cos(rad), y1 = cy + (r+6)*Math.sin(rad);
          const x2 = cx + (r+2)*Math.cos(rad), y2 = cy + (r+2)*Math.sin(rad);
          return <line key={p} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1a3d22" strokeWidth={1.5}/>;
        })}
        {/* value */}
        <text x={cx} y={cy-8} textAnchor="middle" fill={meta.color} fontSize={22} fontFamily="'Space Mono',monospace" fontWeight={700} filter="url(#glow)">
          {Math.round(pevi)}
        </text>
        <text x={cx} y={cy+10} textAnchor="middle" fill="#4b7c52" fontSize={9} fontFamily="'Space Mono',monospace" letterSpacing="0.1em">
          PEVI
        </text>
        <text x={cx} y={cy+24} textAnchor="middle" fill={meta.color} fontSize={10} fontFamily="'Space Mono',monospace" letterSpacing="0.08em">
          {risk?.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}

// ── Pollutant bar row ─────────────────────────────────────────────────────────
function PollutantBar({ label, value, max, unit, color="#16a34a" }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ display:"grid", gridTemplateColumns:"60px 1fr 70px", alignItems:"center", gap:10 }}>
      <span style={{ fontSize:10, fontFamily:"'Space Mono',monospace", color:"#4b7c52" }}>{label}</span>
      <div style={{ height:4, background:"#0a1e0d", borderRadius:0, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, boxShadow:`0 0 6px ${color}80`, transition:"width 1s cubic-bezier(.4,0,.2,1)" }}/>
      </div>
      <span style={{ fontSize:10, fontFamily:"'Space Mono',monospace", color:"#86efac", textAlign:"right" }}>
        {typeof value === "number" ? value.toFixed(1) : "—"} <span style={{color:"#4b7c52"}}>{unit}</span>
      </span>
    </div>
  );
}

// ── Stat block ────────────────────────────────────────────────────────────────
function StatBlock({ label, value, sub, accent="#16a34a", ticker=false, decimals=1 }) {
  return (
    <div style={{ padding:"14px 16px", border:`1px solid ${accent}20`, borderLeft:`2px solid ${accent}`, background:"rgba(0,12,4,0.6)" }}>
      <div style={{ fontSize:10, fontFamily:"'Space Mono',monospace", color:"#4b7c52", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:22, fontFamily:"'Space Mono',monospace", color:accent, fontWeight:700, lineHeight:1 }}>
        {ticker ? <Ticker value={value} decimals={decimals}/> : value}
      </div>
      {sub && <div style={{ fontSize:10, color:"#4b7c52", marginTop:4, fontFamily:"'Space Mono',monospace" }}>{sub}</div>}
    </div>
  );
}

// ── Scrolling log line ────────────────────────────────────────────────────────
function LogLine({ text, accent="#4b7c52", delay=0 }) {
  return (
    <div style={{ fontSize:11, fontFamily:"'Space Mono',monospace", color:accent, opacity:0, lineHeight:1.7,
      animation:`fadeIn 0.3s ease ${delay}s forwards` }}>
      <span style={{ color:"#1a3d22", marginRight:8 }}>&gt;</span>{text}
    </div>
  );
}

// ── Blinking cursor ───────────────────────────────────────────────────────────
function Cursor() {
  return <span style={{ display:"inline-block", width:8, height:14, background:"#16a34a", animation:"blink 1s step-end infinite", verticalAlign:"middle", marginLeft:4 }}/>;
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [date, setDate] = useState(today());
  const [location, setLocation] = useState("Anand Vihar");
  const [ageGroup, setAgeGroup] = useState("Adult");
  const [healthCondition, setHealthCondition] = useState("Healthy");
  const [duration, setDuration] = useState(1);
  const [alpha, setAlpha] = useState(0.6);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [time, setTime] = useState(new Date());
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pushLog = (msg) => setLogs(l => [...l.slice(-6), msg]);

  async function handleOptimize() {
    setLoading(true); setError(null); setResult(null); setLogs([]);
    pushLog("Initializing EEOS optimization pipeline...");
    try {
      await new Promise(r => setTimeout(r, 400));
      pushLog(`Loading pollutant data for ${date} · ${location}`);
      await new Promise(r => setTimeout(r, 350));
      pushLog(`Health profile: ${ageGroup.toLowerCase()} / ${healthCondition.toLowerCase()} · ${duration}h duration`);
      await new Promise(r => setTimeout(r, 300));
      pushLog("Running XGBoost PM2.5 prediction model...");

      const url = `http://127.0.0.1:8000/optimize?date=${date}&user_lat=28.6&user_lon=77.2&preference=${alpha}&age_group=${ageGroup.toLowerCase()}&health_condition=${healthCondition.toLowerCase()}&duration_hours=${duration}&alpha=${alpha}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log("API RESPONSE:", data);

      await new Promise(r => setTimeout(r, 250));
      pushLog("Computing PEVI — health-weighted pollutant index...");
      await new Promise(r => setTimeout(r, 200));
      pushLog("Running Haversine distance optimization...");
      await new Promise(r => setTimeout(r, 200));
      pushLog(`✓ Optimal window identified → ${fmtHour(data.recommended_hour)}`);

      setResult(data);
    } catch(e) {
      pushLog("✗ Connection failed — is backend running on :8000?");
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const risk = result?.risk_level;
  const riskMeta = RISK_META[risk] || {};

  return (
    <div style={{ minHeight:"100vh", background:"#010b04", color:"#86efac", fontFamily:"'Space Mono',monospace", position:"relative", overflowX:"hidden" }}>
      <Scanlines/>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne+Mono&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#010b04; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeIn { to{opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes scan { from{transform:translateY(-100%)} to{transform:translateY(100vh)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        select option { background:#010b04; color:#86efac; }
        input[type=range]::-webkit-slider-runnable-track { height:3px; background:#0d2e14; border-radius:0; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:12px; height:12px; background:#16a34a; border:none; margin-top:-4.5px; cursor:pointer; box-shadow:0 0 8px #16a34a80; }
        input[type=range] { -webkit-appearance:none; appearance:none; background:transparent; width:100%; }
        input[type=date]::-webkit-calendar-picker-indicator { filter:invert(0.6) sepia(1) saturate(3) hue-rotate(90deg); cursor:pointer; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:#0d2e14; }
      `}</style>

      {/* moving scan line */}
      <div style={{ position:"fixed", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,#16a34a30,transparent)", animation:"scan 8s linear infinite", zIndex:2, pointerEvents:"none" }}/>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"32px 20px 60px", position:"relative", zIndex:10 }}>

        {/* ── Header ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:40, borderBottom:"1px solid #0d2e14", paddingBottom:20 }}>
          <div>
            <div style={{ fontSize:10, color:"#4b7c52", letterSpacing:"0.2em", marginBottom:8 }}>EEOS // ENVIRONMENTAL EXPOSURE OPTIMIZATION SYSTEM</div>
            <h1 style={{ fontFamily:"'Syne Mono',monospace", fontSize:"clamp(20px,4vw,32px)", color:"#4ade80", fontWeight:700, letterSpacing:"0.05em", lineHeight:1 }}>
              AIR QUALITY<br/>
              <span style={{ color:"#86efac" }}>EXPOSURE OPTIMIZER</span>
            </h1>
            <div style={{ fontSize:10, color:"#1a3d22", marginTop:8, letterSpacing:"0.1em" }}>
              PATENT REF: PEVI · MULTI-OBJECTIVE OPTIMIZATION · XGBOOST ML
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:22, fontFamily:"'Syne Mono',monospace", color:"#4ade80", letterSpacing:"0.1em" }}>
              {pad2(time.getHours())}:{pad2(time.getMinutes())}:{pad2(time.getSeconds())}
            </div>
            <div style={{ fontSize:10, color:"#4b7c52", marginTop:4 }}>
              {time.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})} · IST
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"flex-end", marginTop:8 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", display:"inline-block", animation:"pulse 2s ease-in-out infinite", boxShadow:"0 0 8px #4ade80" }}/>
              <span style={{ fontSize:10, color:"#4b7c52" }}>SYSTEM ONLINE</span>
            </div>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:20, alignItems:"start" }}>

          {/* ── Left: Input panel ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            <Panel label="Mission Parameters" accent="#16a34a">
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <CtrlRow label="Date">
                  <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inputStyle}/>
                </CtrlRow>
                <CtrlRow label="Station">
                  <div style={{ position:"relative" }}>
                    <select value={location} onChange={e=>setLocation(e.target.value)} style={selectStyle}>
                      {LOCATIONS.map(l=><option key={l}>{l}</option>)}
                    </select>
                    <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", color:"#4b7c52", fontSize:10, pointerEvents:"none" }}>▾</span>
                  </div>
                </CtrlRow>
                <CtrlRow label="Age Group">
                  <div style={{ position:"relative" }}>
                    <select value={ageGroup} onChange={e=>setAgeGroup(e.target.value)} style={selectStyle}>
                      {AGE_GROUPS.map(a=><option key={a}>{a}</option>)}
                    </select>
                    <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", color:"#4b7c52", fontSize:10, pointerEvents:"none" }}>▾</span>
                  </div>
                </CtrlRow>
                <CtrlRow label="Condition">
                  <div style={{ position:"relative" }}>
                    <select value={healthCondition} onChange={e=>setHealthCondition(e.target.value)} style={selectStyle}>
                      {HEALTH_CONDITIONS.map(h=><option key={h}>{h}</option>)}
                    </select>
                    <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", color:"#4b7c52", fontSize:10, pointerEvents:"none" }}>▾</span>
                  </div>
                </CtrlRow>
                <CtrlRow label="Duration">
                  <div style={{ position:"relative" }}>
                    <select value={duration} onChange={e=>setDuration(Number(e.target.value))} style={selectStyle}>
                      {DURATION_OPTIONS.map(d=><option key={d} value={d}>{d}h outdoor</option>)}
                    </select>
                    <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", color:"#4b7c52", fontSize:10, pointerEvents:"none" }}>▾</span>
                  </div>
                </CtrlRow>
              </div>
            </Panel>

            <Panel label="Alpha — Optimization Weight" accent="#16a34a">
              <div style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                  <span style={{ fontSize:10, color:"#4b7c52" }}>DISTANCE PRIORITY</span>
                  <span style={{ fontSize:10, color:"#4b7c52" }}>SAFETY PRIORITY</span>
                </div>
                <input type="range" min={0} max={1} step={0.01} value={alpha} onChange={e=>setAlpha(parseFloat(e.target.value))}/>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, alignItems:"center" }}>
                  <span style={{ fontSize:9, color:"#1a3d22" }}>α = 0.0</span>
                  <span style={{ fontSize:14, color:"#4ade80", fontWeight:700 }}>α = {alpha.toFixed(2)}</span>
                  <span style={{ fontSize:9, color:"#1a3d22" }}>α = 1.0</span>
                </div>
              </div>
              <div style={{ fontSize:10, color:"#4b7c52", borderTop:"1px solid #0d2e14", paddingTop:10, lineHeight:1.7 }}>
                SCORE = α·RISK + (1−α)·DIST<br/>
                <span style={{ color:"#1a3d22" }}>Haversine distance · WGS-84</span>
              </div>
            </Panel>

            {/* Execute button */}
            <button onClick={handleOptimize} disabled={loading}
              style={{ width:"100%", padding:"14px", background:loading ? "transparent" : "rgba(22,163,74,0.12)", border:`1px solid ${loading ? "#0d2e14" : "#16a34a"}`, borderRadius:2, color:loading ? "#4b7c52" : "#4ade80", fontSize:12, fontFamily:"'Space Mono',monospace", fontWeight:700, cursor:loading?"not-allowed":"pointer", letterSpacing:"0.15em", textTransform:"uppercase", transition:"all .2s", boxShadow:loading?"none":"0 0 20px rgba(22,163,74,0.15)", position:"relative", overflow:"hidden" }}
              onMouseEnter={e=>{ if(!loading){ e.target.style.background="rgba(22,163,74,0.2)"; e.target.style.boxShadow="0 0 30px rgba(22,163,74,0.3)"; }}}
              onMouseLeave={e=>{ e.target.style.background=loading?"transparent":"rgba(22,163,74,0.12)"; e.target.style.boxShadow=loading?"none":"0 0 20px rgba(22,163,74,0.15)"; }}>
              {loading ? (
                <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                  <span style={{ width:10, height:10, border:"1.5px solid #4b7c52", borderTopColor:"#4ade80", borderRadius:"50%", display:"inline-block", animation:"spin .8s linear infinite" }}/>
                  Processing...
                </span>
              ) : "[ Run Optimization ]"}
            </button>

          </div>

          {/* ── Right: Output panel ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Terminal log */}
            <Panel label="System Log" accent="#1a3d22">
              <div style={{ minHeight:100, display:"flex", flexDirection:"column", justifyContent:"flex-end", gap:2 }}>
                {logs.length === 0 ? (
                  <div style={{ fontSize:11, color:"#1a3d22" }}>
                    <span style={{ marginRight:8 }}>&gt;</span>Awaiting input parameters...<Cursor/>
                  </div>
                ) : (
                  logs.map((l,i) => <LogLine key={i} text={l} accent={l.startsWith("✓") ? "#4ade80" : l.startsWith("✗") ? "#f87171" : "#4b7c52"} delay={0}/>)
                )}
                {loading && <div style={{ fontSize:11, color:"#4b7c52" }}><span style={{ marginRight:8 }}>&gt;</span><Cursor/></div>}
              </div>
            </Panel>

            {/* Error */}
            {error && (
              <Panel label="Error" accent="#f87171">
                <div style={{ fontSize:11, color:"#f87171", lineHeight:1.7 }}>
                  CONNECTION REFUSED · {error}<br/>
                  <span style={{ color:"#4b7c52" }}>Ensure FastAPI server is running on localhost:8000</span>
                </div>
              </Panel>
            )}

            {/* Results */}
            {result && (
              <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"slideUp 0.4s ease both" }}>

                {/* Primary result banner */}
                <Panel label="Optimization Result" accent={riskMeta.color || "#16a34a"}>
                  <div style={{ display:"flex", gap:20, flexWrap:"wrap", alignItems:"center" }}>
                    <PeviGauge pevi={result.pevi ?? 0} risk={risk}/>
                    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:12 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        <StatBlock
                          label="Recommended Hour"
                          value={result.recommended_hour != null ? fmtHour(result.recommended_hour) : "—"}
                          accent="#4ade80"
                        />
                        <StatBlock
                          label="Risk Level"
                          value={risk ?? "—"}
                          accent={riskMeta.color || "#4ade80"}
                        />
                        <StatBlock
                          label="PM2.5 Forecast"
                          value={result.pm25 !== undefined ? result.pm25.toFixed(1) : "—"}
                          sub="μg/m³ · XGBoost"
                          accent="#22d3ee"
                          ticker={result.pm25 != null}
                          decimals={1}
                        />
                        <StatBlock
                          label="Distance"
                          value={result.distance != null ? `${result.distance.toFixed(1)} km` : "—"}
                          sub="Haversine · WGS-84"
                          accent="#a78bfa"
                        />
                      </div>
                    </div>
                  </div>
                </Panel>

                {/* Pollutant breakdown */}
                {result.health_weights && (
                  <Panel label="PEVI Breakdown — Health-Weighted Pollutants" accent="#16a34a">
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      <div style={{ fontSize:10, color:"#4b7c52", marginBottom:4, lineHeight:1.7 }}>
                        PROFILE: {ageGroup.toUpperCase()} / {healthCondition.toUpperCase()} · DURATION: {duration}H<br/>
                        <span style={{ color:"#1a3d22" }}>
                          ADJUSTED PEVI = PEVI × (1 + 0.15 × {duration}) = × {(1 + 0.15*duration).toFixed(3)}
                        </span>
                      </div>
                      {Object.entries(result.health_weights).map(([pol, w]) => (
                        <PollutantBar
                          key={pol}
                          label={pol.toUpperCase()}
                          value={w * 100}
                          max={50}
                          unit="%"
                          color={pol==="pm25"?"#4ade80":pol==="no2"?"#a78bfa":pol==="o3"?"#22d3ee":pol==="co"?"#fbbf24":"#86efac"}
                        />
                      ))}
                    </div>
                  </Panel>
                )}

                {/* Final score breakdown */}
                {result.final_score != null && (
                  <Panel label="Multi-Objective Score" accent="#16a34a">
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                      <StatBlock label="Final Score" value={result.final_score.toFixed(4)} accent="#4ade80" ticker decimals={4}/>
                      <StatBlock label="Alpha Used" value={`α = ${result.alpha_used?.toFixed(2) ?? alpha.toFixed(2)}`} accent="#a78bfa"/>
                      <StatBlock
                        label="PEVI Adjusted"
                        value={result.adjusted_pevi?.toFixed(1) ?? "—"}
                        sub={`× (1 + 0.15×${duration})`}
                        accent="#22d3ee"
                        ticker={result.adjusted_pevi != null}
                        decimals={1}
                      />
                    </div>
                    <div style={{ marginTop:12, fontSize:10, color:"#1a3d22", borderTop:"1px solid #0d2e14", paddingTop:10, lineHeight:1.8 }}>
                      Final Score = {alpha.toFixed(2)} × RISK_NORM + {(1-alpha).toFixed(2)} × DIST_NORM<br/>
                      Station: <span style={{ color:"#4b7c52" }}>{result.station ?? "—"}</span> · City: <span style={{ color:"#4b7c52" }}>{result.city ?? "—"}</span>
                    </div>
                  </Panel>
                )}

                {/* Recommendations (if API returns any) */}
                {result.recommendations?.length > 0 && (
                  <Panel label="AI Recommendations" accent="#16a34a">
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {result.recommendations.map((rec, i) => (
                        <div key={i} style={{ display:"flex", gap:12, fontSize:11, color:"#86efac", lineHeight:1.7 }}>
                          <span style={{ color:"#1a3d22", flexShrink:0 }}>{pad2(i+1)}.</span>
                          {rec}
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}

              </div>
            )}

            {/* Idle state */}
            {!result && !loading && logs.length === 0 && (
              <Panel label="Standby" accent="#1a3d22">
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[
                    ["PEVI Formula","w₁·PM2.5 + w₂·PM10 + w₃·NO2 + w₄·O3 + w₅·CO"],
                    ["Duration Adjust","PEVI × (1 + 0.15 × hours)"],
                    ["Final Score","α·Risk + (1−α)·Distance"],
                    ["Distance Calc","Haversine · WGS-84 sphere"],
                  ].map(([k,v]) => (
                    <div key={k} style={{ padding:"12px", border:"1px solid #0d2e14", background:"rgba(0,12,4,0.4)" }}>
                      <div style={{ fontSize:9, color:"#1a3d22", letterSpacing:"0.12em", marginBottom:5 }}>{k}</div>
                      <div style={{ fontSize:10, color:"#4b7c52", lineHeight:1.6 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ marginTop:40, borderTop:"1px solid #0d2e14", paddingTop:16, display:"flex", justifyContent:"space-between", fontSize:9, color:"#1a3d22", letterSpacing:"0.1em" }}>
          <span>EEOS v1.0 · MANIPAL UNIVERSITY JAIPUR · PATENT FILED 2026</span>
          <span>XGBoost PM2.5 · PEVI · Haversine · Multi-Objective Opt.</span>
        </div>

      </div>
    </div>
  );
}
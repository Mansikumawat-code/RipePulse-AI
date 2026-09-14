import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gauge,
  LineChart,
  PackageCheck,
  Play,
  Pause,
  RotateCcw,
  Route,
  Send,
  ShieldCheck,
  Truck,
  Warehouse,
} from "lucide-react";

const workflowSteps = [
  {
    number: "01",
    role: "Warehouse Manager",
    icon: Warehouse,
    accent: "emerald",
    description: "Turns incoming produce into a living, intelligence-ready batch.",
    tasks: ["Create produce batch", "Manage warehouse inventory", "Run AI-powered risk prediction", "Identify at-risk / urgent batches"],
    statuses: ["Batch Created", "AI Analyzing", "Risk Detected"],
    preview: [
      { label: "Active batches", value: "128", icon: Boxes },
      { label: "AI risk scan", value: "LIVE", icon: Gauge },
      { label: "Urgent queue", value: "07", icon: AlertTriangle },
    ],
  },
  {
    number: "02",
    role: "Supply Chain Manager",
    icon: Truck,
    accent: "amber",
    description: "Moves the right batch through the safest, fastest route.",
    tasks: ["View at-risk batches", "Create dispatch", "Assign and optimize routes", "Track active shipments", "Reroute shipments when required"],
    statuses: ["Dispatch Planned", "Route Assigned", "Shipment In Transit"],
    preview: [
      { label: "Route status", value: "OPTIMAL", icon: Route },
      { label: "In transit", value: "14", icon: Truck },
      { label: "ETA buffer", value: "+08h", icon: Activity },
    ],
  },
  {
    number: "03",
    role: "Destination Receiver",
    icon: PackageCheck,
    accent: "teal",
    description: "Closes the loop with accountable, quality-checked receiving.",
    tasks: ["View incoming shipment", "Verify expected vs received quantity", "Accept shipment", "Partially accept shipment", "Reject damaged shipment", "Submit receipt"],
    statuses: ["Shipment Arrived", "Quantity Verified", "Receipt Submitted"],
    preview: [
      { label: "Arrivals today", value: "09", icon: Send },
      { label: "Quantity match", value: "98.4%", icon: ClipboardCheck },
      { label: "Receipts filed", value: "32", icon: FileText },
    ],
  },
  {
    number: "04",
    role: "Admin",
    icon: ShieldCheck,
    accent: "indigo",
    description: "Sees the complete system, its signals, and its measurable impact.",
    tasks: ["Monitor complete system", "View batches and dispatches", "Track shipment lifecycle", "Monitor alerts", "View audit logs", "View analytics and reports"],
    statuses: ["System Overview", "Alert Generated", "Audit Recorded"],
    preview: [
      { label: "System health", value: "99.98%", icon: LineChart },
      { label: "Open alerts", value: "03", icon: AlertTriangle },
      { label: "Audit trail", value: "SYNCED", icon: ShieldCheck },
    ],
  },
];

const accentStyles = {
  emerald: { text: "text-emerald-300", border: "border-emerald-400/40", soft: "bg-emerald-400/10", glow: "rgba(52,211,153,.45)" },
  amber: { text: "text-amber-300", border: "border-amber-400/40", soft: "bg-amber-400/10", glow: "rgba(251,191,36,.45)" },
  teal: { text: "text-teal-300", border: "border-teal-400/40", soft: "bg-teal-400/10", glow: "rgba(45,212,191,.45)" },
  indigo: { text: "text-indigo-300", border: "border-indigo-400/40", soft: "bg-indigo-400/10", glow: "rgba(129,140,248,.45)" },
};

export const HowHarvestIQWorks = () => {
  const sectionRef = useRef(null);
  const timerRef = useRef(null);
  const [activeStage, setActiveStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    updateMotion();
    media.addEventListener?.("change", updateMotion);
    return () => media.removeEventListener?.("change", updateMotion);
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return undefined;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    window.clearInterval(timerRef.current);
    if (!isPlaying || !isVisible || reducedMotion) return undefined;
    timerRef.current = window.setInterval(() => setActiveStage((stage) => (stage + 1) % workflowSteps.length), 3400);
    return () => window.clearInterval(timerRef.current);
  }, [isPlaying, isVisible, reducedMotion]);

  const replay = () => {
    setActiveStage(0);
    setIsPlaying(true);
  };

  const currentStep = workflowSteps[activeStage];
  const currentAccent = accentStyles[currentStep.accent];
  const progressWidth = `${(activeStage / (workflowSteps.length - 1)) * 100}%`;

  return (
    <section ref={sectionRef} id="role-workflow" className="workflow-section relative overflow-hidden border-y border-emerald-950/80 bg-[#101b12] px-6 py-16 sm:py-20" aria-labelledby="workflow-title">
      <style>{`
        .workflow-section { --workflow-speed: 3.4s; }
        .workflow-track { scrollbar-color: rgba(52,211,153,.45) rgba(255,255,255,.06); }
        .workflow-card { animation: workflowCardEnter .8s cubic-bezier(.16,1,.3,1) both; animation-delay: var(--card-delay); transition: border-color .35s ease, box-shadow .35s ease, transform .35s ease, opacity .35s ease; }
        .workflow-card.is-active { transform: translateY(-8px); animation: workflowCardEnter .8s cubic-bezier(.16,1,.3,1) both, workflowCardGlow 2.4s ease-in-out infinite; animation-delay: var(--card-delay), 0s; }
        .workflow-card.is-past { opacity: .86; }
        .workflow-status { animation: workflowStatusIn .55s both; }
        .workflow-status:nth-child(2) { animation-delay: .12s; }
        .workflow-status:nth-child(3) { animation-delay: .24s; }
        .workflow-status:nth-child(4) { animation-delay: .36s; }
        .workflow-packet { animation: workflowPacket 3.4s cubic-bezier(.65,0,.35,1) both; }
        .workflow-packet.is-paused { animation-play-state: paused; }
        .workflow-scan { animation: workflowScan 2.2s ease-in-out infinite; }
        .workflow-connector { background-image: linear-gradient(90deg, transparent 0%, rgba(110,231,183,.85) 45%, transparent 100%); background-size: 180px 100%; animation: workflowConnectorFlow 2.2s linear infinite; }
        .workflow-connector.is-paused { animation-play-state: paused; }
        @keyframes workflowCardEnter { from { opacity: 0; transform: translateY(18px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes workflowCardGlow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.16); } }
        @keyframes workflowStatusIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes workflowPacket { from { left: var(--packet-start); opacity: 0; transform: scale(.65); } 12% { opacity: 1; transform: scale(1.2); } 82% { opacity: 1; transform: scale(1); } to { left: var(--packet-end); opacity: 0; transform: scale(.7); } }
        @keyframes workflowConnectorFlow { from { background-position: -180px 0; } to { background-position: 180px 0; } }
        @keyframes workflowScan { 0%, 100% { transform: translateX(-105%); opacity: .15; } 50% { opacity: .75; } 100% { transform: translateX(105%); } }
        @media (prefers-reduced-motion: reduce) {
          .workflow-card, .workflow-status, .workflow-packet, .workflow-scan, .workflow-connector { animation: none !important; transition: none !important; }
          .workflow-card.is-active { transform: none; }
        }
      `}</style>

      <div className="pointer-events-none absolute -left-32 top-12 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <span className="text-xs font-black uppercase tracking-[.22em] text-amber-300">Connected operations</span>
          <h2 id="workflow-title" className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">How RipePulse AI Works</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-emerald-100/65 sm:text-base">One connected workflow. Four intelligent dashboards. Complete supply-chain visibility.</p>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3" aria-label="Workflow controls">
          <button type="button" onClick={() => setIsPlaying((playing) => !playing)} className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-200 transition hover:bg-emerald-400/20" aria-label={isPlaying ? "Pause journey" : "Play journey"}>
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isPlaying ? "Pause Journey" : "Play Journey"}
          </button>
          <button type="button" onClick={replay} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-emerald-100/75 transition hover:bg-white/10 hover:text-white"><RotateCcw className="h-3.5 w-3.5" /> Replay</button>
          <span className="ml-1 text-[11px] font-bold uppercase tracking-wider text-emerald-200/40">Stage {activeStage + 1} of {workflowSteps.length}</span>
        </div>

        <div className="workflow-track relative -mx-2 overflow-x-auto px-2 pb-5">
          <div className="relative min-w-[1080px] pt-5">
            <div className="absolute left-[12.5%] right-[12.5%] top-[68px] h-px bg-white/10" aria-hidden="true" />
            <div className={`workflow-connector absolute left-[12.5%] top-[67px] h-[3px] rounded-full transition-all duration-700 ${isPlaying && isVisible ? "" : "is-paused"}`} style={{ width: progressWidth }} aria-hidden="true" />
            {!reducedMotion && <div key={activeStage} className={`workflow-packet absolute top-[60px] z-20 -ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-300 text-slate-950 shadow-[0_0_18px_rgba(251,191,36,.9)] ${isPlaying && isVisible ? "" : "is-paused"}`} style={{ "--packet-start": `${Math.max(4, activeStage * 30 + 4)}%`, "--packet-end": `${Math.min(96, activeStage * 30 + 34)}%` }} aria-hidden="true"><Truck className="h-2.5 w-2.5" /></div>}

            <div className="relative grid grid-cols-4 gap-5">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;
                const accent = accentStyles[step.accent];
                const isActive = index === activeStage;
                const isPast = index < activeStage;
                return (
                  <button key={step.number} type="button" onClick={() => { setActiveStage(index); setIsPlaying(false); }} className={`workflow-card group relative min-h-[430px] rounded-[1.6rem] border bg-[#152317]/90 p-5 text-left backdrop-blur-xl ${isActive ? "is-active" : ""} ${isPast ? "is-past" : ""} ${accent.border}`} style={{ "--card-delay": `${index * 120}ms`, ...(isActive ? { boxShadow: `0 18px 45px -24px ${accent.glow}, 0 0 0 1px ${accent.glow}` } : {}) }} aria-pressed={isActive}>
                    <div className="mb-5 flex items-start justify-between gap-3"><span className={`rounded-full border px-2.5 py-1 font-mono text-[11px] font-black ${accent.border} ${accent.soft} ${accent.text}`}>{step.number}</span><span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${accent.border} ${accent.soft} ${accent.text}`}><Icon className="h-5 w-5" /></span></div>
                    <p className={`text-[10px] font-black uppercase tracking-[.18em] ${accent.text}`}>Dashboard {step.number}</p>
                    <h3 className="mt-2 min-h-[3.5rem] text-xl font-black leading-tight text-white">{step.role}</h3>
                    <p className="mt-2 min-h-[3.5rem] text-xs leading-relaxed text-emerald-100/60">{step.description}</p>

                    <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-wider text-emerald-200/45">Live dashboard</span><span className={`h-1.5 w-1.5 rounded-full ${isActive ? "animate-ping bg-emerald-300" : "bg-emerald-500/50"}`} /></div>
                      <div className="space-y-2">{step.preview.map((item) => { const PreviewIcon = item.icon; return <div key={item.label} className="flex items-center justify-between gap-2 text-[11px]"><span className="flex items-center gap-1.5 text-emerald-100/55"><PreviewIcon className="h-3 w-3" />{item.label}</span><strong className={`font-mono text-[10px] ${accent.text}`}>{item.value}</strong></div>; })}</div>
                      <div className="workflow-scan mt-3 h-px w-full bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">{step.statuses.map((status, statusIndex) => <span key={status} className={`workflow-status rounded-full border px-2 py-1 text-[9px] font-bold ${isActive && statusIndex === 1 ? `${accent.border} ${accent.soft} ${accent.text}` : "border-white/10 bg-white/5 text-emerald-100/55"}`}>{status}</span>)}</div>
                    <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-emerald-200/45"><CheckCircle2 className="h-3 w-3 text-emerald-400" />{step.tasks.length} operational capabilities</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2" aria-label="Select workflow stage">{workflowSteps.map((step, index) => <button key={step.number} type="button" onClick={() => { setActiveStage(index); setIsPlaying(false); }} className={`h-1.5 rounded-full transition-all duration-500 ${index === activeStage ? "w-10 bg-emerald-300" : "w-5 bg-white/20 hover:bg-white/40"}`} aria-label={`View ${step.role} stage`} aria-pressed={index === activeStage} />)}</div>
        <p className={`mt-4 text-center text-[11px] font-bold uppercase tracking-wider ${currentAccent.text}`}>{currentStep.statuses[Math.min(1, currentStep.statuses.length - 1)]} <span className="text-emerald-200/30">•</span> {isPlaying ? "Journey playing" : "Stage selected"}</p>
      </div>
    </section>
  );
};

export default HowHarvestIQWorks;

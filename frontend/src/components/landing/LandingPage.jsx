import React, { useState } from "react";
import fruitBasket from "../../assets/images/fruit_basket.png";
import imgApple from "../../assets/images/produce/apple.png";
import imgTomato from "../../assets/images/produce/tomato.png";
import imgPotato from "../../assets/images/produce/potato.png";
import imgCucumber from "../../assets/images/produce/cucumber.png";
import imgOrange from "../../assets/images/produce/orange.png";
import imgBanana from "../../assets/images/produce/banana.png";
import imgGrapes from "../../assets/images/produce/grapes.png";
import imgStrawberry from "../../assets/images/produce/strawberry.png";
import imgCarrot from "../../assets/images/produce/carrot.png";
import imgMango from "../../assets/images/produce/mango.png";
import imgBroccoli from "../../assets/images/produce/broccoli.png";
import imgBellPepper from "../../assets/images/produce/bell_pepper.png";
import imgSpinach from "../../assets/images/produce/spinach.png";
import imgGreenOnion from "../../assets/images/produce/green_onion.png";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Leaf,
  CheckCircle2,
  ChevronDown,
  Thermometer,
  Send,
  BarChart2,
  RefreshCw,
  Bell,
  Eye,
  Package,
  Heart,
} from "lucide-react";
import { inquiryService } from "../../services/inquiryService";
import { HowHarvestIQWorks } from "./HowHarvestIQWorks";

export const LandingPage = () => {
  // Assessment form states
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [warehouseName, setWarehouseName] = useState("");
  const [email, setEmail] = useState("");
  const [volumeDetails, setVolumeDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAssessmentSubmit = async (e) => {
    e.preventDefault();
    if (!warehouseName.trim() || !email.trim()) return;
    setIsSubmitting(true);
    try {
      await inquiryService.submitInquiry({
        warehouseName,
        email,
        volumeDetails,
      });
      setFormSubmitted(true);
      setWarehouseName("");
      setEmail("");
      setVolumeDetails("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const testimonials = [
    {
      quote:
        "RipePulse's AI predicted our strawberry batch's shelf-life collapse 18 hours before visual mold occurred. We rerouted 2.8 tons to Sanwer Road Processing Hub and saved ₹1,085,000.",
      author: "Elena Vance",
      role: "Cold-Storage Ops Director, Indore Central Hub",
      rating: 5,
      avatar: "👩‍💼",
    },
    {
      quote:
        "Switching from blind FIFO to RipePulse's risk-based dynamic redistribution cut our warehouse produce waste by 74% in the very first quarter.",
      author: "Marcus Brody",
      role: "Supply Chain VP, FreshGrocers Network",
      rating: 5,
      avatar: "👨‍💼",
    },
    {
      quote:
        "When transit routes to distant markets become infeasible, RipePulse matches produce to our food bank in minutes. Pure logistical brilliance.",
      author: "Sarah Jenkins",
      role: "Director, Central Valley Food Relief",
      rating: 5,
      avatar: "👩‍🌾",
    },
  ];

  const showcaseItems = [
    {
      id: "spinach",
      name: "Fresh Spinach",
      variety: "Baby Leaf Organic",
      price: "$3.40/KG",
      image: imgSpinach,
      hoursLeft: "36h Remaining",
      sli: "SLI 72%",
      riskColor: "emerald",
      vault: "Vault A-01",
    },
    {
      id: "broccoli",
      name: "Fresh Broccoli",
      variety: "Calabrese Grade A",
      price: "$4.10/KG",
      image: imgBroccoli,
      hoursLeft: "48h Remaining",
      sli: "SLI 65%",
      riskColor: "emerald",
      vault: "Vault B-03",
    },
    {
      id: "banana",
      name: "Banana",
      variety: "Cavendish Select",
      price: "$2.20/KG",
      image: imgBanana,
      hoursLeft: "24h Remaining",
      sli: "SLI 42%",
      riskColor: "amber",
      vault: "Chamber 04",
    },
    {
      id: "grapes",
      name: "Grapes",
      variety: "Autumn Royal Black",
      price: "$5.90/KG",
      image: imgGrapes,
      hoursLeft: "42h Remaining",
      sli: "SLI 58%",
      riskColor: "emerald",
      vault: "Vault C-02",
    },
    {
      id: "strawberry",
      name: "Fresh Strawberries",
      variety: "Albion Sweet Organic",
      price: "$5.80/KG",
      image: imgStrawberry,
      hoursLeft: "16h Remaining",
      sli: "SLI 26%",
      riskColor: "rose",
      vault: "Vault A-02",
    },
    {
      id: "carrot",
      name: "Carrot",
      variety: "Nantes Sweet Root",
      price: "$2.50/KG",
      image: imgCarrot,
      hoursLeft: "96h Remaining",
      sli: "SLI 89%",
      riskColor: "emerald",
      vault: "Root Cellar 1",
    },
    {
      id: "mango",
      name: "Mango",
      variety: "Kent Honey Select",
      price: "$6.40/KG",
      image: imgMango,
      hoursLeft: "30h Remaining",
      sli: "SLI 48%",
      riskColor: "amber",
      vault: "Chamber 02",
    },
    {
      id: "green_onion",
      name: "Green Onion",
      variety: "Tokyo Long White",
      price: "$2.80/KG",
      image: imgGreenOnion,
      hoursLeft: "28h Remaining",
      sli: "SLI 50%",
      riskColor: "emerald",
      vault: "Vault A-03",
    },
    {
      id: "apple",
      name: "Crisp Apple",
      variety: "Honeycrisp Crisp A",
      price: "$4.50/KG",
      image: imgApple,
      hoursLeft: "84h Remaining",
      sli: "SLI 84%",
      riskColor: "emerald",
      vault: "Cold Vault 01",
    },
    {
      id: "tomato",
      name: "Ripe Tomato",
      variety: "Roma Vine Cluster",
      price: "$3.90/KG",
      image: imgTomato,
      hoursLeft: "22h Remaining",
      sli: "SLI 38%",
      riskColor: "amber",
      vault: "Vault B-01",
    },
    {
      id: "cucumber",
      name: "Fresh Cucumber",
      variety: "English Seedless",
      price: "$2.90/KG",
      image: imgCucumber,
      hoursLeft: "52h Remaining",
      sli: "SLI 66%",
      riskColor: "emerald",
      vault: "Vault B-02",
    },
    {
      id: "bell_pepper",
      name: "Bell Pepper",
      variety: "Sweet Trio Green",
      price: "$4.80/KG",
      image: imgBellPepper,
      hoursLeft: "40h Remaining",
      sli: "SLI 60%",
      riskColor: "emerald",
      vault: "Vault C-01",
    },
    {
      id: "orange",
      name: "Sweet Orange",
      variety: "Valencia Sunburst",
      price: "$3.20/KG",
      image: imgOrange,
      hoursLeft: "70h Remaining",
      sli: "SLI 78%",
      riskColor: "emerald",
      vault: "Cold Vault 03",
    },
    {
      id: "potato",
      name: "Russet Potato",
      variety: "Idaho Premium Russet",
      price: "$1.90/KG",
      image: imgPotato,
      hoursLeft: "120h Remaining",
      sli: "SLI 95%",
      riskColor: "emerald",
      vault: "Root Cellar 2",
    },
  ];

  const features = [
    {
      icon: <Thermometer className="w-6 h-6" />,
      color: "emerald",
      title: "Real-Time Telemetry",
      description:
        "Continuous monitoring of temperature, humidity and ethylene levels across every pallet zone — 24/7, no gaps.",
    },
    {
      icon: <BarChart2 className="w-6 h-6" />,
      color: "amber",
      title: "AI Shelf-Life Prediction",
      description:
        "Predicts exact remaining shelf-life using biological decay models, not guesswork. Know risk days in advance.",
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      color: "teal",
      title: "Smart Rerouting",
      description:
        "Automatically redirects at-risk batches to nearby processors, kitchens, or relief hubs before spoilage hits.",
    },
    {
      icon: <Bell className="w-6 h-6" />,
      color: "rose",
      title: "Instant Alerts",
      description:
        "Get notified the moment a batch enters a risk window — so your team can act before losses occur.",
    },
    {
      icon: <Eye className="w-6 h-6" />,
      color: "indigo",
      title: "Full Batch Visibility",
      description:
        "Track every pallet from cold vault to delivery with a complete, auditable history of conditions and decisions.",
    },
    {
      icon: <Package className="w-6 h-6" />,
      color: "amber",
      title: "FEFO Dispatch Engine",
      description:
        "Goes beyond naive FIFO — dispatches by true biological urgency so the highest-risk produce ships first.",
    },
  ];

  const colorMap = {
    emerald: {
      bg: "bg-emerald-500/15",
      border: "border-emerald-500/30",
      icon: "text-emerald-400",
      glow: "shadow-emerald-500/10",
    },
    amber: {
      bg: "bg-amber-500/15",
      border: "border-amber-500/30",
      icon: "text-amber-400",
      glow: "shadow-amber-500/10",
    },
    teal: {
      bg: "bg-teal-500/15",
      border: "border-teal-500/30",
      icon: "text-teal-400",
      glow: "shadow-teal-500/10",
    },
    rose: {
      bg: "bg-rose-500/15",
      border: "border-rose-500/30",
      icon: "text-rose-400",
      glow: "shadow-rose-500/10",
    },
    indigo: {
      bg: "bg-indigo-500/15",
      border: "border-indigo-500/30",
      icon: "text-indigo-400",
      glow: "shadow-indigo-500/10",
    },
  };

  return (
    <div
      className="min-h-screen bg-[#131e14] text-slate-100 font-sans selection:bg-emerald-500 selection:text-white"
      style={{
        backgroundImage: "url('page_background_1789294203966.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#121c13]/90 backdrop-blur-xl border-b border-emerald-900/60 px-4 sm:px-8 py-3.5 transition-all shadow-xl shadow-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/25 transition-transform group-hover:scale-105 group-hover:rotate-6">
                <Leaf className="w-5 h-5 fill-slate-950 stroke-slate-950" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white font-display flex items-center gap-1">
                RipePulse<span className="text-emerald-400">.</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 ml-1">
                  AI
                </span>
              </span>
            </Link>
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-[11px] font-semibold text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Core Engine Active</span>
            </div>
          </div>
          <div className="hidden md:flex items-center bg-black/25 border border-white/10 rounded-full px-2 py-1 shadow-inner backdrop-blur-md">
            <a href="#how-it-works" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-200/80 hover:text-white hover:bg-white/10 transition-all">Pipeline</a>
            <a href="#features" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-200/80 hover:text-white hover:bg-white/10 transition-all">Features</a>
            <a href="#produce-showcase" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-200/80 hover:text-white hover:bg-white/10 transition-all">Pallet Lots</a>
            <a href="#testimonials" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-200/80 hover:text-white hover:bg-white/10 transition-all">Case Studies</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-xs font-bold text-emerald-200/80 hover:text-white transition-all px-3 py-1.5 rounded-xl hover:bg-white/5">
              Sign In
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 text-xs font-extrabold rounded-full shadow-lg shadow-amber-400/25 transition-all hover:scale-105 active:scale-95"
            >
              <span>Launch Live App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO - reduced spacing */}
      <section className="relative pt-20 pb-14 px-6 overflow-hidden min-h-[85vh] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 filter saturate-150 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 60% 30%, rgba(34,60,36,0.5) 0%, rgba(16,27,18,0.95) 80%), url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000&auto=format&fit=crop')`,
          }}
        />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 text-xs font-semibold backdrop-blur-sm shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI-Driven Freshness Intelligence &amp; Dynamic Produce Routing</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white leading-[1.08] font-display">
              Predict Risk<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-emerald-300">
                Prevent Waste Save Produce.
              </span>
            </h1>
            <p className="text-emerald-100/75 text-sm sm:text-base max-w-xl leading-relaxed">
              Traditional inventory systems rely on FIFO, assuming older produce always degrades first. RipePulse AI
              continuously analyzes environmental telemetry and respiration kinetics to predict exact shelf-life and
              dynamically redistribute produce before waste occurs.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/login"
                className="px-8 py-3.5 bg-white hover:bg-emerald-50 text-slate-900 text-xs font-black uppercase tracking-wider rounded-full shadow-xl shadow-black/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <span>Start Monitoring</span>
                <ArrowRight className="w-4 h-4 text-emerald-600" />
              </Link>
            </div>
            <div className="pt-4 flex items-center gap-2 text-emerald-200/50 text-xs font-medium">
              <span>Scroll to explore</span>
              <ChevronDown className="w-4 h-4 animate-bounce text-emerald-400" />
            </div>
          </div>
          <div className="hidden lg:flex justify-center items-center relative">
            <div className="absolute w-96 h-96 bg-emerald-500/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none translate-x-12 translate-y-8" />
            <style>{`
              @keyframes heroFloat {
                0%   { transform: translateY(0px) scale(1); }
                50%  { transform: translateY(-12px) scale(1.015); }
                100% { transform: translateY(0px) scale(1); }
              }
              .fruit-basket-spin { animation: heroFloat 4s ease-in-out infinite; }
            `}</style>
            <img
              src={fruitBasket}
              alt="Fresh Produce Basket"
              className="fruit-basket-spin relative w-full max-w-lg object-contain"
              style={{ filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.6))" }}
            />
          </div>
        </div>
      </section>

      <HowHarvestIQWorks />

      {/* HOW IT WORKS - simplified, reduced spacing */}
      <section id="how-it-works" className="py-14 px-6 bg-[#0f1911]/90 border-t border-b border-emerald-950/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">The AI Freshness Pipeline</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
              Your Trusted Guardian for Commercial Produce
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/60">
              Connecting real-time environmental data to biological degradation kinetics and dynamic supply-chain redirection.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: simplified steps */}
            <div className="relative rounded-3xl overflow-hidden border border-emerald-800/40 bg-gradient-to-b from-[#18261a] to-[#101911] p-6 shadow-2xl flex flex-col gap-5">
              <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none bg-emerald-500/10" />
              <div className="relative z-10">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider">How RipePulse Works</span>
                <h3 className="text-xl font-bold text-white mt-1">From Sensor to Smart Decision</h3>
              </div>
              <div className="relative z-10 space-y-3">
                {[
                  { icon: <Thermometer className="w-4 h-4 text-emerald-400" />, title: "Monitor", desc: "IoT sensors track temperature, humidity and ethylene per pallet in real-time." },
                  { icon: <BarChart2 className="w-4 h-4 text-amber-400" />, title: "Predict", desc: "AI models calculate exact shelf-life remaining for every batch." },
                  { icon: <RefreshCw className="w-4 h-4 text-teal-400" />, title: "Reroute", desc: "At-risk batches are automatically redirected to the best nearby destination." },
                  { icon: <CheckCircle2 className="w-4 h-4 text-indigo-400" />, title: "Save", desc: "Prevent food waste, protect revenue, and keep your supply chain lean." },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="mt-0.5 shrink-0">{step.icon}</div>
                    <div>
                      <span className="text-xs font-bold text-white block">{step.title}</span>
                      <span className="text-[11px] text-emerald-200/60">{step.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right: Zero Waste Mission */}
            <div
              className="relative rounded-3xl overflow-hidden border border-emerald-800/40 bg-cover bg-center p-8 flex flex-col justify-between min-h-[380px] shadow-2xl"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(16,27,18,0.25) 0%, rgba(16,27,18,0.94) 75%), url('https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1200&auto=format&fit=crop')`,
              }}
            >
              <div className="flex flex-wrap items-center gap-2 z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#101911]/80 border border-emerald-600/40 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>14,892 kg produce rescued</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#101911]/80 border border-amber-500/40 text-amber-300 text-xs font-semibold backdrop-blur-md shadow-lg">
                  <span>3.4M L water saved</span>
                </div>
              </div>
              <div className="space-y-3 relative z-10 mt-12">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Zero Waste Mission</span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight font-display">
                  Straight From the Harvest, Fresh and Honest
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/85 max-w-md">
                  Every pallet preserved through RipePulse AI means nutritious food reaches dinner tables, commercial kitchens,
                  and relief pantries instead of landfills.
                </p>
                <div className="pt-3 flex items-center justify-between border-t border-emerald-900/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600/90 border border-emerald-400/40 flex items-center justify-center text-base shadow-lg shadow-emerald-950/80">
                      🌾
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Central Valley Harvest Cooperative</h5>
                      <span className="text-[11px] text-emerald-300/70">Verified Commercial Network Partner</span>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    Active Feed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-14 px-6 bg-[#0f1911]/90 border-t border-emerald-950/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Platform Features</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
              Everything You Need to Stop Food Waste
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/60">
              RipePulse brings together sensor data, AI predictions and smart logistics into one simple dashboard.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => {
              const c = colorMap[feature.color] || colorMap.emerald;
              return (
                <div
                  key={i}
                  className={`rounded-2xl p-5 border ${c.border} bg-[#152317]/80 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex flex-col gap-3`}
                >
                  <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center ${c.icon}`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">{feature.title}</h3>
                    <p className="text-xs text-emerald-200/60 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 text-sm font-black rounded-full shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <span>Explore the Platform</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* DEMO INVENTORY - Attractive Original Card Style (Informational Demo Only) */}
      <section id="produce-showcase" className="py-14 px-6 max-w-7xl mx-auto overflow-hidden">
        <style>{`
          @keyframes marqueeScroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .cards-marquee-track {
            display: flex;
            gap: 1.5rem;
            width: max-content;
            animation: marqueeScroll 40s linear infinite;
          }
          .cards-marquee-track:hover { animation-play-state: paused; }
        `}</style>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Demo Inventory</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              For Demonstration Only
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
            Fruits &amp; Vegetables We Track
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/60 mt-1 max-w-xl">
            A snapshot of commercial produce monitored by RipePulse AI. Each item displays real-time simulated telemetry
            and predictive shelf-life degradation.
          </p>
        </div>
        <div className="relative w-full py-2">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#131e14] to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#131e14] to-transparent z-20 pointer-events-none" />
          <div className="cards-marquee-track py-4">
            {[...showcaseItems, ...showcaseItems].map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="w-72 flex-shrink-0 bg-gradient-to-b from-[#142316] via-[#101c12] to-[#0c150e] rounded-3xl p-6 shadow-2xl shadow-black/80 border border-emerald-800/40 hover:border-emerald-500/60 flex flex-col justify-between select-none transition-all duration-300 hover:-translate-y-2 hover:shadow-emerald-950/60 group"
              >
                {/* Card Top: Price Badge & Heart */}
                <div className="flex items-center justify-between w-full">
                  <span className="px-3 py-1 rounded-full bg-[#f8b803] text-slate-950 font-black text-xs shadow-md tracking-tight">
                    {item.price}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-emerald-300/40 group-hover:text-rose-400 group-hover:bg-rose-500/10 transition-colors">
                    <Heart className="w-4 h-4" />
                  </div>
                </div>

                {/* Produce Image: Floating transparent image with glow */}
                <div className="relative w-full h-36 my-3 flex items-center justify-center">
                  <div className="absolute w-24 h-24 rounded-full bg-emerald-500/10 blur-xl group-hover:bg-emerald-400/20 transition-all pointer-events-none" />
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-32 h-32 object-contain filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Title and Variety */}
                <div className="text-center space-y-1">
                  <h4 className="text-lg font-black text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-xs text-emerald-200/60 font-medium">
                    {item.variety}
                  </p>
                </div>

                {/* Shelf-Life & SLI Indicator (as in original) */}
                <div className="flex items-center justify-center gap-2 mt-3 pt-1">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      item.riskColor === "rose"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                        : item.riskColor === "amber"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    }`}
                  >
                    {item.hoursLeft}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-300/70">
                    {item.sli}
                  </span>
                </div>

                {/* Informative-only strip (no clickable buttons / no quantity steppers) */}
                <div className="w-full mt-4 pt-3 border-t border-emerald-900/40 flex items-center justify-between text-[11px] text-emerald-200/60 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-emerald-300 font-semibold">Live Sensor</span>
                  </span>
                  <span className="text-amber-300/80 font-bold">{item.vault}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-14 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Field Testimonials</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
            Fresh Thoughts from Commercial Warehouse Operators
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-[#18261a]/70 rounded-3xl p-6 border border-emerald-800/40 shadow-lg backdrop-blur-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex text-amber-400 text-sm">{"★".repeat(t.rating)}</div>
                <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed italic">"{t.quote}"</p>
              </div>
              <div className="pt-6 mt-6 border-t border-emerald-800/30 flex items-center gap-3">
                <span className="text-2xl">{t.avatar}</span>
                <div>
                  <h4 className="text-xs font-bold text-white">{t.author}</h4>
                  <span className="text-[11px] text-emerald-300/60">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pt-14 pb-10 px-6 bg-[#0a120b] border-t border-emerald-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 pb-12 border-b border-emerald-950/80">
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
              Save Fresh.<br />Waste Zero.
            </h3>
            <p className="text-xs text-emerald-200/60 max-w-sm">
              RipePulse AI transforms agricultural produce inventory from passive First-In First-Out monitoring to
              risk-based dynamic redistribution.
            </p>
            <div className="pt-4">
              <Link to="/login" className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-full shadow-lg transition-all">
                Sign In &amp; Launch Platform
              </Link>
            </div>
          </div>
          <div className="lg:col-span-6 bg-[#131f14] p-6 rounded-3xl border border-emerald-800/30">
            <h4 className="text-sm font-bold text-white mb-1">Request Warehouse Integration Assessment</h4>
            <p className="text-xs text-emerald-200/60 mb-4">
              Submit your warehouse details for commercial evaluation and technical integration review.
            </p>

            {formSubmitted ? (
              <div className="rounded-2xl bg-emerald-950/60 border border-emerald-500/40 p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Request Under Progress</span>
                </div>
                <h5 className="text-sm font-extrabold text-white">Assessment Request Received</h5>
                <p className="text-xs text-emerald-200/80 leading-relaxed max-w-sm mx-auto">
                  Thank you! Your warehouse integration inquiry is now under review by our operations team. We will inspect your storage chamber specifications and contact you via email shortly.
                </p>
                <div className="pt-2 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setFormSubmitted(false)}
                    className="text-xs text-emerald-300 hover:text-white underline font-medium transition-colors"
                  >
                    Submit another request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAssessmentSubmit} className="space-y-3">
                <input
                  type="text"
                  required
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  placeholder="Warehouse Name / Facility Director"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-emerald-800/40 text-xs text-white placeholder-emerald-200/40 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Commercial Email"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-emerald-800/40 text-xs text-white placeholder-emerald-200/40 focus:outline-none focus:border-emerald-500"
                />
                <textarea
                  value={volumeDetails}
                  onChange={(e) => setVolumeDetails(e.target.value)}
                  placeholder="Volume & Storage Chambers (e.g. 4,200 tons, 6 ripening rooms)"
                  rows="2"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-emerald-800/40 text-xs text-white placeholder-emerald-200/40 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>{isSubmitting ? "Routing to Admin Panel…" : "Send Assessment Request"}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-200/50 gap-4">
          <p>2026 RipePulse AI. Predictive Produce Waste Prevention &amp; Dynamic Redistribution.</p>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hover:text-white">Architecture</a>
            <Link to="/dashboard" className="hover:text-white">Live Platform</Link>
            <Link to="/settings" className="hover:text-white">API Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

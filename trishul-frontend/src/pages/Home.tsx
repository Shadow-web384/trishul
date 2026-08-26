import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, NavLink } from 'react-router-dom';
import { FlowButton } from '../components/ui/flow-button';
import { BlindsTextReveal } from '../components/home/BlindsTextReveal';
import { PLACEHOLDERS } from '../data/placeholders';
import trishulLogo from '../assets/trishul-logo.png';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div
      className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat flex flex-col justify-between overflow-hidden"
      style={{ backgroundImage: "url('/background_trishul.png')" }}
    >
      {/* Dark overlay for rich contrast & readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0" />

      {/* Top Bar with Trishul Logo */}
      <header className="relative z-10 p-6 flex justify-between items-center">
        <NavLink to="/" className="flex items-center gap-3">
          <img
            src={trishulLogo}
            alt="Trishul logo"
            className="h-10 w-10 object-contain"
          />
          <span className="font-trishul text-2xl font-bold text-white drop-shadow-md tracking-wide">
            TRISHUL
          </span>
        </NavLink>
      </header>

      {/* Hero Content Section */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto my-auto space-y-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 flex flex-col items-center"
        >
          <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 text-white/90 text-sm font-semibold tracking-wider uppercase shadow-lg">
            AI Monitoring &amp; Governance Engine
          </div>

          <div className="text-white drop-shadow-lg">
            <BlindsTextReveal text="Trishul" />
          </div>

          <p className="text-lg md:text-xl text-white/90 max-w-2xl font-normal leading-relaxed drop-shadow">
            {PLACEHOLDERS.HOME_INTRO}
          </p>

          <div
            onClick={() => navigate('/dashboard')}
            className="pt-4 cursor-pointer"
          >
            <div className="bg-white/90 hover:bg-black text-slate-900 rounded-full shadow-2xl p-1 transition-transform hover:scale-105">
              <FlowButton text={PLACEHOLDERS.BUTTON_ENTER_DASHBOARD} />
            </div>
          </div>
        </motion.div>
      </main>

      {/* Restricted Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-white/60">
        {PLACEHOLDERS.FOOTER_RESTRICTED}
      </footer>
    </div>
  );
}

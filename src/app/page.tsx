"use client"

import CreateForm from "@/components/CreateForm";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { Logo } from "@/components/icons/Logo"; // 引入 Logo
import HowItWorks from "@/components/HowItWorks";
import { useState } from "react";
import { Info } from "lucide-react";

export default function Home() {
  const [inResult, setInresult] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 overflow-hidden bg-black text-zinc-200">

      {/* Top Left Logo */}
      <div className="absolute top-8 left-8 z-20 flex items-center gap-3 select-none animate-in fade-in slide-in-from-top-4 duration-1000">
        <Logo className="w-8 h-8 text-white" />
        <span className="font-bold text-xl tracking-tighter">One-Look</span>
      </div>

      <div className="absolute inset-0 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none"></div>

      <div className="z-10 w-full max-w-lg flex flex-col items-center space-y-10">

        <div className="text-center space-y-4 select-none">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter animate-in fade-in slide-in-from-bottom-5 duration-1000">
            <span className="text-gradient">
              One-Look
            </span>
          </h1>

          <p className="text-base md:text-lg text-zinc-500 font-medium animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-150 max-w-sm mx-auto leading-relaxed">
            {inResult
              ? "Share this link once. It's gone forever."
              : "End-to-end encrypted secret sharing.\nNo database, no logs, one-time view."}
          </p>

          {!inResult && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors animate-in fade-in duration-1000 delay-300"
            >
              <Info className="w-3.5 h-3.5" />
              <span>How it keeps you safe</span>
            </button>
          )}
        </div>

        <div className="w-full animate-in fade-in zoom-in-95 duration-700 delay-200">
          <CreateForm setInresult={setInresult} />
        </div>
      </div>

      <div className="fixed top-8 right-8 z-10 hidden md:block">
        <a
          href="https://github.com/Kadxy/one-look"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 hover:border-zinc-700 transition-all duration-300 group"
        >
          <GithubIcon size={16} className="text-zinc-500 group-hover:text-zinc-200 transition-colors" />
          <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">Source</span>
        </a>
      </div>

      <HowItWorks isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  );
}
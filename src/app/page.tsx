"use client"

import CreateForm from "@/components/CreateForm";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { useState } from "react";

export default function Home() {
  const [inResult, setInresult] = useState(false);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 overflow-hidden bg-black text-zinc-200">

      <div className="absolute inset-0 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none"></div>

      <div className="z-10 w-full max-w-lg flex flex-col items-center space-y-12">

        <div className="text-center space-y-3 select-none">
          <p className="text-3xl md:text-4xl font-medium text-zinc-500 animate-in fade-in slide-in-from-bottom-5 duration-1000 tracking-wide">
            {inResult ? "Your Secrets Secured" : "Share Secrets Securely"}
          </p>
          <h1 className="text-3xl md:text-4xl font-medium text-zinc-500 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-150 tracking-wide">
            {inResult ? "Link for" : "Burn After"}&nbsp;
            <span className="inline-block align-baseline font-black text-5xl md:text-6xl tracking-tight pb-1 cursor-default underline-slide text-gradient">
              One Look
            </span>
          </h1>
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
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 hover:border-zinc-600 shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          <GithubIcon size={16} className="text-zinc-500 group-hover:text-zinc-200 transition-colors duration-300" />
          <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-100 transition-colors duration-300 tracking-wide">Kadxy/One-Look</span>
        </a>
      </div>
    </main>
  );
}
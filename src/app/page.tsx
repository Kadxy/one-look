"use client"
import Link from "next/link";
import CreateForm from "@/components/CreateForm";
import { GithubIcon } from "@/components/icons/GithubIcon";
import HowItWorks from "@/components/HowItWorks";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const [inResult, setInresult] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 overflow-hidden bg-black text-zinc-200">

      <div className="fixed top-8 left-8 z-20 flex items-center gap-3 select-none animate-in fade-in slide-in-from-top-4 duration-1000">
        <Link
          href="/"
          className="fixed top-8 left-8 z-20 flex items-center gap-3 select-none animate-in fade-in slide-in-from-top-4 duration-1000 group cursor-pointer"
        >
          <Image
            src="/icon.webp"
            draggable={false}
            alt="One-Look Logo"
            width={48}
            height={48}
            className="w-8 h-8 transition-transform group-hover:scale-110"
          />
          <span className="font-bold text-xl tracking-tighter text-zinc-200">One-Look</span>
        </Link>
      </div>

      <div className="absolute inset-0 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none"></div>

      <div className="z-10 w-full max-w-lg flex flex-col items-center space-y-12">

        <div className="text-center space-y-6 select-none">
          <div className="space-y-2">
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

          {!inResult && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 hover:text-zinc-300 text-xs font-medium text-zinc-500 transition-all cursor-pointer group"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                <span>End-to-End Encrypted</span>
              </button>
            </div>
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
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-300 group"
        >
          <GithubIcon size={18} className="text-zinc-600 group-hover:text-zinc-200 transition-colors" />
          <span className="text-xs font-medium text-zinc-600 group-hover:text-zinc-300 transition-colors">Kadxy/One-Look</span>
        </a>
      </div>

      <HowItWorks isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  );
}
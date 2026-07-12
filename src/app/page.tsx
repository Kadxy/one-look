"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import CreateForm from "@/components/CreateForm";
import HowItWorks from "@/components/HowItWorks";
import { PageBackdrop, SiteHeader } from "@/components/SiteChrome";

export default function Home() {
  const [inResult, setInResult] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="relative flex min-h-[100svh] flex-col overflow-x-hidden bg-[var(--app-bg)] text-[var(--app-text)]">
      <PageBackdrop />
      <SiteHeader />

      <section className="safe-page-gutters safe-page-bottom relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center pt-5 sm:pt-8 lg:justify-center lg:py-12">
        <motion.div
          key={inResult ? "result-title" : "create-title"}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20, scale: 0.97, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.72, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-[560px] text-center"
        >
          <h1 className="whitespace-nowrap text-[2.15rem] font-semibold leading-none text-[var(--app-text)] sm:text-[3rem]">
            {inResult ? "Ready. Then gone." : "One look. Then gone."}
          </h1>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 42, scale: 0.975, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 105, damping: 18, mass: 0.9, delay: 0.22 }}
          className="mx-auto mt-7 w-full max-w-[560px] sm:mt-9"
        >
          <CreateForm setInresult={setInResult} />
          {!inResult && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="security-link focus-ring mx-auto mt-4 flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px]"
              aria-label="How end-to-end encryption works"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>How encryption works</span>
            </button>
          )}
        </motion.div>
      </section>

      <HowItWorks isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  );
}

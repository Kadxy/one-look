"use client";

import { X, ShieldCheck, KeyRound, Flame, Lock, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function HowItWorks({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [isRendered, setIsRendered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            // 双重保险：确保 DOM 挂载后再触发动画类名
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setIsRendered(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isRendered) return null;

    return (
        <div className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ease-out select-none",
            isVisible ? "opacity-100 backdrop-blur-md bg-black/60" : "opacity-0 backdrop-blur-none bg-black/0"
        )}>
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            <div className={cn(
                "relative w-full max-w-2xl bg-[#09090b] border border-zinc-800 rounded-3xl p-8 shadow-2xl transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) transform overflow-hidden",
                isVisible ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-8 opacity-0"
            )}>
                {/* 装饰性背景光 */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-zinc-800/20 blur-3xl rounded-full pointer-events-none"></div>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-zinc-200 transition-colors rounded-full hover:bg-zinc-800/50 cursor-pointer z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold mb-2 text-zinc-100 tracking-tight">Zero-Knowledge Architecture</h2>
                <p className="text-zinc-500 mb-10 text-sm font-medium">Trust through mathematics, not promises.</p>

                <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
                    <div className="space-y-3 group">
                        <div className="flex items-center gap-3 text-zinc-200">
                            <div className="p-2 bg-zinc-900 rounded-lg group-hover:bg-zinc-800 transition-colors">
                                <KeyRound className="w-4 h-4 text-zinc-400" />
                            </div>
                            <h3 className="font-semibold text-sm tracking-wide">Client-Side Encryption</h3>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed font-mono">
                            Data is sealed with <span className="text-zinc-400">AES-256-GCM</span> within your browser's runtime. The plaintext never touches the network stack.
                        </p>
                    </div>

                    <div className="space-y-3 group">
                        <div className="flex items-center gap-3 text-zinc-200">
                            <div className="p-2 bg-zinc-900 rounded-lg group-hover:bg-zinc-800 transition-colors">
                                <Lock className="w-4 h-4 text-zinc-400" />
                            </div>
                            <h3 className="font-semibold text-sm tracking-wide">Blind Storage</h3>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed font-mono">
                            The server acts as a dumb store for opaque blobs. The decryption key is anchored in the <span className="text-zinc-400">URL fragment (#)</span>, which is never sent to the server.
                        </p>
                    </div>

                    <div className="space-y-3 group">
                        <div className="flex items-center gap-3 text-zinc-200">
                            <div className="p-2 bg-zinc-900 rounded-lg group-hover:bg-zinc-800 transition-colors">
                                <Flame className="w-4 h-4 text-zinc-400" />
                            </div>
                            <h3 className="font-semibold text-sm tracking-wide">Atomic Destruction</h3>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed font-mono">
                            Retrieval triggers a Redis <span className="text-zinc-400">GETDEL</span> atomic operation. The data is wiped from memory instantly upon access. No race conditions.
                        </p>
                    </div>

                    <div className="space-y-3 group">
                        <div className="flex items-center gap-3 text-zinc-200">
                            <div className="p-2 bg-zinc-900 rounded-lg group-hover:bg-zinc-800 transition-colors">
                                <ShieldCheck className="w-4 h-4 text-zinc-400" />
                            </div>
                            <h3 className="font-semibold text-sm tracking-wide">Open Source</h3>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed font-mono">
                            No analytics. No tracking. No hidden backdoors. Verify the cryptographic implementation yourself on GitHub.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
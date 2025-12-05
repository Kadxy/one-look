"use client";

import { X, ShieldCheck, KeyRound, Flame, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function HowItWorks({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [render, setRender] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRender(true);
            // 稍微延迟一点点以触发 CSS transition
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
            const timer = setTimeout(() => setRender(false), 300); // 等待动画结束
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!render) return null;

    return (
        <div className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out",
            visible ? "opacity-100 backdrop-blur-sm bg-black/60" : "opacity-0 backdrop-blur-none bg-black/0"
        )}>
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            <div className={cn(
                "relative w-full max-w-2xl bg-[#0A0A0A] border border-zinc-800/80 rounded-3xl p-8 shadow-2xl transition-all duration-300 ease-out transform",
                visible ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"
            )}>
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-zinc-200 transition-colors rounded-full hover:bg-zinc-800/50 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold mb-2 text-zinc-100 tracking-tight">Zero-Knowledge Architecture</h2>
                <p className="text-zinc-500 mb-8 text-sm">How One-Look protects the secret.</p>

                <div className="grid md:grid-cols-2 gap-x-8 gap-y-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-zinc-200">
                            <KeyRound className="w-5 h-5 text-zinc-400" />
                            <h3 className="font-medium text-sm">Browser Encryption</h3>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed pl-8 border-l border-zinc-900">
                            Encryption keys are generated locally. The secret is sealed with AES-256-GCM <strong>before</strong> leaving the device.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-zinc-200">
                            <Lock className="w-5 h-5 text-zinc-400" />
                            <h3 className="font-medium text-sm">Blind Server</h3>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed pl-8 border-l border-zinc-900">
                            The server stores only the encrypted blob. The decryption key travels in the URL hash, which the server <strong>never</strong> receives.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-zinc-200">
                            <Flame className="w-5 h-5 text-zinc-400" />
                            <h3 className="font-medium text-sm">Atomic Destruction</h3>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed pl-8 border-l border-zinc-900">
                            Retrieving the secret triggers an atomic <code>GET + DEL</code> operation in memory. No backups, no trace.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-zinc-200">
                            <ShieldCheck className="w-5 h-5 text-zinc-400" />
                            <h3 className="font-medium text-sm">Transparent</h3>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed pl-8 border-l border-zinc-900">
                            The code is open source. No hidden logic. Verify the cryptography implementation on GitHub.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
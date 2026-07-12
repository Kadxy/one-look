"use client";

import { X, ShieldCheck, KeyRound, Flame, Lock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function HowItWorks({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    // visible controls animation state, shouldRender controls DOM presence
    const [animationState, setAnimationState] = useState<"entering" | "visible" | "leaving" | "hidden">(
        isOpen ? "entering" : "hidden"
    );
    const animationTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose();
        }
    }, [onClose]);

    // Synchronously update state based on isOpen prop changes during render
    if (isOpen && animationState === "hidden") {
        setAnimationState("entering");
    } else if (!isOpen && (animationState === "visible" || animationState === "entering")) {
        setAnimationState("leaving");
    }

    useEffect(() => {
        if (animationState === "entering") {
            // Use double RAF to ensure the DOM is painted before triggering the animation
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setAnimationState("visible");
                });
            });
        } else if (animationState === "leaving") {
            animationTimerRef.current = setTimeout(() => setAnimationState("hidden"), 300);
        }

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            if (animationTimerRef.current) {
                clearTimeout(animationTimerRef.current);
            }
        };
    }, [animationState, isOpen, handleKeyDown]);

    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    if (animationState === "hidden") return null;

    const isVisible = animationState === "visible";

    return (
        <div className={cn(
            "fixed inset-0 z-50 flex items-end justify-center overflow-hidden pt-3 transition-all duration-300 ease-out sm:items-center sm:p-4",
            isVisible ? "bg-[var(--app-scrim)] opacity-100 backdrop-blur-md" : "bg-transparent opacity-0 backdrop-blur-none"
        )}>
            <div
                className="absolute inset-0"
                onClick={onClose}
                aria-hidden="true"
            />

            <div className={cn(
                "app-surface relative z-10 flex max-h-[calc(100dvh-0.75rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[24px] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:max-h-[calc(100dvh-2rem)] sm:rounded-[24px]",
                isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-[0.98] opacity-0"
            )}
                role="dialog"
                aria-modal="true"
                aria-labelledby="how-it-works-title"
                aria-describedby="how-it-works-description"
            >
                <div className="relative shrink-0 px-5 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
                    <button
                        onClick={onClose}
                        className="focus-ring absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-xl text-[var(--app-muted)] transition-colors hover:bg-[var(--app-surface-strong)] hover:text-[var(--app-text)] cursor-pointer sm:right-5 sm:top-5"
                        aria-label="Close security details"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <h2 id="how-it-works-title" className="pr-12 text-xl font-bold text-[var(--app-text)] sm:text-2xl">
                        Zero-Knowledge Architecture
                    </h2>
                    <p id="how-it-works-description" className="mt-2 pr-10 text-sm leading-6 text-[var(--app-muted)]">
                        Trust through mathematics, not promises.
                    </p>
                </div>

                <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-8 sm:pb-8">
                    <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 sm:gap-y-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-[var(--app-text-soft)]">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                                <KeyRound className="h-4 w-4 text-[var(--app-muted)]" />
                            </div>
                            <h3 className="text-sm font-semibold">Client-Side Encryption</h3>
                        </div>
                        <p className="text-sm leading-6 text-[var(--app-text-soft)]">
                            Data is sealed with <span className="font-mono text-[var(--app-text)]">AES-256-GCM</span> within your browser&apos;s runtime. The plaintext never touches the network stack.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-[var(--app-text-soft)]">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                                <Lock className="h-4 w-4 text-[var(--app-muted)]" />
                            </div>
                            <h3 className="text-sm font-semibold">Blind Storage</h3>
                        </div>
                        <p className="text-sm leading-6 text-[var(--app-text-soft)]">
                            The server acts as a dumb store for opaque blobs. The decryption key is anchored in the <span className="font-mono text-[var(--app-text)]">URL fragment (#)</span>, which is never sent to the server.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-[var(--app-text-soft)]">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                                <Flame className="h-4 w-4 text-[var(--app-muted)]" />
                            </div>
                            <h3 className="text-sm font-semibold">Atomic Destruction</h3>
                        </div>
                        <p className="text-sm leading-6 text-[var(--app-text-soft)]">
                            Retrieving the secret triggers an atomic Redis <span className="font-mono text-[var(--app-text)]">GETDEL</span> operation. The data is wiped from memory instantly upon access.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-[var(--app-text-soft)]">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                                <ShieldCheck className="h-4 w-4 text-[var(--app-muted)]" />
                            </div>
                            <h3 className="text-sm font-semibold">Open Source</h3>
                        </div>
                        <p className="text-sm leading-6 text-[var(--app-text-soft)]">
                            No analytics. No tracking. No hidden backdoors. Verify the cryptographic implementation yourself on GitHub.
                        </p>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

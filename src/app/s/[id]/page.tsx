"use client";

import { useEffect, useState, use } from "react";
import { decryptData } from "@/lib/crypto";
import { Loader2, Eye, EyeOff, Lock, CheckCircle2, AlertTriangle, FileText, Copy, Download, Check } from "lucide-react";
import { copyToClipboard as copyText, downloadTextFile } from "@/lib/utils";

export default function ViewSecretPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [secretContent, setSecretContent] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isCopied, setIsCopied] = useState(false);
    const [inputKey, setInputKey] = useState("");
    const [isDrm, setIsDrm] = useState(false);

    const getKeyFromHash = () => {
        if (typeof window !== "undefined") {
            return window.location.hash.substring(1);
        }
        return "";
    };

    const handleReveal = async (manualKey?: string) => {
        const key = manualKey || getKeyFromHash();
        if (!key) {
            setStatus("error");
            setErrorMsg("Decryption key missing. Please enter it below.");
            return;
        }

        setStatus("loading");

        try {
            const res = await fetch("/api/view", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (res.status === 404) {
                throw new Error("Secret not found or already destroyed.");
            }
            if (!res.ok) {
                throw new Error("Server error.");
            }

            const { encryptedContent } = await res.json();
            const textJson = await decryptData(encryptedContent.data, encryptedContent.iv, key);

            // Try to parse as JSON first (new format with DRM), otherwise fallback to raw string (old format)
            try {
                const payload = JSON.parse(textJson);
                if (typeof payload === 'object' && payload !== null && 'text' in payload) {
                    setSecretContent(payload.text);
                    if (payload.drm) {
                        setIsDrm(true);
                    }
                } else {
                    // Fallback for simple string if JSON.parse worked but structure is diff (unlikely)
                    setSecretContent(textJson);
                }
            } catch (e) {
                // Not JSON, explicit old content
                setSecretContent(textJson);
            }

            setStatus("success");

        } catch (err: any) {
            console.error(err);
            setStatus("error");
            setErrorMsg(err.message || "Failed to retrieve secret.");
        }
    };

    const copyContent = () => {
        copyText(secretContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }

    const downloadContent = () => {
        downloadTextFile(secretContent, `secret-${id}.txt`);
    }

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center p-6 bg-black text-zinc-200 transition-colors duration-300">

            {/* Top Bar */}
            <div className="absolute top-6 left-6 font-bold text-xl tracking-tighter opacity-50">One-Look</div>

            {/* Grid BG */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none"></div>

            <div className="w-full max-w-lg z-10">

                {status === "idle" && (
                    <div className="bg-black border border-zinc-800 p-8 rounded-3xl text-center space-y-8 shadow-2xl shadow-zinc-900/50 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-200">
                            <Lock className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold mb-3">View Secret?</h2>
                            <p className="text-zinc-500">
                                You can only view this once. It will be <span className="font-bold text-red-500">permanently deleted</span> from the server immediately.
                            </p>
                        </div>
                        <button
                            onClick={() => handleReveal()}
                            className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                        >
                            <Eye className="w-5 h-5" />
                            <span>Reveal Content</span>
                        </button>
                    </div>
                )}

                {status === "loading" && (
                    <div className="text-center space-y-4 animate-pulse">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto text-zinc-400" />
                        <p className="text-zinc-500 font-medium">Decrypting...</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="bg-black border border-zinc-800 p-1 rounded-3xl shadow-xl animate-in zoom-in-95 duration-300">
                        <div className="p-6 md:p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-white">
                                    <CheckCircle2 className="w-6 h-6" />
                                    <span className="font-bold text-lg">Secret Revealed</span>
                                </div>
                                <span className="text-xs font-mono px-2 py-1 bg-zinc-900 rounded text-zinc-500">
                                    Data destroyed
                                </span>
                            </div>

                            {/* DRM Status Banner */}
                            {isDrm && (
                                <div className="bg-amber-900/20 border border-amber-900/50 p-3 rounded-xl flex items-center space-x-3 text-amber-200">
                                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                    <div className="text-xs">
                                        <span className="font-bold block">Rights Protection Enabled</span>
                                        Copying, saving, and screenshots are restricted by sender.
                                    </div>
                                </div>
                            )}

                            <div className="relative">
                                <pre
                                    className={`w-full h-64 p-4 bg-zinc-950 rounded-xl border border-zinc-900 text-white font-mono text-sm whitespace-pre-wrap break-words overflow-y-auto custom-scrollbar ${isDrm ? "select-none cursor-default" : ""}`}
                                    onContextMenu={(e) => isDrm && e.preventDefault()}
                                    style={isDrm ? { WebkitUserSelect: "none", MozUserSelect: "none", msUserSelect: "none" } : {}}
                                >
                                    {secretContent}
                                </pre>
                            </div>

                            <div className="flex gap-3">
                                {!isDrm && (
                                    <>
                                        <button
                                            onClick={copyContent}
                                            className="flex-1 py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center space-x-2 hover:bg-zinc-200 transition-opacity cursor-pointer"
                                        >
                                            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            <span>{isCopied ? "Copied" : "Copy"}</span>
                                        </button>

                                        <button
                                            onClick={downloadContent}
                                            className="px-4 py-3 bg-zinc-900 text-zinc-400 font-medium rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                                            title="Download as .txt"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                    </>
                                )}
                                {isDrm && (
                                    <div className="w-full py-3 bg-zinc-900/50 border border-zinc-800 text-zinc-600 font-bold rounded-xl flex items-center justify-center space-x-2 cursor-not-allowed user-select-none">
                                        <Lock className="w-4 h-4" />
                                        <span>Content Protected</span>
                                    </div>
                                )}
                            </div>

                            <div className="text-center pt-2">
                                <p className="text-zinc-600 text-xs">
                                    This link is now invalid. Save your data.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div className="bg-black border border-red-900/50 p-8 rounded-3xl text-center space-y-6 shadow-xl">
                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-500">
                            <EyeOff className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Unavailable</h2>
                            <p className="text-zinc-500">
                                {errorMsg}
                            </p>
                        </div>

                        {/* Retry Mechanism */}
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Enter decryption key/hash..."
                                value={inputKey}
                                onChange={(e) => setInputKey(e.target.value)}
                                className="w-full p-3 bg-black border border-zinc-800 rounded-xl text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 text-zinc-300"
                            />
                            <button
                                onClick={() => handleReveal(inputKey)}
                                disabled={!inputKey}
                                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 disabled:opacity-50 transition-all cursor-pointer"
                            >
                                Try Decrypt
                            </button>
                        </div>

                        <div className="pt-4 border-t border-zinc-800">
                            <a href="/" className="inline-flex items-center space-x-2 text-zinc-500 hover:text-white transition-colors cursor-pointer">
                                <span className="font-medium">Back to Home</span>
                            </a>
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
}
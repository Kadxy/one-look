"use client";

import { useEffect, useState, use } from "react";
import { decryptData } from "@/lib/crypto";
import { Loader2, Eye, EyeOff, Lock, CheckCircle2, AlertTriangle, FileText, Copy, Download, Check } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ViewSecretPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [secretContent, setSecretContent] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isCopied, setIsCopied] = useState(false);

    const getKeyFromHash = () => {
        if (typeof window !== "undefined") {
            return window.location.hash.substring(1);
        }
        return "";
    };

    const handleReveal = async () => {
        const key = getKeyFromHash();
        if (!key) {
            setStatus("error");
            setErrorMsg("Decryption key missing from URL.");
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
            const payload = JSON.parse(textJson);

            setSecretContent(payload.text);
            setStatus("success");

        } catch (err: any) {
            console.error(err);
            setStatus("error");
            setErrorMsg(err.message || "Failed to retrieve secret.");
        }
    };

    const copyContent = () => {
        navigator.clipboard.writeText(secretContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }

    const downloadContent = () => {
        const blob = new Blob([secretContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `secret-${id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 transition-colors duration-300">

            {/* Top Bar */}
            <div className="absolute top-6 left-6 font-bold text-xl tracking-tighter opacity-50">One-Look</div>
            <div className="absolute top-6 right-6">
                <ThemeToggle />
            </div>

            {/* Grid BG */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-40 dark:opacity-20 pointer-events-none"></div>

            <div className="w-full max-w-lg z-10">

                {status === "idle" && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl text-center space-y-8 shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-900 dark:text-zinc-100">
                            <Lock className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold mb-3">View Secret?</h2>
                            <p className="text-zinc-500">
                                You can only view this once. It will be <span className="text-red-500 font-medium">permanently deleted</span> from the server immediately.
                            </p>
                        </div>
                        <button
                            onClick={handleReveal}
                            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-lg rounded-xl hover:opacity-80 transition-all flex items-center justify-center space-x-2"
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
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-3xl shadow-xl animate-in zoom-in-95 duration-300">
                        <div className="p-6 md:p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-green-600 dark:text-green-500">
                                    <CheckCircle2 className="w-6 h-6" />
                                    <span className="font-bold text-lg">Secret Revealed</span>
                                </div>
                                <span className="text-xs font-mono px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500">
                                    Server data incinerated
                                </span>
                            </div>

                            <div className="relative">
                                <pre className="w-full h-64 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-sm whitespace-pre-wrap break-words overflow-y-auto custom-scrollbar">
                                    {secretContent}
                                </pre>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={copyContent}
                                    className="flex-1 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black font-bold rounded-xl flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity"
                                >
                                    {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    <span>{isCopied ? "Copied" : "Copy"}</span>
                                </button>

                                <button
                                    onClick={downloadContent}
                                    className="px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                    title="Download as .txt"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="text-center pt-2">
                                <p className="text-zinc-400 dark:text-zinc-600 text-xs">
                                    Data does not exist on server anymore. Save it now.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 p-8 rounded-3xl text-center space-y-6 shadow-xl">
                        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                            <EyeOff className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-2">Gone Forever</h2>
                            <p className="text-zinc-500">
                                {errorMsg}
                            </p>
                        </div>
                        <a href="/" className="inline-block mt-4 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-full font-medium text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                            Create a new secret
                        </a>
                    </div>
                )}

            </div>
        </main>
    );
}
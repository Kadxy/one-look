"use client";

import { useState, use, useEffect } from "react";
import { decryptData } from "@/lib/crypto";
import { Loader2, EyeOff, Copy, Download, Check, HatGlasses, LockOpen } from "lucide-react";
import { copyToClipboard as copyText, downloadTextFile } from "@/lib/utils";
import { BurnResponse } from "@/app/api/burn/route";
import { SecretTypes } from "@/lib/constants";

export default function ViewSecretPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const [secretContent, setSecretContent] = useState("");
    const [isCopied, setIsCopied] = useState(false);

    const [inputKey, setInputKey] = useState("");
    const [urlKey, setUrlKey] = useState("");

    const [secretType, setSecretType] = useState<SecretTypes>(SecretTypes.TEXT);

    const [isHashChecked, setIsHashChecked] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            if (window.location.hash) {
                setUrlKey(window.location.hash.substring(1));
            }
            setIsHashChecked(true);
        }
    }, []);

    const handleBurn = async () => {
        if (!isHashChecked) {
            return;
        }

        const key = urlKey || inputKey;

        if (!key) {
            setStatus("error");
            setErrorMsg("Decryption key missing.");
            return;
        }

        setStatus("loading");

        try {
            const res = await fetch("/api/burn", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (res.status === 404) {
                throw new Error("Secret not found or already destroyed");
            }

            if (!res.ok) {
                // 尝试读取服务端返回的 json error
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Server error occurred");
            }

            const { secretType, data, iv } = await res.json() as BurnResponse;
            setSecretType(secretType);

            try {
                const _secretContent = await decryptData(data, iv, key);
                if (!_secretContent) throw new Error("Empty result");
                setSecretContent(_secretContent);
                setStatus("success");
            } catch (decryptionError) {
                console.error("Decryption failed:", decryptionError);
                throw new Error("Decryption failed, key incorrect or data corrupted");
            }

        } catch (err: any) {
            console.error(err);
            setStatus("error");
            setErrorMsg(err.message || "An unexpected error occurred.");
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
            <div className="absolute inset-0 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none"></div>

            <div className="w-full max-w-lg z-10">

                {(status === "idle" || status === 'loading') && (
                    <div className="bg-black border border-zinc-800 p-8 rounded-3xl text-center space-y-8 shadow-2xl shadow-zinc-900/50 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-200">
                            <HatGlasses className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold mb-6">
                                Reveal Secret
                            </h2>
                            <p className="text-zinc-500">
                                You can ONLY access once.
                                <br />
                                Once decrypted, the secret will be destroyed.
                            </p>
                        </div>

                        {!urlKey && isHashChecked && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                                <input
                                    value={inputKey}
                                    onChange={(e) => setInputKey(e.target.value)}
                                    placeholder="Enter decryption key"
                                    className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all"
                                />
                            </div>
                        )}

                        <button
                            onClick={() => handleBurn()}
                            className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={status === 'loading' || (!urlKey && !inputKey.trim())}
                        >
                            {status === 'loading' ? (
                                <><Loader2 className="animate-spin w-5 h-5" /> <span>Decrypting...</span></>
                            ) : (
                                "Decrypt & Burn"
                            )}
                        </button>
                    </div>
                )}

                {status === "success" && (
                    <div className="bg-black border border-zinc-800 p-1 rounded-3xl shadow-xl animate-in zoom-in-95 duration-300">
                        <div className="p-6 md:p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-white">
                                    <LockOpen className="w-6 h-6" />
                                    <span className="font-bold text-lg">Secret Decrypted</span>
                                </div>
                            </div>

                            {secretType === SecretTypes.TEXT && (
                                <>
                                    <div className="relative">
                                        <pre
                                            className={`w-full h-64 p-4 bg-zinc-950 rounded-xl border border-zinc-900 text-white font-mono text-sm whitespace-pre-wrap break-words overflow-y-auto custom-scrollbar`}
                                        >
                                            {secretContent}
                                        </pre>
                                    </div>
                                    <div className="flex gap-3">
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

                                    </div>
                                </>
                            )}

                            {secretType === SecretTypes.FILE && (
                                <>

                                </>
                            )}
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div className="bg-black border border-zinc-800 p-8 rounded-3xl text-center space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-500">
                            <EyeOff className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Access Failed</h2>
                            <p className="text-zinc-500 font-medium px-4">
                                {errorMsg}
                            </p>
                        </div>

                        <div className="pt-4 flex flex-col gap-3">
                            <a
                                href="/"
                                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-colors block"
                            >
                                Back to Home
                            </a>
                        </div>
                    </div>
                )}

            </div>
        </main >
    );
}
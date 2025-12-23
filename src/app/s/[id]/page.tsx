"use client";

import Link from "next/link";
import { useState, use, useEffect } from "react";
import { decryptData } from "@/lib/crypto";
import { Loader2, EyeOff, Copy, Download, Check, LockOpen, FileText, Image as ImageIcon, Video, Music, ScanEye, ShieldPlus, ArrowRight, Lock } from "lucide-react";
import { copyToClipboard as copyText, downloadTextFile, triggerDownload, cn } from "@/lib/utils";
import { BurnResponse } from "@/app/api/burn/route";
import { SecretTypes } from "@/lib/constants";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface DecryptedFile {
    fileName: string;
    fileType: string;
    fileData: string;
}

export default function ViewSecretPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const [secretContent, setSecretContent] = useState("");
    const [secretFile, setSecretFile] = useState<DecryptedFile | null>(null);

    const [isCopied, setIsCopied] = useState(false);
    const [inputKey, setInputKey] = useState("");
    const [urlKey, setUrlKey] = useState("");
    const [secretType, setSecretType] = useState<SecretTypes>(SecretTypes.TEXT);
    const [isHashChecked, setIsHashChecked] = useState(false);
    
    // Animation states for VFX
    const [isTransferring, setIsTransferring] = useState(false);
    const [isBurning, setIsBurning] = useState(false);
    const [showVault, setShowVault] = useState(true);

    useEffect(() => {
        if (typeof window !== "undefined") {
            if (window.location.hash) {
                setUrlKey(window.location.hash.substring(1));
            }
            setIsHashChecked(true);
        }
    }, []);

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return ImageIcon;
        if (mimeType.startsWith('video/')) return Video;
        if (mimeType.startsWith('audio/')) return Music;
        return FileText;
    };

    const handleBurn = async () => {
        if (!isHashChecked) return;
        const key = urlKey || inputKey;

        if (!key) {
            setStatus("error");
            setErrorMsg("Decryption key missing.");
            return;
        }

        setStatus("loading");
        
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        try {
            const res = await fetch("/api/burn", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (res.status === 404) {
                throw new Error("Secret vanished.");
            }

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Server error.");
            }

            const response = await res.json() as BurnResponse;
            setSecretType(response.secretType);

            try {
                const _secretContent = await decryptData(response.data, response.iv, key);
                if (!_secretContent) throw new Error("Empty result");

                if (response.secretType === SecretTypes.FILE) {
                    const parsedFile = JSON.parse(_secretContent) as DecryptedFile;
                    setSecretFile(parsedFile);
                } else {
                    setSecretContent(_secretContent);
                }

                // Start the data transfer animation sequence
                setIsTransferring(true);
                await sleep(600); // Wait for transfer animation
                
                // Start burning the vault icon
                setIsBurning(true);
                await sleep(300); // Small delay before showing success
                
                setStatus("success");
                
                // After burn animation completes, hide the vault
                await sleep(400);
                setShowVault(false);
            } catch (decryptionError) {
                console.error("Decryption failed:", decryptionError);
                throw new Error("Invalid key. Unable to decrypt.");
            }

        } catch (err: unknown) {
            console.error(err);
            setStatus("error");
            setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
        }
    };

    const copyContent = () => {
        copyText(secretContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }

    const downloadContent = () => {
        if (secretType === SecretTypes.FILE && secretFile) {
            triggerDownload(secretFile.fileData, secretFile.fileName);
        } else {
            downloadTextFile(secretContent, `secret-${id}.txt`);
        }
    }

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center p-6 overflow-hidden bg-black text-zinc-200">

            <div className="fixed top-8 left-8 z-20 flex items-center gap-3 select-none animate-in fade-in slide-in-from-top-4 duration-1000">
                <Link
                    href="/"
                    className="fixed top-8 left-8 z-20 flex items-center gap-3 select-none animate-in fade-in slide-in-from-top-4 duration-1000 group cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                >
                    <Image
                        src="/icon.webp"
                        draggable={false}
                        alt="One-Look Logo"
                        width={48}
                        height={48}
                        className="w-8 h-8 transition-transform"
                    />
                    <span className="font-bold text-xl tracking-tighter text-zinc-200">One-Look</span>
                </Link>
            </div>

            <div className="absolute inset-0 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none"></div>

            <div className="w-full max-w-lg z-10 flex flex-col gap-8">

                {(status === "idle" || status === 'loading') && (
                    <div className="bg-black border border-zinc-800 p-8 rounded-3xl text-center space-y-8 shadow-2xl shadow-zinc-900/50 animate-in fade-in zoom-in-95 duration-500">
                        {/* Server Vault Section */}
                        <div className="relative">
                            <div className="flex flex-col items-center gap-2 mb-4">
                                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Server Vault</span>
                            </div>
                            <div className={cn(
                                "w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-200 relative group",
                                isTransferring && "animate-pulse"
                            )}>
                                <div className="absolute inset-0 bg-zinc-800/20 rounded-full blur-xl group-hover:bg-zinc-700/30 transition-all duration-500"></div>
                                <Lock className="w-10 h-10 relative z-10" />
                            </div>
                            
                            {/* Data Transfer Animation */}
                            <AnimatePresence>
                                {isTransferring && (
                                    <motion.div
                                        className="absolute left-1/2 top-24 -translate-x-1/2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {/* Animated particles flowing down */}
                                        {[...Array(5)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className="absolute w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                                                initial={{ y: 0, opacity: 1, scale: 1 }}
                                                animate={{ 
                                                    y: 80, 
                                                    opacity: [1, 0.8, 0],
                                                    scale: [1, 0.8, 0.5]
                                                }}
                                                transition={{
                                                    duration: 0.6,
                                                    delay: i * 0.1,
                                                    ease: "easeIn"
                                                }}
                                            />
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        {/* Receiving Area Indicator */}
                        <div className="flex flex-col items-center gap-2">
                            <div className={cn(
                                "w-12 h-12 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-300",
                                isTransferring ? "border-green-500/50 bg-green-500/5" : "border-zinc-700"
                            )}>
                                <ScanEye className={cn(
                                    "w-6 h-6 transition-colors",
                                    isTransferring ? "text-green-400" : "text-zinc-500"
                                )} />
                            </div>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Your Device</span>
                        </div>
                        
                        <div className="select-none">
                            <h2 className="text-3xl font-bold mb-4">
                                Decrypt Secret
                            </h2>
                            <p className="text-zinc-500 leading-relaxed">
                                You are about to view a secret.
                                <br />
                                <span className="text-zinc-400 font-medium">It vanishes completely once displayed.</span>
                            </p>
                        </div>

                        {!urlKey && isHashChecked && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                                <input
                                    value={inputKey}
                                    onChange={(e) => setInputKey(e.target.value)}
                                    placeholder="Paste decryption key"
                                    className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all text-center font-mono placeholder:text-zinc-600"
                                />
                            </div>
                        )}

                        <button
                            onClick={() => handleBurn()}
                            className="h-12 w-full bg-gradient-to-t from-zinc-100 to-white text-black font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-[0px_0px_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-white/50 disabled:opacity-50 disabled:cursor-not-allowed select-none hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                            disabled={status === 'loading' || (!urlKey && !inputKey.trim())}
                        >
                            {status === 'loading' ? (
                                <><Loader2 className="animate-spin w-5 h-5" /> <span>Decrypting...</span></>
                            ) : (
                                "Reveal Secret"
                            )}
                        </button>
                    </div>
                )}

                {status === "success" && (
                    <div className="space-y-6 animate-in zoom-in-95 duration-500">
                        {/* Burning Vault Icon */}
                        <AnimatePresence>
                            {showVault && (
                                <motion.div 
                                    className="flex justify-center mb-4"
                                    initial={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className={cn(
                                        "w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-200 relative",
                                        isBurning && "animate-burn"
                                    )}>
                                        <Lock className="w-8 h-8" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        <motion.div 
                            className="bg-black border border-zinc-800 p-1 rounded-3xl shadow-xl"
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ 
                                type: "spring",
                                stiffness: 300,
                                damping: 25,
                                delay: 0.2
                            }}
                        >
                            <div className="p-6 md:p-8 space-y-6">
                                <div className="flex items-center justify-between select-none">
                                    <div className="flex items-center space-x-2 text-white">
                                        <LockOpen className="w-6 h-6" />
                                        <span className="font-bold text-lg">Decrypted</span>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold bg-zinc-900/50 border border-zinc-800 px-2 py-1 rounded">Vanished from server</span>
                                </div>

                                {secretType === SecretTypes.TEXT && (
                                    <>
                                        <div className="relative">
                                            <pre className={`w-full h-64 p-4 bg-zinc-950 rounded-xl border border-zinc-900 text-white font-mono text-sm whitespace-pre-wrap break-words overflow-y-auto custom-scrollbar`}>
                                                {secretContent}
                                            </pre>
                                        </div>
                                        <div className="flex gap-3 select-none">
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
                                                title="Save as file"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </>
                                )}

                                {secretType === SecretTypes.FILE && secretFile && (
                                    <>
                                        <div className="w-full h-64 bg-zinc-950 rounded-xl border border-zinc-900 flex flex-col items-center justify-center gap-4 text-center p-6 select-none">
                                            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center">
                                                {(() => {
                                                    const Icon = getFileIcon(secretFile.fileType);
                                                    return <Icon className="w-8 h-8 text-zinc-400" />;
                                                })()}
                                            </div>
                                            <div className="space-y-1 overflow-hidden w-full">
                                                <p className="text-zinc-200 font-medium truncate px-4" title={secretFile.fileName}>
                                                    {secretFile.fileName}
                                                </p>
                                                <p className="text-zinc-500 text-sm">
                                                    {secretFile.fileType || "Unknown Type"}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={downloadContent}
                                            className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center space-x-2 cursor-pointer select-none"
                                        >
                                            <Download className="w-5 h-5" />
                                            <span>Download File</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>

                        {/* Navigate to create another secret */}
                        <Link
                            href="/"
                            className="block w-full py-4 text-center text-zinc-500 hover:text-zinc-300 bg-zinc-900/20 hover:bg-zinc-900/50 rounded-xl transition-all cursor-pointer group select-none border border-zinc-800/50 hover:border-zinc-800"
                        >
                            <span className="flex items-center justify-center gap-2 text-sm font-medium">
                                <ShieldPlus className="w-4 h-4" />
                                <span>Secure another secret</span>
                                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </span>
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="bg-black border border-zinc-800 p-8 rounded-3xl text-center space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-500">
                            <EyeOff className="w-10 h-10" />
                        </div>
                        <div className="select-none">
                            <h2 className="text-2xl font-bold text-white mb-2">Content Unavailable</h2>
                            <p className="text-zinc-500 font-medium px-4">
                                {errorMsg}
                            </p>
                        </div>

                        <div className="pt-4 flex flex-col gap-3 select-none">
                            <Link
                                href="/"
                                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-colors block"
                            >
                                Create New Secret
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 left-0 right-0 text-center select-none pointer-events-none">
                <p className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase">Powered by One Look</p>
            </div>
        </main >
    );
}
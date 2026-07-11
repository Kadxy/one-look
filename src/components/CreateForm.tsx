"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { generateKey, encryptData } from "@/lib/crypto";
import {
    Copy, Check, Link2, Clock, ChevronDown, Upload,
    Lock, CloudUpload, Key, ShieldCheck,
    FileText, X, Image as ImageIcon, Video, Music, ArrowRight
} from "lucide-react";
import { cn, copyToClipboard as copyText, getShareLink } from "@/lib/utils";
import { TTL_OPTIONS, SecretTypes, MAX_FILE_SIZE } from "@/lib/constants";
import { VaultRequestPayload } from "@/app/api/vault/route";
import { motion, useReducedMotion } from "framer-motion";

// These are minimum display times, not extra waits after the request finishes.
// Fast requests keep a short cinematic sequence; slow requests naturally spend
// their time on the "Storing ciphertext" step instead of paying both costs.
const LOADING_STEPS = [
    { icon: Key, text: "Forging keys...", duration: 200 },
    { icon: Lock, text: "Encrypting locally...", duration: 240 },
    { icon: CloudUpload, text: "Storing ciphertext...", duration: 180 },
    { icon: ShieldCheck, text: "Ready.", duration: 160 },
];

const CIPHER_PHASES = ["KEY MATERIAL", "LOCAL CIPHER", "UPLOAD BUFFER", "SEALED"];
const CIPHER_ROW_COUNT = 3;
const CIPHER_BYTES_PER_ROW = 12;

interface SelectedFile {
    name: string;
    size: number;
    type: string;
}

function createCipherRows(): string[][] {
    const bytes = new Uint8Array(CIPHER_ROW_COUNT * CIPHER_BYTES_PER_ROW);
    window.crypto.getRandomValues(bytes);

    return Array.from({ length: CIPHER_ROW_COUNT }, (_, rowIndex) => {
        const start = rowIndex * CIPHER_BYTES_PER_ROW;
        return Array.from(bytes.slice(start, start + CIPHER_BYTES_PER_ROW), byte =>
            byte.toString(16).padStart(2, "0").toUpperCase()
        );
    });
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function CipherStream({ phase }: { phase: number }) {
    const [rows] = useState(createCipherRows);

    return (
        <div
            className="relative w-full h-40 overflow-hidden rounded-2xl border border-zinc-800 bg-black shadow-sm select-none"
            aria-hidden="true"
        >
            <div className="absolute inset-x-4 top-3 z-10 flex items-center justify-between font-mono text-[9px] tracking-[0.2em] text-zinc-600">
                <span>{CIPHER_PHASES[phase]}</span>
                <span>AES-256-GCM</span>
            </div>

            <div className="absolute inset-x-0 top-9 bottom-3 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
                <div className="flex h-full flex-col justify-center gap-2">
                    {rows.map((row, rowIndex) => (
                        <motion.div
                            key={rowIndex}
                            className="flex w-full justify-between px-4 font-mono text-[10px]"
                            animate={{ opacity: [0.48, 0.72, 0.48] }}
                            transition={{
                                duration: 1.1,
                                delay: rowIndex * 0.12,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            {row.map((byte, byteIndex) => (
                                <span
                                    key={`${rowIndex}-${byteIndex}`}
                                    className="flex h-5 w-6 sm:w-7 items-center justify-center rounded border border-green-500/[0.08] bg-green-500/[0.025] text-green-300/55"
                                >
                                    {byte}
                                </span>
                            ))}
                        </motion.div>
                    ))}
                </div>
            </div>

            <motion.div
                className="absolute inset-x-4 top-9 h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent shadow-[0_0_8px_rgba(74,222,128,0.22)]"
                animate={{ y: [0, 88, 0], opacity: [0, 0.65, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
            />
        </div>
    );
}

export default function CreateForm({ setInresult }: { setInresult: (inResult: boolean) => void }) {
    const shouldReduceMotion = useReducedMotion();
    const [content, setContent] = useState("");
    const [secretType, setSecretType] = useState<SecretTypes>(SecretTypes.TEXT);

    const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isTtlOpen, setIsTtlOpen] = useState(false);
    const [ttl, setTtl] = useState(TTL_OPTIONS.at(-1)?.value || 24 * 60 * 60);
    const [linkNum, setLinkNum] = useState(1);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);

    const [isShaking, setIsShaking] = useState(false);
    const [customPlaceholder, setCustomPlaceholder] = useState("What's the secret?");

    const [isDragging, setIsDragging] = useState(false);

    const [resultLinks, setResultLinks] = useState<string[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    
    // Animation states for VFX
    const [isTextEncrypting, setIsTextEncrypting] = useState(false);
    const [isFileEncrypting, setIsFileEncrypting] = useState(false);

    useEffect(() => {
        setInresult(resultLinks.length > 0)
    }, [resultLinks, setInresult])

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return ImageIcon;
        if (mimeType.startsWith('video/')) return Video;
        if (mimeType.startsWith('audio/')) return Music;
        return FileText;
    };

    const handleFileProcess = (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            setIsShaking(true);
            const maxSizeMB = Math.round(MAX_FILE_SIZE / 1024 / 1024);
            setCustomPlaceholder(`File too large (Max ${maxSizeMB}MB).`);
            setTimeout(() => {
                setIsShaking(false);
                setCustomPlaceholder("What's the secret?");
            }, 2000);

            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64 = ev.target?.result as string;
            const packedContent = JSON.stringify({
                fileName: file.name,
                fileType: file.type,
                fileData: base64
            });

            setContent(packedContent);
            setSecretType(SecretTypes.FILE);
            setSelectedFile({
                name: file.name,
                size: file.size,
                type: file.type,
            });
        };
        reader.readAsDataURL(file);
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileProcess(file);
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileProcess(file);
    }, []);

    const clearFile = () => {
        setContent("");
        setSecretType(SecretTypes.TEXT);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleCreate = async () => {
        if (!content.trim()) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            return;
        }
        setIsLoading(true);
        setLoadingStep(0);
        setResultLinks([]);

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        const stepDuration = (index: number) => shouldReduceMotion ? 0 : LOADING_STEPS[index].duration;

        try {
            // Start encryption API in background
            const apiPromise = (async () => {
                const promises = Array.from({ length: linkNum }).map(async () => {
                    const key = await generateKey();
                    const encrypted = await encryptData(content, key);
                    return { encrypted, key };
                });
                const encryptedData = await Promise.all(promises);

                const uploadPromises = encryptedData.map(async ({ encrypted, key }) => {
                    const { iv, data } = encrypted
                    const res = await fetch("/api/vault", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ iv, secretType, data, ttl } as VaultRequestPayload),
                    });
                    if (!res.ok) throw new Error("Failed to create link.");
                    const { id } = await res.json();
                    return getShareLink(id, key);
                });
                return await Promise.all(uploadPromises);
            })();

            // Start VFX immediately while button is loading (visual feedback only)
            if (!shouldReduceMotion && secretType === SecretTypes.TEXT && content.length > 0) {
                setIsTextEncrypting(true);
            } else if (!shouldReduceMotion && secretType === SecretTypes.FILE) {
                setIsFileEncrypting(true);
            }

            // Run loading steps while API runs in background
            await sleep(stepDuration(0));
            setLoadingStep(1);
            await sleep(stepDuration(1));
            setLoadingStep(2);
            const uploadStepStartedAt = Date.now();
            const results = await apiPromise;
            const uploadStepElapsed = Date.now() - uploadStepStartedAt;
            await sleep(Math.max(0, stepDuration(2) - uploadStepElapsed));
            setLoadingStep(3);
            await sleep(stepDuration(3));
            
            // Loading complete - stop VFX and show results immediately
            setIsTextEncrypting(false);
            setIsFileEncrypting(false);
            setIsLoading(false);
            setLoadingStep(0);

            setResultLinks(results);
            clearFile();
            setContent("");
        } catch (err) {
            console.error(err);
            setCustomPlaceholder("Network error. Please try again.");
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 2000);
            // Reset animation states on error
            setIsTextEncrypting(false);
            setIsFileEncrypting(false);
            setIsLoading(false);
            setLoadingStep(0);
        }
    };

    const copyToClipboard = (link: string, index: number) => {
        copyText(link);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const copyAll = () => {
        const text = resultLinks.join("\n");
        copyText(text);
        setCopiedIndex(999);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const resetToCreateNew = () => {
        setResultLinks([]);
        setCopiedIndex(null);
        setIsTextEncrypting(false);
        setIsFileEncrypting(false);
    };

    return (
        <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-3">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

            {resultLinks.length > 0 ? (
                <>
                    <motion.div 
                        initial={{ scale: 0.92, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 420,
                            damping: 32
                        }}
                        className="bg-black border border-zinc-800 rounded-2xl shadow-xl overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between select-none">
                            <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium tracking-wide">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Secured</span>
                            </div>
                            <div className="text-xs text-zinc-500 font-mono">
                                Auto-burns in {TTL_OPTIONS.find(t => t.value === ttl)?.label}
                            </div>
                        </div>

                        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                            {resultLinks.map((link, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="flex items-center gap-3 px-3 py-2 bg-zinc-900/40 hover:bg-zinc-900/60 rounded-lg transition-all border border-zinc-800/50">
                                        <div className="flex-1 min-w-0">
                                            <input
                                                readOnly
                                                value={link}
                                                onClick={(e) => e.currentTarget.select()}
                                                className="w-full bg-transparent text-xs font-mono text-zinc-400 focus:text-zinc-200 focus:outline-none cursor-pointer no-scrollbar"
                                            />
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(link, idx)}
                                            className={cn(
                                                "flex-shrink-0 p-2 rounded-md transition-all cursor-pointer",
                                                copiedIndex === idx
                                                    ? "bg-zinc-800 text-white"
                                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                                            )}
                                        >
                                            {copiedIndex === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {resultLinks.length > 1 && (
                            <div className="px-4 pb-4 pt-3">
                                <button
                                    onClick={copyAll}
                                    className={cn(
                                        "w-full py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center transition-colors cursor-pointer select-none",
                                        copiedIndex === 999
                                            ? "bg-zinc-800 text-white border border-zinc-700"
                                            : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800"
                                    )}
                                >
                                    <span className="inline-flex items-center gap-2 w-[5.5rem] justify-center">
                                        {copiedIndex === 999 ? (
                                            <><Check className="w-4 h-4" /><span>Copied</span></>
                                        ) : (
                                            <><Copy className="w-4 h-4" /><span>Copy All</span></>
                                        )}
                                    </span>
                                </button>
                            </div>
                        )}
                    </motion.div>

                    <button
                        onClick={resetToCreateNew}
                        className="w-full text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer underline underline-offset-4 decoration-zinc-700 hover:decoration-zinc-500 select-none"
                    >
                        Create another
                    </button>
                </>
            ) : (
                <div className="space-y-6">
                    <div
                        className="relative group origin-center"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className={cn(
                            "absolute -inset-0.5 bg-gradient-to-br from-zinc-800/30 to-zinc-900/30 rounded-2xl blur opacity-20 transition duration-500",
                            isDragging ? "opacity-60 bg-zinc-700" : "group-hover:opacity-40"
                        )}></div>

                        <div className="relative h-40">
                            {secretType === SecretTypes.FILE && selectedFile ? (
                                <div className="relative w-full h-40 bg-black text-zinc-300 p-5 rounded-2xl border border-zinc-800 flex items-center transition-all select-none">
                                    <div className="flex w-full items-center gap-3 px-2">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/70">
                                            {isFileEncrypting ? (
                                                <Lock className="w-5 h-5 text-zinc-400 animate-pulse" />
                                            ) : (
                                                (() => {
                                                    const Icon = getFileIcon(selectedFile.type);
                                                    return <Icon className="w-5 h-5 text-zinc-400" />;
                                                })()
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1 text-left">
                                            <p className="truncate text-sm font-medium text-zinc-200">
                                                {isFileEncrypting ? "Encrypting file..." : selectedFile.name}
                                            </p>
                                            <p className="mt-0.5 truncate text-xs text-zinc-500">
                                                {isFileEncrypting ? selectedFile.name : formatFileSize(selectedFile.size)}
                                            </p>
                                        </div>

                                        {!isFileEncrypting && (
                                            <button
                                                onClick={clearFile}
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-900 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600/50 cursor-pointer"
                                                aria-label="Remove selected file"
                                                title="Remove file"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // Fixed cipher stream: independent of plaintext length and language.
                                <>
                                    {isTextEncrypting ? (
                                        <CipherStream phase={loadingStep} />
                                    ) : (
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            placeholder={customPlaceholder}
                                            className={cn(
                                                "relative block w-full h-40 bg-black text-zinc-300 p-5 pr-14 rounded-2xl border focus:outline-none focus:ring-4 resize-none placeholder:text-zinc-600 text-base font-mono leading-relaxed shadow-sm transition-all no-scrollbar",
                                                isDragging ? "border-dashed border-zinc-500 bg-zinc-900/20" : "border-zinc-800 focus:border-zinc-500/50 focus:ring-zinc-500/10",
                                                isShaking && "animate-shake border-zinc-600 placeholder:text-zinc-500"
                                            )}
                                            spellCheck={false}
                                        />
                                    )}
                                    {isDragging && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <p className="text-zinc-400 font-medium">Drop to upload</p>
                                        </div>
                                    )}
                                    {!content && !isDragging && !isTextEncrypting && (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-3 right-3 p-2.5 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/50 rounded-lg transition-all cursor-pointer group/upload"
                                            title={`Attach File (Max ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)`}
                                        >
                                            <Upload className="w-4.5 h-4.5" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4 select-none">
                        <div className="space-y-2 w-24">
                            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider pl-1">
                                <Clock className="w-3 h-3" />
                                <span>TTL</span>
                            </div>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsTtlOpen(!isTtlOpen)}
                                    className={cn("w-full h-8.5 flex items-center justify-between px-3 bg-black border border-zinc-800 rounded-lg text-xs text-zinc-300 hover:border-zinc-600 transition-colors cursor-pointer", isLoading && "opacity-50 cursor-not-allowed")}
                                    disabled={isLoading}
                                >
                                    <span>{TTL_OPTIONS.find((t) => t.value === ttl)?.label}</span>
                                    <ChevronDown className={cn("w-3 h-3 transition-transform", isTtlOpen && "rotate-180")} />
                                </button>
                                {isTtlOpen && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100">
                                        {TTL_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => { setTtl(opt.value); setIsTtlOpen(false); }}
                                                className={cn("w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer hover:bg-zinc-800", ttl === opt.value ? "text-white bg-zinc-800/50 font-medium" : "text-zinc-400")}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider pl-1">
                                <Link2 className="w-3 h-3" />
                                <span>Copies</span>
                            </div>
                            <div className="flex bg-black p-1 rounded-lg border border-zinc-800 w-fit h-8.5">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => setLinkNum(num)}
                                        className={cn(
                                            "w-8 h-full flex items-center justify-center rounded-md text-xs font-medium transition-all cursor-pointer",
                                            linkNum === num ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-400",
                                            isLoading && "opacity-50 cursor-not-allowed"
                                        )}
                                        disabled={isLoading}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Action Button */}
                    <button
                        onClick={handleCreate}
                        className={cn("h-12 group w-full bg-gradient-to-t from-zinc-100 to-white text-black font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-[0px_0px_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-white/50 active:scale-[0.99] cursor-pointer select-none",
                            isLoading && "opacity-80 shadow-none scale-[1.01]"
                        )}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center space-x-2">
                                {(() => {
                                    const Icon = LOADING_STEPS[loadingStep].icon;
                                    return <Icon className="w-5 h-5 animate-pulse" />;
                                })()}
                                <span className="font-medium">{LOADING_STEPS[loadingStep].text}</span>
                            </div>
                        ) : (
                            <span className="flex items-center gap-2">Seal the Secret <ArrowRight className="w-4 h-4" /></span>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

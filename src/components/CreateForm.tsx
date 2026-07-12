"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { generateKey, encryptData } from "@/lib/crypto";
import {
    Copy, Check, Link2, Clock, Minus, Plus, Paperclip,
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
const CIPHER_BYTES_PER_ROW = 10;
const TTL_SHORT_LABELS: Record<number, string> = {
    [10 * 60]: "10m",
    [30 * 60]: "30m",
    [60 * 60]: "1h",
    [12 * 60 * 60]: "12h",
    [24 * 60 * 60]: "24h",
};

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
            className="control-surface relative h-full w-full overflow-hidden rounded-xl select-none"
            aria-hidden="true"
        >
            <div className="absolute inset-x-4 top-3 z-10 flex items-center justify-between font-mono text-[9px] tracking-[0.2em] text-[var(--app-muted-dim)]">
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
                                    className="flex h-5 w-6 items-center justify-center rounded border border-[var(--app-border)] bg-[var(--app-hover)] text-[var(--app-muted)] sm:w-7"
                                >
                                    {byte}
                                </span>
                            ))}
                        </motion.div>
                    ))}
                </div>
            </div>

            <motion.div
                className="cipher-scan-line absolute inset-x-4 top-9 h-px"
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
        <div className="w-full max-w-xl space-y-3">
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
                        className="app-surface overflow-hidden rounded-2xl"
                    >
                        <div className="flex items-center justify-between gap-3 border-b border-[var(--app-border)] px-4 py-4 select-none sm:px-6">
                            <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-[var(--app-text-soft)]">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Secured</span>
                            </div>
                            <div className="text-right font-mono text-xs text-[var(--app-muted)]">
                                Auto-burns in {TTL_OPTIONS.find(t => t.value === ttl)?.label}
                            </div>
                        </div>

                        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                            {resultLinks.map((link, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="control-surface flex min-h-14 items-center gap-2 rounded-xl px-2.5 py-1.5 transition-colors sm:gap-3 sm:px-3">
                                        <div className="flex-1 min-w-0">
                                            <input
                                                readOnly
                                                value={link}
                                                onClick={(e) => e.currentTarget.select()}
                                                aria-label={`Secured link ${idx + 1}`}
                                                className="h-11 w-full cursor-pointer bg-transparent font-mono text-xs text-[var(--app-text-soft)] outline-none no-scrollbar focus:text-[var(--app-text)]"
                                            />
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(link, idx)}
                                            aria-label={copiedIndex === idx ? `Link ${idx + 1} copied` : `Copy link ${idx + 1}`}
                                            className={cn(
                                                "focus-ring flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg transition-all cursor-pointer",
                                                copiedIndex === idx
                                                    ? "bg-[var(--app-hover-strong)] text-[var(--app-text)]"
                                                    : "text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)]"
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
                                        "control-surface focus-ring flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-medium transition-colors cursor-pointer select-none",
                                        copiedIndex === 999
                                            ? "text-[var(--app-text)]"
                                            : "text-[var(--app-text-soft)] hover:text-[var(--app-text)]"
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
                        className="focus-ring flex min-h-11 w-full items-center justify-center rounded-lg text-center text-sm text-[var(--app-muted)] transition-colors cursor-pointer underline underline-offset-4 decoration-[var(--app-border-strong)] hover:text-[var(--app-text-soft)] hover:decoration-[var(--app-muted)] select-none"
                    >
                        Create another
                    </button>
                </>
            ) : (
                <div className="space-y-5 sm:space-y-6">
                    <div
                        className="relative origin-center"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="relative h-40 sm:h-48">
                            {secretType === SecretTypes.FILE && selectedFile ? (
                                <div className="control-surface relative flex h-full w-full items-center rounded-xl p-5 text-[var(--app-text-soft)] transition-all select-none">
                                    <div className="flex w-full items-center gap-3 px-2">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-hover)]">
                                            {isFileEncrypting ? (
                                                <Lock className="h-5 w-5 animate-pulse text-[var(--app-muted)]" />
                                            ) : (
                                                (() => {
                                                    const Icon = getFileIcon(selectedFile.type);
                                                    return <Icon className="h-5 w-5 text-[var(--app-muted)]" />;
                                                })()
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1 text-left">
                                            <p className="truncate text-sm font-medium text-[var(--app-text-soft)]">
                                                {isFileEncrypting ? "Encrypting file..." : selectedFile.name}
                                            </p>
                                            <p className="mt-0.5 truncate text-xs text-[var(--app-muted)]">
                                                {isFileEncrypting ? selectedFile.name : formatFileSize(selectedFile.size)}
                                            </p>
                                        </div>

                                        {!isFileEncrypting && (
                                            <button
                                                onClick={clearFile}
                                                className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--app-muted)] transition-colors hover:bg-[var(--app-hover)] hover:text-[var(--app-text)] cursor-pointer"
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
                                                "control-surface field-control relative block h-full w-full resize-none rounded-xl px-4 pt-4 pb-11 font-mono text-[15px] leading-7 text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted-dim)] no-scrollbar sm:px-5 sm:pt-5",
                                                isDragging && "border-dashed border-[var(--app-border-strong)] bg-[var(--app-hover)]",
                                                isShaking && "animate-shake border-[var(--app-border-strong)] placeholder:text-[var(--app-muted)]"
                                            )}
                                            spellCheck={false}
                                        />
                                    )}
                                    {isDragging && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <p className="font-medium text-[var(--app-text-soft)]">Drop to upload</p>
                                        </div>
                                    )}
                                    {!content && !isDragging && !isTextEncrypting && (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="focus-ring absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-md text-[var(--app-muted-dim)] transition-colors hover:bg-[var(--app-surface-strong)] hover:text-[var(--app-text)] cursor-pointer"
                                            title={`Attach File (Max ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)`}
                                            aria-label={`Attach file, maximum ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`}
                                        >
                                            <Paperclip className="h-4 w-4" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] items-start gap-2 select-none sm:grid-cols-[minmax(0,1fr)_8rem] sm:gap-3">
                        <fieldset className="min-w-0 space-y-2">
                            <legend className="sr-only">Expiration time</legend>
                            <div className="flex h-4 items-center gap-1.5 text-[11px] font-medium whitespace-nowrap sm:text-xs">
                                <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--app-muted-dim)]" />
                                <span className="text-[var(--app-muted)]">Expires after</span>
                            </div>
                            <div className="control-surface grid h-10 min-w-0 grid-cols-5 rounded-lg p-0.5" role="group" aria-label="Secret expiration time">
                                {TTL_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setTtl(option.value)}
                                        aria-pressed={ttl === option.value}
                                        aria-label={`Expire after ${option.label}`}
                                        className={cn(
                                            "focus-ring flex h-full min-w-0 items-center justify-center rounded-md text-[10px] font-medium transition-colors sm:text-xs",
                                            ttl === option.value
                                                ? "bg-[var(--app-surface-strong)] text-[var(--app-text)]"
                                                : "text-[var(--app-muted-dim)] hover:bg-[var(--app-surface-strong)] hover:text-[var(--app-text)]",
                                            isLoading && "cursor-not-allowed opacity-50"
                                        )}
                                        disabled={isLoading}
                                    >
                                        {TTL_SHORT_LABELS[option.value]}
                                    </button>
                                ))}
                            </div>
                        </fieldset>

                        <fieldset className="min-w-0 space-y-2">
                            <legend className="sr-only">Number of one-time links</legend>
                            <div className="flex h-4 items-center gap-1.5 text-[11px] font-medium whitespace-nowrap sm:text-xs">
                                <Link2 className="h-3.5 w-3.5 shrink-0 text-[var(--app-muted-dim)]" />
                                <span className="text-[var(--app-muted)]">Copies</span>
                            </div>

                            <div className="control-surface grid h-10 w-full grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] overflow-hidden rounded-lg" role="group" aria-label="Number of one-time links">
                                <button
                                    type="button"
                                    onClick={() => setLinkNum((current) => Math.max(1, current - 1))}
                                    disabled={isLoading || linkNum === 1}
                                    className="focus-ring flex h-full w-full items-center justify-center rounded-md text-[var(--app-muted-dim)] transition-colors hover:bg-[var(--app-surface-strong)] hover:text-[var(--app-text)] disabled:opacity-30"
                                    aria-label="Create fewer links"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="flex min-w-0 items-center justify-center text-center text-sm font-medium text-[var(--app-text)]" aria-live="polite">{linkNum}</span>
                                <button
                                    type="button"
                                    onClick={() => setLinkNum((current) => Math.min(5, current + 1))}
                                    disabled={isLoading || linkNum === 5}
                                    className="focus-ring flex h-full w-full items-center justify-center rounded-md text-[var(--app-muted-dim)] transition-colors hover:bg-[var(--app-surface-strong)] hover:text-[var(--app-text)] disabled:opacity-30"
                                    aria-label="Create more links"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </fieldset>
                    </div>

                    {/* Main Action Button */}
                    <button
                        onClick={handleCreate}
                        className={cn("primary-action group flex min-h-11 w-full items-center justify-center space-x-2 rounded-lg px-5 text-sm font-medium transition-colors cursor-pointer select-none sm:ml-auto sm:w-auto sm:min-w-[168px]",
                            isLoading && "opacity-80"
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

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

const LOADING_STEPS = [
    { icon: Key, text: "Forging keys...", duration: 500 },
    { icon: Lock, text: "Encrypting locally...", duration: 500 },
    { icon: CloudUpload, text: "Storing ciphertext...", duration: 500 },
    { icon: ShieldCheck, text: "Ready.", duration: 300 },
];

export default function CreateForm({ setInresult }: { setInresult: (inResult: boolean) => void }) {
    const [content, setContent] = useState("");
    const [secretType, setSecretType] = useState<SecretTypes>(SecretTypes.TEXT);

    const [selectedFile, setSelectedFile] = useState<{ name: string, size: number, type: string } | null>(null);
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
            setSelectedFile({ name: file.name, size: file.size, type: file.type });
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

        try {
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

            await sleep(LOADING_STEPS[0].duration);
            setLoadingStep(1);
            await sleep(LOADING_STEPS[1].duration);
            setLoadingStep(2);
            const uploadStart = Date.now();
            const results = await apiPromise;
            const uploadElapsed = Date.now() - uploadStart;
            await sleep(Math.max(0, LOADING_STEPS[2].duration - uploadElapsed));
            setLoadingStep(3);
            await sleep(LOADING_STEPS[3].duration);

            setResultLinks(results);
            clearFile();
            setContent("");
        } catch (err) {
            console.error(err);
            setCustomPlaceholder("Network error. Please try again.");
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 2000);
        } finally {
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

    return (
        <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-3">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

            {resultLinks.length > 0 ? (
                <>
                    <div className="bg-black border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
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
                    </div>

                    <button
                        onClick={() => { setResultLinks([]); setCopiedIndex(null); }}
                        className="w-full text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer underline underline-offset-4 decoration-zinc-700 hover:decoration-zinc-500 select-none"
                    >
                        Create another
                    </button>
                </>
            ) : (
                <div className="space-y-6">
                    <div
                        className="relative group"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className={cn(
                            "absolute -inset-0.5 bg-gradient-to-br from-zinc-800/30 to-zinc-900/30 rounded-2xl blur opacity-20 transition duration-500",
                            isDragging ? "opacity-60 bg-zinc-700" : "group-hover:opacity-40"
                        )}></div>

                        <div className="relative">
                            {secretType === SecretTypes.FILE && selectedFile ? (
                                // File Preview
                                <div className={cn(
                                    "relative w-full h-40 bg-black text-zinc-300 p-5 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all select-none",
                                    "border-zinc-800"
                                )}>
                                    <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center">
                                        {(() => {
                                            const Icon = getFileIcon(selectedFile.type);
                                            return <Icon className="w-6 h-6 text-zinc-400" />;
                                        })()}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-zinc-200 truncate max-w-[200px]">{selectedFile.name}</p>
                                        <p className="text-xs text-zinc-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button
                                        onClick={clearFile}
                                        className="absolute top-3 right-3 p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-full transition-all cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                // Text Input
                                <>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder={customPlaceholder}
                                        className={cn(
                                            "relative w-full h-40 bg-black text-zinc-300 p-5 pr-14 rounded-2xl border focus:outline-none focus:ring-4 resize-none placeholder:text-zinc-600 text-base font-mono leading-relaxed shadow-sm transition-all no-scrollbar",
                                            isDragging ? "border-dashed border-zinc-500 bg-zinc-900/20" : "border-zinc-800 focus:border-zinc-500/50 focus:ring-zinc-500/10",
                                            isShaking && "animate-shake border-zinc-600 placeholder:text-zinc-500"
                                        )}
                                        spellCheck={false}
                                    />
                                    {isDragging && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <p className="text-zinc-400 font-medium">Drop to upload</p>
                                        </div>
                                    )}
                                    {!content && !isDragging && (
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
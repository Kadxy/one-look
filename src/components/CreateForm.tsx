"use client";

import { useEffect, useState } from "react";
import { generateKey, encryptData } from "@/lib/crypto";
import { Copy, Check, Link2, Clock, ChevronDown, Upload, Lock, CloudUpload, Key, ShieldCheck, Copyright } from "lucide-react";
import { cn, copyToClipboard as copyText, getShareLink } from "@/lib/utils";
import { TTL_OPTIONS, SecretTypes } from "@/lib/constants";
import { VaultRequestPayload } from "@/app/api/vault/route";

const LOADING_STEPS = [
    { icon: Key, text: "Generating a random key...", duration: 420 },
    { icon: Lock, text: "Encrypting your secret...", duration: 420 },
    { icon: CloudUpload, text: "Uploading to vault...", duration: 420 },
    { icon: ShieldCheck, text: "Done!", duration: 240 },
];

export default function CreateForm({ setInresult }: { setInresult: (inResult: boolean) => void }) {
    const [content, setContent] = useState("");
    const [secretType, setSecretType] = useState<SecretTypes>(SecretTypes.TEXT);

    const [isTtlOpen, setIsTtlOpen] = useState(false);

    const [ttl, setTtl] = useState(TTL_OPTIONS.at(-1)?.value || 24 * 60 * 60);
    const [linkNum, setLinkNum] = useState(1);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);

    const [error, setError] = useState(false);
    const [isShaking, setIsShaking] = useState(false);

    const [resultLinks, setResultLinks] = useState<string[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    useEffect(() => {
        setInresult(resultLinks.length > 0)
    }, [resultLinks])

    const handleCreate = async () => {
        if (!content.trim()) {
            setError(true);
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            return;
        }
        setIsLoading(true);
        setLoadingStep(0);
        setResultLinks([]);

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        try {
            // Start encryption and uploading in background
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

            // Step 1: Generating key (fixed duration)
            await sleep(LOADING_STEPS[0].duration);

            // Step 2: Encrypting (fixed duration)
            setLoadingStep(1);
            await sleep(LOADING_STEPS[1].duration);

            // Step 3: Uploading (wait for API, minimum duration)
            setLoadingStep(2);
            const uploadStart = Date.now();
            const results = await apiPromise; // Wait for API to complete
            const uploadElapsed = Date.now() - uploadStart;
            await sleep(Math.max(0, LOADING_STEPS[2].duration - uploadElapsed));

            // Step 4: All set! (success message)
            setLoadingStep(3);
            await sleep(LOADING_STEPS[3].duration);

            setResultLinks(results);
            setContent("");
        } catch (err) {
            console.error(err);
            alert("Error creating link.");
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
        setCopiedIndex(999); // 999 marks "All"
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-3">
            {resultLinks.length > 0 ? (
                <>
                    <div className="bg-black border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium tracking-wide">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Links Generated</span>
                            </div>
                            <div className="text-xs text-zinc-500 font-mono">
                                Expires in {TTL_OPTIONS.find(t => t.value === ttl)?.label}
                            </div>
                        </div>

                        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                            {resultLinks.map((link, idx) => (
                                <div key={idx} className="relative group">
                                    {resultLinks.length > 1 && (
                                        <div className="text-[10px] text-zinc-600 mb-1 font-mono uppercase tracking-wider">Link {idx + 1}</div>
                                    )}
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
                                            {copiedIndex === idx
                                                ? <Check className="w-3.5 h-3.5" />
                                                : <Copy className="w-3.5 h-3.5" />
                                            }
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
                                        "w-full py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center transition-colors cursor-pointer",
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
                        className="w-full text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer underline underline-offset-4 decoration-zinc-700 hover:decoration-zinc-500"
                    >
                        Make Another
                    </button>
                </>
            ) : (
                <div className="space-y-6">
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-br from-zinc-800/30 to-zinc-900/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                        <div className="relative">
                            <textarea
                                value={content}
                                onChange={(e) => {
                                    setContent(e.target.value);
                                    if (error) setError(false);
                                }}
                                placeholder="Shh! Enter something or upload a file..."
                                className={cn(
                                    "relative w-full h-40 bg-black text-zinc-300 p-5 pr-14 rounded-2xl border focus:outline-none focus:ring-4 resize-none placeholder:text-zinc-600 text-base font-mono leading-relaxed shadow-sm transition-all no-scrollbar",
                                    error
                                        ? "border-zinc-600 focus:border-zinc-500 focus:ring-zinc-700/20"
                                        : "border-zinc-800 focus:border-zinc-500/50 focus:ring-zinc-500/10",
                                    isShaking && "animate-shake"
                                )}
                                spellCheck={false}
                            />
                            {!content && (
                                <button
                                    type="button"
                                    className="absolute bottom-3 right-3 p-2.5 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/50 rounded-lg transition-all cursor-pointer group/upload"
                                    title="Upload file"
                                >
                                    <Upload className="w-4.5 h-4.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Configuration Bar */}
                    <div className="flex gap-4">
                        {/* TTL Selector (Dropdown) */}
                        <div className="space-y-2 w-24">
                            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider pl-1">
                                <Clock className="w-3 h-3" />
                                <span>Expires</span>
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
                                                onClick={() => {
                                                    setTtl(opt.value);
                                                    setIsTtlOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer hover:bg-zinc-800",
                                                    ttl === opt.value ? "text-white bg-zinc-800/50 font-medium" : "text-zinc-400"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Quantity Selector */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider pl-1">
                                <Link2 className="w-3 h-3" />
                                <span>Links</span>
                            </div>
                            <div className="flex bg-black p-1 rounded-lg border border-zinc-800 w-fit h-8.5">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => setLinkNum(num)}
                                        className={cn(
                                            "w-8 h-full flex items-center justify-center rounded-md text-xs font-medium transition-all cursor-pointer",
                                            linkNum === num
                                                ? "bg-zinc-800 text-white shadow-sm"
                                                : "text-zinc-600 hover:text-zinc-400",
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

                    {/* Action Button */}
                    <button
                        onClick={handleCreate}
                        disabled={isLoading}
                        className="h-14 group w-full py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-zinc-500/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:opacity-50 hover:opacity-90 active:scale-[0.99] cursor-pointer"
                    >
                        {isLoading ? (
                            <div className="flex items-center space-x-2">
                                {(() => {
                                    const Icon = LOADING_STEPS[loadingStep].icon;
                                    return <Icon className="w-5 h-5 animate-pulse" />;
                                })()}
                                <span className="font-medium">
                                    {LOADING_STEPS[loadingStep].text}
                                </span>
                            </div>
                        ) : (
                            <span>
                                {`Create Secret Link${linkNum > 1 ? "s" : ""}`}
                            </span>
                        )}
                    </button>
                </div>


            )}
        </div>
    );
}

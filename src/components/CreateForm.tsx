"use client";

import { useState } from "react";
import { generateKey, encryptData } from "@/lib/crypto";
import { Copy, Check, Loader2, Link2, Clock, ShieldCheck, Terminal, ChevronDown, AlertCircle, Upload } from "lucide-react";
import { cn, copyToClipboard as copyText } from "@/lib/utils";

const TTL_OPTIONS = [
    { label: "10 min", value: 10 * 60 },
    { label: "30 min", value: 30 * 60 },
    { label: "60 min", value: 60 * 60 },
    { label: "12 hr", value: 12 * 60 * 60 },
    { label: "24 hr", value: 24 * 60 * 60 },
];

export default function CreateForm() {
    const [content, setContent] = useState("");
    const [ttl, setTtl] = useState(86400); // Default 1 Day
    const [maxViews, setMaxViews] = useState(1); // Recipients
    const [isLoading, setIsLoading] = useState(false);
    const [isDrmEnabled, setIsDrmEnabled] = useState(false);
    const [isTtlOpen, setIsTtlOpen] = useState(false);
    const [error, setError] = useState(false);

    // 结果可能是多个链接
    const [resultLinks, setResultLinks] = useState<string[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleCreate = async () => {
        if (!content.trim()) {
            setError(true);
            return;
        }
        setIsLoading(true);
        setResultLinks([]);

        try {
            // 批量生成逻辑：循环调用 (对于少量生成，并行请求即可)
            const promises = Array.from({ length: maxViews }).map(async () => {
                const key = await generateKey();
                const encrypted = await encryptData(JSON.stringify({ text: content, drm: isDrmEnabled }), key);

                const res = await fetch("/api/burn", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ encryptedContent: encrypted, ttl: ttl }),
                });

                if (!res.ok) throw new Error("Failed");
                const { id } = await res.json();
                return `${window.location.origin}/s/${id}#${key}`;
            });

            const results = await Promise.all(promises);
            setResultLinks(results);
            setContent("");
        } catch (err) {
            console.error(err);
            alert("Error creating secrets.");
        } finally {
            setIsLoading(false);
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
        <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {resultLinks.length > 0 ? (
                /* --- 结果页 UI --- */
                <div className="bg-black border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-zinc-900/30 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-zinc-200">
                            <ShieldCheck className="w-5 h-5 text-white" />
                            <span className="font-semibold text-sm">Secret Links Ready</span>
                        </div>
                        <div className="text-xs text-zinc-400 font-mono">
                            Exp: {TTL_OPTIONS.find(t => t.value === ttl)?.label}
                        </div>
                    </div>

                    {/* Links List */}
                    <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                        {resultLinks.map((link, idx) => (
                            <div key={idx} className="flex items-center p-2 hover:bg-zinc-900/50 rounded-lg group transition-colors">
                                <div className="flex-1 min-w-0 mr-4">
                                    {resultLinks.length > 1 && (
                                        <div className="text-xs text-zinc-400 mb-0.5 ml-1">Link #{idx + 1}</div>
                                    )}
                                    <input
                                        readOnly
                                        value={link}
                                        onClick={(e) => e.currentTarget.select()}
                                        className="w-full bg-transparent text-sm font-mono text-zinc-400 focus:text-zinc-200 focus:outline-none cursor-pointer truncate no-scrollbar"
                                    />
                                </div>
                                <button
                                    onClick={() => copyToClipboard(link, idx)}
                                    className={cn(
                                        "p-2 rounded-md transition-all cursor-pointer",
                                        copiedIndex === idx
                                            ? "bg-zinc-800 text-white"
                                            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                                    )}
                                >
                                    {copiedIndex === idx ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/20 flex flex-col gap-3">
                        {resultLinks.length > 1 && (
                            <button
                                onClick={copyAll}
                                className={cn(
                                    "w-full py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer",
                                    copiedIndex === 999
                                        ? "bg-white text-black"
                                        : "bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                                )}
                            >
                                {copiedIndex === 999 ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                <span>{copiedIndex === 999 ? "All Copied" : "Copy All"}</span>
                            </button>
                        )}
                        <button
                            onClick={() => { setResultLinks([]); setCopiedIndex(null); }}
                            className="w-full px-4 py-2.5 rounded-xl font-medium text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors cursor-pointer"
                        >
                            Create New
                        </button>
                    </div>
                </div>
            ) : (
                /* --- 输入页 UI --- */
                <div className="space-y-6">
                    {/* Main Input */}
                    <div className="relative group space-y-2">
                        <div className="absolute -inset-0.5 bg-gradient-to-br from-zinc-800/30 to-zinc-900/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                        <div className="relative">
                            <textarea
                                value={content}
                                onChange={(e) => {
                                    setContent(e.target.value);
                                    if (error) setError(false);
                                }}
                                placeholder="Secrets go here..."
                                className={cn(
                                    "relative w-full h-40 bg-black text-zinc-300 p-5 pr-14 rounded-2xl border focus:outline-none focus:ring-4 resize-none placeholder:text-zinc-600 text-base font-mono leading-relaxed shadow-sm transition-all no-scrollbar",
                                    error
                                        ? "border-zinc-600 focus:border-zinc-500 focus:ring-zinc-700/20"
                                        : "border-zinc-800 focus:border-zinc-500/50 focus:ring-zinc-500/10"
                                )}
                                spellCheck={false}
                            />
                            <button
                                type="button"
                                className="absolute bottom-3 right-3 p-2.5 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/50 rounded-lg transition-all cursor-pointer group/upload"
                                title="Upload file"
                            >
                                <Upload className="w-4.5 h-4.5" />
                            </button>
                        </div>
                        {error && (
                            <div className="flex items-center justify-end space-x-1.5 text-zinc-400 animate-in fade-in slide-in-from-bottom-1 duration-200">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span className="text-xs">Please enter some content</span>
                            </div>
                        )}
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
                                    className="w-full h-8.5 flex items-center justify-between px-3 bg-black border border-zinc-800 rounded-lg text-xs text-zinc-300 hover:border-zinc-600 transition-colors cursor-pointer"
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

                        {/* DRM Toggle */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider pl-1">
                                <ShieldCheck className="w-3 h-3" />
                                <span>DRM</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsDrmEnabled(!isDrmEnabled)}
                                className={cn(
                                    "h-8.5 flex items-center justify-between px-3 rounded-lg border transition-all cursor-pointer w-24",
                                    isDrmEnabled
                                        ? "bg-zinc-900/50 border-zinc-700"
                                        : "bg-black border-zinc-800 hover:border-zinc-700"
                                )}
                            >
                                <span className={cn("text-xs font-medium transition-colors", isDrmEnabled ? "text-white" : "text-zinc-500")}>
                                    {isDrmEnabled ? "ON" : "OFF"}
                                </span>
                                <div className={cn(
                                    "w-8 h-5 rounded-full relative transition-colors",
                                    isDrmEnabled ? "bg-white" : "bg-zinc-800"
                                )}>
                                    <div className={cn(
                                        "absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform bg-black",
                                        isDrmEnabled ? "translate-x-3" : "translate-x-0"
                                    )} />
                                </div>
                            </button>
                        </div>


                        {/* Quantity Selector */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider pl-1">
                                <Link2 className="w-3 h-3" />
                                <span>Links</span>
                            </div>
                            <div className="flex bg-black p-1 rounded-lg border border-zinc-800 w-fit h-8.5">
                                {[1, 2, 3].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => setMaxViews(num)}
                                        className={cn(
                                            "w-8 h-full flex items-center justify-center rounded-md text-xs font-medium transition-all cursor-pointer",
                                            maxViews === num
                                                ? "bg-zinc-800 text-white shadow-sm"
                                                : "text-zinc-600 hover:text-zinc-400"
                                        )}
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
                        className="group w-full py-4 bg-white hover:bg-zinc-200 text-black font-bold text-lg rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-zinc-500/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:opacity-50 hover:opacity-90 active:scale-[0.99] cursor-pointer"
                    >
                        {isLoading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <Terminal className="w-5 h-5 text-zinc-500 group-hover:text-black transition-colors" />
                                <span>
                                    {maxViews > 1 ? `Create ${maxViews} Secret Links` : "Create Secret Link"}
                                </span>
                            </>
                        )}
                    </button>
                </div>


            )}
        </div>
    );
}

"use client";

import { useState } from "react";
import { generateKey, encryptData } from "@/lib/crypto";
import { Copy, Check, Sparkles, Loader2, Link2, Clock, Users, ShieldCheck, Download } from "lucide-react";
import clsx from "clsx";

// 你的指定时间选项
const TTL_OPTIONS = [
    { label: "10 Min", value: 600 },
    { label: "1 Hour", value: 3600 },
    { label: "4 Hours", value: 14400 },
    { label: "12 Hours", value: 43200 },
    { label: "1 Day", value: 86400 },
];

export default function CreateForm() {
    const [content, setContent] = useState("");
    const [ttl, setTtl] = useState(3600); // 默认 1小时
    const [maxViews, setMaxViews] = useState(1); // 批量生成数量 (其实是生成多个独立链接)
    const [isLoading, setIsLoading] = useState(false);

    // 结果可能是多个链接
    const [resultLinks, setResultLinks] = useState<string[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleBurn = async () => {
        if (!content.trim()) return;
        setIsLoading(true);
        setResultLinks([]);

        try {
            const links: string[] = [];

            // 批量生成逻辑：循环调用 (对于少量生成，并行请求即可)
            const promises = Array.from({ length: maxViews }).map(async () => {
                const key = await generateKey();
                const encrypted = await encryptData(JSON.stringify({ text: content }), key);

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
        navigator.clipboard.writeText(link);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const copyAll = () => {
        const text = resultLinks.join("\n");
        navigator.clipboard.writeText(text);
        setCopiedIndex(999); // 999 marks "All"
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {resultLinks.length > 0 ? (
                /* --- 结果页 UI --- */
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-zinc-800 dark:text-zinc-200">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <span className="font-semibold text-sm">Secret Links Ready</span>
                        </div>
                        <div className="text-xs text-zinc-400 font-mono">
                            Exp: {TTL_OPTIONS.find(t => t.value === ttl)?.label}
                        </div>
                    </div>

                    {/* Links List */}
                    <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                        {resultLinks.map((link, idx) => (
                            <div key={idx} className="flex items-center p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg group transition-colors">
                                <div className="flex-1 min-w-0 mr-4">
                                    <div className="text-xs text-zinc-400 mb-0.5 ml-1">Link #{idx + 1}</div>
                                    <input
                                        readOnly
                                        value={link}
                                        onClick={(e) => e.currentTarget.select()}
                                        className="w-full bg-transparent text-sm font-mono text-zinc-600 dark:text-zinc-300 focus:outline-none cursor-pointer truncate"
                                    />
                                </div>
                                <button
                                    onClick={() => copyToClipboard(link, idx)}
                                    className={clsx(
                                        "p-2 rounded-md transition-all",
                                        copiedIndex === idx
                                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                                            : "text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                    )}
                                >
                                    {copiedIndex === idx ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/20 flex gap-3">
                        <button
                            onClick={copyAll}
                            className={clsx(
                                "flex-1 py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center space-x-2 transition-all",
                                copiedIndex === 999
                                    ? "bg-emerald-500 text-white"
                                    : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black hover:opacity-90"
                            )}
                        >
                            {copiedIndex === 999 ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedIndex === 999 ? "All Copied" : "Copy All"}</span>
                        </button>
                        <button
                            onClick={() => { setResultLinks([]); setCopiedIndex(null); }}
                            className="px-4 py-2.5 rounded-xl font-medium text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Create New
                        </button>
                    </div>
                </div>
            ) : (
                /* --- 输入页 UI --- */
                <div className="space-y-6">
                    {/* Main Input */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-br from-zinc-200 to-zinc-400 dark:from-zinc-700 dark:to-zinc-800 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Paste sensitive data here (Passwords, Nodes, Keys)..."
                            className="relative w-full h-40 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-800 resize-none placeholder:text-zinc-400 text-base font-mono leading-relaxed shadow-sm transition-all"
                            spellCheck={false}
                        />
                    </div>

                    {/* Configuration Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* TTL Selector */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider pl-1">
                                <Clock className="w-3 h-3" />
                                <span>Validity (TTL)</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {TTL_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setTtl(opt.value)}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                                            ttl === opt.value
                                                ? "bg-zinc-800 dark:bg-zinc-200 text-white dark:text-black border-zinc-800 dark:border-zinc-200 shadow-md"
                                                : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider pl-1">
                                <Users className="w-3 h-3" />
                                <span>Recipients (Links)</span>
                            </div>
                            <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 w-fit">
                                {[1, 2, 3, 5].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => setMaxViews(num)}
                                        className={clsx(
                                            "w-8 h-7 flex items-center justify-center rounded-md text-xs font-medium transition-all",
                                            maxViews === num
                                                ? "bg-zinc-100 dark:bg-zinc-700 text-black dark:text-white shadow-sm"
                                                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                        )}
                                    >
                                        {num}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleBurn}
                        disabled={isLoading || !content}
                        className="group w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-lg rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-xl shadow-zinc-900/10 dark:shadow-white/5 active:scale-[0.99]"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 text-zinc-400 group-hover:text-yellow-400 transition-colors" />
                                <span>
                                    {maxViews > 1 ? `Create ${maxViews} Secret Links` : "Create Secret Link"}
                                </span>
                            </>
                        )}
                    </button>

                    <div className="text-center">
                        <p className="text-xs text-zinc-400 dark:text-zinc-600">
                            Data is encrypted locally. Server knows nothing.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
    ArrowRight,
    Check,
    Copy,
    Download,
    EyeOff,
    FileText,
    Image as ImageIcon,
    Loader2,
    LockOpen,
    Music,
    ShieldPlus,
    Video,
} from "lucide-react";
import { decryptData } from "@/lib/crypto";
import { copyToClipboard as copyText, downloadTextFile, triggerDownload } from "@/lib/utils";
import { BurnResponse } from "@/app/api/burn/route";
import { SecretTypes } from "@/lib/constants";
import { PageBackdrop, SiteHeader } from "@/components/SiteChrome";

interface DecryptedFile {
    fileName: string;
    fileType: string;
    fileData: string;
}

const REVEAL_MINIMUM_MS = 320;

export default function ViewSecretPage({ params }: { params: Promise<{ id: string }> }) {
    const shouldReduceMotion = useReducedMotion();
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

    useEffect(() => {
        if (window.location.hash) {
            setUrlKey(window.location.hash.substring(1));
        }
        setIsHashChecked(true);
    }, []);

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith("image/")) return ImageIcon;
        if (mimeType.startsWith("video/")) return Video;
        if (mimeType.startsWith("audio/")) return Music;
        return FileText;
    };

    const handleBurn = async () => {
        if (!isHashChecked) return;
        const key = urlKey || inputKey;

        if (!key) {
            setStatus("error");
            setErrorMsg("A decryption key is required.");
            return;
        }

        setStatus("loading");
        const startedAt = Date.now();

        try {
            const response = await fetch("/api/burn", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (response.status === 404) throw new Error("This secret has already been opened or has expired.");
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Unable to retrieve this secret.");
            }

            const payload = await response.json() as BurnResponse;
            const decryptedContent = await decryptData(payload.data, payload.iv, key);
            if (!decryptedContent) throw new Error("The decrypted secret was empty.");

            setSecretType(payload.secretType);
            if (payload.secretType === SecretTypes.FILE) {
                setSecretFile(JSON.parse(decryptedContent) as DecryptedFile);
            } else {
                setSecretContent(decryptedContent);
            }

            if (!shouldReduceMotion) {
                const remaining = Math.max(0, REVEAL_MINIMUM_MS - (Date.now() - startedAt));
                await new Promise((resolve) => setTimeout(resolve, remaining));
            }
            setStatus("success");
        } catch (error: unknown) {
            console.error(error);
            setStatus("error");
            setErrorMsg(error instanceof Error ? error.message : "Unable to open this secret.");
        }
    };

    const copyContent = () => {
        copyText(secretContent);
        setIsCopied(true);
        window.setTimeout(() => setIsCopied(false), 2000);
    };

    const downloadContent = () => {
        if (secretType === SecretTypes.FILE && secretFile) {
            triggerDownload(secretFile.fileData, secretFile.fileName);
        } else {
            downloadTextFile(secretContent, `secret-${id}.txt`);
        }
    };

    return (
        <main className="relative flex min-h-[100svh] flex-col overflow-x-hidden bg-[var(--app-bg)] text-[var(--app-text)]">
            <PageBackdrop />
            <SiteHeader subtle={status !== "idle"} />

            <section className="safe-page-gutters safe-page-bottom relative z-10 mx-auto flex w-full max-w-xl flex-1 items-start justify-center pt-4 sm:pt-9 lg:items-center lg:py-12">
                <div className="w-full">
                    {(status === "idle" || status === "loading") && (
                        <motion.section
                            initial={{ y: shouldReduceMotion ? 0 : 8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: "easeOut" }}
                            className="app-surface rounded-2xl p-5 text-center sm:p-7"
                            aria-busy={status === "loading"}
                        >
                            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-text-soft)]">
                                <EyeOff className="h-5 w-5" />
                            </span>

                            <h1 className="mt-5 text-2xl font-semibold tracking-[-0.035em] text-[var(--app-text)] sm:text-[28px]">
                                Reveal one-time secret
                            </h1>
                            <p className="mx-auto mt-2 text-sm leading-6 text-[var(--app-muted)] sm:whitespace-nowrap">
                                Opening it permanently deletes the encrypted data from the server.
                            </p>

                            {!urlKey && isHashChecked && (
                                <div className="mt-6 text-left">
                                    <label htmlFor="decryption-key" className="mb-2 block text-xs font-medium text-[var(--app-text-soft)]">
                                        Decryption key
                                    </label>
                                    <input
                                        id="decryption-key"
                                        value={inputKey}
                                        onChange={(event) => setInputKey(event.target.value)}
                                        placeholder="Enter decryption key"
                                        autoComplete="off"
                                        autoCapitalize="none"
                                        spellCheck={false}
                                        className="control-surface field-control h-12 w-full rounded-xl px-4 text-center font-mono text-sm text-[var(--app-text)] placeholder:text-[var(--app-muted-dim)]"
                                    />
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleBurn}
                                className="primary-action mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={status === "loading" || (!urlKey && !inputKey.trim())}
                            >
                                {status === "loading" ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Decrypting…</span>
                                    </>
                                ) : (
                                    <>
                                        <LockOpen className="h-4 w-4" />
                                        <span>Reveal secret</span>
                                    </>
                                )}
                            </button>
                        </motion.section>
                    )}

                    {status === "success" && (
                        <motion.section
                            initial={{ y: shouldReduceMotion ? 0 : 8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: "easeOut" }}
                            className="app-surface overflow-hidden rounded-2xl"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--app-border)] px-5 py-4 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-text-soft)]">
                                        <LockOpen className="h-4 w-4" />
                                    </span>
                                    <h1 className="text-sm font-medium text-[var(--app-text)]">Secret decrypted</h1>
                                </div>
                                <span className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-2 py-1 text-xs text-[var(--app-muted-dim)]">
                                    Deleted from server
                                </span>
                            </div>

                            <div className="space-y-3 p-4 sm:p-5">
                                {secretType === SecretTypes.TEXT && (
                                    <>
                                        <pre className="control-surface min-h-48 max-h-[48svh] w-full overflow-y-auto whitespace-pre-wrap break-words rounded-xl p-4 font-mono text-sm leading-6 text-[var(--app-text)] sm:p-5">
                                            {secretContent}
                                        </pre>
                                        <div className="grid grid-cols-[1fr_3rem] gap-2">
                                            <button
                                                type="button"
                                                onClick={copyContent}
                                                className="primary-action flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium"
                                            >
                                                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                <span>{isCopied ? "Copied" : "Copy secret"}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={downloadContent}
                                                className="focus-ring control-surface flex h-12 w-12 items-center justify-center rounded-xl text-[var(--app-muted-dim)] transition-colors hover:text-[var(--app-text)]"
                                                aria-label="Download secret as a text file"
                                            >
                                                <Download className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </>
                                )}

                                {secretType === SecretTypes.FILE && secretFile && (
                                    <>
                                        <div className="control-surface flex min-h-52 flex-col items-center justify-center gap-4 rounded-xl p-6 text-center">
                                            <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-text-soft)]">
                                                {(() => {
                                                    const Icon = getFileIcon(secretFile.fileType);
                                                    return <Icon className="h-6 w-6" />;
                                                })()}
                                            </span>
                                            <div className="w-full min-w-0">
                                                <p className="truncate px-3 text-sm font-medium text-[var(--app-text)]" title={secretFile.fileName}>{secretFile.fileName}</p>
                                                <p className="mt-1 text-xs text-[var(--app-muted-dim)]">{secretFile.fileType || "Unknown file type"}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={downloadContent}
                                            className="primary-action flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium"
                                        >
                                            <Download className="h-4 w-4" />
                                            <span>Download file</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.section>
                    )}

                    {status === "success" && (
                        <Link
                            href="/"
                            className="focus-ring mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 text-sm text-[var(--app-muted-dim)] transition-colors hover:border-[var(--app-muted-dim)] hover:text-[var(--app-text)]"
                        >
                            <ShieldPlus className="h-4 w-4" />
                            <span>Secure another secret</span>
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    )}

                    {status === "error" && (
                        <motion.section
                            initial={{ y: shouldReduceMotion ? 0 : 8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="app-surface rounded-2xl p-5 text-center sm:p-7"
                        >
                            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-muted-dim)]">
                                <EyeOff className="h-5 w-5" />
                            </span>
                            <h1 className="mt-5 text-xl font-semibold text-[var(--app-text)]">Secret unavailable</h1>
                            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--app-muted)]">{errorMsg}</p>
                            <Link
                                href="/"
                                className="primary-action mt-6 flex min-h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-medium"
                            >
                                Create a new secret
                            </Link>
                        </motion.section>
                    )}
                </div>
            </section>
        </main>
    );
}

import { ExternalLink, ShieldAlert } from "lucide-react";
import { BrandLink, PageBackdrop } from "@/components/SiteChrome";

export default function WeChatIntercept() {
    return (
        <main className="relative min-h-[100svh] overflow-x-hidden bg-[var(--app-bg)] text-[var(--app-text)]">
            <PageBackdrop />

            <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-lg flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-8 sm:pb-8 sm:pt-6">
                <header className="flex items-start justify-between gap-4">
                    <BrandLink subtle />

                    <div className="flex shrink-0 flex-col items-end gap-1.5 pt-1" aria-hidden="true">
                        <ExternalLink className="h-7 w-7 rotate-[-15deg] text-[var(--app-text-soft)]" />
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--app-muted)]">Tap here</p>
                    </div>
                </header>

                <section className="my-auto w-full py-8 text-center sm:py-12">
                    <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                        <div className="pointer-events-none absolute inset-0 rounded-full bg-[var(--app-border)] blur-2xl" />
                        <div className="control-surface relative flex h-20 w-20 items-center justify-center rounded-[24px]">
                            <ShieldAlert className="h-9 w-9 text-[var(--app-text-soft)]" />
                        </div>
                    </div>

                    <div className="mt-7 space-y-3">
                        <h1 className="text-2xl font-bold tracking-tight text-[var(--app-text)]">
                            Security Intercept
                        </h1>
                        <div className="space-y-1 text-sm leading-6 text-[var(--app-muted)]">
                            <p>This link contains a secure, one-time secret.</p>
                            <p>WeChat&apos;s built-in browser is not secure enough.</p>
                        </div>
                    </div>

                    <div className="my-7 h-px w-full bg-gradient-to-r from-transparent via-[var(--app-border)] to-transparent" />

                    <div className="app-surface rounded-2xl p-4 text-left sm:p-5">
                        <div className="flex items-center gap-3.5">
                            <div className="control-surface flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[var(--app-text-soft)]">
                                1
                            </div>
                            <p className="text-sm leading-6 text-[var(--app-text-soft)]">
                                Tap the menu icon <span className="text-[var(--app-muted)]">(•••)</span> in the top right corner.
                            </p>
                        </div>
                        <div className="ml-[1.3rem] h-4 w-px bg-[var(--app-border)]" />
                        <div className="flex items-center gap-3.5">
                            <div className="control-surface flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[var(--app-text-soft)]">
                                2
                            </div>
                            <p className="text-sm leading-6 text-[var(--app-text-soft)]">
                                Select <span className="font-medium text-[var(--app-text)]">Open in Browser</span> to decrypt.
                            </p>
                        </div>
                    </div>
                </section>

                <footer className="pt-6 text-center">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--app-muted-dim)]">
                        One-Look Security
                    </span>
                </footer>
            </div>
        </main>
    );
}

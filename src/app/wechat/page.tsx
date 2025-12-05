import Image from "next/image";
import { ExternalLink, ShieldAlert } from "lucide-react";

export default function WeChatIntercept() {
    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center p-6 bg-[#050505] text-zinc-200 overflow-hidden select-none">

            {/* Background Grid */}
            <div className="absolute inset-0 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none"
            >
            </div>

            {/* Top Right Arrow Animation */}
            <div className="absolute top-4 right-6 z-50">
                <div className="flex flex-col items-end gap-2">
                    <ExternalLink className="w-8 h-8 text-zinc-400 rotate-[-15deg]" />
                    <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Tap here</p>
                </div>
            </div>

            <div className="z-10 w-full max-w-md space-y-8 text-center">

                {/* Icon */}
                <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 bg-zinc-800/30 rounded-full blur-2xl animate-pulse"></div>
                    <div className="relative bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl">
                        <ShieldAlert className="w-10 h-10 text-zinc-400" />
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-4 select-none">
                    <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
                        Security Intercept
                    </h1>
                    <div className="space-y-1 text-sm text-zinc-500 leading-relaxed px-4">
                        <p>This link contains a secure, one-time secret.</p>
                        <p>WeChat’s built-in browser is not secure enough.</p>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent my-8" />

                {/* Instruction */}
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 mx-4 backdrop-blur-sm">
                    <div className="flex items-center gap-4 text-left">
                        <div className="flex-shrink-0 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-bold text-xs">
                            1
                        </div>
                        <p className="text-sm text-zinc-400">Tap the menu icon <span className="text-zinc-600">(•••)</span> in the top right corner.</p>
                    </div>
                    <div className="w-0.5 h-4 bg-zinc-800 ml-4 my-1"></div>
                    <div className="flex items-center gap-4 text-left">
                        <div className="flex-shrink-0 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-bold text-xs">
                            2
                        </div>
                        <p className="text-sm text-zinc-400">Select <span className="text-zinc-200 font-medium">Open in Browser</span> to decrypt.</p>
                    </div>
                </div>

            </div>

            {/* Footer */}
            <div className="absolute bottom-8 left-0 right-0 text-center opacity-30 pointer-events-none flex items-center justify-center gap-2 select-none">
                <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-400">One-Look Security</span>
            </div>
        </main>
    );
}
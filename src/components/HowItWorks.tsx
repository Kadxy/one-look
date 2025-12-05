"use client";

import { X, Shield, Key, Flame, Eye } from "lucide-react";
import { useEffect, useState } from "react";

export default function HowItWorks({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) setVisible(true);
        else setTimeout(() => setVisible(false), 300);
    }, [isOpen]);

    if (!visible && !isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Content */}
            <div className={`relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl transform transition-all duration-300 ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}>
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-zinc-200 transition-colors rounded-full hover:bg-zinc-800"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold mb-2 text-zinc-100">Why One-Look is Secure</h2>
                <p className="text-zinc-400 mb-8">We can't see your secrets even if we wanted to.</p>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-200">
                            <Key className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-zinc-200">Encryption happens locally</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            A random key is generated in your browser. Your secret is encrypted <strong>before</strong> it ever leaves your device.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-200">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-zinc-200">We don't have the key</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            The decryption key is part of the URL (after the #). It is <strong>never</strong> sent to our servers. We store only the encrypted blob.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-200">
                            <Flame className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-zinc-200">True "Burn"</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Once the secret is retrieved, it is <strong>atomically deleted</strong> from the database. There are no backups.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-200">
                            <Eye className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-zinc-200">Open Source</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Don't trust us? Verify the code yourself on GitHub. Transparent security is the only real security.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
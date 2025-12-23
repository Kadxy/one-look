import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const getRedisKey = (key: string) => {
    const _PREFIX = "onelook"
    return [_PREFIX, key].join(":");
}

/**
 * Merges class names
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export async function copyToClipboard(text: string): Promise<boolean> {
    if (!navigator?.clipboard) {
        console.warn("Clipboard not supported");
        return false;
    }
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.warn("Copy failed", error);
        return false;
    }
}

export function downloadTextFile(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, filename);
    URL.revokeObjectURL(url);
}

export function triggerDownload(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export const getShareLink = (id: string, hash: string, sharePath = 's') => {
    return `${window.location.origin}/${sharePath}/${id}#${hash}`;
}

/**
 * Creates a glitch effect by progressively replacing characters with random symbols
 * @param text The original text to glitch
 * @param onUpdate Callback with the current glitched text
 * @param duration Total duration in milliseconds (default 500ms)
 * @returns A cleanup function to stop the animation
 */
export function glitchText(
    text: string,
    onUpdate: (glitchedText: string) => void,
    duration = 500
): () => void {
    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789';
    const intervalMs = 30;
    const totalSteps = duration / intervalMs;
    let step = 0;
    
    const interval = setInterval(() => {
        step++;
        const progress = step / totalSteps;
        
        // Generate glitched text with increasing randomness
        const glitched = text
            .split('')
            .map((char) => {
                if (char === ' ' || char === '\n') return char;
                // Higher chance of random char as progress increases
                if (Math.random() < 0.6 + progress * 0.4) {
                    return glitchChars[Math.floor(Math.random() * glitchChars.length)];
                }
                return char;
            })
            .join('');
        
        onUpdate(glitched);
        
        if (step >= totalSteps) {
            clearInterval(interval);
        }
    }, intervalMs);
    
    return () => clearInterval(interval);
}
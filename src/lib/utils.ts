import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 1. Generate random key (AES-256)
export async function generateKey(): Promise<string> {
    const key = await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
    const exported = await window.crypto.subtle.exportKey("raw", key);
    return arrayBufferToBase64(exported);
}

// 2. Encrypt data
export async function encryptData(content: string, keyStr: string) {
    const key = await importKey(keyStr);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // GCM standard IV length
    const encodedContent = new TextEncoder().encode(content);

    const encryptedContent = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encodedContent
    );

    return {
        iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
        data: arrayBufferToBase64(encryptedContent)
    };
}

// 3. Decrypt data
export async function decryptData(encryptedData: string, ivStr: string, keyStr: string) {
    try {
        const key = await importKey(keyStr);
        const iv = base64ToArrayBuffer(ivStr);
        const data = base64ToArrayBuffer(encryptedData);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            data
        );
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error("Decryption failed", e);
        throw new Error("Decryption failed: invalid key or data corrupted");
    }
}

async function importKey(base64Key: string): Promise<CryptoKey> {
    const keyBuffer = base64ToArrayBuffer(base64Key);
    return window.crypto.subtle.importKey(
        "raw",
        keyBuffer,
        "AES-GCM",
        true,
        ["encrypt", "decrypt"]
    );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    // Replace with URL-safe characters and remove trailing =
    return window.btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    let safeBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');
    while (safeBase64.length % 4) {
        safeBase64 += '=';
    }
    const binary_string = window.atob(safeBase64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}
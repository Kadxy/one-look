// 1. 生成随机密钥 (AES-256)
export async function generateKey(): Promise<string> {
    const key = await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
    const exported = await window.crypto.subtle.exportKey("raw", key);
    return arrayBufferToBase64(exported);
}

// 2. 加密数据
// content: 明文 (JSON string)
// keyStr: Base64 格式的密钥
export async function encryptData(content: string, keyStr: string) {
    const key = await importKey(keyStr);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // GCM 标准 IV 长度
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

// 3. 解密数据
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
        throw new Error("Decryption failed"); // 可能是密钥错，也可能是数据坏了
    }
}

// --- 内部工具函数 ---

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

// ArrayBuffer 转 Base64 (URL Safe)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    // 替换成 URL 安全字符，并去掉末尾的 =
    return window.btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Base64 转 ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    // 还原 URL 安全字符
    let safeBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');
    // 补全 padding
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
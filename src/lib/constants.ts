export const TTL_OPTIONS = [
    { label: "10 min", value: 10 * 60 },
    { label: "30 min", value: 30 * 60 },
    { label: "60 min", value: 60 * 60 },
    { label: "12 hr", value: 12 * 60 * 60 },
    { label: "24 hr", value: 24 * 60 * 60 },
];

export enum SecretTypes {
    TEXT = "text",
    FILE = "file"
}

// Maximum file upload size in bytes
// Can be configured via NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB environment variable (in MB)
// Default: 3MB
export const MAX_FILE_SIZE = (() => {
    const envValue = process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB;
    const parsed = envValue ? parseFloat(envValue) : NaN;
    const sizeInMB = !isNaN(parsed) ? parsed : 3;
    return Math.max(1, sizeInMB) * 1024 * 1024;
})();
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
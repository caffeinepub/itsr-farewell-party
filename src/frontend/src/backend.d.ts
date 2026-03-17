import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface MediaEntry {
    id: string;
    title: string;
    file: ExternalBlob;
    group: string;
    timestamp: bigint;
    mediaType: MediaType;
}
export interface UserProfile {
    name: string;
}
export enum MediaType {
    video = "video",
    photo = "photo"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addMedia(title: string, mediaType: MediaType, file: ExternalBlob, group: string): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimFirstAdmin(): Promise<boolean>;
    deleteMedia(id: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMedia(id: string): Promise<MediaEntry>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isAdminClaimed(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    listMedia(): Promise<Array<MediaEntry>>;
    resetAdmin(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}

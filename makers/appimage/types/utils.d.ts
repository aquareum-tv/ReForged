/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import EventEmitter from "events";
import { Mode } from "fs";
import type { MakerOptions } from "@electron-forge/maker-base";
import type { SemVer } from "semver";
type AppImageArch = "x86_64" | "aarch64" | "armhf" | "i686";
export type ForgeArch = "x64" | "arm64" | "armv7l" | "ia32" | "mips64el" | "universal";
type ModeFunction = (source: string, destination: string) => Mode | Promise<Mode>;
export interface MakerMeta extends MakerOptions {
    targetArch: ForgeArch;
}
interface ImageMetadata {
    type: "PNG" | "SVG" | "XPM3" | "XPM2";
    width: number | null;
    height: number | null;
}
/** Function argument definitions for {@linkcode mkSqFsEvt}. */
interface mkSqFSListenerArgs {
    close: [
        /** A returned code when process normally exits. */
        code: number | null,
        /** A signal which closed the process. */
        signal: NodeJS.Signals | null,
        /** A message printed to STDERR, if available. */
        msg?: string
    ];
    progress: [
        /** A number from range 0-100 indicating the current progress made on creating the image. */
        percent: number
    ];
    error: [
        error: Error
    ];
}
type mkSqFSEvtListen<T extends keyof mkSqFSListenerArgs> = [
    eventName: T,
    listener: (..._: mkSqFSListenerArgs[T]) => void
];
/** An `EventListener` interface with parsed events from mksquashfs child process. */
interface mkSqFsEvt extends EventEmitter {
    /**
     * Emitted when `mksquashfs` process has been closed.
     */
    on(..._: mkSqFSEvtListen<"close">): this;
    /**
     * Emitted once `mksquashfs` process has been closed.
     */
    once(..._: mkSqFSEvtListen<"close">): this;
    /**
     * Emitted when `mksquashfs` process has been closed.
     */
    addListener(..._: mkSqFSEvtListen<"close">): this;
    /**
     * Emitted when `mksquashfs` process has been closed.
     */
    removeListener(..._: mkSqFSEvtListen<"close">): this;
    /**
     * Emitted whenever a progress has been made on SquashFS image generation.
     */
    on(..._: mkSqFSEvtListen<"progress">): this;
    /**
     * Emitted whenever a progress has been made on SquashFS image generation.
     */
    once(..._: mkSqFSEvtListen<"progress">): this;
    /**
     * Emitted whenever a progress has been made on SquashFS image generation.
     */
    addListener(..._: mkSqFSEvtListen<"progress">): this;
    /**
     * Emitted whenever a progress has been made on SquashFS image generation.
     */
    removeListener(..._: mkSqFSEvtListen<"progress">): this;
    /** Emitted whenever process has threw an error. */
    on(..._: mkSqFSEvtListen<"error">): this;
    /** Emitted whenever process has threw an error. */
    once(..._: mkSqFSEvtListen<"error">): this;
    /** Emitted whenever process has threw an error. */
    addListener(..._: mkSqFSEvtListen<"error">): this;
    /** Emitted whenever process has threw an error. */
    removeListener(..._: mkSqFSEvtListen<"error">): this;
}
export declare function generateDesktop(desktopEntry: Partial<Record<string, string | null>>, actions?: Record<string, Partial<Record<string, string | null>> & {
    Name: string;
}>): string;
/**
 * Asynchronously copy path from `source` to `destination`, with similar logic
 * to Unix `cp -R` command.
 */
export declare function copyPath(source: string, destination: string, dirmode?: Mode | ModeFunction): Promise<void>;
/**
 * A wrapper for `mksquashfs` binary.
 *
 * @returns An event used to watch for `mksquashfs` changes, including the job progress (in percent – as float number).
 */
export declare function mkSquashFs(...squashfsOptions: string[]): mkSqFsEvt;
/**
 * Returns the version of `mksquashfs` binary, as `SemVer` value.
 *
 * Under the hood, it executes `mksquashfs` with `-version`, parses
 * the `stdout` and tries to coerce it to `SemVer`.
 */
export declare function getSquashFsVer(): SemVer;
/**
 * Concatenates files and/or buffers into a new buffer.
 */
export declare function joinFiles(...filesAndBuffers: (string | Buffer)[]): Promise<Buffer>;
/**
 * Maps Node.js architecture to the AppImage-friendly format.
 */
export declare function mapArch(arch: ForgeArch): AppImageArch;
/**
 * An object which maps files to their MD5 hashes.
 *
 * **Note:** Checksums are valid only for the assets of AppImageKit `13`.
 */
export declare const mapHash: Readonly<{
    runtime: Readonly<{
        x86_64: "37d6f0bc41f143c8c0376e874769e20a";
        i686: "498c198765ebb914e43713af4f85c5a9";
        aarch64: "d41d8cd98f00b204e9800998ecf8427e";
        armhf: "85b929e78dc59098928df1655b4b7963";
    }>;
    AppRun: Readonly<{
        x86_64: "91b81afc501f78761adbf3bab49b0590";
        i686: "a16e8b7d1052a388bb9fd1e42d790434";
        aarch64: "e991d36711f99097e5c46deabb0c84a9";
        armhf: "4e7401fd36d3d4afa4963bf0a8e08221";
    }>;
}>;
/**
 * A function to fetch metadata from buffer in PNG or SVG format.
 *
 * @remarks
 *
 * For PNGs, it gets required information (like image width or height)
 * from IHDR header (if it is correct according to spec), otherwise it sets
 * dimension values to `null`.
 *
 * For SVGs, it gets information about the dimensions from `<svg>` tag. If it is
 * missing, this function will return `null` for `width` and/or `height`.
 *
 * This function will also recognize file formats based on *MAGIC* headers – for
 * SVGs, it looks for existence of `<svg>` tag, for PNGs it looks if file starts
 * from the specific bytes.
 *
 * @param image PNG/SVG/XPM image buffer.
 */
export declare function getImageMetadata(image: Buffer): ImageMetadata;
export declare function setChecksum(runtime: ArrayBuffer | Buffer, squashfs: Buffer): Buffer;
export {};
//# sourceMappingURL=utils.d.ts.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakerAppImage = void 0;
process.setSourceMapsEnabled?.(true);
const crypto_1 = require("crypto");
const os_1 = require("os");
const path_1 = require("path");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const events_1 = require("events");
const maker_base_1 = require("@electron-forge/maker-base");
const lss_1 = __importDefault(require("@spacingbat3/lss"));
const utils_js_1 = require("./utils.js");
var RemoteDefaults;
(function (RemoteDefaults) {
    RemoteDefaults["MirrorHost"] = "https://github.com/AppImage/";
    RemoteDefaults["MirrorPath"] = "/releases/download/";
    RemoteDefaults["MirrorAK"] = "AppImageKit";
    RemoteDefaults["MirrorT2R"] = "type2-runtime";
    /** Currently supported release of AppImageKit distributables. */
    RemoteDefaults[RemoteDefaults["Tag"] = 13] = "Tag";
    RemoteDefaults["Dir"] = "{{ version }}";
    RemoteDefaults["FileName"] = "{{ filename }}-{{ arch }}";
})(RemoteDefaults || (RemoteDefaults = {}));
/**
 * An AppImage maker for Electron Forge.
 *
 * See `Readme.md` file distributed in subproject's root dir for more
 * information and documentation of supported env variables. See
 * JSDoc/TSDoc/TypeDoc documentation (this ones!) for supported
 * configuration options.
 *
 * @example
 * ```js
 * {
 *   name: "@reforged/maker-appimage",
 *   config: {
 *     options: {
 *       // Package name.
 *       name: "example-app",
 *       // Executable name.
 *       bin: "app",
 *       // Human-friendly name of the application.
 *       productName: "Example Electron Application",
 *       // `GenericName` in generated `.desktop` file.
 *       genericName: "Example application",
 *       // Path to application's icon.
 *       icon: "/path/to/icon.png",
 *       // Desktop file to be used instead of the configuration above.
 *       desktopFile: "/path/to/example-app.desktop",
 *       // Release of `AppImage/AppImageKit`, either number or "continuous".
 *       AppImageKitRelease: "continuous",
 *       // Support parsing Arch Linux '*_flags.conf' file.
 *       flagsFile: "true"
 *     }
 *   }
 * }
 * ```
 */
class MakerAppImage extends maker_base_1.MakerBase {
    /** @internal */
    __VndReForgedAPI = 1;
    defaultPlatforms = ["linux"];
    name = "AppImage";
    requiredExternalBinaries = ["mksquashfs"];
    isSupportedOnCurrentPlatform = () => true;
    async make({ appName, dir, makeDir, packageJSON, targetArch }, ...vendorExt) {
        const { actions, categories, compressor, genericName, flagsFile, type2runtime } = (this.config.options ?? {});
        const appImageArch = (0, utils_js_1.mapArch)(targetArch);
        function parseMirror(string, version, filename = null) {
            string = string
                .replaceAll(/{{ *version *}}/g, `${version}`)
                .replaceAll(/{{ *arch *}}/g, appImageArch)
                .replaceAll(/{{ *node.arch *}}/g, targetArch);
            if (filename !== null)
                string = string.replaceAll(/{{ *filename *}}/g, filename);
            return string;
        }
        /** A URL-like object from which assets will be downloaded. */
        const remote = {
            mirror: {
                runtime: type2runtime ?
                    `${RemoteDefaults.MirrorHost}${RemoteDefaults.MirrorT2R}${RemoteDefaults.MirrorPath}` :
                    process.env["REFORGED_APPIMAGEKIT_MIRROR"] ??
                        process.env["APPIMAGEKIT_MIRROR"] ??
                        `${RemoteDefaults.MirrorHost}${RemoteDefaults.MirrorAK}${RemoteDefaults.MirrorPath}`,
                AppRun: process.env["REFORGED_APPIMAGEKIT_MIRROR"] ??
                    process.env["APPIMAGEKIT_MIRROR"] ??
                    `${RemoteDefaults.MirrorHost}${RemoteDefaults.MirrorAK}${RemoteDefaults.MirrorPath}`
            },
            dir: process.env["REFORGED_APPIMAGEKIT_CUSTOM_DIR"] ?? process.env["APPIMAGEKIT_CUSTOM_DIR"] ?? RemoteDefaults.Dir,
            file: process.env["REFORGED_APPIMAGEKIT_CUSTOM_FILENAME"] ?? process.env["APPIMAGEKIT_CUSTOM_FILENAME"] ?? RemoteDefaults.FileName
        };
        /** Node.js friendly name of the application. */
        const name = (0, lss_1.default)(this.config.options?.name ?? packageJSON.name);
        /** Name of binary, used for shell script generation and `Exec` values. */
        const bin = this.config.options?.bin ?? name;
        const binShell = bin.replaceAll(/(?<!\\)"/g, '\\"');
        /** Human-friendly application name. */
        const productName = this.config.options?.productName ?? appName;
        /** A path to application's icon. */
        const icon = this.config?.options?.icon ?? null;
        /** Resolved path to AppImage output file. */
        const outFile = (0, path_1.resolve)(makeDir, this.name, targetArch, `${productName}-${packageJSON.version}-${targetArch}.AppImage`);
        /** A currently used AppImageKit release. */
        const currentTag = (type2runtime ? "continuous" : this.config.options?.AppImageKitRelease ?? RemoteDefaults.Tag);
        /**
         * Detailed information about the source files.
         *
         * As of remote content, objects contain the data in form of
         * ArrayBuffers (which are then allocated to Buffers,
         * checksum-verified and saved as regular files). The text-based
         * generated content is however saved in form of the string (UTF-8
         * encoded, with LF endings).
         */
        const sources = Object.freeze({
            /** Details about the AppImage runtime. */
            runtime: Object.freeze({
                data: fetch(parseMirror(`${remote.mirror.runtime}${remote.dir}/${remote.file}`, currentTag, "runtime"))
                    .then(response => {
                    if (response.ok)
                        return response.arrayBuffer();
                    else
                        throw new Error(`Runtime request failure (${response.status}: ${response.statusText}).`);
                }),
                md5: utils_js_1.mapHash.runtime[(0, utils_js_1.mapArch)(targetArch)]
            }),
            /** Details about AppRun ELF executable, used to start the app. */
            AppRun: Object.freeze({
                data: fetch(parseMirror(`${remote.mirror.AppRun}${remote.dir}/${remote.file}`, currentTag, "AppRun"))
                    .then(response => {
                    if (response.ok)
                        return response.arrayBuffer();
                    else
                        throw new Error(`AppRun request failure (${response.status}: ${response.statusText}).`);
                }),
                md5: utils_js_1.mapHash.AppRun[(0, utils_js_1.mapArch)(targetArch)]
            }),
            /** Details about the generated `.desktop` file. */
            desktop: typeof this.config.options?.desktopFile === "string" ?
                (0, promises_1.readFile)(this.config.options.desktopFile, "utf-8") :
                Promise.resolve((0, utils_js_1.generateDesktop)({
                    Version: "1.5",
                    Type: "Application",
                    Name: productName,
                    GenericName: genericName,
                    Exec: `${bin.includes(" ") ? `"${binShell}"` : bin} %U`,
                    Icon: icon ? name : undefined,
                    Categories: categories ?
                        categories.join(';') + ';' :
                        undefined,
                    "X-AppImage-Name": name,
                    "X-AppImage-Version": packageJSON.version,
                    "X-AppImage-Arch": (0, utils_js_1.mapArch)(targetArch)
                }, actions)),
            /** Shell script used to launch the application. */
            shell: [
                '#!/bin/sh -e',
                // Normalized string to 'usr/' in the AppImage.
                'USR="$(echo "$0" | sed \'s/\\/\\/*/\\//g;s/\\/$//;s/\\/[^/]*\\/[^/]*$//\')"',
                // Executes the binary and passes arguments to it.
                `exec "$USR/lib/${name}/${binShell}" "$@"`
            ]
        });
        /** Whenever using the script is necessary. */
        let useScript = false;
        if (flagsFile) {
            useScript = true;
            sources.shell.pop();
            sources.shell.push('ARGV=\'\'', 'for arg in "$@"; do', '\tARGV="$ARGV${ARGV:+ }$(echo "$arg" | sed \'s~\\\\~\\\\\\\\~g;s~"~"\\\\""~g;s~^\\(.*\\)$~"\\1"~g\')"', 'done', `CFG="\${XDG_CONFIG_HOME:-"\${HOME:-/home/"$USER"}/.config"}/${name}-flags.conf"`, 'if [ -f "$CFG" ]; then ARGV="$(cat "$CFG" | sed \'s~^\\s*#.*$~~g\') $ARGV"; fi', `echo "$ARGV" | exec xargs "$USR/lib/${name}/${binShell}"`);
        }
        this.ensureFile(outFile);
        // Verify if there's a `bin` file in packaged application.
        if (!(0, fs_1.existsSync)((0, path_1.resolve)(dir, bin)))
            throw new Error([
                `Could not find executable '${bin}' in packaged application.`,
                "Make sure 'packagerConfig.executableName' or 'config.options.bin'",
                "in Forge config are pointing to valid file."
            ].join(" "));
        /** A temporary directory used for the packaging. */
        const workDir = (0, fs_1.mkdtempSync)((0, path_1.resolve)((0, os_1.tmpdir)(), `.${productName}-${packageJSON.version}-${targetArch}-`));
        const iconMeta = icon ? (0, promises_1.readFile)(icon).then(icon => (0, utils_js_1.getImageMetadata)(icon)) : Promise.resolve(undefined);
        {
            let cleanup = () => {
                cleanup = () => { };
                (0, fs_1.rmSync)(workDir, { recursive: true });
            };
            process.on("uncaughtExceptionMonitor", cleanup);
            process.on("exit", cleanup);
        }
        process.on("SIGINT", () => {
            console.error("User interrupted the process.");
            process.exit(130);
        });
        const directories = {
            lib: (0, path_1.resolve)(workDir, 'usr/lib/'),
            data: (0, path_1.resolve)(workDir, 'usr/lib/', name),
            bin: (0, path_1.resolve)(workDir, 'usr/bin'),
            icons: iconMeta.then(meta => meta && meta.width && meta.height ?
                (0, path_1.resolve)(workDir, 'usr/share/icons/hicolor', meta.width.toFixed(0) + 'x' + meta.height.toFixed(0)) :
                null)
        };
        const iconPath = icon ? (0, path_1.resolve)(workDir, name + (0, path_1.extname)(icon)) : undefined;
        /** First-step jobs, which does not depend on any other job. */
        const earlyJobs = [
            // Create further directory tree (0,1,2)
            (0, promises_1.mkdir)(directories.lib, { recursive: true, mode: 0o755 }),
            (0, promises_1.mkdir)(directories.bin, { recursive: true, mode: 0o755 }),
            directories.icons
                .then(path => path ? (0, promises_1.mkdir)(path, { recursive: true, mode: 0o755 }).then(() => path) : undefined),
            // Save `.desktop` to file (3)
            sources.desktop
                .then(data => (0, promises_1.writeFile)((0, path_1.resolve)(workDir, productName + '.desktop'), data, { mode: 0o755, encoding: "utf-8" })),
            // Verify and save `AppRun` to file (4)
            sources.AppRun.data
                .then(data => {
                const buffer = Buffer.from(data);
                if (currentTag === RemoteDefaults.Tag) {
                    if (!(0, crypto_1.getHashes)().includes("md5"))
                        throw new Error("MD5 is not supported by 'node:crypto'.");
                    const hash = (0, crypto_1.createHash)("md5")
                        .update(buffer)
                        .digest('hex');
                    if (hash !== sources.AppRun.md5)
                        throw new Error("AppRun hash mismatch.");
                }
                return (0, promises_1.writeFile)((0, path_1.resolve)(workDir, 'AppRun'), buffer, { mode: 0o755 });
            }),
            // Save icon to file and symlink it as `.DirIcon` (5)
            icon ? iconPath && (0, fs_1.existsSync)(icon) ?
                (0, promises_1.copyFile)(icon, iconPath)
                    .then(() => (0, promises_1.symlink)((0, path_1.relative)(workDir, iconPath), (0, path_1.resolve)(workDir, ".DirIcon"), 'file'))
                : Promise.reject(Error("Invalid icon / icon path.")) : Promise.resolve(),
        ];
        const lateJobs = [
            // Write shell script to file or create a symlink
            earlyJobs[1]
                .then(() => {
                const binPath = (0, path_1.resolve)(directories.bin, bin);
                if (useScript)
                    return (0, promises_1.writeFile)(binPath, sources.shell.join('\n'), { mode: 0o755 });
                return (0, promises_1.symlink)((0, path_1.relative)(directories.bin, (0, path_1.resolve)(directories.data, binShell)), binPath, "file");
            }),
            // Copy Electron app to AppImage directories
            earlyJobs[0]
                .then(() => (0, utils_js_1.copyPath)(dir, directories.data, 0o755)),
            // Copy icon to `usr` directory whenever possible
            Promise.all([earlyJobs[2], earlyJobs[5]])
                .then(([path]) => icon && path ?
                (0, promises_1.copyFile)(icon, (0, path_1.resolve)(path, name + (0, path_1.extname)(icon))) :
                void 0),
            // Ensure that root folder has proper file mode
            (0, promises_1.chmod)(workDir, 0o755)
        ];
        // Wait for early/late jobs to finish
        await (Promise.all([...earlyJobs, ...lateJobs]));
        // Run `mksquashfs` and wait for it to finish
        const mkSquashFsArgs = [workDir, outFile];
        const mkSquashFsVer = (0, utils_js_1.getSquashFsVer)();
        switch (-1) {
            // -noappend is supported since 1.2+
            case (mkSquashFsVer.compare("1.2.0")): //@ts-expect-error falls through
                break;
            case -1:
                mkSquashFsArgs.push("-noappend");
            // -all-root is supported since 2.0+
            case mkSquashFsVer.compare("2.0.0"): //@ts-expect-error falls through
                break;
            case -1:
                mkSquashFsArgs.push("-all-root");
            // -all-time and -mkfs-time is supported since 4.4+
            case mkSquashFsVer.compare("4.4.0"):
                break;
            default: if (process.env["SOURCE_DATE_EPOCH"] === undefined)
                mkSquashFsArgs.push("-all-time", "0", "-mkfs-time", "0");
        }
        // Set compressor options if available
        if (compressor)
            mkSquashFsArgs.push("-comp", compressor);
        if (compressor === "xz")
            mkSquashFsArgs.push(
            // Defaults for `xz` took from AppImageTool:
            "-Xdict-size", "100%", "-b", "16384");
        await new Promise((resolve, reject) => {
            (0, promises_1.mkdir)((0, path_1.dirname)(outFile), { recursive: true }).then(() => {
                const evtCh = (0, utils_js_1.mkSquashFs)(...mkSquashFsArgs)
                    .once("close", (code, _signal, msg) => code !== 0 ?
                    reject(new Error(`mksquashfs returned ${msg ? `'${msg}' in stderr` : "non-zero code"} (${code}).`)) :
                    resolve(undefined))
                    .once("error", (error) => reject(error));
                for (let vndHead; vndHead !== undefined && vndHead !== "RF1"; vndHead = vendorExt.pop())
                    ;
                const [vndCh] = vendorExt;
                // Leak current progress to API consumers if supported
                if (vndCh instanceof events_1.EventEmitter)
                    evtCh.on("progress", percent => vndCh.emit("progress", percent));
            }).catch(error => reject(error));
        });
        // Append runtime to SquashFS image and wait for that task to finish
        await sources.runtime.data
            //TODO: Find how properly embed MD5 or SHA256 signatures
            /*.then(
              async runtime => config.options?.digestMd5??true ?
                setChecksum(runtime, await readFile(outFile)) :
                runtime
            )*/
            .then(runtime => (0, utils_js_1.joinFiles)(Buffer.from(runtime), outFile))
            .then(buffer => (0, promises_1.writeFile)(outFile, buffer))
            .then(() => (0, promises_1.chmod)(outFile, 0o755));
        // Finally, return a path to maker artifacts
        return [outFile];
    }
}
exports.default = MakerAppImage;
exports.MakerAppImage = MakerAppImage;
//# sourceMappingURL=main.js.map
import { MakerBase } from "@electron-forge/maker-base";
import type MakerAppImageConfig from "../types/config.d.ts";
import type { MakerMeta } from "./utils.js";
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
export default class MakerAppImage extends MakerBase<MakerAppImageConfig> {
    defaultPlatforms: ["linux"];
    name: "AppImage";
    requiredExternalBinaries: ["mksquashfs"];
    isSupportedOnCurrentPlatform: () => true;
    make({ appName, dir, makeDir, packageJSON, targetArch }: MakerMeta, ...vendorExt: unknown[]): Promise<string[]>;
}
export { MakerAppImage };
export type { MakerAppImageConfig, MakerAppImageConfigOptions, FreeDesktopCategories } from "../types/config.d.ts";
export type { ForgeArch, MakerMeta } from "./utils.js";
//# sourceMappingURL=main.d.ts.map
import { IApplication } from "./IApplication";
import { Server } from "../Server";
import { Record } from "./Caches/Record";
export declare class Cache {
    protected server: Server;
    protected dirIndexScriptModules: Map<string, Record>;
    protected requireCacheWatched: Map<string, boolean>;
    protected requireCacheDependencies: Map<string, Map<string, boolean>>;
    constructor(server: Server);
    /**
     * @summary Initialize filesystem change or rename handler for given fullpath file to clear necessary require cache modules:
     */
    InitRequireCacheItemsWatchHandlers(requiredByFullPath: string, cacheKeysToWatchFullPaths: string[]): void;
    TryToFindParentDirectoryIndexScriptModule(pathsToFound: string[]): Record | null;
    GetIndexScriptModuleRecord(fullPath: string): Record | null;
    SetNewIndexScriptModuleRecord(appInstance: IApplication, indexScriptModTime: number, indexScript: string, dirFullPath: string): Cache;
    /**
     * @summary Delete cached module from Node.JS require cache by full path.
     */
    ClearModuleInstanceCacheAndRequireCache(fullPath: string): void;
    ClearDirectoryModules(): Cache;
    /**
     * @summary Clear require cache recursively with cleaning module dependencies:
     */
    protected clearRequireCacheRecursive(fullPath: string, clearedKeys: Map<string, boolean>): void;
    static GetRequireCacheDifferenceKeys(cacheKeysBeforeRequire: string[], cacheKeysAfterRequire: string[], requiredBy: string, doNotIncludePath: string): string[];
}

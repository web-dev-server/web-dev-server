import { IApplication } from "./application";
import { Server } from "./server";
export declare class Cache {
    protected server: Server;
    protected dirIndexScriptModules: Map<string, CacheRecord>;
    protected requireCacheWatched: Map<string, boolean>;
    protected requireCacheDependencies: Map<string, Map<string, boolean>>;
    constructor(server: Server);
    /**
     * @summary Initialize filesystem change or rename handler for given fullpath file to clear necessary require cache modules:
     */
    InitRequireCacheItemsWatchHandlers(requiredByFullPath: string, cacheKeysToWatchFullPaths: string[]): void;
    TryToFindParentDirectoryIndexScriptModule(pathsToFound: string[]): CacheRecord | null;
    GetIndexScriptModuleRecord(fullPath: string): CacheRecord | null;
    SetNewIndexScriptModuleRecord(appInstance: IApplication, indexScriptModTime: number, indexScript: string, fullPath: string): Cache;
    /**
     * @summary Delete cached module from Node.JS require cache by full path.
     */
    ClearModuleInstanceCacheAndRequireCache(fullPath: string): void;
    ClearDirectoryModules(): Cache;
    /**
     * @summary Clear require cache recursively with cleaning module dependencies:
     */
    protected clearRequireCacheRecursive(fullPath: string, clearedKeys: Map<string, boolean>): void;
}
export declare class CacheRecord {
    instance: IApplication;
    modTime: number;
    scriptName: string;
    fullPath: string;
    constructor(instance: IApplication, modTime: number, scriptName: string, fullPath: string);
}

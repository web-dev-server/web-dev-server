import fs from "fs";
import pathUtil from "path";

import { IApplication } from "./IApplication";
import { Server } from "../Server";
import { Record } from "./Caches/Record";


export class Cache {
	protected server: Server;

	protected dirIndexScriptModules: Map<string, Record> = new Map<string, Record> ();
	protected requireCacheWatched: Map<string, boolean> = new Map<string, boolean>();
	protected requireCacheDependencies: Map<string, Map<string, boolean>> = new Map<string, Map<string, boolean>>();

	constructor (server: Server) {
		this.server = server;
	}

	/**
	 * @summary Initialize filesystem change or rename handler for given fullpath file to clear necessary require cache modules:
	 */
	public InitRequireCacheItemsWatchHandlers (
		requiredByFullPath: string, 
		cacheKeysToWatchFullPaths: string[]
	): void {
		cacheKeysToWatchFullPaths.forEach((cacheKeyToWatchFullPath: string, i: number) => {
			// set up dependencies:
			var dependencies: Map<string, boolean> = new Map<string, boolean>();
			if (this.requireCacheDependencies.has(cacheKeyToWatchFullPath)) 
				dependencies = this.requireCacheDependencies.get(cacheKeyToWatchFullPath);
			for (var j: number = 0, k: number = cacheKeysToWatchFullPaths.length; j < k; j++) {
				if (j !== i)
					dependencies.set(cacheKeysToWatchFullPaths[j], true);
			}
			dependencies.set(requiredByFullPath, true);
			this.requireCacheDependencies.set(cacheKeyToWatchFullPath, dependencies);
			// watch directory if necessary:
			var lastSlashPos: number = cacheKeyToWatchFullPath.lastIndexOf('/');
			if (lastSlashPos !== -1) { 
				var cacheDirKeyToWatch: string = cacheKeyToWatchFullPath.substr(0, lastSlashPos);
				if (!this.requireCacheWatched.has(cacheDirKeyToWatch)) {
					this.requireCacheWatched.set(cacheDirKeyToWatch, true);
					fs.watch(
						cacheDirKeyToWatch, 
						{ persistent: true, recursive: true }, 
						(eventType: string, filename: string): void => {
							if (filename.length > 3 && filename.substr(-3).toLowerCase() == '.js') {
								// eventType => 'change' | 'rename'
								var clearedKeys: Map<string, boolean> = new Map<string, boolean>();
								this.clearRequireCacheRecursive(
									cacheDirKeyToWatch + '/' + filename, clearedKeys
								);
							}
						}
					);
				}
			}
		});
	}

	public TryToFindParentDirectoryIndexScriptModule (pathsToFound: string[]): Record | null {
		var dirIndexScriptsModule: Record = null,
			pathToFound: string = '',
			documentRoot: string = this.server.GetDocumentRoot();
		for (var i:number = 0, l:number = pathsToFound.length; i < l; i += 1) {
			pathToFound = pathUtil.resolve(documentRoot + pathsToFound[i]).replace(/\\/g, '/');
			if (this.dirIndexScriptModules.has(pathToFound)) {
				dirIndexScriptsModule = this.dirIndexScriptModules.get(pathToFound);
				break;
			}
		}
		return dirIndexScriptsModule;
	}

	public GetIndexScriptModuleRecord (fullPath: string): Record | null {
		var indexScriptModuleRecord: Record = null;
		if (this.dirIndexScriptModules.has(fullPath)) 
			indexScriptModuleRecord = this.dirIndexScriptModules.get(fullPath);
		return indexScriptModuleRecord;
	}

	public SetNewIndexScriptModuleRecord (
		appInstance: IApplication,
		indexScriptModTime: number,
		indexScript: string,
		dirFullPath: string
	): Cache {
		this.dirIndexScriptModules.set(dirFullPath, new Record (
			appInstance,
			indexScriptModTime,
			indexScript,
			dirFullPath
		));
		return this;
	}

	/**
	 * @summary Delete cached module from Node.JS require cache by full path.
	 */
	public ClearModuleInstanceCacheAndRequireCache (fullPath: string) {
		var fullPathResolved: string = require.resolve(fullPath);
		if (typeof(require.cache[fullPathResolved]) != 'undefined') {
			delete require.cache[fullPathResolved];
			if (this.server.IsDevelopment()) console.info(
				'Module cache cleaned for: "' + fullPathResolved + '"'
			);
		}
		this.dirIndexScriptModules.delete(fullPath);
	}

	public ClearDirectoryModules (): Cache {
		this.dirIndexScriptModules = new Map<string, Record>();
		return this;
	}

	/**
	 * @summary Clear require cache recursively with cleaning module dependencies:
	 */
	protected clearRequireCacheRecursive (fullPath: string, clearedKeys: Map<string, boolean>): void {
		clearedKeys.set(fullPath, true);
		if (typeof(require.cache[fullPath]) != 'undefined') {
			delete require.cache[fullPath];	
			if (this.server.IsDevelopment()) console.info(
				'Module cache cleaned for: "' + fullPath + '"'
			);
		}
		this.dirIndexScriptModules.delete(fullPath);
		if (this.requireCacheDependencies.has(fullPath)) {
			var dependencies: Map<string, boolean> = this.requireCacheDependencies.get(fullPath);
			this.requireCacheDependencies.delete(fullPath);
			dependencies.forEach((val: boolean, dependencyFullPath, string) => {
				if (!clearedKeys.has(dependencyFullPath))
					this.clearRequireCacheRecursive(dependencyFullPath, clearedKeys);
			});
			this.requireCacheDependencies.set(fullPath, dependencies);
		}
	}

	public static GetRequireCacheDifferenceKeys (
		cacheKeysBeforeRequire: string[], 
		cacheKeysAfterRequire: string[], 
		requiredBy: string, 
		doNotIncludePath: string
	): string[] {
		var result: string[] = [], 
			record: string;
		for (var i: number = 0, l: number = cacheKeysAfterRequire.length; i < l; i += 1) {
			record = cacheKeysAfterRequire[i];
			if (cacheKeysBeforeRequire.indexOf(record) == -1)
				if (record !== requiredBy && record.indexOf(doNotIncludePath) !== 0)
					result.push(record);
		}
		return result;
	}
}
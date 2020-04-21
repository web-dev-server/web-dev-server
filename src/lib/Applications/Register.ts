import fs from "fs";
import pathUtil from "path";

import { Server, IApplication } from "../Server";
import { Record } from "./Registers/Record";
import { ErrorsHandler } from "../Handlers/Error";


export class Register {
	/**
	 * @summary Server instance pointer.
	 */
	protected server: Server;
	
	/**
	 * @summary Server error handler submodule pointer.
	 */
	protected errorsHandler: ErrorsHandler;

	/**
	 * @summary Store of cached application instances.
	 * Keys are index script directories, values are `Record` types.
	 */
	protected store: Map<string, Record> = new Map<string, Record> ();
	
	/**
	 * @summary Store with keys as application instance index script directories full paths 
	 * and values as application instances dependent files full paths.
	 */
	protected dependencies: Map<string, Set<string>> = new Map<string, Set<string>>();

	/**
	 * @summary Store with keys as watched filesystem directories and values as
	 * dependent application instance index script directories full paths.
	 */
	protected watchedDirs: Map<string, Set<string>> = new Map<string, Set<string>>();
	
	protected watchHandleTimeouts: Map<string, NodeJS.Timeout> = new Map<string, NodeJS.Timeout>();

	/**
	 * @summary Register constructor with stored server instance to call it back.
	 * @param server 
	 */
	constructor (server: Server) {
		this.server = server;
	}

	/**
	 * @summary Set internal `Server` handling functionality.
	 * @param errorsHandler 
	 */
	public SetErrorsHandler (errorsHandler: ErrorsHandler): this {
		this.errorsHandler = errorsHandler;
		return this;
	}

	/**
	 * @summary Initialize filesystem change or rename handler for given 
	 * fullpath file to clear necessary require cache modules (only if necessary):
	 */
	public AddWatchHandlers (
		requiredByFullPath: string, 
		cacheKeysToWatchFullPaths: string[]
	): void {
		var alreadyDependentFiles: Set<string>,
			dependentIndexScriptsDirs: Set<string>,
			checkedDirectories: Set<string>,
			dependentDirFullPath: string,
			requiredByDirFullPath: string,
			watchedDirAlready: string,
			pos: number;
		pos = requiredByFullPath.lastIndexOf('/');
		if (pos == -1) {
			requiredByDirFullPath = requiredByFullPath;
		} else {
			requiredByDirFullPath = requiredByFullPath.substr(0, pos);
		}
		// Add any other dependent files not already in dependencies:
		if (!this.dependencies.has(requiredByDirFullPath)) {
			alreadyDependentFiles = new Set<string>();
			for (var newDependentFile of cacheKeysToWatchFullPaths) 
				alreadyDependentFiles.add(newDependentFile);
		} else {
			alreadyDependentFiles = this.dependencies.get(requiredByDirFullPath);
			for (var newDependentFile of cacheKeysToWatchFullPaths) 
				if (!alreadyDependentFiles.has(newDependentFile)) 
					alreadyDependentFiles.add(newDependentFile);
		}
		this.dependencies.set(requiredByDirFullPath, alreadyDependentFiles);
		// Check if directory with application script is already monitored:
		watchedDirAlready = this.hasWatchHandler(requiredByDirFullPath);
		if (watchedDirAlready == null) {
			// Add current application script directory between watched directories
			// and add dependency on it:
			this.addWatchHandler(requiredByDirFullPath, requiredByDirFullPath);
		} else {
			// Check if there is for this directory already a dependency 
			// for currently called application index script:
			dependentIndexScriptsDirs = this.watchedDirs.get(watchedDirAlready);
			if (!dependentIndexScriptsDirs.has(requiredByDirFullPath)) {
				dependentIndexScriptsDirs.add(requiredByDirFullPath);
				this.watchedDirs.set(watchedDirAlready, dependentIndexScriptsDirs);
			}
		}
		// Check if all dependent file directories are already monitored:
		checkedDirectories = new Set<string>();
		for (var dependentFileFullPath of cacheKeysToWatchFullPaths) {
			pos = dependentFileFullPath.lastIndexOf('/');
			if (pos == -1) {
				dependentDirFullPath = dependentFileFullPath;
			} else {
				dependentDirFullPath = dependentFileFullPath.substr(0, pos);
			}
			if (checkedDirectories.has(dependentDirFullPath)) continue;
			checkedDirectories.add(dependentDirFullPath);
			watchedDirAlready = this.hasWatchHandler(dependentDirFullPath);
			if (watchedDirAlready == null) {
				// Add current dependent script directory between watched directories
				// and add dependency to and application index script on it:
				this.addWatchHandler(dependentDirFullPath, requiredByDirFullPath);
			} else {
				// Check if there is for this directory already a dependency 
				// for currently called application index script:
				dependentIndexScriptsDirs = this.watchedDirs.get(watchedDirAlready);
				if (!dependentIndexScriptsDirs.has(requiredByDirFullPath)) {
					dependentIndexScriptsDirs.add(requiredByDirFullPath);
					this.watchedDirs.set(watchedDirAlready, dependentIndexScriptsDirs);
				}
			}
		}
	}

	protected addWatchHandler (dirFullPathToWatch: string, dependentIndexScriptDirFullPath: string): void {
		var dependentIndexScriptDirs: Set<string> = new Set<string>();
		dependentIndexScriptDirs.add(dependentIndexScriptDirFullPath);
		this.watchedDirs.set(dirFullPathToWatch, dependentIndexScriptDirs);
		fs.watch(
			dirFullPathToWatch, 
			{ persistent: true, recursive: true }, 
			(eventType: string, fileName: string): void => {
				if (fileName.length > 3 && fileName.substr(-3).toLowerCase() == '.js') {
					// Delay cleaning for windows and do it fo all systems, because watching API is unstable:
					var changedFileFullPath: string = dirFullPathToWatch + '/' + fileName,
						prevWatchHandleTimeout: NodeJS.Timeout,
						newWatchHandleTimeout: NodeJS.Timeout;
					if (this.watchHandleTimeouts.has(changedFileFullPath)) {
						prevWatchHandleTimeout = this.watchHandleTimeouts.get(changedFileFullPath);
						clearTimeout(prevWatchHandleTimeout);
						this.watchHandleTimeouts.delete(changedFileFullPath);
					}
					newWatchHandleTimeout = setTimeout(async () => {
						clearTimeout(newWatchHandleTimeout);
						this.watchHandleTimeouts.delete(changedFileFullPath);
						await this.clearInstanceAndRequireCacheOnChange(
							dirFullPathToWatch, changedFileFullPath
						);
					}, 50);
					this.watchHandleTimeouts.set(changedFileFullPath, newWatchHandleTimeout);
				}
			}
		);
	}

	/**
	 * @summary Clear instance cache and require cache for all dependent index script directories.
	 */
	protected async clearInstanceAndRequireCacheOnChange (dirFullPathToWatch: string, changedFileFullPath: string): Promise<boolean> {
		if (!this.watchedDirs.has(dirFullPathToWatch)) return false;
		var dependentIndexScriptDirs: Set<string> = this.watchedDirs.get(dirFullPathToWatch),
			promises: Promise<boolean>[] = [],
			cacheRecord: Record;
		for (var dependentIndexScriptDir of dependentIndexScriptDirs.keys()) {
			if (!this.store.has(dependentIndexScriptDir)) continue;
			cacheRecord = this.store.get(dependentIndexScriptDir);
			this.store.delete(dependentIndexScriptDir);
			((cacheRecordLocal: Record) => {
				promises.push(new Promise<boolean>(async (resolve, reject) => {
					if (cacheRecordLocal != null) {
						try {
							await cacheRecordLocal.Instance.Stop(this.server);
						} catch (e) {
							this.errorsHandler.LogError(e, 500, null, null);
						}
						this
							.ClearModuleInstance(dependentIndexScriptDir)
							.ClearModuleRequireCache(cacheRecordLocal);
					}
					resolve(true);
				}));
			})(cacheRecord);
		}
		promises.push(new Promise<boolean>(async (resolve, reject) => {
			var fullPathResolved: string = require.resolve(changedFileFullPath);
			if (typeof(require.cache[fullPathResolved]) != 'undefined') {
				delete require.cache[fullPathResolved];
				if (this.server.IsDevelopment()) console.info(
					'Module cache cleaned for: "' + changedFileFullPath + '"'
				);
			}
			resolve(true);
		}));
		var allDone: Promise<boolean[]> = Promise.all(promises);
		var allDoneBools: boolean[] = await allDone;
		return allDoneBools.length == promises.length;
	}

	/**
	 * @summary Check if given directory full path has already any other 
	 * parent directory recursive watched or if the given directory itself has a watched.
	 * @param dirFullPath 
	 * @return Already watched full path to cover this directory.
	 */
	protected hasWatchHandler (dirFullPath: string): string {
		var result: string = null;
		for (var watchedParentDirFullPath of this.watchedDirs.keys()) {
			if (dirFullPath.indexOf(watchedParentDirFullPath) === 0) {
				result = watchedParentDirFullPath;
				break;
			}
		}
		return result;
	}

	/**
	 * @summary Try to search in application scripts cache for 
	 * any application instance to handle given directory or virtual directory request.
	 * @param pathsToFound 
	 */
	public TryToFindParentDirectoryIndexScriptModule (pathsToFound: string[]): Record | null {
		var dirIndexScriptsModule: Record = null,
			pathToFound: string = '',
			documentRoot: string = this.server.GetDocumentRoot();
		for (var i:number = 0, l:number = pathsToFound.length; i < l; i += 1) {
			pathToFound = pathUtil.resolve(documentRoot + pathsToFound[i]).replace(/\\/g, '/');
			if (this.store.has(pathToFound)) {
				dirIndexScriptsModule = this.store.get(pathToFound);
				break;
			}
		}
		return dirIndexScriptsModule;
	}

	public GetIndexScriptModuleRecord (fullPath: string): Record | null {
		var indexScriptModuleRecord: Record = null;
		if (this.store.has(fullPath)) 
			indexScriptModuleRecord = this.store.get(fullPath);
		return indexScriptModuleRecord;
	}

	/**
	 * @summary Set new application instance cache record.
	 * @param appInstance 
	 * @param indexScriptModTime 
	 * @param indexScriptFileName 
	 * @param dirFullPath 
	 */
	public SetNewApplicationCacheRecord (
		appInstance: IApplication,
		indexScriptModTime: number,
		indexScriptFileName: string,
		dirFullPath: string
	): Register {
		this.store.set(dirFullPath, new Record (
			appInstance,
			indexScriptModTime,
			indexScriptFileName,
			dirFullPath
		));
		return this;
	}

	/**
	 * @summary Get registered running apps count.
	 */
	public GetSize (): number {
		return this.store.size;
	}

	/**
	 * @summary Stop all running registered app instances.
	 * @param cb 
	 */
	public StopAll (cb?: () => void): void {
		var promises: Promise<void>[] = [];
		if (this.store.size === 0) return cb();
		this.store.forEach((record: Record, indexScriptDirFullPath: string) => {
			promises.push(new Promise<void>(
				async (resolve: (() => void), reject: ((reason: Error) => void)) => {
					if (!record.Instance || !record.Instance.Stop) {
						this
							.ClearModuleInstance(indexScriptDirFullPath)
							.ClearModuleRequireCache(record);
						resolve();
					} else {
						try {
							await record.Instance.Stop(this.server);
						} catch (e) {
							this.errorsHandler.LogError(e, 500, null, null);
						}
						this
							.ClearModuleInstance(indexScriptDirFullPath)
							.ClearModuleRequireCache(record);
						resolve();
					}
				}
			));
		});
		Promise.all(promises).then(() => {
			if (cb) cb();
		});
	}

	/**
	 * @summary Delete cached module from Node.JS require cache by full path.
	 * @param indexScriptDirFullPath
	 */
	public ClearModuleInstanceAndModuleRequireCache (indexScriptDirFullPath: string): void {
		if (this.store.has(indexScriptDirFullPath)) {
			var record: Record = this.store.get(indexScriptDirFullPath);
			this.store.delete(indexScriptDirFullPath);
			this.ClearModuleRequireCache(record);
		}
	}

	/**
	 * @summary Delete cached application index script module instance.
	 * @param indexScriptDirFullPath
	 */
	public ClearModuleInstance (indexScriptDirFullPath: string): this {
		if (!this.store.has(indexScriptDirFullPath)) return this;
		this.store.delete(indexScriptDirFullPath);
		return this;
	}

	/**
	 * @summary Delete require cache for dependencies of application index script dir full path 
	 * delete require cache for index script file itself.
	 * @param indexScriptDirFullPath 
	 * @param indexScriptFullPath 
	 */
	public ClearModuleRequireCache (cacheRecord: Record): this {
		var indexScriptDirFullPath: string = cacheRecord.DirectoryFullPath,
			indexScriptFullPath: string = indexScriptDirFullPath + '/' + cacheRecord.IndexScriptFileName,
			pathsToClear: Map<string, string> = new Map<string, string>();
		pathsToClear.set(indexScriptFullPath, require.resolve(indexScriptFullPath));
		var dependentFiles: Set<string>;
		if (this.dependencies.has(indexScriptDirFullPath)) {
			dependentFiles = this.dependencies.get(indexScriptDirFullPath);
			for (var dependentFileFullPath of dependentFiles.keys()) 
				pathsToClear.set(dependentFileFullPath, require.resolve(dependentFileFullPath));
		}
		var isDevelopment: boolean = this.server.IsDevelopment();
		for (var [fullPath, fullPathResolved] of pathsToClear.entries()) {
			if (typeof(require.cache[fullPathResolved]) != 'undefined') {
				delete require.cache[fullPathResolved];
				if (isDevelopment) console.info(
					'Module cache cleaned for: "' + fullPath + '"'
				);
			}
		}
		return this;
	}

	/**
	 * @summary Clear all require cache.
	 */
	public ClearAllRequireCache (): Register {
		var requireCacheKeys = Object.keys(require.cache);
		for (var i:number = 0, l:number = requireCacheKeys.length; i < l; i++) 
			delete require.cache[requireCacheKeys[i]];
		return this;
	}

	/**
	 * @summary Get all required full paths as difference between application call and after application call.
	 * @param cacheKeysBeforeRequire 
	 * @param cacheKeysAfterRequire 
	 * @param requiredBy 
	 * @param doNotIncludePaths 
	 */
	public static GetRequireCacheDifferenceKeys (
		cacheKeysBeforeRequire: string[], 
		cacheKeysAfterRequire: string[], 
		requiredBy: string, 
		doNotIncludePaths: string[]
	): string[] {
		var result: string[] = [], 
			record: string,
			doNotInclude: boolean;
		for (var i: number = 0, l: number = cacheKeysAfterRequire.length; i < l; i += 1) {
			record = cacheKeysAfterRequire[i];
			if (cacheKeysBeforeRequire.indexOf(record) == -1) {
				record = record.replace(/\\/g, '/');
				if (record !== requiredBy) {
					doNotInclude = false;
					for (var doNotIncludePath of doNotIncludePaths) {
						if (record.indexOf(doNotIncludePath) != -1) {
							doNotInclude = true;
							break;
						}
					}
					if (!doNotInclude) 
						result.push(record);
				}
			}
		}
		return result;
	}
}
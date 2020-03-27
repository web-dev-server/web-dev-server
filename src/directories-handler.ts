import fs from "fs";
import pathUtil from "path";
import * as core from "express-serve-static-core";

import { Server } from "./server"
import { Helpers, DirItem } from "./helpers"
import * as App from "./application"
import { Cache, CacheRecord } from "./cache"
import { FilesHandler } from "./files-handler"
import { ErrorsHandler } from "./errors-handler"

export class DirectoriesHandler {
	protected server: Server;
	protected cache: Cache;
	protected filesHandler: FilesHandler;
	protected errorsHandler: ErrorsHandler;

	protected indexFiles: Map<string, number> = new Map<string, number>();
	protected indexScripts: Map<string, number> = new Map<string, number>();
	
	constructor (
		server: Server, 
		cache: Cache, 
		filesHandler: FilesHandler, 
		errorsHandler: ErrorsHandler
	) {
		this.server = server;
		this.cache = cache;
		this.filesHandler = filesHandler;
		this.errorsHandler = errorsHandler;
		var scripts: string[] = Server.INDEX.SCRIPTS,
			files: string[] = Server.INDEX.FILES,
			i: number, 
			l: number;
		for (i = 0, l = scripts.length; i < l; i++) 
			this.indexScripts.set(scripts[i], i);
		for (i = 0, l = files.length; i < l; i++) 
			this.indexFiles.set(files[i], i);
	}
	
	/**
	 * @summary Display directory content or send index.html file:
	 */
	public HandleDirectory (
		statusCode: number, 
		dirStats: fs.Stats, 
		path: string, 
		fullPath: string, 
		req: core.Request<core.ParamsDictionary, any, any>, 
		res: core.Response<any>,
		cb: core.NextFunction,
		dirItems: string[]
	) {
		var indexScriptsAndFiles: {
			scripts: string[];
			files: string[];
		} = Helpers.FindIndexInDirectory(
			dirItems, this.indexScripts, this.indexFiles
		);
		if (indexScriptsAndFiles.scripts.length > 0) {
			// try to get stat about any index script handler
			this.indexScriptOrFileStats(
				fullPath, indexScriptsAndFiles.scripts, 0, 
				(indexScript: string, indexScriptStat: fs.Stats) => {
					// index script handler
					this.HandleIndexScript(
						fullPath, indexScript, indexScriptStat.mtime.getTime(), req, res, cb
					);
				}, 
				() => {
					if (indexScriptsAndFiles.files.length > 0) {
						// try to get stat about any index file handler
						this.indexScriptOrFileStats(
							fullPath, indexScriptsAndFiles.files, 0, 
							(indexFile: string, indexFileStat: fs.Stats) => {
								// index file handler
								this.filesHandler.HandleFile(
									indexFileStat, path+'/'+indexFile, fullPath+'/'+indexFile, req, res, cb
								);
							}, 
							() => {
								if (!this.server.IsDevelopment()) {
									this.HandleForbidden(res, cb);
								} else {
									// directory handler
									this.renderDirContent(
										statusCode, dirStats, dirItems, path, fullPath, res, cb
									);
								}
							}
						);
					} else {
						if (!this.server.IsDevelopment()) {
							this.HandleForbidden(res, cb);
						} else {
							// directory handler
							this.renderDirContent(
								statusCode, dirStats, dirItems, path, fullPath, res, cb
							);
						}
					}
				}
			);
		} else if (indexScriptsAndFiles.files.length > 0) {
			this.indexScriptOrFileStats(
				fullPath, indexScriptsAndFiles.files, 0, 
				(indexFile: string, indexFileStat: fs.Stats) => {
					// index file handler
					this.filesHandler.HandleFile(
						indexFileStat, path+'/'+indexFile, fullPath+'/'+indexFile, req, res, cb
					);
				}, 
				() => {
					if (!this.server.IsDevelopment()) {
						this.HandleForbidden(res, cb);
					} else {
						// directory handler
						this.renderDirContent(statusCode, dirStats, dirItems, path, fullPath, res, cb);
					}
				}
			);
		} else {
			if (!this.server.IsDevelopment()) {
				this.HandleForbidden(res, cb);
			} else {
				// directory handler
				this.renderDirContent(statusCode, dirStats, dirItems, path, fullPath, res, cb);
			}
		}
	}
	/**
	 * @summary Process any application in index.js in directory request or on non-existing path request:
	 */
	public HandleIndexScript (
		fullPath: string, 
		indexScript: string, 
		indexScriptModTime: number,
		req: core.Request<core.ParamsDictionary, any, any>, 
		res: core.Response<any>, 
		cb: core.NextFunction
	): void {
		(async () => {
			var cachedModule: CacheRecord = this.cache.GetIndexScriptModuleRecord(fullPath),
				moduleInstance: App.IApplication;
			if (cachedModule !== null) {
				// instance of index.js class already exists:
				if (this.server.IsDevelopment()) {
					try {
						var requireCacheKey: string = pathUtil.resolve(fullPath + '/' + indexScript);
						moduleInstance = cachedModule.instance;
						if (
							indexScriptModTime > cachedModule.modTime || 
							!require.cache[requireCacheKey]
						) {
							this.cache.ClearModuleInstanceCacheAndRequireCache(fullPath);
							moduleInstance = this.indexScriptModuleCreate(
								fullPath, indexScript, indexScriptModTime, req, res
							);
						} else {
							moduleInstance = cachedModule.instance;
						}
						await this.indexScriptModuleExecute(
							fullPath, indexScript, moduleInstance, req, res
						);
						cb();
					} catch (e) {
						this.errorsHandler.PrintError(e, req, res, 500);
						this.cache.ClearModuleInstanceCacheAndRequireCache(fullPath);
						cb();
					}
				} else {
					try {
						moduleInstance = cachedModule.instance;
						await this.indexScriptModuleExecute(
							fullPath, indexScript, moduleInstance, req, res
						);
						cb();
					} catch (e) {
						this.errorsHandler.PrintError(e, req, res, 500);
						this.cache.ClearModuleInstanceCacheAndRequireCache(fullPath);
						cb();
					}
				}
			} else {
				// create instance and handle request by index.js class:
				try {
					moduleInstance = this.indexScriptModuleCreate(
						fullPath, indexScript, indexScriptModTime, req, res
					);
					await this.indexScriptModuleExecute(
						fullPath, indexScript, moduleInstance, req, res
					);
					cb();
				} catch (e) {
					this.errorsHandler.PrintError(e, req, res, 500);
					this.cache.ClearModuleInstanceCacheAndRequireCache(fullPath);
					cb();
				}
			}
		})();
	}
	/**
	 * @summary Render and send 403 forbidden page - do not list directory content:
	 */
	public HandleForbidden (
		res: core.Response<any>,
		cb: core.NextFunction
	): void {
		if (!res.headersSent) {
			res.setHeader('Content-Type', 'text/html; charset=utf-8');
			res.writeHead(403);
		}
		if (!res.finished) {
			var outputStr = Server.DEFAULTS.RESPONSES.CODES.HTML
				.replace('%head%', Server.DEFAULTS.RESPONSES.CODES.HEAD_NOT_ALLOWED)
				.replace('%icon%', '')
				.replace('%body%', Server.DEFAULTS.RESPONSES.CODES.HEADER_NOT_ALLOWED);
			res.write(outputStr, null, cb);
			res.end();
		} else {
			cb();
		}
	}

	
	/**
	 * @summary Get first index script (or index static file) file system stats:
	 */
	protected indexScriptOrFileStats (
		fullPath: string, 
		files: string[], 
		index: number, 
		successCallback: (indexScript: string, indexScriptStats: fs.Stats) => void, 
		errorCallback: () => void
	): void {
		fs.stat(
			fullPath + '/' + files[index], 
			(err: Error, itemStat: fs.Stats) => {
				if (err == null && itemStat.isFile()) {
					successCallback(files[index], itemStat);
				} else {
					index++;
					if (index + 1 > files.length) {
						errorCallback();
					} else {
						this.indexScriptOrFileStats(
							fullPath, files, index, successCallback, errorCallback
						);
					}
				}
			}
		);
	}
	/**
	 * @summary Create directory index.js script module instance with optional development require cache resolving:
	 */
	protected indexScriptModuleCreate (
		fullPath: string, 
		indexScript: string, 
		indexScriptModTime: number, 
		req: core.Request<core.ParamsDictionary, any, any>, 
		res: core.Response<any>
	): App.IApplication {
		var appDeclaration: App.IApplication.Constructor;
		if (this.server.IsDevelopment()) {
			var cacheKeysBeforeRequire: string[] = Object.keys(require.cache);
			appDeclaration = this.indexScriptModuleGetDeclaration(
				fullPath + '/' + indexScript
			);
			var cacheKeysAfterRequire: string[] = Object.keys(require.cache);
			if (cacheKeysBeforeRequire.length != cacheKeysAfterRequire.length) {
				var cacheKeysToWatch = Helpers.GetRequireCacheDifferenceKeys(
					cacheKeysBeforeRequire, 
					cacheKeysAfterRequire, 
					fullPath + '/' + indexScript, 
					fullPath + '/node_modules/'
				);
				//console.log("declaration keys loaded: ", cacheKeysToWatch);
				this.cache.InitRequireCacheItemsWatchHandlers(
					fullPath + '/' + indexScript, cacheKeysToWatch
				);
			}
		} else {
			appDeclaration = this.indexScriptModuleGetDeclaration(
				fullPath + '/' + indexScript
			);
		}

		var appInstance: App.IApplication = new appDeclaration(
			this.server.GetHttpServer(), 
			this.server.GetExpressApp(), 
			this.server.GetExpressSessionParser(),
			req, 
			res
		);

		this.cache.SetNewIndexScriptModuleRecord (
			appInstance,
			indexScriptModTime,
			indexScript,
			fullPath
		);
		
		return appInstance;
	}
	/**
	 * @summary Create directory index.js script module instance with optional development require cache resolving:
	 */
	protected indexScriptModuleGetDeclaration (
		modulefullPath: string
	): App.IApplication.Constructor {
		var appDeclaration: App.IApplication.Constructor = null;
		var handleMethodName: string = 'handleHttpRequest';
		var module: any = require(modulefullPath);
		if (module && module.prototype && handleMethodName in module.prototype) {
			appDeclaration = module as App.IApplication.Constructor;
		} else if (module && module.__esModule) {
			var moduleKeys: string[] = Object.keys(module);
			if (
				moduleKeys.indexOf('default') != -1 && 
				module.default &&
				module.default.prototype &&
				handleMethodName in module.default.prototype
			) {
				appDeclaration = module.default as App.IApplication.Constructor;
			} else {
				var moduleKey: string, 
					moduleItem: any;
				for (var i: number = 0, l: number = moduleKeys.length; i < l; i++) {
					moduleKey = moduleKeys[i];
					moduleItem = module[moduleKey];
					if (
						moduleItem &&
						moduleItem.prototype &&
						handleMethodName in moduleItem
					) {
						appDeclaration = moduleItem as App.IApplication.Constructor;
						break;
					}
				}
			}
		}
		if (appDeclaration === null) 
			throw new Error(
				"Cannot find `IAplication` declaration in directory index script: `" + modulefullPath + "`."
			);
		return appDeclaration;
	}
	/**
	 * @summary Process directory index.js script http request handler with optional development require cache resolving:
	 */
	protected async indexScriptModuleExecute (
		fullPath: string, 
		indexScript: string, 
		appInstance: App.IApplication, 
		req: core.Request<core.ParamsDictionary, any, any>, 
		res: core.Response<any>
	): Promise<void> {
		if (this.server.IsDevelopment()) {
			var cacheKeysBeforeRequire = Object.keys(require.cache);
			await appInstance.handleHttpRequest(
				req, res, 
			);
			var cacheKeysAfterRequire: string[] = Object.keys(require.cache);
			if (cacheKeysBeforeRequire.length != cacheKeysAfterRequire.length) {
				var cacheKeysToWatch: string[] = Helpers.GetRequireCacheDifferenceKeys(
					cacheKeysBeforeRequire, 
					cacheKeysAfterRequire, 
					fullPath + '/' + indexScript, 
					fullPath + '/node_modules/'
				);
				//console.log("handler keys loaded: ", cacheKeysToWatch);
				this.cache.InitRequireCacheItemsWatchHandlers(
					fullPath + '/' + indexScript, 
					cacheKeysToWatch
				);
			}
		} else {
			await appInstance.handleHttpRequest(
				req, res
			);
		}
	}
	
	/**
	 * @summary Go through all files and folders in current directory:
	 */
	protected renderDirContent (
		statusCode: number, 
		dirStats: fs.Stats, 
		dirItemsNames: string[], 
		reqRelPath: string, 
		fullPath: string, 
		res: core.Response<any>,
		cb: core.NextFunction,
	): void {
		var promises: Promise<void>[] = [],
			dirRows: DirItem[] = [], 
			fileRows: DirItem[] = [];
		reqRelPath = Helpers.Trim(reqRelPath, '/');
		dirItemsNames.forEach((dirItemName: string, index: number) => {
			promises.push(new Promise<void>(
				(resolve: (() => void), reject: ((reason: Error) => void)) => {
					fs.stat(
						fullPath + '/' + dirItemName, (err: Error, itemStats: fs.Stats) => {
							if (err != null) return reject(err);
							this.renderDirContentRowStats(
								reqRelPath, dirItemName, itemStats, dirRows, fileRows, resolve
							);
						}
					);
				}
			));
		});
		Promise.all(promises).then(() => {
			this.handleDirContentRows(
				statusCode, reqRelPath, fullPath, dirStats, 
				dirRows, fileRows, 
				res, cb
			);	
		});
	}
	protected renderDirContentRowStats (
		reqRelPath: string,
		dirItemName: string, 
		itemStats: fs.Stats, 
		dirRows: DirItem[], 
		fileRows: DirItem[],
		resolve: (() => void)
	): void {
		if (itemStats.isDirectory()) {
			dirRows.push(new DirItem(
				itemStats.isSymbolicLink() 
					? DirItem.TYPE_DIR | DirItem.TYPE_SYMLINK
					: DirItem.TYPE_DIR,
				dirItemName, 
				this.renderDirContentDirRow(
					reqRelPath, dirItemName, itemStats
				)
			));
		} else {
			var dirItemType: number;
			if (itemStats.isFile()) {
				dirItemType = itemStats.isSymbolicLink() 
					? DirItem.TYPE_FILE | DirItem.TYPE_SYMLINK
					: DirItem.TYPE_FILE
			} else if (itemStats.isBlockDevice()) {
				dirItemType = DirItem.TYPE_BLOCK_DEVICE;
			} else if (itemStats.isCharacterDevice()) {
				dirItemType = DirItem.TYPE_CHARACTER_DEVICE;
			} else if (itemStats.isSocket()) {
				dirItemType = DirItem.TYPE_SOCKET;
			} else if (itemStats.isFIFO()) {
				dirItemType = DirItem.TYPE_FIFO;
			}
			fileRows.push(new DirItem(
				dirItemType,
				dirItemName, 
				this.renderDirContentFileRow(
					reqRelPath, dirItemName, itemStats
				)
			));
		}
		resolve();
	}
	/**
	 * @summary Display directory content - complete directory row code for directory content:
	 */
	protected renderDirContentDirRow (
		reqRelPath: string, 
		dirItemName: string, 
		itemStats: fs.Stats
	): string {
		var baseUrl: string = this.server.GetBaseUrl();
		var hrefParts: string[] = [];
		if (baseUrl) hrefParts.push(baseUrl);
		if (reqRelPath) hrefParts.push(reqRelPath);
		hrefParts.push(Helpers.Trim(dirItemName, '/'));
		return Server.DEFAULTS.RESPONSES.CODES.DIR_ROW
			.replace('%href%', '/' + hrefParts.join('/') + '/')
			.replace('%path%', Helpers.HtmlEntitiesEncode(dirItemName))
			.replace('%date%', Helpers.FormatDate(itemStats.mtime));
	}
	/**
	 * @summary Display directory content - complete file row code for directory content:
	 */
	protected renderDirContentFileRow (
		reqRelPath: string, 
		fileItemName: string, 
		itemStats: fs.Stats = null
	): string {
		var date: Date,
			size: number = 0,
			baseUrl: string = this.server.GetBaseUrl();
		if (itemStats) {
			date = itemStats.mtime;
			size = itemStats.size;
		} else {
			date = new Date();
			date.setTime(0);
		}
		var hrefParts: string[] = [];
		if (baseUrl) hrefParts.push(baseUrl);
		if (reqRelPath) hrefParts.push(reqRelPath);
		hrefParts.push(Helpers.Trim(fileItemName, '/'));
		return Server.DEFAULTS.RESPONSES.CODES.FILE_ROW
			.replace('%href%', '/' + hrefParts.join('/'))
			.replace('%path%', Helpers.HtmlEntitiesEncode(fileItemName))
			.replace('%filesize%', Helpers.FormatFileSize(size))
			.replace('%date%', Helpers.FormatDate(date));
	}
	
	/**
	 * @summary Display directory content - send directory content html code:
	 */
	protected handleDirContentRows (
		statusCode: number, 
		path: string, 
		fullPath: string, 
		dirStats: fs.Stats, 
		dirRows: DirItem[], 
		fileRows: DirItem[], 
		res: core.Response<any>,
		cb: core.NextFunction,
	): void {
		var headerCode = '',
			listCode = '', 
			outputStr = '';
		
		dirRows.sort(Helpers.ObjectsArraySortByPathProperty);
		fileRows.sort(Helpers.ObjectsArraySortByPathProperty);
		
		if (statusCode == 200) {
			headerCode = this.handleDirReqCompleteHeader(path, fullPath, dirStats);
			if (path) {
				dirRows.unshift(new DirItem(
					DirItem.TYPE_DIR, 
					'..', 
					this.renderDirContentDirRow(path, '..', dirStats)
				));
			}
			dirRows.forEach(item => {
				listCode += item.code;
			});
			fileRows.forEach(item => {
				listCode += item.code;
			});
			outputStr = Server.DEFAULTS.RESPONSES.CODES.HTML
				.replace('%head%', Server.DEFAULTS.RESPONSES.CODES.HEAD_FOUND.replace('%fullPath%', fullPath))
				.replace('%icon%', Server.DEFAULTS.RESPONSES.ICONS.FAVICON)
				.replace('%body%', headerCode + Server.DEFAULTS.RESPONSES.CODES.LIST.replace('%tbody%', listCode));
		} else /*if (statusCode == 403)*/ {
			outputStr = Server.DEFAULTS.RESPONSES.CODES.HTML
				.replace('%head%', Server.DEFAULTS.RESPONSES.CODES.HEAD_NOT_ALLOWED)
				.replace('%icon%', Server.DEFAULTS.RESPONSES.ICONS.FAVICON)
				.replace('%body%', Server.DEFAULTS.RESPONSES.CODES.HEADER_NOT_ALLOWED);
		}
		
		if (!res.headersSent) {
			res.setHeader('Content-Type', 'text/html; charset=utf-8');
			res.writeHead(statusCode);
		}
		if (!res.finished) {
			res.write(outputStr, null, cb);
			res.end();
		} else {
			cb();	
		}
	}
	
	/**
	 * @summary Display directory content - complete heading code for directory content:
	 */
	protected handleDirReqCompleteHeader (
		path: string, 
		fullPath: string, 
		dirStats: fs.Stats
	): string {
		var headerCode: string = '', 
			pathStep: string = '', 
			pathCodes: string[] = [],
			pathExploded: string[] = path.split('/'),
			portStr: string = this.server.GetPort().toString(),
			domain: string = this.server.GetDomain();
		if (pathExploded[0] != '') {
			for (var i: number = 0, l: number = pathExploded.length; i < l; i++) {
				pathStep += ((i > 0) ? '/' : '') + pathExploded[i];
				pathCodes.push(
					'<a href="/' + 
						Helpers.HtmlEntitiesEncode(pathStep) + 
					'/">' + pathExploded[i] + '/</a> '
				);
			}
		} else {
			pathCodes = [path];
		}
		headerCode = Server.DEFAULTS.RESPONSES.CODES.HEADER_FOUND
			.replace('%domain%', Helpers.HtmlEntitiesEncode(domain))
			.replace('%port%', portStr)
			.replace('%path%', pathCodes.join(''))
			.replace('%fullPath%', fullPath)
			.replace('%lastMod%', Helpers.FormatDate(dirStats.mtime));
		return headerCode;
	}
}
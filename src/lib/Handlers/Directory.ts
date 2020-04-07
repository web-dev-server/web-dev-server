import { Stats as FsStats, stat as FsStat } from "fs";
import { resolve as PathResolve } from "path";

import { Server } from "../Server";
import { Request } from "../Request";
import { Response } from "../Response";
import { DirItem } from "./Directories/DirItem";
import { StringHelper } from "../Tools/Helpers/StringHelper";
import { NumberHelper } from "../Tools/Helpers/NumberHelper";
import { DateHelper } from "../Tools/Helpers/DateHelper";
import { IApplication } from "../Applications/IApplication";
import { IApplicationConstructor } from "../Applications/IApplicationConstructor";
import { Register } from "../Applications/Register";
import { Record } from "../Applications/Registers/Record";
import { FilesHandler } from "./File";
import { ErrorsHandler } from "./Error";


export class DirectoriesHandler {
	protected server: Server;
	protected cache: Register;
	protected filesHandler: FilesHandler;
	protected errorsHandler: ErrorsHandler;

	protected indexFiles: Map<string, number> = new Map<string, number>();
	protected indexScripts: Map<string, number> = new Map<string, number>();
	
	constructor (
		server: Server, 
		cache: Register, 
		filesHandler: FilesHandler, 
		errorsHandler: ErrorsHandler
	) {
		this.server = server;
		this.cache = cache;
		this.filesHandler = filesHandler;
		this.errorsHandler = errorsHandler;
		var scripts: string[] = this.server.GetIndexScripts(),
			files: string[] = this.server.GetIndexFiles(),
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
		fullPath: string, 
		requestPath: string, 
		dirStats: FsStats,
		dirItems: string[],
		statusCode: number, 
		req: Request, 
		res: Response
	) {
		var indexScriptsAndFiles: {
			scripts: string[];
			files: string[];
		} = DirItem.FindIndex(
			dirItems, this.indexScripts, this.indexFiles
		);
		if (indexScriptsAndFiles.scripts.length > 0) {
			// try to get stat about any index script handler
			this.indexScriptOrFileStats(
				fullPath, indexScriptsAndFiles.scripts, 0, 
				(indexFullPath: string, indexScript: string, indexScriptStat: FsStats) => {
					// index script handler
					this.HandleIndexScript(
						fullPath, indexScript, indexScriptStat.mtime.getTime(), req, res
					);
				}, 
				() => {
					if (indexScriptsAndFiles.files.length > 0) {
						// try to get stat about any index file handler
						this.indexScriptOrFileStats(
							fullPath, indexScriptsAndFiles.files, 0, 
							(indexFullPath: string, indexFile: string, indexFileStat: FsStats) => {
								// index file handler
								this.filesHandler.HandleFile(
									indexFullPath, indexFile, indexFileStat, res
								);
							}, 
							() => {
								if (!this.server.IsDevelopment()) {
									this.HandleForbidden(res);
								} else {
									// directory handler
									this.renderDirContent(
										statusCode, dirStats, dirItems, requestPath, fullPath, res
									);
								}
							}
						);
					} else {
						if (!this.server.IsDevelopment()) {
							this.HandleForbidden(res);
						} else {
							// directory handler
							this.renderDirContent(
								statusCode, dirStats, dirItems, requestPath, fullPath, res
							);
						}
					}
				}
			);
		} else if (indexScriptsAndFiles.files.length > 0) {
			this.indexScriptOrFileStats(
				fullPath, indexScriptsAndFiles.files, 0, 
				(indexFullPath: string, indexFile: string, indexFileStat: FsStats) => {
					// index file handler
					this.filesHandler.HandleFile(
						indexFullPath, indexFile, indexFileStat, res
					);
				}, 
				() => {
					if (!this.server.IsDevelopment()) {
						this.HandleForbidden(res);
					} else {
						// directory handler
						this.renderDirContent(statusCode, dirStats, dirItems, requestPath, fullPath, res);
					}
				}
			);
		} else {
			if (!this.server.IsDevelopment()) {
				this.HandleForbidden(res);
			} else {
				// directory handler
				this.renderDirContent(200, dirStats, dirItems, requestPath, fullPath, res);
			}
		}
	}
	/**
	 * @summary Process any application in index.js in directory request or on non-existing path request:
	 */
	public HandleIndexScript (
		dirFullPath: string, 
		indexScript: string, 
		indexScriptModTime: number,
		req: Request, 
		res: Response
	): void {
		(async () => {
			var cachedModule: Record = this.cache.GetIndexScriptModuleRecord(dirFullPath),
				moduleInstance: IApplication;
			// set up request before index script execution:
			// @ts-ignore
			req.setUpIndexScriptExec(
				this.server.GetDocumentRoot(), 
				dirFullPath, 
				indexScript,
				this.server.GetBasePath(),
				res
			);
			if (cachedModule != null) {
				// instance of index.js class already exists:
				if (this.server.IsDevelopment()) {
					try {
						var requireCacheKey: string = PathResolve(dirFullPath + '/' + indexScript);
						if (
							indexScriptModTime > cachedModule.modTime || 
							!require.cache[requireCacheKey]
						) {
							try {
								await cachedModule.instance.Stop(this.server);
							} catch (e1) {
								this.errorsHandler.LogError(e1, 500, req, res);
							}
							cachedModule.instance = null;
							this.cache.ClearModuleInstanceCacheAndRequireCache(dirFullPath);
							cachedModule = null;
							moduleInstance = await this.indexScriptModuleCreate(
								dirFullPath, indexScript, indexScriptModTime, req, res
							);
						} else {
							moduleInstance = cachedModule.instance;
						}
						await this.indexScriptModuleExecute(
							dirFullPath, indexScript, moduleInstance, req, res
						);
					} catch (e2) {
						this.errorsHandler
							.LogError(e2, 500, req, res)
							.PrintError(e2, 500, req, res);
						if (moduleInstance != null) {
							try {
								await moduleInstance.Stop(this.server);
							} catch (e3) {
								this.errorsHandler.LogError(e3, 500, req, res);
							}
						}
						this.cache.ClearModuleInstanceCacheAndRequireCache(dirFullPath);
					}
				} else {
					try {
						moduleInstance = cachedModule.instance;
						await this.indexScriptModuleExecute(
							dirFullPath, indexScript, moduleInstance, req, res
						);
					} catch (e4) {
						this.errorsHandler
							.LogError(e4, 500, req, res)
							.PrintError(e4, 500, req, res);
						if (moduleInstance != null) {
							try {
								await moduleInstance.Stop(this.server);
							} catch (e5) {
								this.errorsHandler.LogError(e5, 500, req, res);
							}
						}
						this.cache.ClearModuleInstanceCacheAndRequireCache(dirFullPath);
					}
				}
			} else {
				// create instance and handle request by index.js class:
				try {
					moduleInstance = await this.indexScriptModuleCreate(
						dirFullPath, indexScript, indexScriptModTime, req, res
					);
					await this.indexScriptModuleExecute(
						dirFullPath, indexScript, moduleInstance, req, res
					);
				} catch (e6) {
					this.errorsHandler
						.LogError(e6, 500, req, res)
						.PrintError(e6, 500, req, res);
					if (moduleInstance != null) {
						try {
							await moduleInstance.Stop(this.server);
						} catch (e7) {
							this.errorsHandler.LogError(e7, 500, req, res);
						}
					}
					this.cache.ClearModuleInstanceCacheAndRequireCache(dirFullPath);
				}
			}
		})();
	}
	/**
	 * @summary Render and send 403 forbidden page - do not list directory content:
	 */
	public HandleForbidden (res: Response): void {
		var outputStr = Server.DEFAULTS.RESPONSES.CODES.HTML
			.replace('%head%', Server.DEFAULTS.RESPONSES.CODES.HEAD_NOT_ALLOWED)
			.replace('%icon%', '')
			.replace('%body%', Server.DEFAULTS.RESPONSES.CODES.HEADER_NOT_ALLOWED);
		res.SetHeader('Content-Type', 'text/html')
			.SetCode(403)
			.SetEncoding('utf-8')
			.SetBody(outputStr)
			.Send();
	}

	
	/**
	 * @summary Get first index script (or index static file) file system stats:
	 */
	protected indexScriptOrFileStats (
		fullPath: string, 
		files: string[], 
		index: number, 
		successCallback: (indexFullPath: string, indexScript: string, indexScriptStats: FsStats) => void, 
		errorCallback: () => void
	): void {
		var indexFullPath: string = fullPath + '/' + files[index];
		FsStat(
			indexFullPath, (err: Error, itemStat: FsStats) => {
				if (err == null && itemStat.isFile()) {
					successCallback(indexFullPath, files[index], itemStat);
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
	protected async indexScriptModuleCreate (
		dirFullPath: string, 
		indexScript: string, 
		indexScriptModTime: number, 
		req: Request, 
		res: Response
	): Promise<IApplication> {
		var appDeclaration: IApplicationConstructor;
		if (this.server.IsDevelopment()) {
			var cacheKeysBeforeRequire: string[] = Object.keys(require.cache);
			appDeclaration = this.indexScriptModuleGetDeclaration(
				dirFullPath + '/' + indexScript
			);
			var cacheKeysAfterRequire: string[] = Object.keys(require.cache);
			if (cacheKeysBeforeRequire.length != cacheKeysAfterRequire.length) {
				var cacheKeysToWatch = Register.GetRequireCacheDifferenceKeys(
					cacheKeysBeforeRequire, 
					cacheKeysAfterRequire, 
					dirFullPath + '/' + indexScript, 
					dirFullPath + '/node_modules/'
				);
				this.cache.InitRequireCacheItemsWatchHandlers(
					dirFullPath + '/' + indexScript, cacheKeysToWatch
				);
			}
		} else {
			appDeclaration = this.indexScriptModuleGetDeclaration(
				dirFullPath + '/' + indexScript
			);
		}

		var appInstance: IApplication = new appDeclaration();
		await appInstance.Start(this.server, req, res);

		this.cache.SetNewIndexScriptModuleRecord (
			appInstance,
			indexScriptModTime,
			indexScript,
			dirFullPath
		);
		
		return appInstance;
	}
	/**
	 * @summary Create directory index.js script module instance with optional development require cache resolving:
	 */
	protected indexScriptModuleGetDeclaration (
		modulefullPath: string
	): IApplicationConstructor {
		var appDeclaration: IApplicationConstructor = null,
			startMethodName: string = 'Start',
			handleMethodName: string = 'HttpHandle',
			stopMethodName: string = 'Stop',
			module: any = require(modulefullPath);
		if (module && module.prototype && handleMethodName in module.prototype) {
			appDeclaration = module as IApplicationConstructor;
		} else if (module && module.__esModule) {
			var moduleKeys: string[] = Object.keys(module);
			var moduleDefaultPrototype = module.default && module.default.prototype
				? module.default.prototype
				: {};
			if (
				moduleKeys.indexOf('default') != -1 && 
				moduleDefaultPrototype && (
					startMethodName in moduleDefaultPrototype ||
					handleMethodName in moduleDefaultPrototype ||
					stopMethodName in moduleDefaultPrototype
				)
			) {
				appDeclaration = module.default as IApplicationConstructor;
			} else {
				var moduleKey: string, 
					moduleItem: any;
				for (var i: number = 0, l: number = moduleKeys.length; i < l; i++) {
					moduleKey = moduleKeys[i];
					moduleItem = module[moduleKey];
					if (
						moduleItem &&
						moduleItem.prototype && (
							startMethodName in moduleItem ||
							handleMethodName in moduleItem ||
							stopMethodName in moduleItem
						)
					) {
						appDeclaration = moduleItem as IApplicationConstructor;
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
		appInstance: IApplication, 
		req: Request, 
		res: Response
	): Promise<void> {
		if (this.server.IsDevelopment()) {
			var cacheKeysBeforeRequire = Object.keys(require.cache);
			await appInstance.HttpHandle(
				req, res, 
			);
			var cacheKeysAfterRequire: string[] = Object.keys(require.cache);
			if (cacheKeysBeforeRequire.length != cacheKeysAfterRequire.length) {
				var cacheKeysToWatch: string[] = Register.GetRequireCacheDifferenceKeys(
					cacheKeysBeforeRequire, 
					cacheKeysAfterRequire, 
					fullPath + '/' + indexScript, 
					fullPath + '/node_modules/'
				);
				this.cache.InitRequireCacheItemsWatchHandlers(
					fullPath + '/' + indexScript, 
					cacheKeysToWatch
				);
			}
		} else {
			await appInstance.HttpHandle(
				req, res
			);
		}
	}
	
	/**
	 * @summary Go through all files and folders in current directory:
	 */
	protected renderDirContent (
		statusCode: number, 
		dirStats: FsStats, 
		dirItemsNames: string[], 
		reqRelPath: string, 
		fullPath: string, 
		res: Response
	): void {
		var promises: Promise<void>[] = [],
			dirRows: DirItem[] = [], 
			fileRows: DirItem[] = [];
		reqRelPath = StringHelper.Trim(reqRelPath, '/');
		dirItemsNames.forEach((dirItemName: string, index: number) => {
			promises.push(new Promise<void>(
				(resolve: (() => void), reject: ((reason: Error) => void)) => {
					FsStat(
						fullPath + '/' + dirItemName, (err: Error, itemStats: FsStats) => {
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
				res
			);	
		});
	}
	protected renderDirContentRowStats (
		reqRelPath: string,
		dirItemName: string, 
		itemStats: FsStats, 
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
		itemStats: FsStats
	): string {
		var baseUrl: string = this.server.GetBasePath();
		var hrefParts: string[] = [];
		if (baseUrl) hrefParts.push(baseUrl);
		if (reqRelPath) hrefParts.push(reqRelPath);
		hrefParts.push(StringHelper.Trim(dirItemName, '/'));
		return Server.DEFAULTS.RESPONSES.CODES.DIR_ROW
			.replace('%href%', '/' + hrefParts.join('/') + '/')
			.replace('%path%', StringHelper.HtmlEntitiesEncode(dirItemName))
			.replace('%date%', DateHelper.FormatForDirOutput(itemStats.mtime));
	}
	/**
	 * @summary Display directory content - complete file row code for directory content:
	 */
	protected renderDirContentFileRow (
		reqRelPath: string, 
		fileItemName: string, 
		itemStats: FsStats = null
	): string {
		var date: Date,
			size: number = 0,
			baseUrl: string = this.server.GetBasePath();
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
		hrefParts.push(StringHelper.Trim(fileItemName, '/'));
		return Server.DEFAULTS.RESPONSES.CODES.FILE_ROW
			.replace('%href%', '/' + hrefParts.join('/'))
			.replace('%path%', StringHelper.HtmlEntitiesEncode(fileItemName))
			.replace('%filesize%', NumberHelper.FormatFileSize(size))
			.replace('%date%', DateHelper.FormatForDirOutput(date));
	}
	
	/**
	 * @summary Display directory content - send directory content html code:
	 */
	protected handleDirContentRows (
		statusCode: number, 
		path: string, 
		fullPath: string, 
		dirStats: FsStats, 
		dirRows: DirItem[], 
		fileRows: DirItem[], 
		res: Response
	): void {
		var headerCode = '',
			listCode = '', 
			outputStr = '';
		
		dirRows.sort(DirItem.SortByPath);
		fileRows.sort(DirItem.SortByPath);
		
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
				.replace('%head%', Server.DEFAULTS.RESPONSES.CODES.HEAD_FOUND
					.replace('%fullPath%', fullPath)
				)
				.replace('%icon%', Server.DEFAULTS.RESPONSES.ICONS.FAVICON)
				.replace('%body%', headerCode + Server.DEFAULTS.RESPONSES.CODES.LIST
					.replace('%tbody%', listCode)
				);
		} else /*if (statusCode == 403)*/ {
			outputStr = Server.DEFAULTS.RESPONSES.CODES.HTML
				.replace('%head%', Server.DEFAULTS.RESPONSES.CODES.HEAD_NOT_ALLOWED)
				.replace('%icon%', Server.DEFAULTS.RESPONSES.ICONS.FAVICON)
				.replace('%body%', Server.DEFAULTS.RESPONSES.CODES.HEADER_NOT_ALLOWED);
		}
		
		res.SetHeader('Content-Type', 'text/html')
			.SetEncoding('utf-8')
			.SetCode(statusCode)
			.SetBody(outputStr)
			.Send();
	}
	
	/**
	 * @summary Display directory content - complete heading code for directory content:
	 */
	protected handleDirReqCompleteHeader (
		path: string, 
		fullPath: string, 
		dirStats: FsStats
	): string {
		var headerCode: string = '', 
			pathStep: string = '', 
			pathCodes: string[] = [],
			pathExploded: string[] = path.split('/'),
			portStr: string = this.server.GetPort().toString(),
			domain: string = this.server.GetHostname();
		if (pathExploded[0] != '') {
			for (var i: number = 0, l: number = pathExploded.length; i < l; i++) {
				pathStep += ((i > 0) ? '/' : '') + pathExploded[i];
				pathCodes.push(
					'<a href="/' + 
						StringHelper.HtmlEntitiesEncode(pathStep) + 
					'/">' + pathExploded[i] + '/</a> '
				);
			}
		} else {
			pathCodes = [path];
		}
		headerCode = Server.DEFAULTS.RESPONSES.CODES.HEADER_FOUND
			.replace('%domain%', StringHelper.HtmlEntitiesEncode(domain))
			.replace('%port%', portStr)
			.replace('%path%', pathCodes.join(''))
			.replace('%fullPath%', fullPath)
			.replace('%lastMod%', DateHelper.FormatForDirOutput(dirStats.mtime));
		return headerCode;
	}
}
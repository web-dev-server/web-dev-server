import {
	Server as HttpServer,
	RequestListener as HttpRequestListener,
	ServerOptions as HttpServerOptions,
	createServer as HttpCreateServer,
	IncomingMessage as HttpIncomingMessage
} from "http";
import {
	Stats as FsStats,
	readdir as FsReadDir,
	stat as FsStat
} from "fs";
import { resolve as PathResolve } from "path";
import { parse as UrlParse } from "url";

import { StringHelper } from "./Tools/Helpers/StringHelper";
import { Defaults } from "./Handlers/Defaults";
import { Cache } from "./Applications/Cache";
import { Record } from "./Applications/Caches/Record";
import { ErrorsHandler } from "./Handlers/Error";
import { FilesHandler } from "./Handlers/File";
import { DirectoriesHandler } from "./Handlers/Directory";

import { Event } from "./Event";
import { Request } from "./Request";
import { Response } from "./Response";


export * from "./Request";
export * from "./Response";
export * from "./Event";
export * from "./Tools/Namespace";

export * from "./Applications/Namespace";


export class Server {
	public static VERSION: string = '2.2.0';
	public static DEFAULTS: {
		PORT: number, DOMAIN: string, RESPONSES: typeof Defaults
	} = {
		PORT: 8000,
		DOMAIN: '127.0.0.1',
		RESPONSES: Defaults
	};
	public static SESSION: {
		HASH: string; ID_MAX_AGE: number;
	} = {
		HASH: "35$%d9wZfw256SAsMGá/@#$%&",
		ID_MAX_AGE: 3600 // hour
	};
	public static INDEX: {
		SCRIPTS: string[]; FILES: string[];
	} = {
		SCRIPTS: ['index.js'],
		FILES: ['index.html','index.htm','default.html','default.htm']
	};
	
	protected documentRoot?: string = null;
	protected basePath?: string = null;
	protected port?: number = null;
	protected hostName?: string = null;
	protected development: boolean = true;

	protected httpServer?: HttpServer = null;
	protected customServerHandler?: HttpRequestListener = null;
	protected cache?: Cache = null;
	protected errorsHandler?: ErrorsHandler = null;
	protected filesHandler?: FilesHandler = null;
	protected directoriesHandler?: DirectoriesHandler = null;
	
	protected customErrorHandler?: (err: Error, code: number, req?: Request, res?: Response) => Promise<void> = null;
	protected customHttpPreHandlers: ((req: Request, res: Response, event: Event) => Promise<void>)[] = [];
	protected forbiddenPaths: string[] | RegExp[] = [
		'/node_modules', 
		/\/package(-lock)?\.json/g,
		/\/tsconfig\.json/g,
		/\/\.([^\.]+)/g
	] as string[] | RegExp[];
	
	/**
	 * @summary Create new server instance (no singleton implementation).
	 */
	public static CreateNew (): Server {
		return new Server();
	}

	/**
	 * @summary Set development mode, `true` by default. If `true`, directories contents and errors are displayed, `false` otherwise.
	 * @param development If `true`, directories contents and errors are displayed, `false` otherwise.
	 */
	public SetDevelopment (development: boolean): Server {
		this.development = development;
		return this;
	}
	/**
	 * @summary Set http server IP or domain to listening on, `127.0.0.1` by default.
	 * @param hostname Server ip or domain to listening on.
	 */
	public SetHostname (hostname: string): Server {
		this.hostName = hostname;
		return this;
	}
	/**
	 * @summary Set http server port number, `8000` by default.
	 * @param port Server port to listening on.
	 */
	public SetPort (port: number): Server {
		this.port = port;
		return this;
	}
	/**
	 * @summary Set http server root directory, required
	 * @param dirname Server root directory as absolute path.
	 */
	public SetDocumentRoot (dirname: string): Server {
		this.documentRoot = StringHelper.TrimRight(PathResolve(dirname).replace(/\\/g, '/'), '/');
		return this;
	}
	/**
	 * @summary Set http server base path, not required
	 * @param basePath Base path (proxy path, if you are running the server under proxy).
	 */
	public SetBasePath (basePath: string): Server {
		this.basePath = StringHelper.Trim(basePath.replace(/\\/g, '/'), '/');
		return this;
	}
	public SetServerHandler (httpHandler: HttpRequestListener): Server {
		this.customServerHandler = httpHandler;
		return this;
	}
	/**
	 * @summary Set custom error handler for uncatched errors and warnings
	 * @param errorHandler Custom handler called on any uncatched error.
	 */
	public SetErrorHandler (
		errorHandler: (
			err: Error, 
			code: number, 
			req?: Request, 
			res?: Response
		) => Promise<void>
	): Server {
		this.customErrorHandler = errorHandler;
		return this;
	}
	/**
	 * Set forbidden request paths to prevent requesting dangerous places (`["/node_modules", /\/package\.json/g, /\/tsconfig\.json/g, /\/\.([^\.]+)/g]` by default). All previous configuration will be overwritten.
	 * @param forbiddenPaths Forbidden request path begins or regular expression patterns.
	 */
	public SetForbiddenPaths (forbiddenPaths: string[] | RegExp[]): Server {
		this.forbiddenPaths = forbiddenPaths;
		return this;
	}
	/**
	 * Aet forbidden request paths to prevent requesting dangerous places (`["/node_modules", /\/package\.json/g, /\/tsconfig\.json/g, /\/\.([^\.]+)/g]` by default).
	 * @param forbiddenPaths Forbidden request path begins or regular expression patterns.
	 */
	public AddForbiddenPaths (forbiddenPaths: string[] | RegExp[]): Server {
		this.forbiddenPaths = [].concat(this.forbiddenPaths, forbiddenPaths);
		return this;
	}
	/**
	 * @summary Add custom express http handler
	 * @param handler Custom http request handler called every allowed request path before standard server handling.
	 */
	public AddPreHandler (
		handler: (
			req: Request, 
			res: Response, 
			event: Event
		) => Promise<void>
	): Server {
		this.customHttpPreHandlers.push(handler);
		return this;
	}

	/**
	 * @summary Return `true` if development flag is used.
	 */
	public IsDevelopment (): boolean {
		return this.development;
	}
	/**
	 * @summary Return configured domain or ip address.
	 */
	public GetHostname (): string {
		return this.hostName;
	}
	/**
	 * @summary Return configured port number.
	 */
	public GetPort (): number {
		return this.port;
	}
	/**
	 * @summary Return configured document root directory full path.
	 */
	public GetDocumentRoot (): string {
		return this.documentRoot;
	}
	/**
	 * @summary Return configured base url.
	 */
	public GetBasePath (): string {
		return this.basePath;
	}
	/**
	 * @summary Return configured custom errors handler.
	 */
	public GetErrorHandler (): ((err: Error, code: number, req?: Request, res?: Response) => Promise<void>) | null {
		return this.customErrorHandler;
	}
	/**
	 * Get forbidden request paths to prevent requesting dangerous places.
	 */
	public GetForbiddenPaths (): string[] | RegExp[] {
		return this.forbiddenPaths;
	}
	/**
	 * @summary Return used http server instance
	 */
	public GetHttpServer (): HttpServer | null {
		return this.httpServer;
	}

	/**
	 * @summary Try to find cached record by server document root and requested path
	 * 			and return directory full path from the cache record.
	 * @param rawRequestUrl Raw requested path.
	 */
	public TryToFindIndexPath (rawRequestUrl: string): string[] | null {
		var result: string[] = [];
		var qmPos: number = rawRequestUrl.indexOf('?');
		if (qmPos !== -1)
			rawRequestUrl = rawRequestUrl.substr(0, qmPos);
		var searchingRequestPaths: string[] = this.getSearchingRequestPaths(rawRequestUrl);
		var parentDirIndexScriptModule: Record = this.cache
			.TryToFindParentDirectoryIndexScriptModule(searchingRequestPaths);
		if (parentDirIndexScriptModule !== null) 
			result = [
				parentDirIndexScriptModule.dirFullPath,
				parentDirIndexScriptModule.scriptName
			];
		return result;
	}

	/**
	 * @summary Start HTTP server
	 */
	public Run(callback: (success: boolean, error?: Error) => void = null): Server {
		this.documentRoot = PathResolve(this.documentRoot || __dirname).replace(/\\/g, '/');
		this.port = this.port || Server.DEFAULTS.PORT;
		this.hostName = this.hostName || Server.DEFAULTS.DOMAIN;

		this.cache = new Cache(this);
		this.errorsHandler = new ErrorsHandler(this, this.cache);
		this.filesHandler = new FilesHandler(this.errorsHandler);
		this.directoriesHandler = new DirectoriesHandler(
			this, this.cache, this.filesHandler, this.errorsHandler
		);

		var serverOptions: HttpServerOptions = {
			// @ts-ignore
			IncomingMessage: Request,
			// @ts-ignore
			ServerResponse: Response
		};
		if (this.customServerHandler !== null) {
			this.httpServer = HttpCreateServer(serverOptions, this.customServerHandler);
		} else {
			this.httpServer = HttpCreateServer(serverOptions);
		}
		this.httpServer.on('request', async (req: Request, res: Response) => {
			await this.handleReq(req, res);
		});
		this.httpServer.on('error', (err: Error) => {
			if (!callback) {
				console.error(err);
			} else {
				callback(false, err);
				callback = null;
			}
		});
		this.httpServer['__wds'] = this;
		this.httpServer.listen(this.port, this.hostName, () => {
			if (!callback) {
				console.info(
					"HTTP server has been started at: 'http://" + this.hostName + ":" 
					+ this.port.toString() + "' to serve directory: \n'" + this.documentRoot 
					+ "'.\nEnjoy browsing:-) To stop the server, pres CTRL + C or close this command line window."
				);
			} else {
				callback(true, null);
				callback = null;
			}
		});
		return this;
	}

	/**
	 * @summary Handle all HTTP requests
	 */
	protected async handleReq (
		req: Request,
		res: Response
	): Promise<void> {
		// prepare path and full path
		var httpReq: HttpIncomingMessage = req as any;
		var requestPath: string = '/' + StringHelper.Trim(
			UrlParse(httpReq.url).pathname, '/'
		);
		/*console.log([
			requestPath,
			req.GetRequestPath()
		]);*/
		
		var qmPos: number = requestPath.indexOf('?');
		if (qmPos !== -1)
			requestPath = requestPath.substr(0, qmPos);
		
		var pathAllowed: boolean = this.isPathAllowed('/' + requestPath);
		if (!pathAllowed) {
			return this.directoriesHandler.HandleForbidden(res);
		}

		var fullPathVirtual: string = PathResolve(this.documentRoot + requestPath).replace(/\\/g, '/');
		fullPathVirtual = StringHelper.TrimRight(fullPathVirtual, '/');

		if (this.development) 
			this.errorsHandler.SetHandledRequestProperties(req, res);

		(async () => {
			if (this.customHttpPreHandlers.length > 0) {
				var event: Event = new Event(req, res, fullPathVirtual),
					preHandler: (req: Request, res: Response, event: Event) => Promise<void>;
				for (var i: number = 0, l: number = this.customHttpPreHandlers.length; i < l; i++) {
					preHandler = this.customHttpPreHandlers[i];
					try {
						await preHandler.call(null, req, res, event);
					} catch (err) {
						this.errorsHandler.PrintError(err, req, res, 500);
						event.PreventDefault();
					}
					if (event.IsPreventDefault()) break;
				}
				if (event.IsPreventDefault()) return;
			}
			var err: NodeJS.ErrnoException = null;
			var stats: FsStats = await new Promise<FsStats>((resolve, reject) => {
				FsStat(fullPathVirtual, (errLocal: NodeJS.ErrnoException, stats: FsStats) => {
					if (errLocal) err = errLocal;
					resolve(stats);
				});
			});

			if (stats) {
				this.handleReqExistingPath(fullPathVirtual, requestPath, stats, req, res);
			} else if (err && err.code == 'ENOENT') {
				this.handleReqNonExistingPath(requestPath, req, res);
			} else {
				this.errorsHandler.PrintError(err);
			}
		})();
	}
	/**
	 * Get if path is allowed by `this.forbiddenPaths` configuration.
	 * @param path Path including start slash, excluding base url and excluding params.
	 */
	protected isPathAllowed (path: string): boolean {
		var result: boolean = true,
			beginPath: string,
			regExp: RegExp,
			match: RegExpMatchArray;
		for (var i: number = 0, l: number = this.forbiddenPaths.length; i < l; i++) {
			if (this.forbiddenPaths[i] instanceof RegExp) {
				regExp = this.forbiddenPaths[i] as RegExp;
				match = path.match(regExp);
				if (match !== null && match.length > 0) {
					result = false;
					break;
				}
			} else {
				beginPath = this.forbiddenPaths[i].toString();
				if (path.indexOf(beginPath) === 0) {
					result = false;
					break;
				}
			}
		}
		return result;
	}
	/**
	 * @summary Process request content found
	 */
	protected handleReqExistingPath (
		fullPath: string, 
		requestPath: string, 
		stats: FsStats, 
		req: Request, 
		res: Response
	): void {
		if (stats.isDirectory()) {
			var httpReq: HttpIncomingMessage = req as any;
			var originalPathname: string = UrlParse(httpReq.url, false).pathname;
			if (originalPathname.charAt(originalPathname.length - 1) !== '/') {
				res.Redirect(originalPathname + '/', 301, "Correcting directory request", true);
			} else {
				FsReadDir(
					fullPath, (err: Error, dirItems: string[]) => {
						if (err != null) 
							return this.errorsHandler.PrintError(err, req, res, 403);
						this.directoriesHandler.HandleDirectory(
							fullPath, requestPath, stats, dirItems, 200, req, res
						)
					}
				);
			}
		} else if (stats.isFile()) {
			var dirFullPath: string, fileName: string, lastSlashPos: number;
			fullPath = StringHelper.TrimRight(fullPath, '/');
			lastSlashPos = fullPath.lastIndexOf('/');
			if (lastSlashPos !== -1) {
				fileName = fullPath.substr(lastSlashPos + 1);
				dirFullPath = fullPath.substr(0, lastSlashPos);
			} else {
				fileName = fullPath;
				dirFullPath = '';
			}
			if (Server.INDEX.SCRIPTS.indexOf(fileName) != -1) {
				this.directoriesHandler.HandleIndexScript(
					dirFullPath, fileName, stats.mtime.getTime(), req, res
				);
			} else {
				this.filesHandler.HandleFile(
					fullPath, fileName, stats, res
				);
			}
		}/* else (
			stats.isBlockDevice() || 
			stats.isCharacterDevice() || 
			stats.isSymbolicLink() || 
			stats.isFIFO() || 
			stats.isSocket()
		) {
			cb();
		}*/
	}
	/**
	 * @summary Display error 500/404 (and try to list first existing parent folder content):
	 */
	protected handleReqNonExistingPath (
		requestPath: string, 
		req: Request, 
		res: Response
	) {
		var searchingRequestPaths: string[] = this.getSearchingRequestPaths(requestPath);
		
		var parentDirIndexScriptModule: Record = this.cache
			.TryToFindParentDirectoryIndexScriptModule(searchingRequestPaths);

		if (parentDirIndexScriptModule != null) {
			if (!this.development) {
				this.directoriesHandler.HandleIndexScript(
					parentDirIndexScriptModule.dirFullPath, 
					parentDirIndexScriptModule.scriptName, 
					parentDirIndexScriptModule.modTime, 
					req, res
				);
			} else {
				FsStat(parentDirIndexScriptModule.dirFullPath, (err: Error, stats: FsStats) => {
					if (err) {
						return console.error(err);
					}
					this.directoriesHandler.HandleIndexScript(
						parentDirIndexScriptModule.dirFullPath, 
						parentDirIndexScriptModule.scriptName, 
						stats.mtime.getTime(), 
						req, res
					);
				});
			}
			
		} else {
			this.handleReqNonExistPath(
				searchingRequestPaths, 0, 
				(newFullPath: string, newRequestPath: string, foundParentDirStats: FsStats) => {
					FsReadDir(
						newFullPath, 
						(err: Error, dirItems: string[]) => {
							if (err != null) 
								return this.errorsHandler.PrintError(err, req, res, 403);
							this.directoriesHandler.HandleDirectory(
								newFullPath, newRequestPath, foundParentDirStats, dirItems, 404, req, res
							)
						}
					);
				}, 
				(err: Error) => {
					var error: Error = null;
					try {
						throw new Error("Path not found: `" + requestPath + "`.");
					} catch (e) {
						error = e;
					}
					this.errorsHandler.PrintError(error, req, res, 404);
				}
			);
		}
	}
	/**
	 * @summary Try to get file system directory stats - recursively on first existing parent directory.
	 */
	protected handleReqNonExistPath (
		pathsToFound: string[], 
		index: number, 
		successCallback: (newFullPath: string, newRequestPath: string, dirStats: FsStats) => void, 
		errorCallback: (err: Error) => void
	): void {
		var pathToFound: string = pathsToFound[index];
		var newRequestPath = StringHelper.TrimLeft(pathToFound, '/');
		FsStat(
			this.documentRoot + pathToFound, 
			(err: NodeJS.ErrnoException, dirStats: FsStats) => {
				if (err == null) {
					var newFullPath: string = StringHelper.TrimRight(
						this.documentRoot + '/' + newRequestPath, '/'
					);
					successCallback(newFullPath, newRequestPath, dirStats);
				} else {
					index += 1;
					if (index == pathsToFound.length) {
						errorCallback(err);
					} else {
						this.handleReqNonExistPath(pathsToFound, index, successCallback, errorCallback);
					}
				}
			}
		);
	}

	protected getSearchingRequestPaths (requestPath: string): string[] {
		var pathExploded: string[] = StringHelper.Trim(requestPath, '/').split('/'),
			searchingRequestPath: string = '',
			searchingRequestPaths: string[] = [];
		pathExploded.forEach((item: string) => {
			searchingRequestPath += '/' + item;
			searchingRequestPaths.push(searchingRequestPath);
		});
		searchingRequestPaths.reverse();
		if (searchingRequestPaths.length === 1 && searchingRequestPaths[0] != '/')
			searchingRequestPaths.push('/');
		return searchingRequestPaths;
	}
}
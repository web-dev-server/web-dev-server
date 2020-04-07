import {
	Server as HttpServer,
	RequestListener as HttpRequestListener,
	ServerOptions as HttpServerOptions,
	createServer as HttpCreateServer,
	IncomingMessage as HttpIncomingMessage
} from "http";
import { Socket } from "net";
import {
	Stats as FsStats,
	readdir as FsReadDir,
	stat as FsStat
} from "fs";
import { resolve as PathResolve } from "path";
import { parse as UrlParse } from "url";

import { StringHelper } from "./Tools/Helpers/StringHelper";
import { Defaults } from "./Handlers/Defaults";
import { Register } from "./Applications/Register";
import { Record } from "./Applications/Registers/Record";
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
export * from "./Applications/IApplication";


import { Session as _Session } from "./Applications/Session";
export class Session extends _Session {};

import { INamespace as _INamespace } from "./Applications/Sessions/INamespace";
export namespace Session { 
	export interface INamespace extends _INamespace {};
}


export class Server {
	public static readonly VERSION: string = '3.0.0';
	public static readonly STATES: {
		CLOSED: number, STARTING: number, CLOSING: number, STARTED: number
	} = {
		CLOSED: 0, STARTING: 1, CLOSING: 2, STARTED: 4
	}
	public static DEFAULTS: {
		PORT: number, DOMAIN: string, RESPONSES: typeof Defaults
	} = {
		PORT: 8000,
		DOMAIN: '127.0.0.1',
		RESPONSES: Defaults
	};
	
	protected state: number = 0;
	protected documentRoot?: string = null;
	protected basePath?: string = null;
	protected port?: number = null;
	protected hostName?: string = null;
	protected development: boolean = true;
	protected indexes: {
		scripts: string[]; files: string[];
	} = {
		scripts: ['index.js'],
		files: ['index.html','index.htm','default.html','default.htm']
	};

	protected httpServer?: HttpServer = null;
	protected netSockets?: Set<Socket> = null;
	protected customServerHandler?: HttpRequestListener = null;
	protected register?: Register = null;
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
		this.basePath = StringHelper.TrimRight(basePath.replace(/\\/g, '/'), '/');
		return this;
	}
	/**
	 * @summary Set custom http server handler like express module.
	 * @see https://stackoverflow.com/a/17697134/7032987
	 * @param httpHandler
	 */
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
	 * Add forbidden request paths to prevent requesting dangerous places (`["/node_modules", /\/package\.json/g, /\/tsconfig\.json/g, /\/\.([^\.]+)/g]` by default).
	 * @param forbiddenPaths Forbidden request path begins or regular expression patterns.
	 */
	public AddForbiddenPaths (forbiddenPaths: string[] | RegExp[]): Server {
		this.forbiddenPaths = [].concat(this.forbiddenPaths, forbiddenPaths);
		return this;
	}
	/**
	 * Set directory index/default server script file names executed on server side as directory content.
	 * All previous configuration will be replaced. 
	 * Default value is: `['index.js']`.
	 * @param indexScripts Array of file names like `['index.js', 'default.js', 'app.js', ...]`.
	 */
	public SetIndexScripts (indexScripts: string[]): Server {
		this.indexes.scripts = indexScripts;
		return this;
	}
	/**
	 * Add directory index/default server script file names executed on server side as directory content.
	 * Default value is: `['index.js']`.
	 * @param indexScripts Array of file names like `['default.js', 'app.js', ...]`.
	 */
	public AddIndexScripts (indexScripts: string[]): Server {
		this.indexes.scripts = [].concat(this.indexes.scripts, indexScripts);
		return this;
	}
	/**
	 * Set directory index/default server file names staticly send to client as default directory content.
	 * All previous configuration will be replaced. 
	 * Default value is: `['index.html','index.htm','default.html','default.htm']`.
	 * @param indexFiles Array of file names like `['index.html','index.htm','default.html','default.htm', 'directory.html', ...]`.
	 */
	public SetIndexFiles (indexFiles: string[]): Server {
		this.indexes.files = indexFiles;
		return this;
	}
	/**
	 * Add directory index/default server file names staticly send to client as default directory content.
	 * Default value is: `['index.html','index.htm','default.html','default.htm']`.
	 * @param indexFiles Array of file names like `['directory.html', 'directory.htm', ...]`.
	 */
	public AddIndexFiles (indexFiles: string[]): Server {
		this.indexes.files = [].concat(this.indexes.scripts, indexFiles);
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
	 * Get directory index/default server script file names executed on server side as directory content.
	 * Default value is: `['index.js']`.
	 */
	public GetIndexScripts (): string[] {
		return this.indexes.scripts;
	}
	/**
	 * Get directory index/default server file names staticly send to client as default directory content.
	 * Default value is: `['index.html','index.htm','default.html','default.htm']`.
	 */
	public GetIndexFiles (): string[] {
		return this.indexes.files;
	}
	/**
	 * @summary Return used http server instance.
	 */
	public GetHttpServer (): HttpServer | null {
		return this.httpServer;
	}
	/**
	 * @summary Return set of connected sockets.
	 */
	public GetNetSockets (): Set<Socket> {
		return this.netSockets;
	}
	/**
	 * @summary Return server running state (`Server.STATES.<state>`).
	 */
	public GetState (): number {
		return this.state;
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
		var parentDirIndexScriptModule: Record = this.register
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
	public Start (callback?: (success?: boolean, error?: Error) => void): Server {
		if (this.state !== Server.STATES.CLOSED) return this;
		this.state = Server.STATES.STARTING;
		this.documentRoot = PathResolve(this.documentRoot || __dirname).replace(/\\/g, '/');
		this.port = this.port || Server.DEFAULTS.PORT;
		this.hostName = this.hostName || Server.DEFAULTS.DOMAIN;

		this.register = new Register(this);
		this.errorsHandler = new ErrorsHandler(this, this.register);
		this.filesHandler = new FilesHandler(this.errorsHandler);
		this.directoriesHandler = new DirectoriesHandler(
			this, this.register, this.filesHandler, this.errorsHandler
		);

		this.netSockets = new Set<Socket>();

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
		
		this.httpServer.on('connection', (socket: Socket) => {
			this.netSockets.add(socket);
			socket.on('close', () => this.netSockets.delete(socket));
		});
		this.httpServer.on('close', async (req: Request, res: Response) => {
			if (this.state === Server.STATES.CLOSING) return;
			this.state = Server.STATES.CLOSING;
			this.stopHandler(callback);
		});
		this.httpServer.on('request', async (req: Request, res: Response) => {
			await this.handleReq(req, res);
		});
		this.httpServer.on('error', (err: Error) => {
			this.state = Server.STATES.CLOSED;
			if (!callback) {
				console.error(err);
			} else {
				callback(false, err);
				callback = null;
			}
		});
		this.httpServer['__wds'] = this;
		this.httpServer.listen(this.port, this.hostName, () => {
			this.state = Server.STATES.STARTED;
			if (!callback) {
				console.info(
					"HTTP server has been started. \n" + 
					"(`" + this.documentRoot + "` => `http://" + this.hostName + ":" + this.port.toString() + "`)."
				);
			} else {
				callback(true, null);
				callback = null;
			}
		});
		return this;
	}

	/**
	 * @summary Close all registered app instances, close and destroy all connected sockets and stop http server.
	 * @param callback 
	 */
	public Stop (callback?: (success?: boolean, error?: Error) => void): Server {
		if (this.state !== Server.STATES.STARTED) return this;
		this.state = Server.STATES.CLOSING;
		this.stopHandler(callback);
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
		
		/*var httpReq: HttpIncomingMessage = req as any;
		var requestPath: string = '/' + StringHelper.Trim(
			UrlParse(httpReq.url).pathname, '/'
		);*/
		var basePath: string = req.GetBasePath();
		if (this.basePath != null) 
			basePath = basePath.substr(this.basePath.length);
		var requestPath = basePath + req.GetRequestPath();
		
		requestPath = StringHelper.DecodeUri(requestPath);
		
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
						this.errorsHandler
							.LogError(err, 500, req, res)
							.PrintError(err, 500, req, res);
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
	 * @summary Close all registered app instances, close and destroy all connected sockets and stop http server.
	 * @param callback 
	 */
	protected stopHandler (callback?: (success?: boolean, error?: Error) => void): void {
		this.register.StopAll(() => {
			this.netSockets.forEach (socket => {
				socket.destroy();
				this.netSockets.delete(socket);
			});
			this.httpServer.close((err?: Error) => {
				this.state = Server.STATES.CLOSED;
				if (!callback) {
					console.info(
						"HTTP server has been closed. \n" + 
						"(`http://" + this.hostName + ":" + this.port.toString() + "`)."
					);
				} else {
					callback(err == null, err);
				}
			});
		});
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
						if (err != null) {
							this.errorsHandler
								.LogError(err, 403, req, res)
								.PrintError(err, 403, req, res);
							return;
						}
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
			if (this.indexes.scripts.indexOf(fileName) != -1) {
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
		
		var parentDirIndexScriptModule: Record = this.register
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
							if (err != null) {
								this.errorsHandler
									.LogError(err, 403, req, res)
									.PrintError(err, 403, req, res);
								return;
							}
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
					this.errorsHandler
						.LogError(error, 404, req, res)
						.PrintError(error, 404, req, res);
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
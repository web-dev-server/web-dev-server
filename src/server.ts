import * as http from "http";
import fs from "fs";
import pathUtil from "path";
import urlUtil from "url";

import * as core from "express-serve-static-core";
import * as express from "express";
import * as session from "express-session";

import { Helpers } from "./helpers"
import { DefaultResponses } from "./default-responses"
import { Cache, CacheRecord } from "./cache"
import { ErrorsHandler } from "./errors-handler"
import { FilesHandler } from "./files-handler"
import { DirectoriesHandler } from "./directories-handler"

import * as Evnt from "./event"

export * from "./application"
export * from "./event"
export * from "./logger"

export class Server {
	public static VERSION: string = '2.0.0';
	public static DEFAULTS: {
		PORT: number, DOMAIN: string, RESPONSES: typeof DefaultResponses
	} = {
		PORT: 8000,
		DOMAIN: '127.0.0.1',
		RESPONSES: DefaultResponses
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
	}
	public static FILE_SIZE: {
		THRESH: number; UNITS: string[];
	} = {
		THRESH: 1000,
		UNITS: ['KB','MB','GB','TB','PB','EB','ZB','YB'],
	}
	
	protected documentRoot?: string = null;
	protected baseUrl?: string = null;
	protected sessionMaxAge?: number = null;
	protected sessionHashSalt?: string = null;
	protected port?: number = null;
	protected domain?: string = null;
	protected development: boolean = true;

	protected httpServer?: http.Server = null;
	protected expressApp?: core.Express = null;
	protected sessionParser?: express.RequestHandler<core.ParamsDictionary> = null;
	protected cache?: Cache = null;
	protected errorsHandler?: ErrorsHandler = null;
	protected filesHandler?: FilesHandler = null;
	protected directoriesHandler?: DirectoriesHandler = null;
	
	protected customErrorHandler?: (e: Error, code: number, req?: core.Request<core.ParamsDictionary, any, any>, res?: core.Response<any>) => void = null;
	protected customHttpHandlers: ((req: core.Request<core.ParamsDictionary, any, any>, res: core.Response<any>, e: Evnt.Event, cb: core.NextFunction) => void)[] = [];
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
	 * @param domain Server ip or domain to listening on.
	 */
	public SetDomain (domain: string): Server {
		this.domain = domain;
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
		this.documentRoot = pathUtil.resolve(dirname).replace(/\\/g, '/');
		return this;
	}
	/**
	 * @summary Set http server base path, not required
	 * @param baseUrl Base path (proxy path, if you are running the server under proxy).
	 */
	public SetBaseUrl (baseUrl: string): Server {
		this.baseUrl = Helpers.Trim(baseUrl.replace(/\\/g, '/'), '/');
		return this;
	}
	/**
	 * @summary Set session id cookie max age.
	 * @param seconds Cookie max age in seconds, not miliseconds.
	 */
	public SetSessionMaxAge (seconds: number): Server {
		this.sessionMaxAge = seconds;
		return this;
	}
	/**
	 * @summary Set session id hash salt.
	 * @param sessionHashSalt id hash salt.
	 */
	public SetSessionHashSalt (sessionHashSalt: string): Server {
		this.sessionHashSalt = sessionHashSalt;
		return this;
	}
	/**
	 * @summary Set custom error handler for uncatched errors and warnings
	 * @param errorHandler Custom handler called on any uncatched error.
	 */
	public SetErrorHandler (
		errorHandler: (
			e: Error, 
			code: number, 
			req?: core.Request<core.ParamsDictionary, any, any>, 
			res?: core.Response<any>
		) => void
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
	public AddHandler (
		handler: (
			req: core.Request<core.ParamsDictionary, any, any>, 
			res: core.Response<any>, 
			e: Evnt.Event, 
			cb: core.NextFunction
		) => void
	): Server {
		this.customHttpHandlers.push(handler);
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
	public GetDomain (): string {
		return this.domain;
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
	public GetBaseUrl (): string {
		return this.baseUrl;
	}
	/**
	 * @summary Get session id cookie max age in seconds, not miliseconds.
	 */
	public GetSessionMaxAge (): number {
		return this.sessionMaxAge;
	}
	/**
	 * @summary Get session id hash salt.
	 */
	public GetSessionHashSalt (): string {
		return this.sessionHashSalt;
	}
	/**
	 * @summary Return configured custom errors handler.
	 */
	public GetErrorHandler (): ((e: Error, code: number, req?: core.Request<core.ParamsDictionary, any, any>, res?: core.Response<any>) => void) | null {
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
	public GetHttpServer (): http.Server | null {
		return this.httpServer;
	}
	/**
	 * @summary Return used express app instance
	 */
	public GetExpressApp (): core.Express | null {
		return this.expressApp;
	}
	/**
	 * @summary Return used express session parser instance
	 */
	public GetExpressSessionParser (): express.RequestHandler<core.ParamsDictionary> | null {
		return this.sessionParser;
	}

	/**
	 * @summary Start HTTP server
	 */
	public Run (callback: (success: boolean, error?: Error) => void = null): Server {
		this.documentRoot = pathUtil.resolve(this.documentRoot || __dirname).replace(/\\/g, '/');
		this.port = this.port || Server.DEFAULTS.PORT;
		this.domain = this.domain || Server.DEFAULTS.DOMAIN;

		this.cache = new Cache(this);
		this.errorsHandler = new ErrorsHandler(this, this.cache);
		this.filesHandler = new FilesHandler(this.errorsHandler);
		this.directoriesHandler = new DirectoriesHandler(
			this, this.cache, this.filesHandler, this.errorsHandler
		);

		this.expressApp  = express.default();
		this.httpServer = http.createServer(this.expressApp);
		this.sessionParser = session.default(<session.SessionOptions>{
			httpOnly: true,
			secret: this.sessionHashSalt ?? Server.SESSION.HASH,
			cookie: { 
				maxAge: 1000 * (this.sessionMaxAge ?? Server.SESSION.ID_MAX_AGE) /* default is 1 hour */ 
			},
			resave: false,
			saveUninitialized: true
		});

		this.expressApp.use(this.sessionParser);
		this.expressApp.all('*', this.handleReq.bind(this));
		this.httpServer.on('error', (e: Error) => {
			if (!callback) {
				console.error(e);
			} else {
				callback(false, e);
			}
		});
		this.httpServer.listen(this.port, this.domain, () => {
			if (!callback) {
				console.log(
					"HTTP server has been started at: 'http://" + this.domain + ":" 
					+ this.port.toString() + "' to serve directory: \n'" + this.documentRoot 
					+ "'.\nEnjoy browsing:-) To stop the server, pres CTRL + C or close this command line window."
				);
			} else {
				callback(true, null);
			}
		});
		return this;
	}

	/**
	 * @summary Handle all HTTP requests
	 */
	protected handleReq (
		req: core.Request<core.ParamsDictionary, any, any>, 
		res: core.Response<any>, 
		cb: core.NextFunction
	): void {
		// prepare path and full path
		var path: string = Helpers.Trim(
			decodeURIComponent(urlUtil.parse(req.url).pathname), '/'
		);

		var pathAllowed: boolean = this.isPathAllowed('/' + path);
		if (!pathAllowed)
			return this.directoriesHandler.HandleForbidden(res, cb);

		var fullPath: string = pathUtil.resolve(this.documentRoot + '/' + path).replace(/\\/g, '/');
		fullPath = Helpers.TrimRight(fullPath, '/');
		req.baseUrl = '/' + this.baseUrl;

		if (this.development) 
			this.errorsHandler.SetHandledRequestProperties(req, res, cb);
		
		if (this.customHttpHandlers.length > 0) {
			var evnt = new Evnt.Event(req, res, cb, fullPath),
				index = 0;
			this.handleReqCustomHandlersRecursive(
				index, req, res, evnt, () => {
					if (evnt.IsPreventDefault()) {
						cb();
					} else {
						fs.stat(fullPath, this.handleReqPathStats.bind(
							this, path, fullPath, req, res, cb
						));
					}
				}
			);
		} else {
			fs.stat(fullPath, this.handleReqPathStats.bind(
				this, path, fullPath, req, res, cb
			));
		}
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
	 * @summary Handle custom http handlers recursively:
	 */
	protected handleReqCustomHandlersRecursive (
		index: number, 
		req: core.Request<core.ParamsDictionary, any, any>, 
		res: core.Response<any>, 
		evnt: Evnt.Event, 
		cb: core.NextFunction
	): void {
		var handler: (
			req: core.Request<core.ParamsDictionary, any, any>, 
			res: core.Response<any>, 
			e: Evnt.Event, 
			cb: core.NextFunction
		) => void = this.customHttpHandlers[index];
		var localCallback: Function = () => {
			if (evnt.IsPreventDefault() || index + 1 == this.customHttpHandlers.length) {
				cb();
			} else {
				this.handleReqCustomHandlersRecursive(
					index + 1, req, res, evnt, cb
				);
			}
		};
		try {
			handler.call(null, req, res, evnt, localCallback);
		} catch (e) {
			this.errorsHandler.PrintError(e, req, res, 500);
			evnt.PreventDefault();
			localCallback();
		}
	}
	/**
	 * @summary Check if any content exists for current reqest on hard drive:
	 */
	protected handleReqPathStats (
		path: string, 
		fullPath: string, 
		req: core.Request<core.ParamsDictionary, any, any>, 
		res: core.Response<any>, 
		cb: core.NextFunction, 
		err: NodeJS.ErrnoException | null, 
		stats: fs.Stats | null
	) {
		if (err == null) {
			this.handleReqExistingPath(stats, path, fullPath, req, res, cb);
		} else if (err.code == 'ENOENT') {
			this.handleReqNonExistingPath(path, fullPath, req, res, cb);
		}
	}
	/**
	 * @summary Process request content found
	 */
	protected handleReqExistingPath (
		stats: fs.Stats, 
		path: string, 
		fullPath: string, 
		req: core.Request<core.ParamsDictionary, any, any>, 
		res: core.Response<any>, 
		cb: core.NextFunction, 
	): void {
		if (stats.isDirectory()) {
			var originalPathname: string = urlUtil.parse(req.url).pathname;
			if (originalPathname.charAt(originalPathname.length - 1) == '/') {
				fs.readdir(
					fullPath, (err: Error, dirItems: string[]) => {
						if (err != null) {
							this.errorsHandler.PrintError(err, req, res, 403);
							return cb();
						}
						this.directoriesHandler.HandleDirectory(
							200, stats, path, fullPath, req, res, cb, dirItems
						)
					}
				);
			} else {
				res.redirect(301, originalPathname + '/');
			}
		} else if (stats.isFile()) {
			this.filesHandler.HandleFile(stats, path, fullPath, req, res, cb);
		} else /* (
			stats.isBlockDevice() || 
			stats.isCharacterDevice() || 
			stats.isSymbolicLink() || 
			stats.isFIFO() || 
			stats.isSocket()
		)*/ {
			cb();
		}
	}
	/**
	 * @summary Display error 500/404 (and try to list first existing parent folder content):
	 */
	protected handleReqNonExistingPath (
		path: string, 
		fullPath: string, 
		req: core.Request<core.ParamsDictionary, any, any>, 
		res: core.Response<any>, 
		cb: core.NextFunction
	) {
		var pathExploded: string[] = path.split('/'),
			pathToFound: string = '',
			pathsToFound: string[] = [],
			parentDirIndexScriptModule: CacheRecord = null;
		
		pathExploded.forEach((item: string) => {
			pathToFound += '/' + item;
			pathsToFound.push(pathToFound);
		});
		pathsToFound.reverse();
		
		parentDirIndexScriptModule = this.cache.TryToFindParentDirectoryIndexScriptModule(pathsToFound);

		if (parentDirIndexScriptModule != null) {
			if (!this.development) {
				this.directoriesHandler.HandleIndexScript(
					parentDirIndexScriptModule.fullPath, 
					parentDirIndexScriptModule.scriptName, 
					parentDirIndexScriptModule.modTime, 
					req, res, cb
				);
			} else {
				fs.stat(parentDirIndexScriptModule.fullPath, (err: Error, stats: fs.Stats) => {
					if (err) {
						console.error(err);
						return cb();
					}
					this.directoriesHandler.HandleIndexScript(
						parentDirIndexScriptModule.fullPath, 
						parentDirIndexScriptModule.scriptName, 
						stats.mtime.getTime(), 
						req, res, cb
					);
				});
			}
			
		} else {
			this.handleReqNonExistPath(
				pathsToFound, 0, 
				(newFullPath: string, lastFoundPathStats: fs.Stats, lastFoundPath: string) => {
					fs.readdir(
						newFullPath, 
						(err: Error, dirItems: string[]) => {
							if (err != null) {
								this.errorsHandler.PrintError(err, req, res, 403);
								return cb();
							}
							this.directoriesHandler.HandleDirectory(
								404, lastFoundPathStats, lastFoundPath, fullPath, req, res, cb, dirItems
							)
						}
					);
				}, 
				(err: Error) => {
					var error: Error = null;
					try {
						throw new Error("Path not found: `" + path + "`.");
					} catch (e) {
						error = e;
					}
					this.errorsHandler.PrintError(error, req, res, 404);
					return cb();
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
		successCallback: (newFullPath: string, lastFoundPathStats: fs.Stats, lastFoundPath: string) => void, 
		errorCallback: (err: Error) => void
	): void {
		var pathToFound: string = pathsToFound[index];
		var lastFoundPathLocal = Helpers.TrimLeft(pathToFound, '/');
		fs.stat(
			this.documentRoot + pathToFound, 
			(err: NodeJS.ErrnoException, lastFoundPathStats: fs.Stats) => {
				if (err == null) {
					var newFullPath: string = Helpers.TrimRight(this.documentRoot + '/' + lastFoundPathLocal, '/');
					newFullPath = decodeURIComponent(newFullPath);
					successCallback(newFullPath, lastFoundPathStats, lastFoundPathLocal);
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
}
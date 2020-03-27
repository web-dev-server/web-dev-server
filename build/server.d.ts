/// <reference types="node" />
import * as http from "http";
import fs from "fs";
import * as core from "express-serve-static-core";
import * as express from "express";
import { DefaultResponses } from "./default-responses";
import { Cache } from "./cache";
import { ErrorsHandler } from "./errors-handler";
import { FilesHandler } from "./files-handler";
import { DirectoriesHandler } from "./directories-handler";
import * as Evnt from "./event";
export * from "./application";
export * from "./event";
export * from "./logger";
export declare class Server {
    static VERSION: string;
    static DEFAULTS: {
        PORT: number;
        DOMAIN: string;
        RESPONSES: typeof DefaultResponses;
    };
    static SESSION: {
        HASH: string;
        ID_MAX_AGE: number;
    };
    static INDEX: {
        SCRIPTS: string[];
        FILES: string[];
    };
    static FILE_SIZE: {
        THRESH: number;
        UNITS: string[];
    };
    protected documentRoot?: string;
    protected baseUrl?: string;
    protected sessionMaxAge?: number;
    protected sessionHashSalt?: string;
    protected port?: number;
    protected domain?: string;
    protected development: boolean;
    protected httpServer?: http.Server;
    protected expressApp?: core.Express;
    protected sessionParser?: express.RequestHandler<core.ParamsDictionary>;
    protected cache?: Cache;
    protected errorsHandler?: ErrorsHandler;
    protected filesHandler?: FilesHandler;
    protected directoriesHandler?: DirectoriesHandler;
    protected customErrorHandler?: (e: Error, code: number, req?: core.Request<core.ParamsDictionary, any, any>, res?: core.Response<any>) => void;
    protected customHttpHandlers: ((req: core.Request<core.ParamsDictionary, any, any>, res: core.Response<any>, e: Evnt.Event, cb: core.NextFunction) => void)[];
    protected forbiddenPaths: string[] | RegExp[];
    /**
     * @summary Create new server instance (no singleton implementation).
     */
    static CreateNew(): Server;
    /**
     * @summary Set development mode, `true` by default. If `true`, directories contents and errors are displayed, `false` otherwise.
     * @param development If `true`, directories contents and errors are displayed, `false` otherwise.
     */
    SetDevelopment(development: boolean): Server;
    /**
     * @summary Set http server IP or domain to listening on, `127.0.0.1` by default.
     * @param domain Server ip or domain to listening on.
     */
    SetDomain(domain: string): Server;
    /**
     * @summary Set http server port number, `8000` by default.
     * @param port Server port to listening on.
     */
    SetPort(port: number): Server;
    /**
     * @summary Set http server root directory, required
     * @param dirname Server root directory as absolute path.
     */
    SetDocumentRoot(dirname: string): Server;
    /**
     * @summary Set http server base path, not required
     * @param baseUrl Base path (proxy path, if you are running the server under proxy).
     */
    SetBaseUrl(baseUrl: string): Server;
    /**
     * @summary Set session id cookie max age.
     * @param seconds Cookie max age in seconds, not miliseconds.
     */
    SetSessionMaxAge(seconds: number): Server;
    /**
     * @summary Set session id hash salt.
     * @param sessionHashSalt id hash salt.
     */
    SetSessionHashSalt(sessionHashSalt: string): Server;
    /**
     * @summary Set custom error handler for uncatched errors and warnings
     * @param errorHandler Custom handler called on any uncatched error.
     */
    SetErrorHandler(errorHandler: (e: Error, code: number, req?: core.Request<core.ParamsDictionary, any, any>, res?: core.Response<any>) => void): Server;
    /**
     * Set forbidden request paths to prevent requesting dangerous places (`["/node_modules", /\/package\.json/g, /\/tsconfig\.json/g, /\/\.([^\.]+)/g]` by default). All previous configuration will be overwritten.
     * @param forbiddenPaths Forbidden request path begins or regular expression patterns.
     */
    SetForbiddenPaths(forbiddenPaths: string[] | RegExp[]): Server;
    /**
     * Aet forbidden request paths to prevent requesting dangerous places (`["/node_modules", /\/package\.json/g, /\/tsconfig\.json/g, /\/\.([^\.]+)/g]` by default).
     * @param forbiddenPaths Forbidden request path begins or regular expression patterns.
     */
    AddForbiddenPaths(forbiddenPaths: string[] | RegExp[]): Server;
    /**
     * @summary Add custom express http handler
     * @param handler Custom http request handler called every allowed request path before standard server handling.
     */
    AddHandler(handler: (req: core.Request<core.ParamsDictionary, any, any>, res: core.Response<any>, e: Evnt.Event, cb: core.NextFunction) => void): Server;
    /**
     * @summary Return `true` if development flag is used.
     */
    IsDevelopment(): boolean;
    /**
     * @summary Return configured domain or ip address.
     */
    GetDomain(): string;
    /**
     * @summary Return configured port number.
     */
    GetPort(): number;
    /**
     * @summary Return configured document root directory full path.
     */
    GetDocumentRoot(): string;
    /**
     * @summary Return configured base url.
     */
    GetBaseUrl(): string;
    /**
     * @summary Get session id cookie max age in seconds, not miliseconds.
     */
    GetSessionMaxAge(): number;
    /**
     * @summary Get session id hash salt.
     */
    GetSessionHashSalt(): string;
    /**
     * @summary Return configured custom errors handler.
     */
    GetErrorHandler(): ((e: Error, code: number, req?: core.Request<core.ParamsDictionary, any, any>, res?: core.Response<any>) => void) | null;
    /**
     * Get forbidden request paths to prevent requesting dangerous places.
     */
    GetForbiddenPaths(): string[] | RegExp[];
    /**
     * @summary Return used http server instance
     */
    GetHttpServer(): http.Server | null;
    /**
     * @summary Return used express app instance
     */
    GetExpressApp(): core.Express | null;
    /**
     * @summary Return used express session parser instance
     */
    GetExpressSessionParser(): express.RequestHandler<core.ParamsDictionary> | null;
    /**
     * @summary Start HTTP server
     */
    Run(callback?: (success: boolean, error?: Error) => void): Server;
    /**
     * @summary Handle all HTTP requests
     */
    protected handleReq(req: core.Request<core.ParamsDictionary, any, any>, res: core.Response<any>, cb: core.NextFunction): void;
    /**
     * Get if path is allowed by `this.forbiddenPaths` configuration.
     * @param path Path including start slash, excluding base url and excluding params.
     */
    protected isPathAllowed(path: string): boolean;
    /**
     * @summary Handle custom http handlers recursively:
     */
    protected handleReqCustomHandlersRecursive(index: number, req: core.Request<core.ParamsDictionary, any, any>, res: core.Response<any>, evnt: Evnt.Event, cb: core.NextFunction): void;
    /**
     * @summary Check if any content exists for current reqest on hard drive:
     */
    protected handleReqPathStats(path: string, fullPath: string, req: core.Request<core.ParamsDictionary, any, any>, res: core.Response<any>, cb: core.NextFunction, err: NodeJS.ErrnoException | null, stats: fs.Stats | null): void;
    /**
     * @summary Process request content found
     */
    protected handleReqExistingPath(stats: fs.Stats, path: string, fullPath: string, req: core.Request<core.ParamsDictionary, any, any>, res: core.Response<any>, cb: core.NextFunction): void;
    /**
     * @summary Display error 500/404 (and try to list first existing parent folder content):
     */
    protected handleReqNonExistingPath(path: string, fullPath: string, req: core.Request<core.ParamsDictionary, any, any>, res: core.Response<any>, cb: core.NextFunction): void;
    /**
     * @summary Try to get file system directory stats - recursively on first existing parent directory.
     */
    protected handleReqNonExistPath(pathsToFound: string[], index: number, successCallback: (newFullPath: string, lastFoundPathStats: fs.Stats, lastFoundPath: string) => void, errorCallback: (err: Error) => void): void;
}

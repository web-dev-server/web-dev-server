/// <reference types="node" />
import fs from "fs";
import * as core from "express-serve-static-core";
import { Server } from "./server";
import { DirItem } from "./helpers";
import * as App from "./application";
import { Cache } from "./cache";
import { FilesHandler } from "./files-handler";
import { ErrorsHandler } from "./errors-handler";
export declare class DirectoriesHandler {
    protected server: Server;
    protected cache: Cache;
    protected filesHandler: FilesHandler;
    protected errorsHandler: ErrorsHandler;
    protected indexFiles: Map<string, number>;
    protected indexScripts: Map<string, number>;
    constructor(server: Server, cache: Cache, filesHandler: FilesHandler, errorsHandler: ErrorsHandler);
    /**
     * @summary Display directory content or send index.html file:
     */
    HandleDirectory(statusCode: number, dirStats: fs.Stats, path: string, fullPath: string, req: core.Request<core.ParamsDictionary, any, any>, res: core.Response<any>, cb: core.NextFunction, dirItems: string[]): void;
    /**
     * @summary Process any application in index.js in directory request or on non-existing path request:
     */
    HandleIndexScript(fullPath: string, indexScript: string, indexScriptModTime: number, req: core.Request<core.ParamsDictionary, any, any>, res: core.Response<any>, cb: core.NextFunction): void;
    /**
     * @summary Render and send 403 forbidden page - do not list directory content:
     */
    HandleForbidden(res: core.Response<any>, cb: core.NextFunction): void;
    /**
     * @summary Get first index script (or index static file) file system stats:
     */
    protected indexScriptOrFileStats(fullPath: string, files: string[], index: number, successCallback: (indexScript: string, indexScriptStats: fs.Stats) => void, errorCallback: () => void): void;
    /**
     * @summary Create directory index.js script module instance with optional development require cache resolving:
     */
    protected indexScriptModuleCreate(fullPath: string, indexScript: string, indexScriptModTime: number, req: core.Request<core.ParamsDictionary, any, any>, res: core.Response<any>): App.IApplication;
    /**
     * @summary Create directory index.js script module instance with optional development require cache resolving:
     */
    protected indexScriptModuleGetDeclaration(modulefullPath: string): App.IApplication.Constructor;
    /**
     * @summary Process directory index.js script http request handler with optional development require cache resolving:
     */
    protected indexScriptModuleExecute(fullPath: string, indexScript: string, appInstance: App.IApplication, req: core.Request<core.ParamsDictionary, any, any>, res: core.Response<any>): Promise<void>;
    /**
     * @summary Go through all files and folders in current directory:
     */
    protected renderDirContent(statusCode: number, dirStats: fs.Stats, dirItemsNames: string[], reqRelPath: string, fullPath: string, res: core.Response<any>, cb: core.NextFunction): void;
    protected renderDirContentRowStats(reqRelPath: string, dirItemName: string, itemStats: fs.Stats, dirRows: DirItem[], fileRows: DirItem[], resolve: (() => void)): void;
    /**
     * @summary Display directory content - complete directory row code for directory content:
     */
    protected renderDirContentDirRow(reqRelPath: string, dirItemName: string, itemStats: fs.Stats): string;
    /**
     * @summary Display directory content - complete file row code for directory content:
     */
    protected renderDirContentFileRow(reqRelPath: string, fileItemName: string, itemStats?: fs.Stats): string;
    /**
     * @summary Display directory content - send directory content html code:
     */
    protected handleDirContentRows(statusCode: number, path: string, fullPath: string, dirStats: fs.Stats, dirRows: DirItem[], fileRows: DirItem[], res: core.Response<any>, cb: core.NextFunction): void;
    /**
     * @summary Display directory content - complete heading code for directory content:
     */
    protected handleDirReqCompleteHeader(path: string, fullPath: string, dirStats: fs.Stats): string;
}

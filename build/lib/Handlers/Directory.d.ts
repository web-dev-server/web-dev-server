/// <reference types="node" />
import { Stats as FsStats } from "fs";
import { Server } from "../Server";
import { Request } from "../Request";
import { Response } from "../Response";
import { DirItem } from "./Directories/DirItem";
import { IApplication, IApplicationConstructor } from "../Applications/IApplication";
import { Cache } from "../Applications/Cache";
import { FilesHandler } from "./File";
import { ErrorsHandler } from "./Error";
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
    HandleDirectory(fullPath: string, requestPath: string, dirStats: FsStats, dirItems: string[], statusCode: number, req: Request, res: Response): void;
    /**
     * @summary Process any application in index.js in directory request or on non-existing path request:
     */
    HandleIndexScript(dirFullPath: string, indexScript: string, indexScriptModTime: number, req: Request, res: Response): void;
    /**
     * @summary Render and send 403 forbidden page - do not list directory content:
     */
    HandleForbidden(res: Response): void;
    /**
     * @summary Get first index script (or index static file) file system stats:
     */
    protected indexScriptOrFileStats(fullPath: string, files: string[], index: number, successCallback: (indexFullPath: string, indexScript: string, indexScriptStats: FsStats) => void, errorCallback: () => void): void;
    /**
     * @summary Create directory index.js script module instance with optional development require cache resolving:
     */
    protected indexScriptModuleCreate(dirFullPath: string, indexScript: string, indexScriptModTime: number, req: Request, res: Response): IApplication;
    /**
     * @summary Create directory index.js script module instance with optional development require cache resolving:
     */
    protected indexScriptModuleGetDeclaration(modulefullPath: string): IApplicationConstructor;
    /**
     * @summary Process directory index.js script http request handler with optional development require cache resolving:
     */
    protected indexScriptModuleExecute(fullPath: string, indexScript: string, appInstance: IApplication, req: Request, res: Response): Promise<void>;
    /**
     * @summary Go through all files and folders in current directory:
     */
    protected renderDirContent(statusCode: number, dirStats: FsStats, dirItemsNames: string[], reqRelPath: string, fullPath: string, res: Response): void;
    protected renderDirContentRowStats(reqRelPath: string, dirItemName: string, itemStats: FsStats, dirRows: DirItem[], fileRows: DirItem[], resolve: (() => void)): void;
    /**
     * @summary Display directory content - complete directory row code for directory content:
     */
    protected renderDirContentDirRow(reqRelPath: string, dirItemName: string, itemStats: FsStats): string;
    /**
     * @summary Display directory content - complete file row code for directory content:
     */
    protected renderDirContentFileRow(reqRelPath: string, fileItemName: string, itemStats?: FsStats): string;
    /**
     * @summary Display directory content - send directory content html code:
     */
    protected handleDirContentRows(statusCode: number, path: string, fullPath: string, dirStats: FsStats, dirRows: DirItem[], fileRows: DirItem[], res: Response): void;
    /**
     * @summary Display directory content - complete heading code for directory content:
     */
    protected handleDirReqCompleteHeader(path: string, fullPath: string, dirStats: FsStats): string;
}

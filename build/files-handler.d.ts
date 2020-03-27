/// <reference types="node" />
import fs from "fs";
import * as core from "express-serve-static-core";
import { ErrorsHandler } from "./errors-handler";
export declare class FilesHandler {
    protected errorsHandler: ErrorsHandler;
    constructor(errorsHandler: ErrorsHandler);
    /**
     * @summary Send a file:
     */
    HandleFile(stats: fs.Stats, path: string, fullPath: string, req: core.Request<core.ParamsDictionary, any, any>, res: core.Response<any>, cb: core.NextFunction): void;
}

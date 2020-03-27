import * as core from "express-serve-static-core";
import { Server } from "./server";
import { Cache } from "./cache";
export declare class ErrorsHandler {
    protected server: Server;
    protected cache: Cache;
    protected request?: core.Request<core.ParamsDictionary, any, any>;
    protected response?: core.Response<any>;
    protected callback?: core.NextFunction;
    constructor(server: Server, cache: Cache);
    SetHandledRequestProperties(req: core.Request<core.ParamsDictionary, any, any>, res: core.Response<any>, cb: core.NextFunction): ErrorsHandler;
    /**
     * @summary Print exception in command line a little more nicely and send error in response:
     */
    PrintError(e: Error, req?: core.Request<core.ParamsDictionary, any, any>, res?: core.Response<any>, code?: number): void;
    /**
     * @summary Initialize uncatch error and uncatch warning handlers
     */
    protected initErrorsHandlers(): void;
    /**
     * @summary Clear all modules on any uncatched error
     */
    protected handleUncatchError(clearRequireCache: boolean, error: Error): void;
    /**
     * @summary Render error as text for development purposes:
     */
    protected renderErrorText(e?: Error): string;
}

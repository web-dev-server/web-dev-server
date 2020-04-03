import { Server } from "../Server";
import { Request } from "../Request";
import { Response } from "../Response";
import { Cache } from "../Applications/Cache";
export declare class ErrorsHandler {
    protected server: Server;
    protected cache: Cache;
    protected request?: Request;
    protected response?: Response;
    constructor(server: Server, cache: Cache);
    SetHandledRequestProperties(req: Request, res: Response): ErrorsHandler;
    /**
     * @summary Print exception in command line a little more nicely and send error in response:
     */
    PrintError(e: Error, req?: Request, res?: Response, code?: number): void;
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

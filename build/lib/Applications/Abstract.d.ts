import { Server } from "../Server";
import { Request } from "../Request";
import { Response } from "../Response";
import { IApplication } from "./IApplication";
export declare abstract class Abstract implements IApplication {
    protected server: Server;
    constructor(server: Server);
    abstract ServerHandler(request: Request, response: Response): Promise<void>;
}

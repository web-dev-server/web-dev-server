import { Server } from "../Server";
import { Request } from "../Request";
import { Response } from "../Response";
import { IApplication } from "./IApplication";
export declare abstract class Abstract implements IApplication {
    abstract Start?(server: Server, request: Request, response: Response): Promise<void>;
    abstract HttpHandle?(request: Request, response: Response): Promise<void>;
    abstract Stop?(server: Server): Promise<void>;
}

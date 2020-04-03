import { Server } from "../Server";
import { Request } from "../Request";
import { Response } from "../Response";
export interface IApplication {
    ServerHandler(request: Request, response: Response): Promise<void>;
}
export interface IApplicationConstructor {
    new (Server: Server, request: Request, response: Response): IApplication;
}

import { Server } from "../Server";
import { Request } from "../Request";
import { Response } from "../Response";


export interface IApplication {
	Start? (server: Server, firstRequest: Request, firstResponse: Response): Promise<void>;
	HttpHandle? (request: Request, response: Response): Promise<void>;
	Stop? (server: Server): Promise<void>;
}
import { Server } from "../Server";
import { Request } from "../Request";
import { Response } from "../Response";
import { IApplication } from "./IApplication";


export abstract class Abstract implements IApplication {
	protected server: Server;
	public constructor (server: Server) {
		this.server = server;
	};
	public abstract async ServerHandler (request: Request, response: Response): Promise<void>;
}
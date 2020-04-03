import { Request } from "./Request";
import { Response } from "./Response";


export class Event {
	public req: Request;
	public res: Response;
	public fullPath: string;
	protected preventDefault: boolean = false;
	public constructor (
		req: Request, 
		res: Response,
		fullPath: string
	) {
		this.req = req;
		this.res = res;
		this.fullPath = fullPath;
	}
	PreventDefault (): Event {
		this.preventDefault = true;
		return this;
	}
	IsPreventDefault (): boolean {
		return this.preventDefault;
	}
}
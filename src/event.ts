import * as core from "express-serve-static-core";

export class Event {
	public req: core.Request<core.ParamsDictionary, any, any>;
	public res: core.Response<any>;
	public cb: core.NextFunction;
	public fullPath: string;
	protected preventDefault: boolean = false;
	public constructor (
		req: core.Request<core.ParamsDictionary, any, any>, 
		res: core.Response<any>, 
		cb: core.NextFunction, 
		fullPath: string
	) {
		this.req = req;
		this.res = res;
		this.cb = cb;
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
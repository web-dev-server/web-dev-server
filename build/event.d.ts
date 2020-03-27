import * as core from "express-serve-static-core";
export declare class Event {
    req: core.Request<core.ParamsDictionary, any, any>;
    res: core.Response<any>;
    cb: core.NextFunction;
    fullPath: string;
    protected preventDefault: boolean;
    constructor(req: core.Request<core.ParamsDictionary, any, any>, res: core.Response<any>, cb: core.NextFunction, fullPath: string);
    PreventDefault(): Event;
    IsPreventDefault(): boolean;
}

/// <reference types="node" />
import http from "http";
import * as express from "express";
import * as core from "express-serve-static-core";
export interface IApplication {
    HandleHttpRequest(request: core.Request<core.ParamsDictionary, any, any>, response: core.Response<any>): Promise<void>;
}
export declare namespace IApplication {
    interface Constructor {
        new (httpServer: http.Server, expressApp: core.Express, sessionParser: express.RequestHandler<core.ParamsDictionary>, request: core.Request<core.ParamsDictionary, any, any>, response: core.Response<any>): IApplication;
    }
}
export declare namespace Application {
    abstract class Abstract implements IApplication {
        protected httpServer: http.Server;
        protected expressApp: core.Express;
        protected sessionParser: express.RequestHandler<core.ParamsDictionary>;
        constructor(httpServer: http.Server, expressApp: core.Express, sessionParser: express.RequestHandler<core.ParamsDictionary>, request: core.Request<core.ParamsDictionary, any, any>, response: core.Response<any>);
        abstract HandleHttpRequest(request: core.Request<core.ParamsDictionary, any, any>, response: core.Response<any>): Promise<void>;
    }
}

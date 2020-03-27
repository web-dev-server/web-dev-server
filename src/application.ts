import http from "http";
import * as express from "express";
import * as core from "express-serve-static-core";

export interface IApplication {
	HandleHttpRequest (
		request: core.Request<core.ParamsDictionary, any, any>,
		response: core.Response<any>
	): Promise<void>;
}
export namespace IApplication {
	export interface Constructor {
		new (
			httpServer: http.Server, 
			expressApp: core.Express, 
			sessionParser: express.RequestHandler<core.ParamsDictionary>,
			request: core.Request<core.ParamsDictionary, any, any>,
			response: core.Response<any>
		): IApplication;
	}
}
export namespace Application {
	export abstract class Abstract implements IApplication {
		protected httpServer: http.Server;
		protected expressApp: core.Express;
		protected sessionParser: express.RequestHandler<core.ParamsDictionary>;
		public constructor (
			httpServer: http.Server, 
			expressApp: core.Express, 
			sessionParser: express.RequestHandler<core.ParamsDictionary>,
			request: core.Request<core.ParamsDictionary, any, any>,
			response: core.Response<any>
		) {
			this.httpServer = httpServer;
			this.expressApp = expressApp;
			this.sessionParser = sessionParser;
		};
		public abstract async HandleHttpRequest (
			request: core.Request<core.ParamsDictionary, any, any>,
			response: core.Response<any>
		): Promise<void>;
	}
}
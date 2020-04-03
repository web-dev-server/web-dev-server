import * as ApplicationInterfaces from "./IApplication";
import { Abstract as _Abstract } from "./Abstract";
import { Session as _Session } from "./Session";
import { INamespace as _INamespace } from "./Sessions/INamespace";


export namespace Applications {
	export import IApplication = ApplicationInterfaces.IApplication;
	export abstract class Abstract extends _Abstract {};
	export class Session extends _Session {};
	
}
export namespace Applications.Session { 
	export interface INamespace extends _INamespace {};
}
export namespace Applications.IAplication { 
	export import IApplicationConstructor = ApplicationInterfaces.IApplicationConstructor;
}
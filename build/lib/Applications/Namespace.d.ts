import * as ApplicationInterfaces from "./IApplication";
import { Abstract as _Abstract } from "./Abstract";
import { Session as _Session } from "./Session";
import { INamespace as _INamespace } from "./Sessions/INamespace";
export declare namespace Applications {
    export import IApplication = ApplicationInterfaces.IApplication;
    abstract class Abstract extends _Abstract {
    }
    class Session extends _Session {
    }
}
export declare namespace Applications.Session {
    interface INamespace extends _INamespace {
    }
}
export declare namespace Applications.IAplication {
    export import IApplicationConstructor = ApplicationInterfaces.IApplicationConstructor;
}

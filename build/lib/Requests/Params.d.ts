import { Request } from "../Request";
export declare class Params {
    protected params?: any;
    protected body?: string;
    IsCompleted(): boolean;
    LoadBody(): Promise<string>;
    SetParams(params: any): Request;
    GetParams(nameReplaceFilter?: string | false | {
        pattern: string | RegExp;
        replace: string | Function;
    }, valueReplaceFilter?: string | false | {
        pattern: string | RegExp;
        replace: string | Function;
    }, onlyNames?: string[]): any;
    SetParam(name: string, value: any): Request;
    GetParam(name: string, valueReplaceFilter?: string | false | {
        pattern: string | RegExp;
        replace: string | Function;
    }, ifNullValue?: any): any;
    RemoveParam(name: string): Request;
    HasParam(name: string): boolean;
    /**
     * Initialize params from GET (or also from post, if request is already completed).
     */
    protected initParams(): void;
    /**
     * Read and return unserialized POST/PUT request body.
     */
    protected initParamsCompletePostData(): any;
}

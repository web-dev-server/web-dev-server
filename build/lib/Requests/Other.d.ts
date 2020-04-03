import { Request } from "../Request";
export declare class Other {
    /**
     * Http method (upper case) - `GET`, `POST`, `PUT`, `HEAD`...
     * Example: `"GET"`
     * @var string|NULL
     */
    protected httpMethod?: string;
    /**
     * Referer URI if any, safely read from header `Referer`.
     * Example: `"http://foreing.domain.com/path/where/is/link/to/?my=app"`
     * @var string|NULL
     */
    protected referer?: string;
    /**
     * Server IP address string.
     * Example: `"127.0.0.1" | "111.222.111.222"`
     * @var string|NULL
     */
    protected serverIp?: string;
    /**
     * Client IP address string.
     * Example: `"127.0.0.1" | "222.111.222.111"`
     */
    protected clientIp?: string;
    /**
     * Integer value from header `Content-Length`,
     * `NULL` if no value presented in headers object.
     * Example: `123456 | NULL`
     */
    protected contentLength?: number;
    /**
     * Timestamp of the start of the request in miliseconds.
     */
    protected startTime?: number;
    /**
     * `true` if request is requested from browser by `XmlHttpRequest` object
     * with http header: `X-Requested-With: AnyJavascriptFrameworkName`, `false` otherwise.
     */
    protected ajax?: boolean;
    /**
     * Php requested script name path from application root.
     * Example: `"/index.js"`
     */
    protected scriptName?: string;
    /**
     * Application root path on hard drive.
     * Example: `"C:/www/my/development/directory/www"`
     */
    protected appRoot?: string;
    GetScriptName(): string;
    GetAppRoot(): string;
    SetMethod(rawMethod: string): Request;
    GetMethod(): string;
    GetReferer(rawInput?: boolean): string;
    GetServerIp(): string;
    GetClientIp(): string;
    IsAjax(): boolean;
    GetContentLength(): number | null;
    GetStartTime(): number;
}

import { IncomingMessage as HttpIncomingMessage } from "http";
import {
	parse as UrlParse,
	UrlWithStringQuery
} from "url";
import { Socket } from "net";

import { Server } from "./Server";
import { ObjectHelper } from "./Tools/Helpers/ObjectHelper";

import { Static } from "./Requests/Static";
import { Constants } from "./Requests/Constants";
import { Localization } from "./Requests/Localization";
import { Headers } from "./Requests/Headers";
import { IRequestHeaders } from "./Requests/IRequestHeaders";
import { Params } from "./Requests/Params";
import { Stream } from "./Requests/Stream";
import { Cookies } from "./Requests/Cookies";
import { IRequestCookies } from "./Requests/IRequestCookies";
import { Url } from "./Requests/Url";
import { Other } from "./Requests/Other";
import { StringHelper } from "./Tools/Helpers/StringHelper";


Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = /** @class */ (function () {
	class Request {
		protected http: HttpIncomingMessage;
		private _url: string;
		public GetHttpRequest(): HttpIncomingMessage {
			return this.http;
		}
		constructor (socket: Socket) {
			//super(socket);
			// @ts-ignore
			HttpIncomingMessage.call(this, socket);
			this.http = this as any;
			// @ts-ignore
			this.startTime = (new Date()).getTime();
			var urlInitLocal: boolean = false;
			var bodyArr: any = [];
			this.http.on('data', (chunk: any) => {
				bodyArr.push(chunk);
			}).on('end', () => {
				// @ts-ignore
				this.body = Buffer.concat(bodyArr).toString();
				this.http.complete = true;
				this.http.emit('body-loaded');
			});
			Object.defineProperty(this, 'url', {
				get: () => {
					return this._url;
				},
				set: (url) => {
					this._url = url;
					if (!urlInitLocal) {
						urlInitLocal = true;
						this._urlInit(socket['server']['__wds']);
					}
				} 
			});
		}
		private _urlInit (server: Server) {
			var serverDocumentRoot: string = server.GetDocumentRoot();
			var parsedUrl: UrlWithStringQuery = UrlParse(this._url, false);
			var requestPath: string = parsedUrl.pathname.replace(/[\/]+/g, '/');
			if (typeof parsedUrl.query == 'string' && parsedUrl.query.length > 0)
				requestPath += '?' + parsedUrl.query.replace(/\+/g, '%20');
			requestPath = StringHelper.DecodeUri(requestPath);
			var basePath: string = '';
			var appRootPathAndScript: string[] = server.TryToFindIndexPath(requestPath);
			if (appRootPathAndScript.length > 0) {
				var appRootFullPath = appRootPathAndScript[0];
				var indexScript = appRootPathAndScript[1];
				basePath = appRootFullPath.substr(serverDocumentRoot.length);
				if (basePath.length > 0 && requestPath.indexOf(basePath) == 0)
					requestPath = requestPath.substr(basePath.length);
			}
			var serverBasePath: string = server.GetBasePath();
			if (serverBasePath != null)
				basePath = serverBasePath + basePath;
			// @ts-ignore
			this.initUrlSegments(appRootFullPath, basePath, indexScript, requestPath);
		}
		public AddListener (): this {
			return this.http.addListener.apply(this, [].slice.apply(arguments));
		}
		public Emit (): this {
			return this.http.emit.apply(this, [].slice.apply(arguments));
		}
		public On (): this {
			return this.http.on.apply(this, [].slice.apply(arguments));
		}
		public Once (): this {
			return this.http.once.apply(this, [].slice.apply(arguments));
		}
		public PrependListener (): this {
			return this.http.prependListener.apply(this, [].slice.apply(arguments));
		}
		public PrependOnceListener (): this {
			return this.http.prependOnceListener.apply(this, [].slice.apply(arguments));
		}
		public RemoveListener (): this {
			return this.http.removeListener.apply(this, [].slice.apply(arguments));
		}
	}
	ObjectHelper.Extend(Request, HttpIncomingMessage);
	ObjectHelper.Mixins(Request, [
		Constants, 
		Static, 
		Localization,
		Headers,
		Params,
		Stream,
		Cookies,
		Url,
		Other
	]);
    return Request;
}());


declare class Request {
	/**
	 * Non-secured HTTP scheme (`http:`).
	 * @see https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol
	 */
	public static readonly SCHEME_HTTP: string;
	/**
	 * Secured HTTPS scheme (`https:`).
	 * @see https://en.wikipedia.org/wiki/HTTP_Secure
	 */
	public static readonly SCHEME_HTTPS: string;
	/**
	 * Non-secured FTP scheme (`ftp:`).
	 * @see https://en.wikipedia.org/wiki/File_Transfer_Protocol
	 */
	public static readonly SCHEME_FTP: string;
	/**
	 * Secured FTP scheme (`ftps:`).
	 * @see https://en.wikipedia.org/wiki/File_Transfer_Protocol
	 */
	public static readonly SCHEME_FTPS: string;
	/**
	 * Non-secured IRC scheme (`irc:`).
	 * @see https://en.wikipedia.org/wiki/Internet_Relay_Chat#URI_scheme
	 */
	public static readonly SCHEME_IRC: string;
	/**
	 * Secured IRC scheme (`ircs:`).
	 * @see https://en.wikipedia.org/wiki/Internet_Relay_Chat#URI_scheme
	 */
	public static readonly SCHEME_IRCS: string;
	/**
	 * Email scheme (`mailto:`).
	 * @see https://en.wikipedia.org/wiki/Mailto
	 */
	public static readonly SCHEME_MAILTO: string;
	/**
	 * File scheme (`file:`).
	 * @see https://en.wikipedia.org/wiki/File_URI_scheme
	 */
	public static readonly SCHEME_FILE: string;
	/**
	 * Data scheme (`data:`).
	 * @see https://en.wikipedia.org/wiki/Data_URI_scheme
	 */
	public static readonly SCHEME_DATA: string;
	/**
	 * Telephone scheme (`tel:`).
	 * @see https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/PhoneLinks/PhoneLinks.html
	 */
	public static readonly SCHEME_TEL: string;
	/**
	 * Telnet scheme (`telnet:`).
	 * @see https://en.wikipedia.org/wiki/Telnet
	 */
	public static readonly SCHEME_TELNET: string;
	/**
	 * LDAP scheme (`ldap:`).
	 * @see https://en.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol
	 */
	public static readonly SCHEME_LDAP: string;
	/**
	 * SSH scheme (`ssh:`).
	 * @see https://en.wikipedia.org/wiki/Secure_Shell
	 */
	public static readonly SCHEME_SSH: string;
	/**
	 * RTSP scheme (`rtsp:`).
	 * @see https://en.wikipedia.org/wiki/Real_Time_Streaming_Protocol
	 */
	public static readonly SCHEME_RTSP: string;
	/**
	 * @see https://en.wikipedia.org/wiki/Real-time_Transport_Protocol
	 * RTP scheme (`rtp:`).
	 */
	public static readonly SCHEME_RTP: string;
	
	/**
	 * Retrieves the information or entity that is identified by the URI of the request.
	 */
	public static readonly METHOD_GET: string;
	/**
	 * Posts a new entity as an addition to a URI.
	 */
	public static readonly METHOD_POST: string;
	/**
	 * Replaces an entity that is identified by a URI.
	 */
	public static readonly METHOD_PUT: string;
	/**
	 * Requests that a specified URI be deleted.
	 */
	public static readonly METHOD_DELETE: string;
	/**
	 * Retrieves the message headers for the information or entity that is identified by the URI of the request.
	 */
	public static readonly METHOD_HEAD: string;
	/**
	 * Represents a request for information about the communication options available on the request/response chain identified by the Request-URI.
	 */
	public static readonly METHOD_OPTIONS: string;
	/**
	 * Requests that a set of changes described in the request entity be applied to the resource identified by the Request- URI.
	 */
	public static readonly METHOD_PATCH: string;
	
	/**
	 * Lower case and upper case alphabet characters only.
	 */
	public static readonly PARAM_FILTER_ALPHABETS: string;
	/**
	 * Lower case alphabet characters only.
	 */
	public static readonly PARAM_FILTER_ALPHABETS_LOWER: string;
	/**
	 * Upper case alphabet characters only.
	 */
	public static readonly PARAM_FILTER_ALPHABETS_UPPER: string;
	/**
	 * Lower case and upper case alphabet characters and digits only.
	 */
	public static readonly PARAM_FILTER_ALPHABETS_DIGITS: string;
	/**
	 * Lower case and upper case alphabet characters and punctuation characters: 
	 * - . , SPACE ; ` " ' : ? !
	 */
	public static readonly PARAM_FILTER_ALPHABETS_PUNCT: string;
	/**
	 * Lower case and upper case alphabet characters, digits with dot, comma, minus 
	 * and plus sign and punctuation characters: - . , SPACE ; ` " ' : ? !
	 */
	public static readonly PARAM_FILTER_ALPHABETS_NUMERICS_PUNCT: string;
	/**
	 * Lower case and upper case alphabet characters, digits with dot, comma, minus 
	 * and plus sign, punctuation characters: - . , SPACE ; ` " ' : ? !
	 * and special characters: % _ / @ ~ # & $ [ ] ( ) { } | = * ^
	 */
	public static readonly PARAM_FILTER_ALPHABETS_NUMERICS_PUNCT_SPECIAL: string;
	/**
	 * Punctuation characters only: - . , SPACE ; ` " ' : ? !
	 */
	public static readonly PARAM_FILTER_PUNCT: string;
	/**
	 * Special characters only: % _ / @ ~ # & $ [ ] ( ) { } | = * ^
	 */
	public static readonly PARAM_FILTER_SPECIAL: string;
	/**
	 * Digits only from 0 to 9.
	 */
	public static readonly PARAM_FILTER_DIGITS: string;
	/**
	 * Digits from 0 to 9 with dot, comma and minus and plus sign.
	 */
	public static readonly PARAM_FILTER_NUMERICS: string;

	public constructor(socket: Socket);

	/**
	 * Add exceptional two-segment top-level domain like
	 * `'co.jp', 'co.uk', 'co.kr', 'co.nf' ...` to parse
	 * domain string correctly.
	 * Example:
	 * `Request.AddTwoSegmentTlds('co.uk', 'co.jp');`
	 * @param twoSegmentTlds List of two-segment top-level domains without leading dot.
	 */
	public static AddTwoSegmentTlds (...twoSegmentTlds: string[]): typeof Request;
	/**
	 * Parse list of comma separated language tags and sort it by the
	 * quality value from raw `Http-Accept-Language` header.
	 * @param languagesList
	 */
	public static ParseHttpAcceptLang (languagesList: string): Map<number, string[]>;
	
	/**
	 * Get original http module request type.
	 */
	public GetHttpRequest(): HttpIncomingMessage
	
	/**
	 * @summary Set language international code.
	 * Use this lang storage by your own decision.
	 * Example: `"en" | "de"`
	 */
	public SetLang (lang: string | null): Request;
	/**
	 * @summary Get language international code, lower case, not used by default.
	 * Or use this variable by your own decision.
	 * Example: `"en" | "de"`
	 */
	public GetLang (): string | null;
	/**
	 * @summary Set country/locale code, upper case.
	 * Use this locale storage by your own decision.
	 * Example: `"US" | "UK"`
	 */
	public SetLocale (locale: string | null): Request;
	/**
	 * @summary Get country/locale code, upper case, not used by default.
	 * Or use this variable by your own decision.
	 * Example: `"US" | "UK"`
	 */
	public GetLocale (): string | null;

	/**
	 * @summary Set directly all raw http headers without any conversion at once.
	 * Header name(s) as array keys should be in standard format like:
	 * `"Content-Type" | "Content-Length" | "X-Requested-With" ...`.
	 * @param headers
	 */
	public SetHeaders (headers: any);
	/**
	 * @summary Get directly all raw http headers at once (with/without conversion).
	 * Headers are returned as `key => value` array, headers keys are
	 * in standard format like: `"content-type" | "content-length" | "x-requested-with" ...`.
	 * @param nameReplaceFilter If String - list of regular expression characters to only keep, if array - `replace()` pattern and reverse, if `false`, raw value is returned.
	 * @param valueReplaceFilter If String - list of regular expression characters to only keep, if array - `replace()` pattern and reverse, if `false`, raw value is returned.
	 * @param onlyNames Array with keys to get only. If empty (by default), all possible cookies are returned.
	 */
	public GetHeaders (nameReplaceFilter?: string | false | { pattern: string | RegExp, replace: string | Function }, valueReplaceFilter?: string | false | { pattern: string | RegExp, replace: string | Function }, onlyNames?: string[]): IRequestHeaders;
	/**
	 * @summary Set directly raw http header value without any conversion.
	 * Header name should be in standard format like:
	 * `"content-type" | "content-length" | "x-requested-with" ...`.
	 * @param name
	 * @param value
	 */
	public SetHeader (name: string, value: string | string[]): Request;
	/**
	 * @summary Get http header value filtered by "rule to keep defined characters only",
	 * defined in second argument (by `replace()`). Place into second argument
	 * only char groups you want to keep. Header has to be in format like:
	 * `"content-type" | "content-length" | "x-requested-with" ...`.
	 * @param name Http header string name.
	 * @param replaceFilter If String - list of regular expression characters to only keep, if array - `replace()` pattern and reverse, if `false`, raw value is returned.
	 * @param ifNullValue Default value returned if given param name is null.
	 */
	public GetHeader (name: string, replaceFilter?: string | false | { pattern: string | RegExp, replace: string | Function }, ifNullValue?: any): string | null;
	/**
	 * @summary Return if request has any http header by given name.
	 * @param name Http header string name.
	 */
	public HasHeader (name: string): boolean;
	/**
	 * @summary Return `true` if request is upgrading request.
	 */
	public IsUpgrading (): boolean;

	/**
	 * @summary Return `true` if whole request is loaded.
	 */
	public IsCompleted (): boolean;
	/**
	 * @summary Load whole request body and returns it.
	 */
	public GetBody (): Promise<string>;
	/**
	 * @summary Set directly all raw parameters without any conversion at once.
	 * @param params
	 */
	public SetParams (params: any): Request;
	/**
	 * @summary Get directly all raw parameters at once (with/without conversion).
	 * If any defined char groups in `valueReplaceFilter`, there will be returned
	 * all params filtered by given rule in `replace()`.
	 * @param nameReplaceFilter If String - list of regular expression characters to only keep, if array - `replace()` pattern and reverse, if `false`, raw value is returned.
	 * @param valueReplaceFilter If String - list of regular expression characters to only keep, if array - `replace()` pattern and reverse, if `false`, raw value is returned.
	 * @param onlyKeys Array with keys to get only. If empty (by default), all possible params are returned.
	 */
	public GetParams (
		nameReplaceFilter?: string | false | { pattern: string | RegExp, replace: string | Function },
		valueReplaceFilter?: string | false | { pattern: string | RegExp, replace: string | Function },
		onlyNames?: string[]
	): any;
	/**
	 * @summary Set directly raw parameter value without any conversion.
	 * @param name
	 * @param value
	 */
	public SetParam (name: string, value: any): Request;
	/**
	 * @summary Get param value from GET or POST, filtered by
	 * "rule to keep defined characters only", defined in second argument (by `replace()`).
	 * Place into second argument only char groups you want to keep.
	 * @param name Parameter string name.
	 * @param valueReplaceFilter If String - list of regular expression characters to only keep, if array - `replace()` pattern and reverse, if `false`, raw value is returned.
	 * @param ifNullValue Default value returned if given param name is null.
	 */
	public GetParam (
		name: string,
		valueReplaceFilter?: string | false | { pattern: string | RegExp, replace: string | Function },
		ifNullValue?: any
	): any;
	/**
	 * @summary Remove parameter by name.
	 * @param name
	 */
	public RemoveParam (name: string): Request;
	/**
	 * @summary Get if any param value exists in GET/POST params.
	 * @param name Parameter string name.
	 */
	public HasParam (name: string): boolean;

	/**
	 * @summary Set directly all cookies without any conversion at once.
	 * @param cookies
	 */
	public SetCookies (cookies: IRequestCookies): Request;
	/**
	 * @summary Get directly all cookies at once (with/without conversion).
	 * @param nameReplaceFilter If String - list of regular expression characters to only keep, if array - `replace()` pattern and reverse, if `false`, raw value is returned.
	 * @param valueReplaceFilter If String - list of regular expression characters to only keep, if array - `replace()` pattern and reverse, if `false`, raw value is returned.
	 * @param onlyNames Array with keys to get only. If empty (by default), all possible cookies are returned.
	 */
	public GetCookies (
		nameReplaceFilter?: string | false | { pattern: string | RegExp, replace: string | Function },
		valueReplaceFilter?: string | false | { pattern: string | RegExp, replace: string | Function }, 
		onlyNames?: string[]
	): IRequestCookies;
	/**
	 * @summary Set raw request cookie without any conversion.
	 * @param name
	 * @param value
	 */
	public SetCookie (name: string, value: string): Request;
	/**
	 * @summary Get request cookie value filtered by characters defined 
	 * in second argument through `replace()`.
	 * Place into second argument only char groups you want to keep.
	 * @param name Cookie string name.
	 * @param valueReplaceFilter If String - list of regular expression characters to only keep, if array - `replace()` pattern and reverse, if `false`, raw value is returned.
	 * @param ifNullValue Default value returned if given param name is null.
	 */
	public GetCookie (
		name: string,
		valueReplaceFilter?: string | false | { pattern: string | RegExp, replace: string | Function },
		ifNullValue?: string
	): string | null ;
	/**
	 * @summary Return if any item by cookie name exists or not.
	 * @param name Cookie string name.
	 */
	public HasCookie (name?: string): boolean;

	/**
	 * @summary Set http scheme string.
	 * Example: `request.SetScheme("https:");`
	 * @param rawProtocol
	 */
	public SetScheme (rawProtocol: string): Request;
	/**
	 * @summary Get http scheme string.
	 * Example: `"http:" | "https:"`
	 */
	public GetScheme (): string;
	/**
	 * @summary Get `TRUE` if http scheme is `"https:"`.
	 */
	public IsSecure (): boolean;
	/**
	 * @summary Set application server name - domain without any port.
	 * Method also change host record and domain records automatically.
	 * Example: `request.SetHostName("localhost");`
	 * @param rawHostName
	 */
	public SetHostName (rawHostName: string): Request;
	/**
	 * @summary Get application server name - domain without any port.
	 * Example: `"localhost"`
	 */
	public GetHostName (): string;
	/**
	 * @summary Set application host with port if there is any.
	 * Method also change server name record and domain records automatically.
	 * Example: `request.SetHost("localhost:88");`
	 * @param rawHost
	 */
	public SetHost (rawHost: string): Request;
	/**
	 * @summary Get application host with port if there is any.
	 * Example: `"localhost:88"`
	 */
	public GetHost (): string;
	/**
	 * @summary Set http port defined in requested URI if any.
	 * Empty string if there is no port number in requested address.`.
	 * Example: `request.SetPort("88")`
	 * @param rawPort
	 */
	public SetPort (rawPort: string): Request;
	/**
	 * @summary Get http port defined in requested URI if any.
	 * Empty string if there is no port number in requested address.`.
	 * Example: `"88" | ""`
	 */
	public GetPort (): string;
	/**
	 * @summary Set TOP level domain like `com` or `co.uk`.
	 * Method also change server name and host record automatically.
	 * @param topLevelDomain
	 */
	public SetTopLevelDomain (topLevelDomain: string | null): Request;
	/**
	 * @summary Set top level domain like `com` from `www.example.com`.
	 */
	public GetTopLevelDomain (): string | null;
	/**
	 * @summary Set second level domain like `example` in `www.example.com`.
	 * Method also change server name and host record automatically.
	 * @param secondLevelDomain
	 */
	public SetSecondLevelDomain (secondLevelDomain: string | null): Request;
	/**
	 * @summary Get second level domain like `example` in `www.example.com`.
	 */
	public GetSecondLevelDomain (): string | null;
	/**
	 * @summary Set second level domain like `example` from `www.example.com`.
	 * Method also change server name and host record automatically.
	 * @param thirdLevelDomain
	 */
	public SetThirdLevelDomain (thirdLevelDomain: string | null): Request;
	/**
	 * @summary Get third level domain like `www` from `www.example.com`.
	 */
	public GetThirdLevelDomain (): string | null;

	/**
	 * @summary Set base app directory path after domain,
	 * if application is placed in domain subdirectory.
	 * Example:
	 * - for full URI:  `"http://localhost:88/my/development/directory/www/requested/path/after/domain?with=possible&query=string"`
	 * - set base path: `request.SetBasePath("/my/development/directory/www");`
	 * @param rawBasePath
	 */
	public SetBasePath (rawBasePath: string): Request;
	/**
	 * @summary Get base app directory path after domain,
	 * if application is placed in domain subdirectory.
	 * Example:
	 * - full URI:  `"http://localhost:88/my/development/directory/www/requested/path/after/domain?with=possible&query=string"`
	 * - base path: `"/my/development/directory/www"`
	 */
	public GetBasePath (): string;
	/**
	 * Set requested path in from application root, never with query string.
	 * Example: `request.SetPort("/products/page/2");`
	 * @param rawPathValue
	 */
	public SetPath (rawPathValue: string): Request;
	/**
	 * @summary Get requested path in from application root, never with query string.
	 * Example: `"/products/page/2"`
	 * @param rawInput Get raw input if `true`. `false` by default to get value 
	 * 				   through `htmlspecialchars(result);` without ampersand `&` escaping.
	 */
	public GetPath (rawInput?: boolean);
	/**
	 * @summary Set URI query string, with or without question mark character, doesn't matter.
	 * Example: `request.SetQuery("param-1=value-1&param-2=value-2&param-3[]=value-3-a&param-3[]=value-3-b");`
	 * @param rawQuery
	 */
	public SetQuery (rawQuery: string): Request;
	/**
	 * @summary Get URI query string (without question mark character by default).
	 * Example: `"param-1=value-1&param-2=value-2&param-3[]=value-3-a&param-3[]=value-3-b"`
	 * @param withQuestionMark If `FALSE` (by default), query string is returned always without question
	 *						   mark character at the beginning.
	 *						   If `TRUE`, and query string contains any character(s), query string is returned
	 *						   with question mark character at the beginning. But if query string contains no
	 *						   character(s), query string is returned as EMPTY STRING WITHOUT question mark character.
	 * @param rawInput Get raw input if `true`. `false` by default to get value through 
	 * 				   `htmlspecialchars(result);` without ampersand `&` escaping.
	 */
	public GetQuery (withQuestionMark?: boolean, rawInput?: boolean): string;
	/**
	 * @summary Get request path after domain with possible query string
	 * Example: `"/requested/path/after/app/root?with=possible&query=string"`
	 * @param rawInput Get raw input if `true`. `false` by default to get 
	 * 				   value through `htmlspecialchars(result);` without ampersand `&` escaping.
	 */
	public GetRequestPath (rawInput?: boolean): string;
	/**
	 * @summary Get URI to requested domain and possible port.
	 * Example: `"https://domain.com" | "http://domain:88"` if any port.
	 * @param rawInput Get raw input if `true`. `false` by default to get value 
	 * 				   through `htmlspecialchars(result);` without ampersand `&` escaping.
	 */
	public GetDomainUrl (rawInput?: boolean): string;
	/**
	 * @summary Get base URI to application root.
	 * Example: `"http://domain:88/my/development/directory/www"`
	 * @param rawInput Get raw input if `true`. `false` by default to get value 
	 * 				   through `htmlspecialchars(result);` without ampersand `&` escaping.
	 */
	public GetBaseUrl (rawInput?: boolean): string;
	/**
	 * @summary Get request URI including scheme, domain, port, path, without any query string
	 * Example: "`http://localhost:88/my/development/directory/www/requested/path/after/domain"`
	 * @param rawInput Get raw input if `true`. `false` by default to get value 
	 * 				   through `htmlspecialchars(result);` without ampersand `&` escaping.
	 */
	public GetRequestUrl (rawInput?: boolean): string;
	/**
	 * @summary Get request URI including scheme, domain, port, path and with query string
	 * Example: `"http://localhost:88/my/development/directory/www/requested/path/after/domain?with=possible&query=string"`
	 * @param rawInput Get raw input if `true`. `false` by default to get value 
	 * 				   through `htmlspecialchars(result);` without ampersand `&` escaping.
	 */
	public GetFullUrl (rawInput?: boolean): string;

	/**
	 * @summary Requested script name path from application root.
	 * Example: `"/index.js"`
	 */
	public GetScriptName (): string;
	/**
	 * @summary Get application root path on hard drive.
	 * Example: `"C:/www/my/development/directory/www"`
	 */
	public GetAppRoot (): string;
	/**
	 * @summary Set upper cased http method.
	 * Example: `request.SetMethod("GET" | "POST" | "PUT" | "HEAD"...);`
	 * @param rawMethod
	 */
	public SetMethod (rawMethod: string): Request;
	/**
	 * @summary Get upper cased http method.
	 * Example: `"GET" | "POST" | "PUT" | "HEAD"...`
	 */
	public GetMethod (): string;
	/**
	 * @summary Get referer URI if any.
	 * Example: `"http://foreing.domain.com/path/where/is/link/to/?my=app"`
	 * @param rawInput Get raw input if `true`. `false` by default to get value through `htmlspecialchars(result);` without ampersand `&` escaping.
	 */
	public GetReferer (rawInput?: boolean): string;
	/**
	 * @summary Get server IP.
	 */
	public GetServerIp (): string;
	/**
	 * @summary Get client IP.
	 */
	public GetClientIp (): string;
	/**
	 * @summary Get `true` if request is requested on the background
	 * with usual Javascript HTTP header containing:
	 * `X-Requested-With: AnyJsFrameworkName`.
	 */
	public IsAjax (): boolean;
	/**
	 * @summary Get integer value from http header,
	 * If no value, `null` is returned.
	 */
	public GetContentLength (): number | null;
	/**
	 * @summary Get miliseconds time when the request has been started.
	 */
	public GetStartTime (): number;

	/**
	 * Event emitter
	 * The defined events on documents including:
	 * 1. close
	 * 2. data
	 * 3. end
	 * 4. readable
	 * 5. error
	 */
	public AddListener(event: "close", listener: () => void): this;
	public AddListener(event: "data", listener: (chunk: any) => void): this;
	public AddListener(event: "end", listener: () => void): this;
	public AddListener(event: "readable", listener: () => void): this;
	public AddListener(event: "error", listener: (err: Error) => void): this;
	public AddListener(event: string | symbol, listener: (...args: any[]) => void): this;

	public Emit(event: "close"): boolean;
	public Emit(event: "data", chunk: any): boolean;
	public Emit(event: "end"): boolean;
	public Emit(event: "readable"): boolean;
	public Emit(event: "error", err: Error): boolean;
	public Emit(event: string | symbol, ...args: any[]): boolean;

	public On(event: "close", listener: () => void): this;
	public On(event: "data", listener: (chunk: any) => void): this;
	public On(event: "end", listener: () => void): this;
	public On(event: "readable", listener: () => void): this;
	public On(event: "error", listener: (err: Error) => void): this;
	public On(event: string | symbol, listener: (...args: any[]) => void): this;

	public Once(event: "close", listener: () => void): this;
	public Once(event: "data", listener: (chunk: any) => void): this;
	public Once(event: "end", listener: () => void): this;
	public Once(event: "readable", listener: () => void): this;
	public Once(event: "error", listener: (err: Error) => void): this;
	public Once(event: string | symbol, listener: (...args: any[]) => void): this;

	public PrependListener(event: "close", listener: () => void): this;
	public PrependListener(event: "data", listener: (chunk: any) => void): this;
	public PrependListener(event: "end", listener: () => void): this;
	public PrependListener(event: "readable", listener: () => void): this;
	public PrependListener(event: "error", listener: (err: Error) => void): this;
	public PrependListener(event: string | symbol, listener: (...args: any[]) => void): this;

	public PrependOnceListener(event: "close", listener: () => void): this;
	public PrependOnceListener(event: "data", listener: (chunk: any) => void): this;
	public PrependOnceListener(event: "end", listener: () => void): this;
	public PrependOnceListener(event: "readable", listener: () => void): this;
	public PrependOnceListener(event: "error", listener: (err: Error) => void): this;
	public PrependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;

	public RemoveListener(event: "close", listener: () => void): this;
	public RemoveListener(event: "data", listener: (chunk: any) => void): this;
	public RemoveListener(event: "end", listener: () => void): this;
	public RemoveListener(event: "readable", listener: () => void): this;
	public RemoveListener(event: "error", listener: (err: Error) => void): this;
	public RemoveListener(event: string | symbol, listener: (...args: any[]) => void): this;
	
	public Read (size?: number): any;
	public SetEncoding (encoding: string): this;
	public Pause (): this;
	public Resume (): this;
	public IsPaused (): boolean;
	public UnPipe (destination?: NodeJS.WritableStream): this;
	public Unshift (chunk: any, encoding?: BufferEncoding): void;
	public Wrap (oldStream: NodeJS.ReadableStream): this;
	public Pipe <T extends NodeJS.WritableStream> (destination: T, options?: { end?: boolean; }): T;
}

export { Request, IRequestHeaders };
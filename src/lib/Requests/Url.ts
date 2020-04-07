import { Request } from "../Request";
import { Constants } from "./Constants";
import { StringHelper } from "../Tools/Helpers/StringHelper";


export class Url {
	/**
	 * Http scheme: `"http:" | "https:"`
	 * Example: `"http:"`
	 * @todo: implement https requesting.
	 */
	protected scheme?: string = 'http:';
	/**
	 * `TRUE` if http scheme is `"https:"`
	 */
	protected secure?: boolean;
	/**
	 * Application server name - domain without any port.
	 * Example: `"localhost"`
	 */
	protected hostName?: string;
	/**
	 * Application host with port if there is any.
	 * Example: `"localhost:88"`
	 */
	protected host?: string;
	/**
	 * Http port defined in requested URI if any, parsed by `url.parse()`.
	 * Empty string if there is no port number in requested address.`.
	 * Example: `"88" | ""`
	 */
	protected port?: string;
	/**
	 * Parsed server name (domain without port) parts.
	 * Example: `['any.content', 'example', 'co.uk'] | [NULL, NULL, 'localhost']`
	 */
	protected domainParts?: string[];
	/**
	 * `TRUE` if http port defined in requested URI (parsed by `url.parse()`).
	 */
	protected portDefined: boolean = false;
	/**
	 * Requested path in from application root, never with query string.
	 * Example: `"/products/page/2"`
	 */
	protected path?: string;
	/**
	 * Uri query string without question mark.
	 * Example: `"param-1=value-1&param-2=value-2&param-3[]=value-3-a&param-3[]=value-3-b"`
	 */
	protected query?: string;
	/**
	 * `TRUE` if request is requested from browser by `XmlHttpRequest` object
	 * with http header: `X-Requested-With: AnyJavascriptFrameworkName`, `FALSE` otherwise.
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
	/**
	 * Base app directory path after domain, if application is placed in domain subdirectory
	 * Example:
	 * - full URI:  `"http://localhost:88/my/development/directory/www/requested/path/after/domain?with=possible&query=string"`
	 * - base path: `"/my/development/directory/www"`
	 */
	protected basePath?: string;
	/**
	 * Request path after domain with possible query string
	 * Example: `"/requested/path/after/app/root?with=possible&query=string"`
	 */
	protected requestPath?: string;
	/**
	 * Url to requested domain and possible port.
	 * Example: `"https://domain.com" | "http://domain:88"` if any port.
	 */
	protected domainUrl?: string;
	/**
	 * Base URI to application root.
	 * Example: `"http://domain:88/my/development/directory/www"`
	 */
	protected baseUrl?: string;
	/**
	 * Request URI including scheme, domain, port, path, without any query string
	 * Example: "`http://localhost:88/my/development/directory/www/requested/path/after/domain"`
	 */
	protected requestUrl?: string;
	/**
	 * Request URI including scheme, domain, port, path and with query string
	 * Example: `"http://localhost:88/my/development/directory/www/requested/path/after/domain?with=possible&query=string"`
	 */
	protected fullUrl?: string;

	public SetScheme (rawProtocol: string): Request {
		this.scheme = rawProtocol;
		this.domainUrl = undefined;
		this.baseUrl = undefined;
		this.requestUrl = undefined;
		this.fullUrl = undefined;
		return this as any;
	}
	public GetScheme (): string {
		return this.scheme;
	}
	public IsSecure (): boolean {
		if (this.secure == null) {
			this.secure = [
				Constants.SCHEME_HTTPS,
				Constants.SCHEME_FTPS,
				Constants.SCHEME_IRCS,
				Constants.SCHEME_SSH
			].indexOf(this.GetScheme()) != -1;
		}
		return this.secure;
	}
	public SetHostName (rawHostName: string): Request {
		if (this.hostName !== rawHostName) 
			this.domainParts = undefined;
		this.hostName = rawHostName;
		this.domainUrl = undefined;
		this.baseUrl = undefined;
		this.requestUrl = undefined;
		this.fullUrl = undefined;
		if (rawHostName && this.portDefined)
			this.host = rawHostName + ':' + this.port;
		return this as any;
	}
	public GetHostName (): string {
		if (this.hostName == null) 
			this.SetHost(StringHelper.HtmlSpecialChars(
				// @ts-ignore
				(this as Request).GetHeader('host'), false
			));
		return this.hostName;
	}
	public SetHost (rawHost: string): Request {
		this.host = rawHost;
		this.domainUrl = undefined;
		this.baseUrl = undefined;
		this.requestUrl = undefined;
		this.fullUrl = undefined;
		var hostName: string;
		var doubleDotPos: number = rawHost.indexOf(':');
		if (doubleDotPos != -1) {
			hostName = rawHost.substr(0, doubleDotPos);
			this.SetPort(rawHost.substr(doubleDotPos + 1));
		} else {
			hostName = rawHost;
			this.port = '';
			this.portDefined = false;
		}
		return this.SetHostName(hostName) as any;
	}
	public GetHost (): string {
		if (this.host == null)
			this.SetHost(StringHelper.HtmlSpecialChars(
				// @ts-ignore
				(this as Request).GetHeader('host'), false
			));
		return this.host;
	}
	public SetPort (rawPort: string): Request {
		this.port = rawPort;
		this.domainUrl = undefined;
		this.baseUrl = undefined;
		this.requestUrl = undefined;
		this.fullUrl = undefined;
		if (rawPort.length > 0) {
			this.host = this.hostName + ':' + rawPort;
			this.portDefined = true;
		} else {
			this.host = this.hostName;
			this.portDefined = false;
		}
		return this as any;
	}
	public GetPort (): string {
		if (this.port == null)
			this.SetHost(StringHelper.HtmlSpecialChars(
				// @ts-ignore
				(this as Request).GetHeader('host'), false
			));
		return this.port;
	}
	public SetTopLevelDomain (topLevelDomain: string | null): Request {
		if (this.domainParts == null) this.initDomainSegments();
		this.domainParts[2] = topLevelDomain;
		this.hostName = this.domainParts.join('.').trim();
		if (this.hostName && this.portDefined)
			this.host = this.hostName + ':' + this.port;
		this.domainUrl = undefined;
		this.baseUrl = undefined;
		this.requestUrl = undefined;
		this.fullUrl = undefined;
		return this as any;
	}
	public GetTopLevelDomain (): string | null {
		if (this.domainParts == null) this.initDomainSegments();
		return this.domainParts[2];
	}
	public SetSecondLevelDomain (secondLevelDomain: string | null): Request {
		if (this.domainParts == null) this.initDomainSegments();
		this.domainParts[1] = secondLevelDomain;
		this.hostName = this.domainParts.join('.').trim();
		if (this.hostName && this.portDefined)
			this.host = this.hostName + ':' + this.port;
		this.domainUrl = undefined;
		this.baseUrl = undefined;
		this.requestUrl = undefined;
		this.fullUrl = undefined;
		return this as any;
	}
	public GetSecondLevelDomain (): string | null {
		if (this.domainParts == null) this.initDomainSegments();
		return this.domainParts[1];
	}
	public SetThirdLevelDomain (thirdLevelDomain: string | null): Request {
		if (this.domainParts == null) this.initDomainSegments();
		this.domainParts[0] = thirdLevelDomain;
		this.hostName = this.domainParts.join('.').trim();
		if (this.hostName && this.portDefined)
			this.host = this.hostName + ':' + this.port;
		this.domainUrl = undefined;
		this.baseUrl = undefined;
		this.requestUrl = undefined;
		this.fullUrl = undefined;
		return this as any;
	}
	public GetThirdLevelDomain (): string | null {
		if (this.domainParts == null) this.initDomainSegments();
		return this.domainParts[0];
	}
	public SetBasePath (rawBasePath: string): Request {
		this.basePath = rawBasePath;
		this.baseUrl = undefined;
		this.requestUrl = undefined;
		this.fullUrl = undefined;
		return this as any;
	}
	public GetBasePath (): string {
		return this.basePath;
	}
	public SetPath (rawPathValue: string): Request {
		this.path = rawPathValue;
		this.requestUrl = undefined;
		this.requestPath = undefined;
		this.fullUrl = undefined;
		return this as any;
	}
	public GetPath (rawInput: boolean = false) {
		return rawInput ? this.path : StringHelper.HtmlSpecialChars(this.path, false);
	}
	public SetQuery (rawQuery: string): Request {
		this.query = StringHelper.TrimLeft(rawQuery, '?');
		this.fullUrl = undefined;
		this.requestPath = undefined;
		return this as any;
	}
	public GetQuery (withQuestionMark: boolean = false, rawInput: boolean = false): string {
		var result: string = (withQuestionMark && this.query.length > 0)
			? '?' + this.query
			: this.query;
		return rawInput ? result : StringHelper.HtmlSpecialChars(result, false);
	}
	public GetRequestPath (rawInput: boolean = false): string {
		if (this.requestPath == null) 
			this.requestPath = this.GetPath(true) + this.GetQuery(true, true);
		return rawInput ? this.requestPath : StringHelper.HtmlSpecialChars(this.requestPath, false);
	}
	public GetDomainUrl (rawInput: boolean = false): string {
		if (this.domainUrl == null)
			this.domainUrl = this.GetScheme() + '//' + this.GetHost();
		return rawInput ? this.domainUrl : StringHelper.HtmlSpecialChars(this.domainUrl, false);
	}
	public GetBaseUrl (rawInput: boolean = false): string {
		if (this.baseUrl == null)
			this.baseUrl = this.GetDomainUrl(true) + this.GetBasePath();
		return rawInput ? this.baseUrl : StringHelper.HtmlSpecialChars(this.baseUrl, false);
	}
	public GetRequestUrl (rawInput: boolean = false): string {
		if (this.requestUrl == null)
			this.requestUrl = this.GetBaseUrl(true) + this.GetPath(true);
		return rawInput ? this.requestUrl : StringHelper.HtmlSpecialChars(this.requestUrl, false);
	}
	public GetFullUrl (rawInput: boolean = false): string {
		if (this.fullUrl == null)
			this.fullUrl = this.GetRequestUrl(true) + this.GetQuery(true, true);
		return rawInput ? this.fullUrl : StringHelper.HtmlSpecialChars(this.fullUrl, false);
	}

	/**
	 * @summary Request set up method called before `index.js` script execution.
	 * @param serverDocRoot 
	 * @param appRootFullPath 
	 * @param indexScript 
	 * @param serverBasePath 
	 */
	protected setUpIndexScriptExec (serverDocRoot: string, appRootFullPath: string, indexScript: string, serverBasePath: string): void {
		var basePath: string = appRootFullPath.substr(serverDocRoot.length);
		var requestPath: string = this.path;
		if (basePath.length > 0 && requestPath.indexOf(basePath) == 0)
			requestPath = requestPath.substr(basePath.length);
		if (this.query && this.query.length > 0) 
			requestPath += '?' + this.query;
		if (serverBasePath != null)
			basePath = serverBasePath + basePath;
		this.initUrlSegments(
			appRootFullPath, basePath, indexScript, requestPath
		);
	}
	

	/**
	 * Initialize URI segments parsed by `url.parse()`: path, query and fragment.
	 */
	protected initUrlSegments (appRoot, basePath, scriptName, requestPath): void {
		this.scheme = 'http:';
		this.appRoot = appRoot;
		this.basePath = basePath;
		this.scriptName = scriptName;
		var qmPos: number = requestPath.indexOf('?');
		if (qmPos !== -1) {
			this.path = requestPath.substr(0, qmPos);
			this.query = requestPath.substr(qmPos + 1);
		} else {
			this.path = requestPath;
			this.query = '';
		}
	}

	/**
	 * Initialize domain parts from server name property.
	 * If you need to add exceptional top-level domain names, use method
	 * `Request.AddTwoSegmentTlds('co.uk');`
	 * Example: 
	 * `'any.content.example.co.uk' => ['any.content', 'example', 'co.uk']`
	 */
	protected initDomainSegments (): void {
		var hostName: string = this.GetHostName(), // without port
			lastDotPos: number = hostName.lastIndexOf('.'),
			twoSegmentTlds: Map<string, boolean>,
			first: string,
			second: string,
			third: string,
			firstTmp: string;
		this.domainParts = [];
		if (lastDotPos == -1) {
			this.domainParts = [null, null, hostName];
		} else {
			first = hostName.substr(lastDotPos + 1);
			second = hostName.substr(0, lastDotPos);
			twoSegmentTlds = this.constructor['twoSegmentTlds'];
			// check co.uk and other...
			if (twoSegmentTlds && twoSegmentTlds.size > 0) {
				lastDotPos = second.lastIndexOf('.');
				if (lastDotPos != -1) {
					firstTmp = second.substr(lastDotPos + 1) + '.' + first;
					if (twoSegmentTlds.has(firstTmp)) {
						first = firstTmp;
						second = firstTmp = second.substr(0, lastDotPos);
					}
				}
			}
			lastDotPos = second.lastIndexOf('.');
			if (lastDotPos == -1) {
				this.domainParts = [null, second, first];
			} else {
				third = second.substr(0, lastDotPos);
				second = second.substr(lastDotPos + 1);
				this.domainParts = [third, second, first];
			}
		}
	}
}
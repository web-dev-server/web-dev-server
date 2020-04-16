import { IncomingMessage as HttpIncomingMessage } from "http";
import { StringHelper } from "../Tools/Helpers/StringHelper";
import { NumberHelper } from "../Tools/Helpers/NumberHelper";
import { Request } from "../Request";


export class Other {
	/**
	 * Http method (upper case) - `GET`, `POST`, `PUT`, `HEAD`...
	 * Example: `"GET"`
	 * @var string|NULL
	 */
	protected httpMethod?: string;
	/**
	 * `true` if request is requested from browser by `XmlHttpRequest` object
	 * with http header: `X-Requested-With: AnyJavascriptFrameworkName`, `false` otherwise.
	 */
	protected ajax?: boolean;
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

	
	public SetMethod (rawMethod: string): Request {
		this.httpMethod = rawMethod.toUpperCase();
		return this as any;
	}
	public GetMethod (): string {
		if (this.httpMethod == null) {
			var httpReq: HttpIncomingMessage = this['http'];
			this.httpMethod = httpReq.method.toUpperCase();
		}
		return this.httpMethod;
	}
	public IsAjax (): boolean {
		if (this.ajax == null) {
			var xReqHeader: string = "x-requested-with";
			var httpReq: HttpIncomingMessage = this['http'];
			this.ajax = (
				xReqHeader in httpReq.headers &&
				httpReq.headers[xReqHeader].length > 0
			);
		}
		return this.ajax;
	}
	public GetReferer (rawInput: boolean = false): string {
		if (this.referer == null) {
			var httpReq: HttpIncomingMessage = this['http'];
			var referer: string = httpReq.headers["referer"];
			if (referer) 
				while (referer.indexOf('%') !== -1)
					referer = StringHelper.RawUrlDecode(referer);
			this.referer = referer;
		}
		return rawInput 
			? this.referer 
			: StringHelper.HtmlSpecialChars(this.referer, false);
	}
	public GetServerIp () {
		if (this.serverIp == null) {
			var httpReq: HttpIncomingMessage = this['http'];
			this.serverIp = httpReq.socket.localAddress;
		}
		return this.serverIp;
	}
	public GetClientIp (): string {
		if (this.clientIp == null) {
			var httpReq: HttpIncomingMessage = this['http'];
			this.clientIp = httpReq.socket.remoteAddress.toString().replace(/[^0-9a-zA-Z\.\:\[\]]/g, '');
		}
		return this.clientIp;
	}
	public GetContentLength (): number | null {
		if (this.contentLength == null) {
			this.contentLength = null;
			var contentLengthHeader: string  = "content-length";
			var httpReq: HttpIncomingMessage = this['http'];
			if (
				contentLengthHeader in httpReq.headers &&
				NumberHelper.IsNumeric(httpReq.headers[contentLengthHeader])
			) this.contentLength = parseInt(httpReq.headers[contentLengthHeader].toString(), 10);
		}
		return this.contentLength;
	}
	public GetStartTime (): number {
		return this.startTime;
	}
}
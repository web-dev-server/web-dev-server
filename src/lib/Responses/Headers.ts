import {
	ServerResponse as HttpServerResponse,
	IncomingMessage as HttpIncomingMessage,
	OutgoingHttpHeaders as HttpOutgoingHttpHeaders,
	STATUS_CODES as HTTP_STATUS_CODES
} from "http";

import { Request } from "../Request";
import { Response } from "../Response";
import { Constants } from "./Constants";
import { IResponseHeaders } from "./IResponseHeaders";


export class Headers {
	/**
	 * Response HTTP protocol version by request.
	 * Example: `HTTP/1.0 | HTTP/1.1 | HTTP/2 | SPDY`
	 */
	protected httpVersion?: string = null;
	/**
	 * Response HTTP headers as `key => value` array.
	 * Example:
	 *	`array(
	 *		'content-type'		=> 'text/html',
	 *		'content-encoding'	=> 'utf-8'
	 *	);`
	 */
	protected headers?: any = {};
	/**
	 * Response content encoding.
	 * Example: `"utf-8" | "windows-1250" | "ISO-8859-2"`
	 * @var \string|NULL
	 */
	protected encoding?: string = null;
	/**
	 * Disabled headers, never sent except if there is
	 * rendered exception in development environment.
	 */
	protected disabledHeaders: Map<string, boolean> = new Map<string, boolean>();

	public IsSentHeaders (): boolean {
		var httpRes: HttpServerResponse = this['http'];
		return httpRes.headersSent;
	}
	public SetHeaders (headers: IResponseHeaders = {}, cleanAllPrevious: boolean = false): Response {
		var httpRes: HttpServerResponse = this['http'];
		if (cleanAllPrevious) {
			var allHeaders: HttpOutgoingHttpHeaders = httpRes.getHeaders();
			for (var name in allHeaders)
				httpRes.removeHeader(name);
		}
		for (var name in headers)
			this.SetHeader(name, headers[name]);
		return this as any;
	}
	public SetHeader (name: string, value: number | string | string[] | null): Response {
		name = name.toLowerCase();
		if (this.disabledHeaders.has(name))
			return this as any;
		var httpRes: HttpServerResponse = this['http'];
		httpRes.setHeader(name, value);
		this.headers[name] = value;
		if (name === 'content-type') {
			var valueStr: string = value.toString();
			var charsetPos: number = valueStr.indexOf('charset');
			if (charsetPos !== -1) {
				var equalPos: number = valueStr.indexOf('=', charsetPos);
				if (equalPos !== -1) this.SetEncoding(
					valueStr.substr(equalPos + 1).trim()
				);
			}
		}
		if (name === 'content-encoding') 
			this.SetEncoding(value.toString());
		return this as any;
	}
	public GetHeader (name: string): number | string | string[] | null {
		this.UpdateHeaders();
		name = name.toLowerCase();
		return name in this.headers
			? this.headers[name]
			: null;
	}
	public HasHeader (name: string): boolean {
		this.UpdateHeaders();
		name = name.toLowerCase();
		return name in this.headers;
	}
	public UpdateHeaders (): Response {
		var httpRes: HttpServerResponse = this['http'];
		this.headers = httpRes.getHeaders();
		return this as any;
	}
	public SetDisabledHeaders (...disabledHeaders: string[]): Response {
		this.disabledHeaders = new Map<string, boolean>();
		for (var i: number = 0, l: number = disabledHeaders.length; i < l; i++) 
			this.disabledHeaders.set(disabledHeaders[i], true);
		return this as any;
	}
	public GetDisabledHeaders (): string[] {
		var result: string[] = [];
		this.disabledHeaders.forEach((value, key) => result.push(key));
		return result;
	}
	public GetHttpVersion (): string {
		if (this.httpVersion == null) {
			var httpReq: HttpIncomingMessage = this['req'];
			this.httpVersion = httpReq.httpVersion
				? 'HTTP/' + httpReq.httpVersion
				: 'HTTP/1.1';
		}
		return this.httpVersion;
	}
	public SetHttpVersion (httpVersion: string): Response {
		this.httpVersion = httpVersion;
		return this as any;
	}
	public SetCode (code: number, codeMessage: string = null): Response {
		var httpRes: HttpServerResponse = this['http'];
		httpRes.statusCode = code;
		if (codeMessage != null) 
			httpRes.statusMessage = codeMessage;
		return this as any;
	}
	public GetCode (): number {
		var httpRes: HttpServerResponse = this['http'];
		if (httpRes.statusCode == null) 
			httpRes.statusCode == Constants.CODES.OK;
		return httpRes.statusCode;
	}
	public GetEncoding (): string | null {
		if (this.encoding == null) {
			this.UpdateHeaders();
			if ('content-encoding' in this.headers) {
				this.encoding = this.headers['content-encoding'];
			} else if ('content-type' in this.headers) {
				var valueStr: string = this.headers['content-type'].toString();
				var charsetPos: number = valueStr.indexOf('charset');
				if (charsetPos !== -1) {
					var equalPos: number = valueStr.indexOf('=', charsetPos);
					if (equalPos !== -1) 
						this.encoding = valueStr.substr(equalPos + 1).trim();
				}
			}
			if (!this.encoding)
				this.encoding = 'utf-8';
		}
		return this.encoding;
	}
	public SetEncoding (encoding: string = 'utf-8'): Response {
		var httpRes: HttpServerResponse = this['http'];
		httpRes.setHeader('content-encoding', encoding);
		this.encoding = encoding;
		this.headers['content-encoding'] = encoding;
		return this as any;
	}
	public IsUpgrading (): boolean {
		var httpRes: HttpServerResponse = this['http'];
		return httpRes.upgrading;
	}
	public IsRedirect (): boolean {
		return this.HasHeader('location');
	}
	public IsSent (): boolean {
		var httpRes: HttpServerResponse = this['http'];
		return httpRes.finished && httpRes.headersSent;
	}
	public SendHeaders (code?: number, end: boolean = false): Response {
		var httpRes: HttpServerResponse = this['http'];
		if (httpRes.headersSent) return this as any;
		httpRes.statusCode = code
			? code
			: this.GetCode();
		var codeStr: string = httpRes.statusCode.toString();
		if (httpRes.statusMessage == null) 
			httpRes.statusMessage = codeStr in HTTP_STATUS_CODES
				? HTTP_STATUS_CODES[codeStr]
				: '';
		this.UpdateHeaders();
		if (!('content-encoding' in this.headers)) 
			this.headers['content-encoding'] = this.GetEncoding();
		var httpReq: Request = this['req'];
		httpRes.setHeader('Host', httpReq.GetHost());
		var charsetMatched: boolean,
			charsetPos: number,
			equalPos: number,
			value: any,
			separator: string,
			nameExploded: string[];
		for (var name in this.headers) {
			value = this.headers[name];
			if (name == 'content-type') {
				charsetMatched = false;
				charsetPos = value.toString().indexOf('charset');
				if (charsetPos !== -1) {
					equalPos = value.indexOf('=', charsetPos);
					if (equalPos != -1) 
						charsetMatched = true;
				}
				if (!charsetMatched) 
					value += '; charset=' + this.GetEncoding();
			}
			if (this.disabledHeaders.has(name)) {
				httpRes.removeHeader(name);
			} else {
				nameExploded = name.split('-');
				name = '';
				separator = '';
				nameExploded.forEach((part, i) => {
					if (part.length == 0) return;
					name += separator + part.substr(0, 1).toUpperCase();
					if (part.length > 1) name += part.substr(1);
					separator = '-';
				});
				httpRes.setHeader(name, value);
			}
		}
		var cookiesHeaders: string[] = this['getCookiesHeaders']();
		for (var i: number = 0, l: number = cookiesHeaders.length; i < l; i++) 
			httpRes.setHeader('Set-Cookie', cookiesHeaders[i]);
		this.disabledHeaders.forEach((bool, name) => {
			httpRes.removeHeader(name);
		});
		httpRes.writeHead(httpRes.statusCode);
		if (end) this.End();
		return this as any;
	}
	public Redirect (location: string, code: number = Constants.CODES.SEE_OTHER, reason?: string, end: boolean = true): void {
		this.SetHeader('Location', location);
		if (reason && reason.length > 0)
			this.SetHeader('X-Redirect-Reason', reason);
		this.SendHeaders(code);
		if (end) this.End();
		return this as any;
	}
	public End (cb?: () => void): void {
		var httpRes: HttpServerResponse = this['http'];
		httpRes.end(() => {
			httpRes.emit('session-unlock');
			httpRes.finished = true;
			if (cb) cb();
		});
		return this as any;
	}
}
import { 
	IncomingMessage as HttpIncomingMessage,
	ServerResponse as HttpServerResponse
} from "http";
import { Readable as StreamReadable } from "stream";

import { ObjectHelper } from "./Tools/Helpers/ObjectHelper";
import { Constants } from "./Responses/Constants";
import { Content } from "./Responses/Content";
import { Cookies } from "./Responses/Cookies";
import { IResponseCookie } from "./Responses/IResponseCookie";
import { Headers } from "./Responses/Headers";
import { IResponseHeaders } from "./Responses/IResponseHeaders";
import { Streams } from "./Responses/Streams";


Object.defineProperty(exports, "__esModule", { value: true });
exports.Response = /** @class */ (function () {
	class Response {
		//protected baseUrl: string;
		protected req: HttpIncomingMessage;
		protected http: HttpServerResponse;
		constructor (req: HttpIncomingMessage) {
			//super(req);
			// @ts-ignore
			HttpServerResponse.call(this, req);
			this.http = this as any;
			this.req = req;
			this['httpVersion'] = null;
			this['headers'] = {};
			this['encoding'] = null;
			this['disabledHeaders'] = new Map<string, boolean>();
			this['body'] = null;
			this['cookies'] = new Map<string, IResponseCookie>();
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
	ObjectHelper.Extend(Response, HttpServerResponse);
	ObjectHelper.Mixins(Response, [
		Constants, 
		Content, 
		Cookies,
		Headers,
		Streams
	]);
    return Response;
}());


declare class Response {
	public static readonly CODES: {
		/**
		 * @summary HTTP response code 200 for OK response;
		 */
		OK: number, 
		/**
		 * @summary HTTP response code 301 for moved permanently redirection;
		 */
		MOVED_PERMANENTLY: number, 
		/**
		 * @summary HTTP response code 303 for see other redirection;
		 */
		SEE_OTHER: number, 
		/**
		 * @summary HTTP response code 404 for not found error;
		 */
		NOT_FOUND: number, 
		/**
		 * @summary HTTP response code 500 for internal server error;
		 */
		INTERNAL_SERVER_ERROR: number
	};

	/**
	 * @summary Internal header always sent in every response.
	 */
	public static readonly HEADER_X_CPU_RAM: string;

	public constructor(res: HttpServerResponse);
	
	/**
	 * @summary Set HTTP response body.
	 * @param body
	 */
	public SetBody (body: string): this;
	/**
	 * @summary Prepend HTTP response body.
	 * @param body
	 */
	public PrependBody (body: string): this;
	/**
	 * @summary Append HTTP response body.
	 * @param body
	 */
	public AppendBody (body: string): this;
	/**
	 * @summary Get HTTP response body.
	 */
	public GetBody (): string | null;
	/**
	 * @summary Returns if response has any `text/html` or `application/xhtml+xml`
	 * substring in `Content-Type` header.
	 */
	public IsHtmlOutput (): boolean;
	/**
	 * @summary Returns if response has any `xml` substring in `Content-Type` header.
	 */
	public IsXmlOutput (): boolean;
	/**
	 * @summary `true` if body has been sent.
	 */
	public IsSentBody (): boolean;
	/**
	 * @summary Send all HTTP headers and send response body.
	 * @param end `true` by default.
	 * @param cb Callback, used only if end param is `true`.
	 */
	public Send (end?: boolean, cb?: () => void): this;
	/**
	 * @summary Send response body.
	 * @param end `true` by default.
	 * @param cb Callback, used only if end param is `true`.
	 */
	public SendBody (end?: boolean, cb?: () => void): this;

	/**
	 * @summary Set response cookie.
	 * @param cfg
	 */
	public SetCookie (cfg: IResponseCookie): this;
	/**
	 * @summary Check if response object has defined given response cookie name.
	 * @param name 
	 */
	public HasCookie (name: string): boolean;
	/**
	 * @summary Delete cookie - set value to empty string and set expiration to past time.
	 * @param name 
	 */
	public DeleteCookie (name: string): this;

	/**
	 * @summary `TRUE` if headers has been sent.
	 */
	public IsSentHeaders (): boolean;
	/**
	 * @summary Set multiple HTTP response headers as `key => value` object.
	 * All given headers are automatically merged with previously setted headers.
	 * If you change second argument to true, all previous response headers
	 * are removed and given headers will be only headers for output.
	 * There is automatically set response encoding from value for
	 * `Content-Type` header, if contains any `charset=...`.
	 * There is automatically set response encoding from value for
	 * `Content-Encoding` header.
	 * Example: `response.SetHeader(array('Content-Type' => 'text/plain; charset=utf-8'));`
	 * @param headers
	 * @param cleanAllPrevious `false` by default. If `true`, all previously configured headers will be replaced.
	 */
	public SetHeaders (headers?: IResponseHeaders, cleanAllPrevious?: boolean): this;
	/**
	 * @summary Set HTTP response header.
	 * There is automatically set response encoding from value for
	 * `Content-Type` header, if contains any `charset=...`.
	 * There is automatically set response encoding from value for
	 * `Content-Encoding` header.
	 * Example: `response.SetHeader('Content-Type', 'text/plain; charset=utf-8');`
	 * @param name
	 * @param value
	 */
	public SetHeader (name: string, value: number | string | string[] | null): this;
	/**
	 * @summary Get HTTP response header by name. If header doesn't exists, null is returned.
	 * Example: `response.GetHeader('content-type'); // returns 'text/plain; charset=utf-8'`
	 * @param name
	 */
	public GetHeader (name: string): number | string | string[] | null;
	/**
	 * @summary Get if response has any HTTP response header by given `name`.
	 * Example:
	 *	`response.GetHeader('Content-Type'); // returns true if there is header 'content-type'
	 *	`response.GetHeader('content-type'); // returns true if there is header 'content-type'
	 * @param name
	 */
	public HasHeader (name: string): boolean;
	/**
	 * @summary Consolidate all headers from http internal response into local headers list.
	 */
	public UpdateHeaders (): this;
	/**
	 * @summary Set disabled headers, never sent except if there is
	 * rendered exception in development environment.
	 * @param disabledHeaders,...
	 */
	public SetDisabledHeaders (...disabledHeaders: string[]): this;
	/**
	 * @summary Get disabled headers, never sent except if there is
	 * rendered exception in development environment.
	 */
	public GetDisabledHeaders (): string[];
	/**
	 * @summary Get response protocol HTTP version by request, `HTTP/1.1` by default.
	 */
	public GetHttpVersion (): string;
	/**
	 * @summary Set response protocol HTTP version - `HTTP/1.1 | HTTP/2.0`...
	 * @param httpVersion
	 */
	public SetHttpVersion (httpVersion: string): this;
	/**
	 * @summary Set HTTP response code.
	 * @param code
	 * @param codeMessage
	 */
	public SetCode (code: number, codeMessage?: string): this;
	/**
	 * @summary Get HTTP response code.
	 */
	public GetCode (): number;
	/**
	 * @summary Get HTTP response content encoding.
	 * Example: `response.GetEncoding(); // returns 'utf-8'`
	 */
	public GetEncoding (): string | null;
	/**
	 * @summary Set HTTP response content encoding.
	 * Example: `response.SetEncoding('utf-8');`
	 * @param encoding
	 */
	public SetEncoding (encoding?: string): this;
	/**
	 * @summary Return `true` if response is upgrading response.
	 */
	public IsUpgrading (): boolean;
	/**
	 * @summary Return if response has any redirect `"location: ..."` header inside.
	 */
	public IsRedirect (): boolean;
	/**
	 * @summary `true` if headers and body has been sent.
	 */
	public IsSent (): boolean;
	/**
	 * @summary Send all HTTP headers.
	 * @param code
	 * @param end `false` by default.
	 */
	public SendHeaders (code?: number, end?: boolean): this;
	/**
	 * @summary Redirect request to another location.
	 * @param location 
	 * @param code 
	 * @param reason 
	 * @param end `true` by default.
	 */
	public Redirect (location: string, code?: number, reason?: string, end?: boolean): void;
	/**
	 * @summary end the request with optional callback.
	 * @param cb 
	 */
	public End (cb?: () => void): void;
	
	/**
	 * Event emitter
	 * The defined events on documents including:
	 * 1. close
	 * 2. drain
	 * 3. error
	 * 4. finish
	 * 5. pipe
	 * 6. unpipe
	 */
	public AddListener(event: "close", listener: () => void): this;
	public AddListener(event: "drain", listener: () => void): this;
	public AddListener(event: "error", listener: (err: Error) => void): this;
	public AddListener(event: "finish", listener: () => void): this;
	public AddListener(event: "pipe", listener: (src: StreamReadable) => void): this;
	public AddListener(event: "unpipe", listener: (src: StreamReadable) => void): this;
	public AddListener(event: string | symbol, listener: (...args: any[]) => void): this;

	public Emit(event: "close"): boolean;
	public Emit(event: "drain"): boolean;
	public Emit(event: "error", err: Error): boolean;
	public Emit(event: "finish"): boolean;
	public Emit(event: "pipe", src: StreamReadable): boolean;
	public Emit(event: "unpipe", src: StreamReadable): boolean;
	public Emit(event: string | symbol, ...args: any[]): boolean;

	public On(event: "close", listener: () => void): this;
	public On(event: "drain", listener: () => void): this;
	public On(event: "error", listener: (err: Error) => void): this;
	public On(event: "finish", listener: () => void): this;
	public On(event: "pipe", listener: (src: StreamReadable) => void): this;
	public On(event: "unpipe", listener: (src: StreamReadable) => void): this;
	public On(event: string | symbol, listener: (...args: any[]) => void): this;

	public Once(event: "close", listener: () => void): this;
	public Once(event: "drain", listener: () => void): this;
	public Once(event: "error", listener: (err: Error) => void): this;
	public Once(event: "finish", listener: () => void): this;
	public Once(event: "pipe", listener: (src: StreamReadable) => void): this;
	public Once(event: "unpipe", listener: (src: StreamReadable) => void): this;
	public Once(event: string | symbol, listener: (...args: any[]) => void): this;

	public PrependListener(event: "close", listener: () => void): this;
	public PrependListener(event: "drain", listener: () => void): this;
	public PrependListener(event: "error", listener: (err: Error) => void): this;
	public PrependListener(event: "finish", listener: () => void): this;
	public PrependListener(event: "pipe", listener: (src: StreamReadable) => void): this;
	public PrependListener(event: "unpipe", listener: (src: StreamReadable) => void): this;
	public PrependListener(event: string | symbol, listener: (...args: any[]) => void): this;

	public PrependOnceListener(event: "close", listener: () => void): this;
	public PrependOnceListener(event: "drain", listener: () => void): this;
	public PrependOnceListener(event: "error", listener: (err: Error) => void): this;
	public PrependOnceListener(event: "finish", listener: () => void): this;
	public PrependOnceListener(event: "pipe", listener: (src: StreamReadable) => void): this;
	public PrependOnceListener(event: "unpipe", listener: (src: StreamReadable) => void): this;
	public PrependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;

	public RemoveListener(event: "close", listener: () => void): this;
	public RemoveListener(event: "drain", listener: () => void): this;
	public RemoveListener(event: "error", listener: (err: Error) => void): this;
	public RemoveListener(event: "finish", listener: () => void): this;
	public RemoveListener(event: "pipe", listener: (src: StreamReadable) => void): this;
	public RemoveListener(event: "unpipe", listener: (src: StreamReadable) => void): this;
	public RemoveListener(event: string | symbol, listener: (...args: any[]) => void): this;

	public Write (chunk: any, encoding: string, cb?: (error: Error | null | undefined) => void): boolean;
	public Pipe <T extends NodeJS.WritableStream> (destination: T, options?: { end?: boolean; }): T;
}

export { Response, IResponseHeaders, IResponseCookie };
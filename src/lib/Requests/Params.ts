import { IncomingMessage } from "http";
import { Server } from "../Server";
import { ErrorsHandler } from "../Handlers/Error";
import { Request } from "../Request";
import { StringHelper } from "../Tools/Helpers/StringHelper";
import { Protected } from "./Protected";
import { Response } from '../Response';


export class Params {
	protected params?: any;
	protected body?: string;
	protected response?: Response;

	public IsCompleted (): boolean {
		var httpReq: IncomingMessage = this['http'];
		return httpReq.complete;
	}
	public async GetBody (): Promise<string> {
		var httpReq: IncomingMessage = this['http'];
		return new Promise<string>((
			resolve: (textBody: string) => void, reject: (err: Error) => void
		) => {
			if (httpReq.complete) resolve(this.body);
			httpReq.on('body-loaded', () => {
				resolve(this.body);
			});
		});
	}
	public SetParams (params: any): Request {
		this.params = params;
		return this as any;
	}
	public GetParams (
		nameReplaceFilter: string | false | { pattern: string | RegExp, replace: string | Function } = "\-\._a-zA-Z0-9",
		valueReplaceFilter: string | false | { pattern: string | RegExp, replace: string | Function } = { pattern: /[\<\>\'"]/g, replace: ''},
		onlyNames: string[] = []
	): any {
		if (this.params == null) this.initParams();
		var result: any = {},
			cleanedName: string,
			noNameFiltering = !nameReplaceFilter || nameReplaceFilter === '.*',
			noValueFiltering = !valueReplaceFilter || valueReplaceFilter === '.*';
		
		if (noNameFiltering && noValueFiltering) {
			if (onlyNames.length > 0) {
				for (var name in this.params) {
					if (onlyNames.indexOf(name) != -1)
						result[name] = this.params[name];
				}
			} else {
				result = this.params;
			}
			return result;
		}

		for (var name in this.params) {
			cleanedName = noNameFiltering
				? name
				: Protected.CleanParamValue(name, nameReplaceFilter);
			result[cleanedName] = noValueFiltering
				? this.params[name]
				: Protected.GetParamFromCollection(
					this.params, name, nameReplaceFilter, valueReplaceFilter, null
				);
		}

		return result;
	}
	public SetParam (name: string, value: any): Request {
		if (this.params == null) this.initParams();
		this.params[name] = value;
		return this as any;
	}
	public GetParam (
		name: string,
		valueReplaceFilter: string | false | { pattern: string | RegExp, replace: string | Function } = "a-zA-Z0-9_;, /\-\@\:",
		ifNullValue: any = null
	): any {
		if (this.params == null) this.initParams();
		return Protected.GetParamFromCollection(
			this.params, name, false, valueReplaceFilter, ifNullValue
		);
	}
	public RemoveParam (name: string): Request {
		if (this.params == null) this.initParams();
		delete this.params[name];
		return this as any;
	}
	public HasParam (name: string): boolean {
		if (this.params == null) this.initParams();
		return name in this.params;
	}

	/**
	 * Initialize params from GET (or also from post, if request is already completed).
	 */
	protected initParams (): void {
		var httpReq: IncomingMessage = this['http'] as IncomingMessage,
			postParams: any,
			getParams: any,
			method: string;
		getParams = StringHelper.QueryStringDecode(this['query'], false);
		this.params = getParams;
		if (!httpReq.complete) return;
		method = httpReq.method.toUpperCase();
		if (method != 'POST' && method != 'PUT') return;
		var contentType: string = this['GetHeader']('content-type');
		var multiPartHeader: string = 'multipart/form-data';
		var multiPartContent: boolean = contentType.indexOf(multiPartHeader) != -1;
		// @see https://stackoverflow.com/a/37046109/7032987
		if (!multiPartContent) 
			postParams = this.parseBodyParams(contentType);
		if (postParams == null) return;
		for (var key in postParams)
			this.params[key] = postParams[key];
	}

	/**
	 * @summary Read and return unserialized POST/PUT request body by "content-type" header.
	 */
	protected parseBodyParams (contentType: string): any {
		if (this.body == null) return null;
		var result: any = null,
			httpReq: IncomingMessage = this['http'] as IncomingMessage,
			server: Server = httpReq.socket['server']['__wds'],
			// @ts-ignore
			errorsHandler: ErrorsHandler = server.errorsHandler;
		var urlEncType: boolean = contentType.indexOf('application/x-www-form-urlencoded') != -1;
		if (urlEncType) {
			try {
				result = StringHelper.QueryStringDecode(this.body, false);
			} catch (e1) {
				errorsHandler.LogError(e1, 500, this as any, this.response);
			}
		} else {
			var jsonType: boolean = (
				contentType.indexOf('application/json') != -1 ||
				contentType.indexOf('text/javascript') != -1 ||
				contentType.indexOf('application/ld+json') != -1
			);
			if (jsonType) {
				try {
					result = JSON.parse(this.body);
				} catch (e2) {
					errorsHandler.LogError(e2, 500, this as any, this.response);
				}
			} else {
				// if content type header is not recognized,
				// try JSON decoding first, then fallback to query string:
				var probablyAJsonType: boolean = !StringHelper.IsQueryString(this.body);
				if (probablyAJsonType) {
					try {
						result = JSON.parse(this.body);
					} catch (e3) {
						errorsHandler.LogError(e3, 500, this as any, this.response);
						probablyAJsonType = false; // fall back to query string parsing
					}
				}
				if (!probablyAJsonType) {
					try {
						result = StringHelper.QueryStringDecode(this.body, false);
					} catch (e4) {
						errorsHandler.LogError(e4, 500, this as any, this.response);
					}
				}
			}
		}
		return result;
	}
}
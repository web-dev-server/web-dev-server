import { IncomingMessage } from "http";
//import { UrlWithParsedQuery, parse as UrlParse } from "url";
import { Request } from "../Request";
import { StringHelper } from "../Tools/Helpers/StringHelper";
import { Protected } from "./Protected";


export class Params {
	protected params?: any;
	protected body?: string;

	public IsCompleted (): boolean {
		var httpReq: IncomingMessage = this['http'];
		return httpReq.complete;
	}
	public async LoadBody (): Promise<string> {
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
		//try { 
			var queryString: string = this['GetQuery'](false, true),
			getParams = StringHelper.QueryStringDecode(queryString, false);
		/*} catch (e) {
			var parsedUrlWithJsonQuery: UrlWithParsedQuery = UrlParse(this['_url'], true),
			getParams = parsedUrlWithJsonQuery.query as any;
		}*/
		this.params = getParams;
		if (!httpReq.complete) return;
		method = httpReq.method.toUpperCase();
		if (method != 'POST' && method != 'PUT') return;
		postParams = this.initParamsCompletePostData();
		if (postParams == null) return;
		for (var key in postParams)
			this.params[key] = postParams[key];
	}

	/**
	 * Read and return unserialized POST/PUT request body.
	 */
	protected initParamsCompletePostData (): any {
		if (this.body == null) return null;
		var result: any = null;
		var rawInput: string = this.body;
		// try first JSON decoding, then fallback to query string
		var probablyAJsonType: boolean = !StringHelper.IsQueryString(rawInput);
		if (probablyAJsonType) {
			try {
				result = JSON.parse(rawInput);
			} catch (e) {
				probablyAJsonType = false; // fall back to query string parsing
			}
		}
		if (!probablyAJsonType) {
			//try {
				result = StringHelper.QueryStringDecode(rawInput, false);
			/*} catch (e) {
				rawInput = 'http://localhost/?' + StringHelper.TrimLeft(StringHelper.Trim(rawInput, '&='), '');
				var parsedBodyAsJsonQuery: UrlWithParsedQuery = UrlParse(rawInput, true);
				if (parsedBodyAsJsonQuery && parsedBodyAsJsonQuery.query)
					result = parsedBodyAsJsonQuery.query as any;
				if (parsedBodyAsJsonQuery && parsedBodyAsJsonQuery.query)
					result = parsedBodyAsJsonQuery.query as any;
			}*/
		}
		return result;
	}
}
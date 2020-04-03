import { IncomingMessage, IncomingHttpHeaders } from "http";
import { Request } from "../Request";
import { Protected } from "./Protected";
import { IRequestCookies } from "./IRequestCookies";


export class Cookies {
	protected cookies?: IRequestCookies;
	
	public SetCookies (cookies: IRequestCookies): Request {
		this.cookies = cookies;
		return this as any;
	}
	public GetCookies (
		nameReplaceFilter: string | false | { pattern: string | RegExp, replace: string | Function } = "\-\._a-zA-Z0-9",
		valueReplaceFilter: string | false | { pattern: string | RegExp, replace: string | Function } = { pattern: /[\<\>\'"]/g, replace: ''}, 
		onlyNames: string[] = []
	): IRequestCookies {
		if (this.cookies == null) this.initCookies();

		var result: IRequestCookies = new Map<string, string>();
		var noNameFiltering = !nameReplaceFilter || nameReplaceFilter === '.*';
		var noValueFiltering = !valueReplaceFilter || valueReplaceFilter === '.*';

		if (noNameFiltering && noValueFiltering) {
			if (onlyNames.length > 0) {
				this.cookies.forEach((cookie, name) => {
					if (onlyNames.indexOf(name) != -1)
						result.set(name, cookie);
				});
			} else {
				result = this.cookies;
			}
			return result;
		}

		this.cookies.forEach((cookie, name) => {
			if (onlyNames.length > 0 && onlyNames.indexOf(name) == -1) return;
			var cleanedName: string = noNameFiltering
				? name
				: Protected.CleanParamValue(name, nameReplaceFilter);
			var cleanedValue: string = noValueFiltering
				? cookie
				: Protected.CleanParamValue(cookie, valueReplaceFilter);
			result.set(cleanedName, cleanedValue);
		});
		
		return result;
	}
	public SetCookie (name: string, value: string): Request {
		if (this.cookies == null) this.initCookies();
		this.cookies.set(name, value == null ? '' : value);
		return this as any;
	}
	public GetCookie (
		name: string = '',
		valueReplaceFilter: string | false | { pattern: string | RegExp, replace: string | Function } = "\;\,\-\.\@\=\+\?\!\/ _a-zA-Z0-9",
		ifNullValue: string = null
	): string | null {
		if (this.cookies == null) this.initCookies();
		return Protected.GetParamFromCollection(
			this.cookies, name, false, valueReplaceFilter, ifNullValue
		);
	}
	public HasCookie (name: string): boolean {
		if (this.cookies == null) this.initCookies();
		return this.cookies.has(name);
	}

	/**
	 * @summary Parse "Cookie" header into local cookies map.
	 */
	protected initCookies (): void {
		this.cookies = new Map<string, string>();
		var headers: IncomingHttpHeaders = (this['http'] as IncomingMessage).headers,
			rawHeader: string = headers["cookie"];
		if (rawHeader == null) return;
		var rawCookies: string[] = String(rawHeader).split(';'),
			rawCookie: string,
			equalPos: number;
		for (var i: number = 0, l: number = rawCookies.length; i < l; i++) {
			rawCookie = rawCookies[i].trim();
			equalPos = rawCookie.indexOf('=');
			if (equalPos == -1) {
				this.cookies.set(rawCookie, '');
			} else {
				this.cookies.set(
					rawCookie.substr(0, equalPos).trim(),
					rawCookie.substr(equalPos + 1).trim()
				);
			}
		}
	}
}
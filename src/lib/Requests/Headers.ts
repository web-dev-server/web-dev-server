import { IncomingMessage as HttpIncomingMessage } from "http";

import { Request } from "../Request";
import { Protected } from "./Protected";
import { IRequestHeaders } from "./IRequestHeaders";


export class Headers {
	public SetHeaders (headers: any = {}): Headers {
		var currentHeaders: IRequestHeaders = (this['http'] as HttpIncomingMessage).headers;
		for (var key in headers)
			currentHeaders[key.toLowerCase()] = headers[key];
		return this as any;
	}
	public GetHeaders (
		nameReplaceFilter: string | false | { pattern: string | RegExp, replace: string | Function } = "\-a-zA-Z0-9",
		valueReplaceFilter: string | false | { pattern: string | RegExp, replace: string | Function } = { pattern: /[\<\>\'"]/g, replace: ''},
		onlyNames: string[] = []
	): IRequestHeaders {
		var headers: IRequestHeaders = (this['http'] as HttpIncomingMessage).headers,
			result: IRequestHeaders = {},
			cleanedName: string,
			noNameFiltering = !nameReplaceFilter || nameReplaceFilter === '.*',
			noValueFiltering = !valueReplaceFilter || valueReplaceFilter === '.*';
		
		if (noNameFiltering && noValueFiltering) {
			if (onlyNames.length > 0) {
				for (var name in headers) {
					if (onlyNames.indexOf(name) != -1)
						result[name] = headers[name];
				}
			} else {
				result = headers;
			}
			return result;
		}

		for (var name in headers) {
			cleanedName = noNameFiltering
				? name
				: Protected.CleanParamValue(name, nameReplaceFilter);
			result[cleanedName] = noValueFiltering
				? headers[name]
				: Protected.GetParamFromCollection(
					headers, name, nameReplaceFilter, valueReplaceFilter, null
				);
		}
		return result;
	}
	public SetHeader (name: string = '', value: string | string[] = ''): Request {
		var headers: IRequestHeaders = (this['http'] as HttpIncomingMessage).headers;
		headers[name.toLowerCase()] = value;
		return this as any;
	}
	public GetHeader (
		name: string = '',
		replaceFilter: string | false | { pattern: string | RegExp, replace: string | Function } = { pattern: /[\<\>\'"]/g, replace: ''},
		ifNullValue: any = null
	): string | null {
		var headers: IRequestHeaders = (this['http'] as HttpIncomingMessage).headers;
		return Protected.GetParamFromCollection(
			headers, name.toLowerCase(), false, replaceFilter, ifNullValue
		);
	}
	public HasHeader (name: string = ''): boolean {
		var headers: IRequestHeaders = (this['http'] as HttpIncomingMessage).headers;
		return name.toLowerCase() in headers;
	}
	public IsUpgrading (): boolean {
		var upgrHeader = this.GetHeader('upgrading');
		return upgrHeader && upgrHeader.length > 0;
	}
}
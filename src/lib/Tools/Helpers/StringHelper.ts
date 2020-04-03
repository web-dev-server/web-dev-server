import { ObjectHelper } from "./ObjectHelper";
import { NumberHelper } from "./NumberHelper";


interface IQsObjectLevel {
	level: any;
	key?: any;
	desc?: string;
	index: number;
}
interface IQsNameLevel {
	implicitIndex: boolean;
	value: string;
}

export class StringHelper {
	protected static readonly HTML_SPECIAL_CHARS: any = {
		'"': '&quot;',
		"'": '&apos;',
		'<': '&lt;',
		'>': '&gt;',
		'&': '&amp;',
	};
	protected static readonly HTML_SPECIAL_CHARS_WITHOUT_AMP: any = {
		'"': '&quot;',
		"'": '&apos;',
		'<': '&lt;',
		'>': '&gt;',
	};
	public static Trim (str: string, chars: string): string {
		var ch: string, newStr = '';
		for (var a: number = 0, b: number = chars.length; a < b; a++) {
			ch = chars.charAt(a);
			for (var i = 0, l = str.length; i < l; i += 1) {
				if (str.charAt(i) == ch) {
					newStr = str.substr(i + 1);
				} else {
					newStr = str.substr(i);
					break;
				}
			}
			str = newStr;
			for (var i = str.length - 1; i > -1; i -= 1) {
				if (str.charAt(i) == ch) {
					newStr = str.substring(0, i);
				} else {
					newStr = str.substring(0, i + 1);
					break;
				}
			}
		}
		return newStr;
	}
	public static TrimLeft (str: string, chars: string): string {
		var ch: string, newStr = '';
		for (var a: number = 0, b: number = chars.length; a < b; a++) {
			ch = chars.charAt(a);
			for (var i: number = 0, l: number = str.length; i < l; i += 1) {
				if (str.charAt(i) == ch) {
					newStr = str.substr(i + 1);
				} else {
					newStr = str.substr(i);
					break;
				}
			}
		}
		return newStr;
	}
	public static TrimRight (str: string, chars: string): string {
		var ch: string, newStr = '';
		for (var a: number = 0, b: number = chars.length; a < b; a++) {
			ch = chars.charAt(a);
			for (var i = str.length - 1; i > -1; i -= 1) {
				if (str.charAt(i) == ch) {
					newStr = str.substring(0, i);
				} else {
					newStr = str.substring(0, i + 1);
					break;
				}
			}
		}
		return newStr;
	}
	public static Strtr (str: string, dic: any): string { 
		var makeToken = (inx) => `{{###~${inx}~###}}`,
			tokens = Object.keys(dic).map(
				(key, inx) => ({
					key,
					val: dic[key],
					token: makeToken(inx)
				})
			),
			tokenizedStr = tokens.reduce(
				(carry, entry) => carry ? carry.replace( entry.key, entry.token ) : carry, 
				str
			);
		return tokens.reduce<string>(
			(carry, entry) => carry ? carry.replace(
				entry.token, entry.val
			) : carry, 
			tokenizedStr
		);
	}
	/**
	 * Convert special characters to HTML entities except ampersand `&`.
	 * @see http://php.net/manual/en/function.htmlspecialchars.php
	 * @param str
	 */
	public static HtmlSpecialChars (str: string, includeAmpersand: boolean = true): string {
		if (includeAmpersand)
			return StringHelper.Strtr(str, this.HTML_SPECIAL_CHARS);
		return StringHelper.Strtr(str, this.HTML_SPECIAL_CHARS_WITHOUT_AMP);
	}
	public static HtmlEntitiesEncode (rawStr: string): string {
		return rawStr.replace(/[\u00A0-\u9999<>\&]/gim, function(i: string) {
			return '&#'+i.charCodeAt(0)+';';
		});
	}
	public static RawUrlDecode (str: string): string {
		return decodeURIComponent((str + '')
			.replace(/%(?![\da-f]{2})/gi, function () {
				// PHP tolerates poorly formed escape sequences
				return '%25';
			}));
	}
	public static QueryStringEncode (obj: any, encodeAmp: boolean = false): string {
		var items: string[] = [];
		this.encodeQueryStringRecursive('', [], obj, items, 0);
		return items.join(encodeAmp ? '&amp;': '&');
	}
	protected static encodeQueryStringRecursive (prefix: string, keys: string[], value: any, items: string[], level: number): void {
		var result: string,
			keysClone: string[],
			keyStr: string,
			objKeys: string[],
			protoName: string;
		if (ObjectHelper.IsPrimitiveType(value)) {
			result = prefix;
			if (keys.length > 0)
				result += '[' + keys.join('][') + ']';
			result += '=';
			if (value != null) 
				result += encodeURIComponent(String(value));
			items.push(result);
		} else if (value instanceof Map) {
			value.forEach((valueLocal: any, keyLocal: any) => {
				keysClone = [].concat(keys);
				keysClone.push(encodeURIComponent(keyLocal));
				this.encodeQueryStringRecursive(prefix, keysClone, valueLocal, items, level + 1);
			});
		} else if (value instanceof Set) {
			value.forEach(valueLocal => {
				keysClone = [].concat(keys);
				keysClone.push('');
				this.encodeQueryStringRecursive(prefix, keysClone, valueLocal, items, level + 1);
			});
		} else {
			protoName = ObjectHelper.RealTypeOf(value);
			if (protoName.indexOf('Array') != -1) {
				for (var i: number = 0, l: number = value['length']; i < l; i++) {
					keysClone = [].concat(keys);
					keysClone.push('');
					this.encodeQueryStringRecursive(prefix, keysClone, value[i], items, level + 1);
				}
			} else {
				objKeys = Object.keys(value);
				for (var i: number = 0, l: number = objKeys.length; i < l; i++) {
					keyStr = objKeys[i];
					keysClone = [].concat(keys);
					if (level === 0) {
						prefix = encodeURIComponent(keyStr);
					} else {
						keysClone.push(encodeURIComponent(keyStr));
					}
					this.encodeQueryStringRecursive(prefix, keysClone, value[keyStr], items, level + 1);
				}
			}
		}
	}

	public static QueryStringDecode (queryString: string, decodeAmp: boolean = true): any {
		if (decodeAmp) 
			while (queryString.match(/&amp;/g))
				queryString = queryString.replace(/&amp;/g, '&');
		queryString = this.Trim(queryString, '&');
		var result: any = [],
			items: string[] = queryString.split('&'),
			allObjectLevels: IQsObjectLevel[] = [],
			objectLevels: IQsObjectLevel[],
			objectLevel: IQsObjectLevel,
			levelKey: string,
			levelValueToRetype: any;
		for (var i: number = 0, l: number = items.length; i < l; i++) {
			objectLevels = this.qsDecodeItem(result, items[i]);
			if (objectLevels == null) continue;
			allObjectLevels = [].concat(allObjectLevels, objectLevels);
		}
		allObjectLevels = allObjectLevels.sort((a, b) => {
			return a.index - b.index;
		});
		var rootMatched = false;
		for (var i: number = allObjectLevels.length - 1; i >= 0; i--) {
			objectLevel = allObjectLevels[i];
			if (objectLevel.index === 0) {
				rootMatched = true;
				continue;
			}
			levelKey = objectLevel.key;
			levelValueToRetype = objectLevel.level[levelKey];
			if (levelValueToRetype instanceof Array)
				objectLevel.level[levelKey] = this.qsRetypeToObject(levelValueToRetype);
		}
		if (rootMatched && result instanceof Array)
			result = this.qsRetypeToObject(result);
		return result;
	}
	protected static qsDecodeItem (result: any[], item: string): IQsObjectLevel[] {
		var pos: number = item.indexOf('=');
		if (pos == -1) {
			result[item] = true;
			return null;
		}
		var rawName: string = item.substr(0, pos),
			rawValue: string = item.substr(pos + 1),
			nameLevels: IQsNameLevel[] = [];
		rawName = this.qsDecodeGetVarNameLevels(rawName, nameLevels);
		if (rawName == 'push') return null;
		var value: any = this.qsDecodeGetValue(rawValue),
			objectLevels: IQsObjectLevel[] = this.qsDecodeValueToLevel(
			result, rawName, nameLevels, value
		);
		if (objectLevels.length > 0) 
			return objectLevels;
		return null;
	}
	protected static qsDecodeGetVarNameLevels (rawName: string, nameLevels: IQsNameLevel[]): string {
		var openPos: number,
			closePos: number,
			nameLevelValue: string;
		while (true) {
			closePos = rawName.lastIndexOf(']', rawName.length);
			if (closePos == -1 && closePos != rawName.length - 1) break;
			openPos = rawName.lastIndexOf('[', closePos);
			if (openPos == -1) break;
			nameLevelValue = rawName.substr(openPos + 1, closePos - openPos - 1);
			nameLevels.push({
				value: nameLevelValue,
				implicitIndex: Boolean(nameLevelValue === '')
			});
			rawName = rawName.substr(0, openPos);
			if (rawName.length === 0) break;
		}
		nameLevels.reverse();
		return rawName;
	}
	protected static qsDecodeGetValue (rawValue: any): any {
		var value: any;
		try {
			value = JSON.parse(rawValue);
		} catch (e) {
			value = rawValue;
		}
		return value;
	}
	protected static qsDecodeValueToLevel (result: any[], rawName: string, nameLevels: IQsNameLevel[], value: any): IQsObjectLevel[] {
		var lastLocalLevelValue: any[],
			localLevelValue: any[],
			nameLevel: { implicitIndex: boolean, value: string },
			nameLevelKey: string,
			lastNameLevelKey: string,
			objectLevels: IQsObjectLevel[] = [];
		if (rawName === '' || !NumberHelper.IsNumeric(rawName))
			objectLevels.push({
				level: result,
				index: 0
			});
		if (nameLevels.length === 0) {
			if (result[rawName] == null) {
				result[rawName] = value;
			} else if (result[rawName] instanceof Array) {
				result[rawName].push(value);
			} else {
				result[rawName] = [result[rawName], value];
			}
			return objectLevels;
		}
		if (result[rawName] == null) 
			result[rawName] = [];

		lastLocalLevelValue = result;
		lastNameLevelKey = rawName;

		localLevelValue = result[rawName];

		for (var j: number = 0, k: number = nameLevels.length; j < k; j++) {
			nameLevel = nameLevels[j];
			if (j + 1 === k) {
				// set last level
				if (nameLevel.implicitIndex) {

					localLevelValue.push(value);
				} else {
					nameLevelKey = nameLevel.value;
					if (nameLevelKey == 'push') continue;

					if (localLevelValue instanceof Array) 
						objectLevels.push({
							level: lastLocalLevelValue,
							key: lastNameLevelKey,
							index: j + 1
						});
				
					if (localLevelValue[nameLevelKey] == null) {
						localLevelValue[nameLevelKey] = value;
					} else if (ObjectHelper.IsPrimitiveType(localLevelValue[nameLevelKey])) {
						localLevelValue[nameLevelKey] = [localLevelValue[nameLevelKey], value];
					} else {
						localLevelValue[nameLevelKey] = value;
					}
				}
			} else {
				// get next level
				if (nameLevel.implicitIndex) {
					if (localLevelValue.length === 0) 
						localLevelValue.push([]);
					if (ObjectHelper.IsPrimitiveType(localLevelValue[localLevelValue.length - 1])) 
						localLevelValue.push([]);

					lastLocalLevelValue = localLevelValue;
					lastNameLevelKey = String(localLevelValue.length - 1);
					
					localLevelValue = localLevelValue[localLevelValue.length - 1];
				} else {

					nameLevelKey = nameLevel.value;
					if (nameLevelKey == 'push') continue;
					
					if (localLevelValue[nameLevelKey] == null) {
						localLevelValue[nameLevelKey] = [];
					} else if (ObjectHelper.IsPrimitiveType(localLevelValue[nameLevelKey])) {
						localLevelValue[nameLevelKey] = [localLevelValue[nameLevelKey]];
					}

					if (localLevelValue instanceof Array) 
						objectLevels.push({
							level: lastLocalLevelValue,
							key: lastNameLevelKey,
							index: j + 1
						});
					
					lastLocalLevelValue = localLevelValue;
					lastNameLevelKey = nameLevelKey;
					
					localLevelValue = localLevelValue[nameLevelKey];
				}
			}
		}
		return objectLevels;
	}
	protected static qsRetypeToObject (arr: any[]): any {
		var obj: any = {},
			key: string,
			keys: string[] = Object.keys(arr);
		for (var i: number = 0, l: number = keys.length; i < l; i++) {
			key = keys[i];
			obj[key] = arr[key];
		}
		return obj;
	}

	/**
	 * Recognize if given string is JSON or not without JSON parsing.
	 * @see https://www.ietf.org/rfc/rfc4627.txt
	 * @param jsonStr
	 * @return bool
	 */
	public static IsJsonString (jsonStr: string): boolean {
		var match: RegExpMatchArray = jsonStr
			.replace(/"(\.|[^\\"])*"/g, '')
			.match(/[^\,\:\{\}\[\]0-9\.\\\-\+Eaeflnr-u \n\r\t]/g);
		return !Boolean(match && match.length > 0);
	}
	/**
	 * Recognize if given string is query string without parsing.
	 * It recognizes query strings like:
	 * - `key1=value1`
	 * - `key1=value1&`
	 * - `key1=value1&key2=value2`
	 * - `key1=value1&key2=value2&`
	 * - `key1=&key2=value2`
	 * - `key1=value&key2=`
	 * - `key1=value&key2=&key3=`
	 * ...
	 * @param jsonStr
	 */
	public static IsQueryString (queryStr: string): boolean {
		var queryStr: string = this.Trim(this.Trim(queryStr, '='), '&');
		var apmsCount: number = queryStr.split('&').length - 1;
		var equalsCount: number = queryStr.split('=').length - 1;
		var firstAndLast: string = queryStr.substr(0, 1) + queryStr.substr(-1, 1);
		if (firstAndLast === '{}' || firstAndLast === '[]') return false; // most likely a JSON
		if (apmsCount === 0 && equalsCount === 0) return false; // there was `nothing`
		if (equalsCount > 0) equalsCount -= 1;
		if (equalsCount === 0) return true; // there was `key=value`
		return apmsCount / equalsCount >= 1; // there was `key=&key=value`
	}
}
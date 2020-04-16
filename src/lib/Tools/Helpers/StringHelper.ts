import { ObjectHelper } from "./ObjectHelper";
import { QueryStringCollection } from "./StringHelpers/QueryString/Collection";
import { QueryStringCollectionRecord } from "./StringHelpers/QueryString/CollectionRecord";
import { QueryStringLastLevel } from "./StringHelpers/QueryString/LastLevel";


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
	public static DecodeUri (str: string): string {
		var result: string = str;
		try {
			result = decodeURIComponent(str);
		} catch (e) {
			var index: number = 0,
				lastIndex: number = 0,
				safePart: string;
			while (true) {
				if (index >= result.length) break;
				safePart = result.substr(index);
				if (!safePart.match(/[\%]([0-9]{2,})/g)) break;
				safePart = safePart.replace(/[\%]([0-9]{2,})/g, (wholeMatch: string, groupMatch: string, indexLocal: number) => {
					var result: string = wholeMatch;
					try {
						result = decodeURIComponent(result);
						index = indexLocal + result.length;
					} catch (e) {
						index = indexLocal + wholeMatch.length;
					}
					return result;
				});
				result = result.substr(0, lastIndex) + safePart;
				lastIndex = index;
			}
		}
		return result;
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

	public static QueryStringDecode (str: string, autoRetype: boolean = false) {
		var result: any = {},
			collections: QueryStringCollectionRecord[] = [],
			lastCollectionId: number = 0,
			lastLevel: QueryStringLastLevel,
			itemsRaw: string[],
			itemRaw: string[],
			itemRawKey: string | number,
			itemRawValue: string,
			itemKeys: string[],
			lastLevelObject: any;
		// trim & from left and right and explode by &?
		itemsRaw = this.queryStringDecodePrepareItems(str);
		for (var i: number = 0, l: number = itemsRaw.length; i < l; i++) {
			itemRaw = this.queryStringDecodeExplodeKeyValue(itemsRaw[i]);
			itemRawKey = itemRaw[0];
			itemRawValue = itemRaw[1];
			// go to next point only if key is valid and if key doesn't start with `[` bracket:
			if (!(itemRawKey.length > 0 && itemRawKey.charAt(0) !== '[')) 
				continue;
			itemKeys = this.queryStringDecodeItemKeys(itemRawKey);
			// start to assign value into proper level
			lastLevel = this.queryStringDecodeGetLastLevel(
				itemKeys, result, collections, lastCollectionId
			);
			lastCollectionId = lastLevel.lastId;
			lastLevelObject = lastLevel.level;
			itemRawKey = lastLevel.key;
			// assign value into proper level collection object:
			if (autoRetype) {
				lastLevelObject[itemRawKey] = this.queryStringDecodeRetypeValue(itemRawValue);
			} else {
				lastLevelObject[itemRawKey] = itemRawValue;
			}
		}
		return this.queryStringDecodeRetypeCollections(result, collections);
	}
	protected static queryStringDecodePrepareItems (str: string): string[] {
		str = String(str).replace(/\+/g, '%20');
		str = StringHelper.DecodeUri(str);
		str = str
			.replace(/^&/, '')
			.replace(/&$/, '');
		return str.split('&');
	}
	protected static queryStringDecodeRetypeValue (itemRawValue: string): boolean | number | string | null | undefined {
		var itemValue: boolean | number | string | null | undefined;
		if (itemRawValue.match(/^(true|false)$/g)) {
			itemValue = itemRawValue === "true";
		} else if (itemRawValue.match(/^(null|undefined)$/g)) {
			itemValue = itemRawValue === "null" ? null : undefined;
		} else if (itemRawValue.match(/^([eE0-9\+\-\.]+)$/g)) {
			var matchedDots: RegExpMatchArray = itemRawValue.match(/\./g);
			if (!matchedDots || (matchedDots && matchedDots.length < 2)) {
				itemValue = parseFloat(itemRawValue);
				if (isNaN(itemValue))
					itemValue = itemRawValue;
			} else {
				itemValue = itemRawValue;
			}	
		} else {
			itemValue = itemRawValue;
		}
		return itemValue;
	}
	protected static queryStringDecodeExplodeKeyValue (itemRaw: string): string[] {
		var itemRawKey: string, 
			itemRawValue: string, 
			strPos: number;
		// explode by first `=`:
		strPos = itemRaw.indexOf('=');
		if (strPos == -1) {
			itemRawKey = itemRaw;
			itemRawValue = "true";
		} else {
			itemRawKey = itemRaw.substr(0, strPos);
			itemRawValue = itemRaw.substr(strPos + 1);
		}
		// trim key with ` ` from left:
		while (itemRawKey.charAt(0) === ' ') 
			itemRawKey = itemRawKey.slice(1);
		// trim key with ` ` from right:
		while (itemRawKey.charAt(itemRawKey.length - 1) === ' ') 
			itemRawKey = itemRawKey.slice(0, itemRawKey.length - 1);
		// discard everything after null char:
		strPos = itemRawKey.indexOf('\x00');
		if (strPos != -1) 
			itemRawKey = itemRawKey.slice(0, strPos);
		return [itemRawKey, itemRawValue];
	}
	protected static queryStringDecodeItemKeys (itemRawKey: string): string[] {
		var itemRawKeyLength: number = itemRawKey.length,
			itemKeys: string[] = [],
			beginPos: number,
			endPos: number,
			index: number = 0;
		beginPos = itemRawKey.indexOf('[');
		if (beginPos == -1) {
			itemKeys = [itemRawKey];
		} else {
			itemKeys.push(
				itemRawKey
					.substr(0, beginPos)
					.replace(/^['"]/, '')
					.replace(/['"]$/, '')
			);
			index = beginPos;
			while (index < itemRawKeyLength) {
				beginPos = itemRawKey.indexOf('[', index);
				if (beginPos == -1) break;
				endPos = itemRawKey.indexOf(']', beginPos);
				if (endPos == -1) break;
				itemKeys.push(
					itemRawKey
						.substr(beginPos + 1, endPos - beginPos - 1)
						.replace(/^['"]/, '')
						.replace(/['"]$/, '')
				);
				index = endPos + 1;
			}
		}
		return itemKeys;
	}
	protected static queryStringDecodeGetLastLevel (itemKeys: string[], result: any, collections: QueryStringCollectionRecord[], lastCollectionId: number): QueryStringLastLevel {
		var levelObject: any = result,
			itemCollection: QueryStringCollection,
			levelObjectValue: any,
			lastLevelObject: any,
			itemRawKey: string | number;
		for (var j: number = 0, k: number = itemKeys.length; j < k; j++) {
			itemRawKey = itemKeys[j];
			lastLevelObject = levelObject;
			// if not root level and key is implicit:
			if (
				j !== 0 &&
				(itemRawKey === '' || itemRawKey === ' ')
			) 
				itemRawKey = levelObject.length;
			// if last key - break, because there will be value assignment only:
			if (j + 1 === k) break;
			// if not last key - there will be another collection:
			levelObjectValue = levelObject[itemRawKey];
			if (levelObjectValue == null) {
				// if there is no collection level yet:
				itemCollection = new QueryStringCollection();
				collections.push({
					collection: itemCollection,
					parent: levelObject,
					key: itemRawKey,
					level: j,
					id: lastCollectionId++
				});
				levelObject[itemRawKey] = itemCollection;
				levelObject = itemCollection;
			} else {
				levelObject = levelObjectValue;
			}
		}
		return <QueryStringLastLevel>{
			level: lastLevelObject,
			key: itemRawKey,
			lastId: lastCollectionId
		};
	}
	protected static queryStringDecodeRetypeCollections (result: any, collections: QueryStringCollectionRecord[]): any {
		// sort all collections reversly
		var collectionItem: QueryStringCollectionRecord;
		collections.sort((a, b): number => {
			var aLevel: number = a.level,
				bLevel: number = b.level;
			if (aLevel == bLevel) return b.id - a.id;
			return bLevel - aLevel;
		});
		for (var i: number = 0, l: number = collections.length; i < l; i++) {
			collectionItem = collections[i];
			collectionItem.parent[collectionItem.key] = Object.getPrototypeOf(collectionItem.collection);
		}
		return result;
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
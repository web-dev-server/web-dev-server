import { ObjectHelper } from "../Tools/Helpers/ObjectHelper";


export class Protected {
	/**
 * Get param value from given collection (`GET`, `POST` or http headers),
 * filtered by characters defined in second argument through `replace()`.
 * Place into second argument only char groups you want to keep.
 * @param collection Array with request params or array with request headers.
 * @param name Parameter string name.
 * @param replaceFilter If String - list of regular expression characters to only keep, if array - `replace()` pattern and reverse, if `false`, raw value is returned.
 * @param ifNullValue Default value returned if given param name is null.
 * @param targetType Target type to retype param value or default if-null value. If param is an array, every param item will be retyped into given target type.
 */
public static GetParamFromCollection (
	paramsCollection: any = {},
	name: string = "",
	nameReplaceFilter: string | false | { pattern: string | RegExp, replace: string | Function } = "a-zA-Z0-9_;, /\.\:\-\@",
	valueReplaceFilter: string | false | { pattern: string | RegExp, replace: string | Function } = "a-zA-Z0-9_;, /\.\:\-\@",
	ifNullValue: any = null
): any {
	var rawValue: any = paramsCollection instanceof Map
		? paramsCollection.get(name)
		: paramsCollection[name];
	if (rawValue == null) 
		return ObjectHelper.IsPrimitiveType(ifNullValue)
			? ifNullValue
			: JSON.parse(JSON.stringify(ifNullValue));
	return Protected.GetParamItem(
		rawValue, nameReplaceFilter, valueReplaceFilter, ifNullValue
	);
}

/**
 * Get filtered param or header value for characters defined as second argument to use them in `replace()`.
 * @param rawValue
 * @param replaceFilter If String - list of regular expression characters to only keep, if array - `replace()` pattern and reverse, if `false`, raw value is returned.
 * @param ifNullValue Default value returned if given param name is null.
 * @param targetType Target type to retype param value or default if-null value. If param is an array, every param item will be retyped into given target type.
 */
public static GetParamItem (
	rawValue: any = null,
	nameReplaceFilter: string | false | { pattern: string | RegExp, replace: string | Function } = "a-zA-Z0-9_;, /\.\:\-\@",
	valueReplaceFilter: string | false | { pattern: string | RegExp, replace: string | Function } = "a-zA-Z0-9_;, /\.\:\-\@",
	ifNullValue: any = null
): any {
	var result: any,
		rawValueArr: any[],
		rawValueKeys: string[],
		rawValueKey: string;
	if (rawValue == null) 
		// if there is NULL in target collection
		return ObjectHelper.IsPrimitiveType(ifNullValue)
			? ifNullValue
			: JSON.parse(JSON.stringify(ifNullValue));
	// if there is not NULL in target collection
	if (
		rawValue.constructor === String && 
		rawValue.trim().length === 0
	) {
		// if value after trim is empty string, return empty string
		result = '';
		if (ifNullValue === null) 
			return result;
		return ObjectHelper.IsPrimitiveType(ifNullValue)
			? ifNullValue
			: JSON.parse(JSON.stringify(ifNullValue));
	} else if (
		valueReplaceFilter === false || 
		valueReplaceFilter === '' || 
		valueReplaceFilter === '.*'
	) {
		// if there is something in target collection and all chars are allowed
		return result;
	} else if (rawValue instanceof Object) {	
		// if there is something in target collection and it's an array
		if (rawValue.constructor.name.indexOf('Array') != -1) {
			result = [];
			rawValueArr = rawValue;
			for (var i: number = 0, l: number = rawValueArr.length; i < l; i++) {
				result[i] = Protected.GetParamItem(
					rawValueArr[i], nameReplaceFilter, valueReplaceFilter, ifNullValue
				);
			}
		} else {
			result = {};
			rawValueKeys = Object.keys(rawValue);
			for (var i: number = 0, l: number = rawValueKeys.length; i < l; i++) {
				rawValueKey = rawValueKeys[i];
				result[Protected.CleanParamValue(rawValueKey, nameReplaceFilter)] = Protected.GetParamItem(
					rawValueArr[rawValueKey], nameReplaceFilter, valueReplaceFilter, ifNullValue
				);
			}
		}
		return result;
	} else {
		// if there is something in target collection and it's not an array
		return Protected.CleanParamValue(rawValue, valueReplaceFilter);
	}
}

/**
 * Clean param value by given list of allowed chars or by given `preg_replace()` pattern and reverse.
 * @param rawValue
 * @param replaceFilter If String - list of regular expression characters to only keep, if array - `replace()` pattern and reverse, if `false`, raw value is returned.
 * @return string
 */
public static CleanParamValue (
	rawValue: string, 
	replaceFilter: string | false | { pattern: string | RegExp, replace: string | Function } = "a-zA-Z0-9_;, /\.\:\-\@"
) {
	var pattern: any,
		replace: any,
		patternRegExp: RegExp,
		replaceStr: string = '',
		rawValueStr: string,
		resultValue: any;
	if (replaceFilter === false) 
		return rawValue;
	rawValueStr = String(rawValue);
	if (replaceFilter instanceof RegExp) {
		resultValue = rawValueStr.replace(patternRegExp, replaceStr);
	}  else if (replaceFilter instanceof Object) {
		pattern = replaceFilter['pattern'];
		replace = replaceFilter['replace'];
		resultValue = rawValueStr.replace(pattern, replace);
	} else {
		patternRegExp = new RegExp("[^" + replaceFilter.toString() + "]", "g");
		resultValue = rawValueStr.replace(patternRegExp, replaceStr);
	}
	if (resultValue === rawValueStr) {
		try {
			resultValue = JSON.parse(rawValue);
		} catch (e) {
			resultValue = rawValue;
		}
	}
	return resultValue;
}
}
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
export declare class StringHelper {
    protected static readonly HTML_SPECIAL_CHARS: any;
    protected static readonly HTML_SPECIAL_CHARS_WITHOUT_AMP: any;
    static Trim(str: string, chars: string): string;
    static TrimLeft(str: string, chars: string): string;
    static TrimRight(str: string, chars: string): string;
    static Strtr(str: string, dic: any): string;
    /**
     * Convert special characters to HTML entities except ampersand `&`.
     * @see http://php.net/manual/en/function.htmlspecialchars.php
     * @param str
     */
    static HtmlSpecialChars(str: string, includeAmpersand?: boolean): string;
    static HtmlEntitiesEncode(rawStr: string): string;
    static RawUrlDecode(str: string): string;
    static QueryStringEncode(obj: any, encodeAmp?: boolean): string;
    protected static encodeQueryStringRecursive(prefix: string, keys: string[], value: any, items: string[], level: number): void;
    static QueryStringDecode(queryString: string, decodeAmp?: boolean): any;
    protected static qsDecodeItem(result: any[], item: string): IQsObjectLevel[];
    protected static qsDecodeGetVarNameLevels(rawName: string, nameLevels: IQsNameLevel[]): string;
    protected static qsDecodeGetValue(rawValue: any): any;
    protected static qsDecodeValueToLevel(result: any[], rawName: string, nameLevels: IQsNameLevel[], value: any): IQsObjectLevel[];
    protected static qsRetypeToObject(arr: any[]): any;
    /**
     * Recognize if given string is JSON or not without JSON parsing.
     * @see https://www.ietf.org/rfc/rfc4627.txt
     * @param jsonStr
     * @return bool
     */
    static IsJsonString(jsonStr: string): boolean;
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
    static IsQueryString(queryStr: string): boolean;
}
export {};

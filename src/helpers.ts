import { Server } from "./server"

export class DirItem {
	public static readonly TYPE_UNKNOWN = 0;
	public static readonly TYPE_DIR = 1;
	public static readonly TYPE_FILE = 2;
	public static readonly TYPE_SYMLINK = 4;
	public static readonly TYPE_SOCKET = 8;
	public static readonly TYPE_BLOCK_DEVICE = 16;
	public static readonly TYPE_CHARACTER_DEVICE = 32;
	public static readonly TYPE_FIFO = 64;
	public type: number;
	public path: string;
	public code: string;
	public constructor (type: number, path: string, code: string) {
		this.type = type;
		this.path = path;
		this.code = code;
	}
}

export class Helpers {
	public static FormatDate (date: Date) {
		return date.getFullYear() +
			'-' + ((date.getMonth() + 1) / 100).toFixed(2).substr(2) +
			'-' + (date.getDate() / 100).toFixed(2).substr(2) +
			'&nbsp;' + (date.getHours() / 100).toFixed(2).substr(2) +
			':' + (date.getMinutes() / 100).toFixed(2).substr(2) +
			':' + (date.getSeconds() / 100).toFixed(2).substr(2) +
			'.' + (date.getMilliseconds() / 1000).toFixed(3).substr(2);
	}
	public static PaddingNumber (number: number, length: number = 2, char: string = '0'): string {
		var result: string = number.toFixed(0);
		for (var i: number = 2, l = length + 1; i < l; i++) // 2 => 2; 3 => 2,3; 4 => 2,3,4; ...
			if (number < Math.pow(10, i - 1)) // 2 => 10; 3 => 10,100; 4 => 10,100,1000; ...
				result = char + result;
		return result;
    }
	public static FormatFileSize (bytes: number): string {
		var u = -1,
			units = Server.FILE_SIZE.UNITS,
			thresh = Server.FILE_SIZE.THRESH;
		if (Math.abs(bytes) < thresh) return bytes + ' B';
		do {
			bytes /= thresh;
			++u;
		} while (Math.abs(bytes) >= thresh && u < units.length - 1);
		return bytes.toFixed(1)+' '+units[u];
	}
	public static Trim (str: string, ch: string): string {
		var newStr = '';
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
		return newStr;
	}
	public static TrimLeft (str: string, ch: string): string {
		var newStr = '';
		for (var i = 0, l = str.length; i < l; i += 1) {
			if (str.charAt(i) == ch) {
				newStr = str.substr(i + 1);
			} else {
				newStr = str.substr(i);
				break;
			}
		}
		return newStr;
	}
	public static TrimRight (str: string, ch: string): string {
		var newStr = '';
		for (var i = str.length - 1; i > -1; i -= 1) {
			if (str.charAt(i) == ch) {
				newStr = str.substring(0, i);
			} else {
				newStr = str.substring(0, i + 1);
				break;
			}
		}
		return newStr;
	}
	public static HtmlEntitiesEncode (rawStr: string): string {
		return rawStr.replace(/[\u00A0-\u9999<>\&]/gim, function(i: string) {
			return '&#'+i.charCodeAt(0)+';';
		});
	}
	public static RealTypeOf (obj: any): string {
		var proto: any = Object.getPrototypeOf(obj);
		if (proto && proto.constructor) {
			return proto.constructor.name;
		} else {
			var s: string = Object.prototype.toString.apply(obj);
			return s.substr(8, s.length - 9);
		}
	}
	public static IsPrimitiveType (obj: any): boolean {
		return (obj !== Object(obj));
	}
	public static GetRequireCacheDifferenceKeys (
		cacheKeysBeforeRequire: string[], 
		cacheKeysAfterRequire: string[], 
		requiredBy: string, 
		doNotIncludePath: string
	): string[] {
		var result: string[] = [], 
			record: string;
		for (var i: number = 0, l: number = cacheKeysAfterRequire.length; i < l; i += 1) {
			record = cacheKeysAfterRequire[i];
			if (cacheKeysBeforeRequire.indexOf(record) == -1)
				if (record !== requiredBy && record.indexOf(doNotIncludePath) !== 0)
					result.push(record);
		}
		return result;
	}
	public static ObjectsArraySortByPathProperty (a: DirItem, b: DirItem) {
		if (a.path < b.path) {
			return -1
		} else if (a.path > b.path) {
			return 1;
		} else {
			return 0;
		}
	}
	public static ObjectToMap<TValue> (obj: object): Map<string, TValue> {
		var result: Map<string, TValue> = new Map<string, TValue>();
		Object.keys(obj).forEach((key: string) => {
			result.set(key, obj[key]);
		});
		return result;
	}
	/**
	 * @summary Return found index JS stripts for server side  execution or index HTML static files.
	 */
	public static FindIndexInDirectory (
		dirItems: string[], 
		indexScripts: Map<string, number>, 
		indexFiles: Map<string, number>
	): { 
		scripts: string[], 
		files: string[]
	} {
		var dirItemsLowerCased: {original: string, lowerCase: string}[] = [],
			indexFilesFound: {index: number, file: string }[] = [],
			indexScriptsFound: {index: number, dir: string }[] = [],
			dirItem: string = '',
			dirItemLowerCased: string = '',
			resultScripts = [],
			resultFiles = [],
			i: number, 
			l: number,
			index: number = 0;
		for (i = 0, l = dirItems.length; i < l; i++) {
			dirItem = dirItems[i];
			dirItemLowerCased = dirItem.toLowerCase();
			dirItemsLowerCased.push({
				original: dirItem, 
				lowerCase: dirItemLowerCased
			});
			if (indexScripts.has(dirItemLowerCased)) {
				index = indexScripts.get(dirItemLowerCased);
				indexScriptsFound.push({
					index: index, 
					dir: dirItem
				});
				break;
			}
		}
		if (indexScriptsFound.length > 0) {
			indexScriptsFound.sort(Helpers.indexScriptsFoundSort);
			indexScriptsFound.map(item => {
				resultScripts.push(item.dir);
			});
		} else {
			for (i = 0, l = dirItemsLowerCased.length; i < l; i++) {
				dirItem = dirItemsLowerCased[i].original;
				dirItemLowerCased = dirItemsLowerCased[i].lowerCase;
				if (indexFiles.has(dirItemLowerCased)) {
					index = indexFiles.get(dirItemLowerCased);
					indexFilesFound.push({
						index: index, 
						file: dirItem
					});
				}
			}
			indexFilesFound.sort(Helpers.indexFilesFoundSort);
			indexFilesFound.map(item =>{
				resultFiles.push(item.file);
			});
		};
		return {
			scripts: resultScripts,
			files: resultFiles
		};
	}
	protected static indexScriptsFoundSort (a: {index: number, dir: string }, b: {index: number, dir: string }): number {
		var ai = a.index;
		var bi = b.index;
		return (ai > bi) ? 1 : (ai < bi ? -1 : 0 ) ;
	}
	protected static indexFilesFoundSort (a: {index: number, file: string }, b: {index: number, file: string }): number {
		var ai = a.index;
		var bi = b.index;
		return (ai > bi) ? 1 : (ai < bi ? -1 : 0 ) ;
	}
}
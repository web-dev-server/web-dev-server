
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
	public static SortByPath (a: DirItem, b: DirItem) {
		if (a.path < b.path) {
			return -1
		} else if (a.path > b.path) {
			return 1;
		} else {
			return 0;
		}
	}
	/**
	 * @summary Return found index JS stripts for server side  execution or index HTML static files.
	 */
	public static FindIndex (
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
			indexScriptsFound.sort(DirItem.indexScriptsFoundSort);
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
			indexFilesFound.sort(DirItem.indexFilesFoundSort);
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
	public constructor (type: number, path: string, code: string) {
		this.type = type;
		this.path = path;
		this.code = code;
	}
}
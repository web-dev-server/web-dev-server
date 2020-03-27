export declare class DirItem {
    static readonly TYPE_UNKNOWN = 0;
    static readonly TYPE_DIR = 1;
    static readonly TYPE_FILE = 2;
    static readonly TYPE_SYMLINK = 4;
    static readonly TYPE_SOCKET = 8;
    static readonly TYPE_BLOCK_DEVICE = 16;
    static readonly TYPE_CHARACTER_DEVICE = 32;
    static readonly TYPE_FIFO = 64;
    type: number;
    path: string;
    code: string;
    constructor(type: number, path: string, code: string);
}
export declare class Helpers {
    static FormatDate(date: Date): string;
    static PaddingNumber(number: number, length?: number, char?: string): string;
    static FormatFileSize(bytes: number): string;
    static Trim(str: string, ch: string): string;
    static TrimLeft(str: string, ch: string): string;
    static TrimRight(str: string, ch: string): string;
    static HtmlEntitiesEncode(rawStr: string): string;
    static RealTypeOf(obj: any): string;
    static IsPrimitiveType(obj: any): boolean;
    static GetRequireCacheDifferenceKeys(cacheKeysBeforeRequire: string[], cacheKeysAfterRequire: string[], requiredBy: string, doNotIncludePath: string): string[];
    static ObjectsArraySortByPathProperty(a: DirItem, b: DirItem): 1 | -1 | 0;
    static ObjectToMap<TValue>(obj: object): Map<string, TValue>;
    /**
     * @summary Return found index JS stripts for server side  execution or index HTML static files.
     */
    static FindIndexInDirectory(dirItems: string[], indexScripts: Map<string, number>, indexFiles: Map<string, number>): {
        scripts: string[];
        files: string[];
    };
    protected static indexScriptsFoundSort(a: {
        index: number;
        dir: string;
    }, b: {
        index: number;
        dir: string;
    }): number;
    protected static indexFilesFoundSort(a: {
        index: number;
        file: string;
    }, b: {
        index: number;
        file: string;
    }): number;
}

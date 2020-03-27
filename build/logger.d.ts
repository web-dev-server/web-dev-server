/// <reference types="node" />
import fs from "fs";
/** @see https://v8.dev/docs/stack-trace-api */
export interface CallSite {
    getFunction(): Function | null;
    getScriptNameOrSourceURL(): string | null;
    getFileName(): string | null;
    getEvalOrigin(): string | null;
    getFunctionName(): string | null;
    getTypeName(): string | null;
    getMethodName(): string | null;
    getThis(): any;
    isToplevel(): boolean;
    isConstructor(): boolean;
    isNative(): boolean;
    isEval(): boolean;
    getLineNumber(): number;
    getColumnNumber(): number;
}
export interface StackTraceItem {
    stack: CallSite;
    scope: any;
    fnFullName: string;
    isConstructor: boolean;
    isNative: boolean;
    isToplevel: boolean;
    isEval: boolean;
    arguments: any[];
    argumentsSerialized: string;
    file: string;
    line: number;
    column: number;
    evalOrigin: string | null;
}
export declare class Logger {
    static readonly LEVEL: {
        CRITICIAL: string;
        ERROR: string;
        WARNING: string;
        NOTICE: string;
        INFO: string;
        DEBUG: string;
    };
    protected static LOGS_EXT: string;
    protected static instance: Logger;
    protected documentRoot: string;
    protected logsDirFullPath: string;
    protected streamWriting: boolean;
    protected maxLogFileSize: number;
    protected allowedLevels: Map<string, boolean>;
    protected logsStreams: Map<string, fs.WriteStream>;
    protected logsStreamsLengths: Map<string, number>;
    protected logsCaches: Map<string, string>;
    protected writeStackTrace: boolean;
    protected writeStackTraceFuncArgs: boolean;
    /**
     * @summary Create new Logger instance.
     * @param logsDirFullPath Directory full path with log files.
     * @param documentRoot Application or project document root to simplify logged source file paths.
     */
    static CreateNew(logsDirFullPath: string, documentRoot: string): Logger;
    /**
     * Get logger instance as singleton.
     */
    static GetInstance(): Logger;
    /**
     * Set logger instance as singleton.
     * @param loggetInstance Logger instance.
     */
    static SetInstance(loggetInstance: Logger): Logger;
    /**
     * @summary Create new Logger instance.
     * @param logsDirFullPath Directory full path with log files.
     * @param documentRoot Application or project document root to simplify logged source file paths.
     */
    constructor(logsDirFullPath: string, documentRoot: string);
    /**
     * Set max. bytes for each log file. 50 MB by default.
     * @see https://convertlive.com/u/convert/megabytes/to/bytes
     * @param maxBytes Max bytes to create another log file (as number of bytes or as string like: 1K, 5M, 1G or 1T).
     */
    SetMaxLogFileSize(maxBytes?: number | string): Logger;
    /**
     * @summary Enable or disable writing to logs by write streams. If disabled, there is used standard file append.
     * @param allowedLevels `true` to enable stream writing (for singleton logger) or `false` for multiple logger instances to the same files.
     */
    SetStreamWriting(streamWriting?: boolean): Logger;
    /**
     * Allowed levels to log. Rest of not presented levels are automatically disallowed.
     * @param allowedLevels Allowed levels to log like: `[Logger.LEVEL.ERROR, Logger.LEVEL.DEBUG, 'customname', ...]`
     */
    SetAllowedLevels(allowedLevels: string[]): Logger;
    /**
     * Set how to write stack trace.
     * @param writeStackTrace If `true`, stack trace will be written into all log types, `false` otherwise, default `true`.
     * @param writeStackTraceFuncArgs If `true`, stack trace will be written with called functions arguments into all log types, `false` otherwise, default `true`. Arguments serialization could be very large.
     */
    SetStackTraceWriting(writeStackTrace?: boolean, writeStackTraceFuncArgs?: boolean): Logger;
    /**
     * @summary Log any error.
     * @param err Error instance to log or error message to generate an error internally and log the error instance.
     * @param level Log level (log file name).
     */
    Error(err: Error | string, level?: string): Logger;
    /**
     * @summary Log any stringified JS variable into log file with stack trace.
     * @param obj any JS variable to log.
     * @param level Log level (log file name).
     */
    Log(obj: any, level?: string): Logger;
    protected appendToLogFile(msg: string, level: string): Logger;
    protected renameFullLogFile(level: string, cb: () => void): void;
    protected appendToLogFileByStandardWrite(msg: string, level: string, logFullPath: string): void;
    protected appendToLogFileByStream(msg: string, level: string, logFullPath: string): void;
    protected serializeStackTrace(items: StackTraceItem[]): string;
    protected getStackTraceItems(stacks: CallSite[]): StackTraceItem[];
    protected getStackTraceItem(stack: CallSite): StackTraceItem;
    protected getStackTraceItemSerializedArgs(args: any[]): string;
    protected serializeWhatIsPossible(obj: any, prettyPrint?: boolean, addTypeName?: boolean): string;
    protected getStackTraceItemFuncFullName(stack: CallSite, isTopLevel: boolean, isConstructor: boolean): string;
}

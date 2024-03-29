/// <reference types="node" />
export declare class Streams {
    Write(chunk: any, encoding: BufferEncoding, cb?: (error: Error | null | undefined) => void): boolean;
    Pipe<T extends NodeJS.WritableStream>(destination: T, options?: {
        end?: boolean;
    }): T;
}

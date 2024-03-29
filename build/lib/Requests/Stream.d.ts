/// <reference types="node" />
import { Request } from "../Request";
export declare class Stream {
    Read(size?: number): any;
    SetEncoding(encoding: BufferEncoding): Request;
    Pause(): Request;
    Resume(): Request;
    IsPaused(): boolean;
    UnPipe(destination?: NodeJS.WritableStream): Request;
    Unshift(chunk: any, encoding?: BufferEncoding): void;
    Wrap(oldStream: NodeJS.ReadableStream): Request;
    Push(chunk: any, encoding?: BufferEncoding): boolean;
    Pipe<T extends NodeJS.WritableStream>(destination: T, options?: {
        end?: boolean;
    }): T;
}

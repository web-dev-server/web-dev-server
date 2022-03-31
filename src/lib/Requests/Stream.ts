import { IncomingMessage } from "http";
import { Request } from "../Request";


export class Stream {
	public Read (size?: number): any {
		var httpReq: IncomingMessage = this['http'];
		return httpReq.read(size);
	}
	public SetEncoding (encoding: BufferEncoding): Request {
		var httpReq: IncomingMessage = this['http'];
		return httpReq.setEncoding(encoding) as any;
	}
	public Pause (): Request {
		var httpReq: IncomingMessage = this['http'];
		return httpReq.pause() as any;
	}
	public Resume (): Request {
		var httpReq: IncomingMessage = this['http'];
		return httpReq.resume() as any;
	}
	public IsPaused (): boolean {
		var httpReq: IncomingMessage = this['http'];
		return httpReq.isPaused();
	}
	public UnPipe (destination?: NodeJS.WritableStream): Request {
		var httpReq: IncomingMessage = this['http'];
		return httpReq.unpipe(destination) as any;
	}
	public Unshift (chunk: any, encoding?: BufferEncoding): void {
		var httpReq: IncomingMessage = this['http'];
		return httpReq.unshift(chunk, encoding);
	}
	public Wrap (oldStream: NodeJS.ReadableStream): Request {
		var httpReq: IncomingMessage = this['http'];
		return httpReq.wrap(oldStream) as any;
	}
	public Push (chunk: any, encoding?: BufferEncoding): boolean {
		var httpReq: IncomingMessage = this['http'];
		return httpReq.push(chunk, encoding);
	}
	public Pipe <T extends NodeJS.WritableStream> (destination: T, options?: { end?: boolean; }): T {
		var httpReq: IncomingMessage = this['http'];
		return httpReq.pipe<T>(destination, options);
	}
}
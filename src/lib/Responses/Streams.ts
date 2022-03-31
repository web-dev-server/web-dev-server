import { OutgoingMessage as HttpOutgoingMessage } from "http";


export class Streams {
	public Write (chunk: any, encoding: BufferEncoding, cb?: (error: Error | null | undefined) => void): boolean {
		var httpRes: HttpOutgoingMessage = this['http'];
		return httpRes.write(chunk, encoding, cb);
	}
	public Pipe <T extends NodeJS.WritableStream> (destination: T, options?: { end?: boolean; }): T {
		var httpReq: HttpOutgoingMessage = this['http'];
		return httpReq.pipe<T>(destination, options);
	}
}
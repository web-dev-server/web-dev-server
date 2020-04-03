import { Stats, ReadStream, createReadStream } from "fs";
import { extname, normalize } from "path";

import { ErrorsHandler } from "./Error";
import { Headers } from "../Tools/MimeTypes";
import { Response } from "../Response";

export class FilesHandler {
	protected errorsHandler: ErrorsHandler;
	constructor (errorsHandler: ErrorsHandler) {
		this.errorsHandler = errorsHandler;
	}
	/**
	 * @summary Send a file:
	 */
	public HandleFile (
		fileFullPath: string, 
		fileName: string, 
		stats: Stats, 
		res: Response
	): void {
		var extension: string = extname('x.' + fileName);
		if (extension) 
			extension = extension.substr(1);
		var mimeType: string = Headers.GetMimeTypeByExtension(extension);
		var readStream: ReadStream = createReadStream(
			normalize(fileFullPath)
		);
		if (mimeType) 
			res.SetHeader('Content-Type', mimeType);
		res.SetHeader('Content-Length', stats.size)
			.SetHeader('Last-Modified', stats.mtime.toUTCString())
			.SendHeaders(200);
		readStream.pipe(res as any, { end: true });
		readStream.on('end', () => {
			res.End();
		});
	}
}
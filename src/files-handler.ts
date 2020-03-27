import fs from "fs";
import pathUtil from "path";
import * as core from "express-serve-static-core";

import { ErrorsHandler } from "./errors-handler"

export class FilesHandler {
	protected errorsHandler: ErrorsHandler;
	
	constructor (errorsHandler: ErrorsHandler) {
		this.errorsHandler = errorsHandler;
	}

	/**
	 * @summary Send a file:
	 */
	public HandleFile (
		stats: fs.Stats, 
		path: string, 
		fullPath: string, 
		req: core.Request<core.ParamsDictionary, any, any>, 
		res: core.Response<any>,
		cb: core.NextFunction,
	): void {
		res.status(200).setHeader('Content-Length', stats.size);
		res.sendFile(
			pathUtil.normalize(fullPath), 
			{ lastModified: stats.mtime.toUTCString() }, 
			(err: Error) => {
				if (err) this.errorsHandler.PrintError(err, req, res, 403);
				return cb();
			}
		);
	}
}
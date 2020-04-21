import { Server } from "../Server";
import { Request } from "../Request";
import { Response } from "../Response";
import { Register } from "../Applications/Register";
import { StringHelper } from "../Tools/Helpers/StringHelper";


export class ErrorsHandler {
	protected server: Server;
	protected register: Register;

	// development purposes:
	protected request?: Request = null;
	protected response?: Response = null;

	constructor (server: Server, cache: Register) {
		this.server = server;
		this.register = cache;
		this.initErrorsHandlers();
	}

	public SetHandledRequestProperties (
		req: Request, 
		res: Response
	): ErrorsHandler {
		this.request = req;
		this.response = res;
		return this;
	}

	/**
	 * @summary Print error in command line a little more nicely or log error by custom error log handler:
	 */
	public LogError (e: Error, code: number, req?: Request, res?: Response): ErrorsHandler {
		var development: boolean = this.server.IsDevelopment(),
			customErrorHandler: (
				err: Error, 
				code: number, 
				req?: Request, 
				res?: Response
			) => void = this.server.GetErrorHandler(),
			noErrorHandler: boolean = customErrorHandler === null,
			errorText: string = (development || noErrorHandler)
				? this.renderErrorText(e)
				: '';
		if (noErrorHandler) {
			if (development) console.info("\n");
			console.error(errorText);
			if (development) console.info("\n");
		} else {
			try {
				customErrorHandler(e, code, req, res);
			} catch (e1) {
				if (development) console.info("\n");
				console.error(e1.message);
				if (development) console.info("\n");
			}
		}
		return this;
	}

	/**
	 * @summary Print exception in command line a little more nicely in response:
	 */
	public PrintError (e: Error, code: number = 500, req: Request = null, res: Response = null): ErrorsHandler {
		var development: boolean = this.server.IsDevelopment(),
			errorText: string = development
				? this.renderErrorText(e)
				: '';
		if (!res || (res && res.IsSent())) 
			return this;
		if (!res.IsSentHeaders()) {
			res.SetHeader('Content-Type', development ? 'text/plain; charset=utf-8' : 'text/html; charset=utf-8');
			res.SendHeaders(code);
		}
		if (development) {
			res.SetBody("/*\n"+errorText+"\n*/");
		} else {
			if (code == 404) {
				var headerCode = Server.DEFAULTS.RESPONSES.CODES.HEADER_NOT_FOUND
					.replace('%path%', StringHelper.HtmlEntitiesEncode(
						req.GetBaseUrl() + req.GetBasePath()
					));
				var outputStr = Server.DEFAULTS.RESPONSES.CODES.HTML
					.replace('%head%', Server.DEFAULTS.RESPONSES.CODES.HEAD_NOT_FOUND)
					.replace('%body%', headerCode);
			} else {
				var outputStr = Server.DEFAULTS.RESPONSES.CODES.HTML
					.replace('%head%', Server.DEFAULTS.RESPONSES.CODES.HEAD_ERROR)
					.replace('%body%', Server.DEFAULTS.RESPONSES.CODES.HEADER_ERROR);
			}
			res.SetBody(outputStr)
		}
		res.Send();
		return this;
	}

	/**
	 * @summary Initialize uncatch error and uncatch warning handlers
	 */
	protected initErrorsHandlers (): void {
		/** @var process NodeJS.Process */
		process.on('uncaughtException', this.handleUncatchError.bind(this, true));
		process.on('warning', this.handleUncatchError.bind(this, false));
		process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
			if (reason instanceof Error) {
				this.handleUncatchError(true, reason);
			} else {
				var reasonMsg: string;
				try {
					reasonMsg = JSON.stringify(reason);
				} catch (e1) {
					reasonMsg = reason.toString();
				}
				try {
					throw new Error(reasonMsg);
				} catch (e2) {
					this.handleUncatchError(true, e2);
				}
			}
		});
	}

	/**
	 * @summary Clear all modules on any uncatched error
	 */
	protected handleUncatchError (clearRequireCache: boolean, error: Error): void {
		this
			.LogError(error, 500, this.request, this.response)
			.PrintError(error, 500, this.request, this.response);
		var development: boolean = this.server.IsDevelopment();
		if (development && clearRequireCache) {
			this.register.StopAll();
		}
	}
	
	/**
	 * @summary Render error as text for development purposes:
	 */
	protected renderErrorText (e: Error = null): string {
		if (!e || !e.stack) return '';
		var documentRoot: string = this.server.GetDocumentRoot(),
			stackLines: string[] = e.stack.replace(/\r/g, '').split("\n"),
			stackLine: string;
		for (var i: number = 1, l: number = stackLines.length; i < l; i++) {
			stackLine = stackLines[i].replace(/\\/g, '/');
			if (stackLine.indexOf(documentRoot) > -1) 
				stackLines[i] = stackLine.replace(documentRoot, '');
		}
		return stackLines.join("\n");
	}
}
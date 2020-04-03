import { Response } from "../Response";
import { IResponseCookie } from "./IResponseCookie";


export class Cookies {
	protected cookies: Map<string, IResponseCookie> = new Map<string, IResponseCookie>();
	protected cookiesToDelete: Map<string, IResponseCookie> = new Map<string, IResponseCookie>();

	public SetCookie (cfg: IResponseCookie): Response {
		this.cookies.set(cfg.name, cfg);
		return this as any;
	}
	public HasCookie (name: string): boolean {
		return this.cookies.has(name);
	}
	public DeleteCookie (name: string): Response {
		var cfg: IResponseCookie;
		if (this.cookies.has(name)) {
			cfg = this.cookies.get(name);
			this.cookiesToDelete.set(name, cfg);
		} else if (!this.cookiesToDelete.has(name)) {
			var expiresDate: Date = new Date();
			expiresDate.setTime(expiresDate.getTime() - (3600 * 1000));
			cfg = {
				name: name,
				value: '',
				expires: expiresDate,
				path: '/'
			}
			this.cookiesToDelete.set(name, cfg);
		}
		this.cookies.delete(name);
		return this as any;
	}
	protected getCookiesHeaders (): string[] {
		var result: string[] = [],
			nowDate: Date = new Date();
		this.cookies.forEach(cfg => {
			var cookieVal: string,
				timeDiff: number,
				maxAge: number;
			cookieVal = cfg.name + "=" + cfg.value.toString();
			if (cfg.expires) {
				cookieVal += "; expires=" + cfg.expires.toUTCString();
				timeDiff = cfg.expires.getTime() - nowDate.getTime();
				if (timeDiff > 0) {
					maxAge = Math.round(timeDiff / 1000);
					if (maxAge > 0)
					cookieVal += "; Max-Age=" + maxAge.toFixed(0);
				}
			}
			if (cfg.domain) 
				cookieVal += "; Domain=" + cfg.domain;
			if (cfg.path) 
				cookieVal += "; Path=" + cfg.path;
			if (cfg.secure) 
				cookieVal += "; Secure";
			if (cfg.httpOnly) 
				cookieVal += "; HttpOnly";
			if (cfg.sameSite) 
				cookieVal += "; SameSite=" + cfg.sameSite;
			result.push(cookieVal);
		});
		return result;
	}
}
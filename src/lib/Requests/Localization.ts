import { IncomingMessage as HttpIncomingMessage } from "http";

import { Static } from "./Static";
import { Request } from "../Request";


export class Localization {
	/**
	 * Language international code, lower case, not used by default.
	 * Or use this variable by your own decision.
	 * Example: `"en" | "de"`
	 */
	protected lang?: string;
	/**
	 * Country/locale code, upper case, not used by default.
	 * Or use this variable by your own decision.
	 * Example: `"US" | "UK"`
	 */
	protected locale?: string;
	
	public SetLang (lang: string | null): Request {
		this.lang = lang;
		return this as any;
	}
	public GetLang (): string | null {
		if (this.lang == null) this.initLangAndLocale();
		return this.lang;
	}
	public SetLocale (locale: string | null): Request {
		this.locale = locale;
		return this as any;
	}
	public GetLocale (): string | null {
		if (this.locale == null) this.initLangAndLocale();
		return this.locale;
	}
	/**
	 * Initialize language code and locale code from raw header `Http-Accept-Language`.
	 */
	protected initLangAndLocale (): void {
		var languagesAndLocales: Map<number, string[]>,
			langAndLocaleArr: string[] = [null, null];
		var httpReq: HttpIncomingMessage = this['http'],
			acceptLangs: string = httpReq.headers["accept-language"];
		if (acceptLangs) {
			languagesAndLocales = Static.ParseHttpAcceptLang(acceptLangs);
			if (languagesAndLocales.size > 0) {
				langAndLocaleArr = languagesAndLocales.values().next().value;
			}
		}
		if (!langAndLocaleArr[0]) langAndLocaleArr[0] = '';
		if (langAndLocaleArr.length > 1 && !langAndLocaleArr[1]) langAndLocaleArr[1] = '';
		this.lang = langAndLocaleArr[0];
		this.locale = langAndLocaleArr[1];
	}
}
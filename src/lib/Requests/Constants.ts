export class Constants {
	public static readonly SCHEME_HTTP: string = 'http:';
	public static readonly SCHEME_HTTPS: string = 'https:';
	public static readonly SCHEME_FTP: string = 'ftp:';
	public static readonly SCHEME_FTPS: string = 'ftps:';
	public static readonly SCHEME_IRC: string = 'irc:';
	public static readonly SCHEME_IRCS: string = 'ircs:';
	public static readonly SCHEME_MAILTO: string = 'mailto:';
	public static readonly SCHEME_FILE: string = 'file:';
	public static readonly SCHEME_DATA: string = 'data:';
	public static readonly SCHEME_TEL: string = 'tel:';
	public static readonly SCHEME_TELNET: string = 'telnet:';
	public static readonly SCHEME_LDAP: string = 'ldap:';
	public static readonly SCHEME_SSH: string = 'ssh:';
	public static readonly SCHEME_RTSP: string = 'rtsp:';
	public static readonly SCHEME_RTP: string = 'rtp:';

	public static readonly METHOD_GET: string = 'GET';
	public static readonly METHOD_POST: string = 'POST';
	public static readonly METHOD_PUT: string = 'PUT';
	public static readonly METHOD_DELETE: string = 'DELETE';
	public static readonly METHOD_HEAD: string = 'HEAD';
	public static readonly METHOD_OPTIONS: string = 'OPTIONS';
	public static readonly METHOD_PATCH: string = 'PATCH';

	public static readonly PARAM_FILTER_ALPHABETS: string = 'a-zA-Z';
	public static readonly PARAM_FILTER_ALPHABETS_LOWER: string = 'a-z';
	public static readonly PARAM_FILTER_ALPHABETS_UPPER: string = 'A-Z';
	public static readonly PARAM_FILTER_ALPHABETS_DIGITS: string = 'a-zA-Z0-9';
	public static readonly PARAM_FILTER_ALPHABETS_PUNCT: string = 'a-zA-Z\-\.\, ;`"\'\:\?\!';
	public static readonly PARAM_FILTER_ALPHABETS_NUMERICS_PUNCT: string = 'a-zA-Z0-9\+\-\.\, ;`"\'\:\?\!';
	public static readonly PARAM_FILTER_ALPHABETS_NUMERICS_PUNCT_SPECIAL: string = 'a-zA-Z0-9\+\-\.\, ;`"\'\:\?\!%_/@~\#\&\$\[\]\(\)\{\}\|\=\*\^';
	public static readonly PARAM_FILTER_PUNCT: string = '\-\.\, ;`"\'\:\?\!';
	public static readonly PARAM_FILTER_SPECIAL: string = '%_/@~\#\&\$\[\]\(\)\{\}\|\=\*\^';
	public static readonly PARAM_FILTER_DIGITS: string = '0-9';
	public static readonly PARAM_FILTER_NUMERICS: string = '-\+0-9\.\,';
}
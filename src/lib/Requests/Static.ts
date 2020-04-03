import { Request } from "../Request";

export class Static {
	protected static twoSegmentTlds: Map<string, boolean> = new Map<string, boolean>();
	public static AddTwoSegmentTlds (...twoSegmentTlds: string[]): typeof Request {
		for (var i: number = 0, l: number = twoSegmentTlds.length; i < l; i++) 
			this.twoSegmentTlds.set(twoSegmentTlds[i], true);
		return this as any;
	}
	public static ParseHttpAcceptLang (languagesList: string): Map<number, string[]>  {
		var languages: { priority: number, values: string[] }[] = [],
			ranges: string[] = languagesList.trim().split(','),
			range: string,
			langAndLocaleAndPriority: string[],
			pos: number,
			priority: number,
			langAndLocale: string;
		for (var i: number = 0, l: number = ranges.length; i < l; i++) {
			range = ranges[i].trim();
			pos = range.indexOf(';');
			if (pos == -1) {
				priority = 1.0;
				langAndLocale = range;
			} else {
				langAndLocaleAndPriority = range.split(';');
				priority = parseFloat(
					langAndLocaleAndPriority[1]
						.replace(/^([^\=]+)\=(.*)$/g, '$2')
						.replace(/([^\-\.0-9]+)/g, '')
				);
				if (isNaN(priority)) priority = 1.0;
				langAndLocale = langAndLocaleAndPriority[0];
			}
			langAndLocale = langAndLocale.replace(/\-/g, '_');
			pos = langAndLocale.indexOf('_');
			if (pos == -1) {
				languages.push({
					priority: priority,
					values: [
						langAndLocale.toLowerCase()
					]
				});
			} else {
				languages.push({
					priority: priority,
					values: [
						langAndLocale.substr(0, pos).toLowerCase(),
						langAndLocale.substr(pos + 1).toUpperCase(),
					]
				});
			}
		}
		return new Map(
			Array.from(languages).sort(
				(a: { priority: number }, b: { priority: number }): number => {
					return a.priority - b.priority;
				}
			)
			.reverse()
			.map(item => [item.priority, item.values])
		);
	}
}
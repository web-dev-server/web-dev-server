export class DateHelper {
	public static FormatForDirOutput (date: Date) {
		return date.getFullYear() +
			'-' + ((date.getMonth() + 1) / 100).toFixed(2).substr(2) +
			'-' + (date.getDate() / 100).toFixed(2).substr(2) +
			'&nbsp;' + (date.getHours() / 100).toFixed(2).substr(2) +
			':' + (date.getMinutes() / 100).toFixed(2).substr(2) +
			':' + (date.getSeconds() / 100).toFixed(2).substr(2) +
			'.' + (date.getMilliseconds() / 1000).toFixed(3).substr(2);
	}
}
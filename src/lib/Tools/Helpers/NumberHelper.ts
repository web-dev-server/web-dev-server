export class NumberHelper {
	public static FILE_SIZE: {
		THRESH: number; UNITS: string[];
	} = {
		THRESH: 1000,
		UNITS: ['KB','MB','GB','TB','PB','EB','ZB','YB'],
	}
	public static Padding (number: number, length: number = 2, char: string = '0'): string {
		var result: string = number.toFixed(0);
		for (var i: number = 2, l = length + 1; i < l; i++) // 2 => 2; 3 => 2,3; 4 => 2,3,4; ...
			if (number < Math.pow(10, i - 1)) // 2 => 10; 3 => 10,100; 4 => 10,100,1000; ...
				result = char + result;
		return result;
	}
	public static FormatFileSize (bytes: number): string {
		var u = -1,
			units = this.FILE_SIZE.UNITS,
			thresh = this.FILE_SIZE.THRESH;
		if (Math.abs(bytes) < thresh) return bytes + ' B';
		do {
			bytes /= thresh;
			++u;
		} while (Math.abs(bytes) >= thresh && u < units.length - 1);
		return bytes.toFixed(1)+' '+units[u];
	}
	public static IsNumeric (val: any): boolean {
		return !isNaN(val);
	}
}
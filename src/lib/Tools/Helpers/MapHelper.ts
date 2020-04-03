export class MapHelper {
	public static ObjectToMap<TValue> (obj: object): Map<string, TValue> {
		var result: Map<string, TValue> = new Map<string, TValue>();
		Object.keys(obj).forEach((key: string) => {
			result.set(key, obj[key]);
		});
		return result;
	}
	public static MapToObject <TValue>(map: Map<string, TValue>): any {
		var result: any = {};
		map.forEach((value: TValue, key: string) => {
			result[key] = value;
		});
		return result;
	}
}
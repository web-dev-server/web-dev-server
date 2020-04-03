var mimeDb: any = require('../../../node_modules/mime-db/db.json');


interface MimeRecord {
	source?: string;
	extensions?: string[];
	compressible?: boolean;
}

export class Headers {
	protected static mimes: any = null;
	protected static extensions: any = null;
	public static GetMimeTypeByExtension (extension: string): string | null {
		if (Headers.extensions === null) Headers.initMimeTypesAndExtensions();
		if (Headers.extensions[extension])
			return Headers.extensions[extension];
		return null;
	}
	public static GetExtensionByMimeType (mimeType: string): string | null {
		if (Headers.mimes === null) Headers.initMimeTypesAndExtensions();
		if (Headers.mimes[mimeType])
			return Headers.mimes[mimeType];
		return null;
	}
	protected static initMimeTypesAndExtensions(): void {
		var preferences: string[] = ['nginx', 'apache', undefined, 'iana'],
			appOctetStreamMime: string = 'application/octet-stream',
			mimesStore: any = Object.create(null),
			extensionsStore: any = Object.create(null);
		
		Object.keys(mimeDb).forEach((mimeType: string) => {
			var mimeRec: MimeRecord = mimeDb[mimeType],
				extensions: string[] = mimeRec.extensions,
				extension: string,
				anotherMimeType: string,
				anotherMimeRec: MimeRecord | null,
				anotherMimeRecSource: string,
				fromIndex: number,
				toIndex: number;

			if (!extensions || !extensions.length)
				return;

			mimesStore[mimeType] = extensions;

			for (var i: number = 0, l: number = extensions.length; i < l; i++) {
				extension = extensions[i];

				if (extensionsStore[extension]) {
					anotherMimeType = extensionsStore[extension];
					anotherMimeRec = mimeDb[anotherMimeType];
					if (anotherMimeRec !== null && anotherMimeRec.source) {
						anotherMimeRecSource = anotherMimeRec.source;
						fromIndex = preferences.indexOf(anotherMimeRecSource);
						toIndex = preferences.indexOf(mimeRec.source);
					}

					if (
						extensionsStore[extension] !== appOctetStreamMime &&
						(fromIndex > toIndex || (
							fromIndex === toIndex &&
							extensionsStore[extension].substr(0, 12) === 'application/'
						))
					) {
						// skip remapping
						continue;
					}
				}

				extensionsStore[extension] = mimeType;
			}
		});

		Headers.mimes = mimesStore;
		Headers.extensions = extensionsStore;
	}
}
export class QueryStringCollection {
	constructor () {
		var numericKeys: boolean = true,
			arrStore: any[] = [],
			objectStore: any = {};
		return new Proxy(this, <ProxyHandler<Object>>{
			getPrototypeOf: (target: Object) => {
				var result = numericKeys
					? arrStore
					: objectStore;
				numericKeys = undefined;
				arrStore = undefined;
				objectStore = undefined;
				return result;
			},
			get: (target: Object, prop: any, receiver: any): any => {
				return numericKeys 
					? arrStore[prop] 
					: objectStore[prop];
			},
			has (target: object, prop: any) {
				return numericKeys
					? prop in arrStore
					: prop in objectStore ;
			},
			set: (target: Object, prop: any, value: any, reciever: any) => {
				if (!isNaN(prop)) {
					// prop is numeric
					if (numericKeys) {
						// it could be still used array store
						arrStore[prop] = value; // length is shifted automatically forward
					} else {
						// store is downgraded to object store
						objectStore[prop] = value;
					}
				} else {
					// prop is not numeric
					if (numericKeys) {
						// if there is still used array store - downgrade it into object store:
						numericKeys = false;
						objectStore = {};
						arrStore.forEach((valueLocal: any, index: number) => {
							objectStore[index] = valueLocal;
						});
						arrStore = undefined;
						objectStore[prop] = value;
					} else {
						objectStore[prop] = value;
					}
				}
				return true;
			}
		});
	}
}
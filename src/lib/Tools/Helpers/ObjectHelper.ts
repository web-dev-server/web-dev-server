export class ObjectHelper {
	public static PROTECTED_ELMS: RegExp = /^(?:constructor|prototype|length|name|arguments|caller|call|apply|bind|toString)$/g;
	public static Mixins (derivedCtor: any, baseCtors: any[]): void {
		var protectedElms = this.PROTECTED_ELMS;
		baseCtors.forEach(baseCtor => {
			Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
				if (!name.match(protectedElms))
					Object.defineProperty(
						derivedCtor.prototype, 
						name, 
						Object.getOwnPropertyDescriptor(baseCtor.prototype, name)
					);
			});
			var baseCtorStaticElms = Object.getOwnPropertyDescriptors(baseCtor);
			for (var key in baseCtorStaticElms) 
				if (!key.match(protectedElms))
					derivedCtor[key] = baseCtorStaticElms[key].value;
		});
	}
	public static Extend (child: any, parent: any): void {
		var F = function() {},
			protectedElms = this.PROTECTED_ELMS,
			parentStaticElms = Object.getOwnPropertyDescriptors(parent),
			childStaticElms = Object.getOwnPropertyDescriptors(child),
			childProtoElms = Object.getOwnPropertyDescriptors(child.prototype);
		F.prototype = parent.prototype;
		child.prototype = new F();
		child.prototype.constructor = child;
		for (var key in parentStaticElms) 
			if (!key.match(protectedElms))
				child[key] = parentStaticElms[key].value;
		for (var key in childStaticElms) 
			if (!key.match(protectedElms))
				child[key] = childStaticElms[key].value;
		for (var key in childProtoElms) 
			child.prototype[key] = childProtoElms[key].value;
	}
	public static RealTypeOf (obj: any): string {
		var proto: any = Object.getPrototypeOf(obj);
		if (proto && proto.constructor) {
			return proto.constructor.name;
		} else {
			var s: string = Object.prototype.toString.apply(obj);
			return s.substr(8, s.length - 9);
		}
	}
	public static IsPrimitiveType (obj: any): boolean {
		return (obj !== Object(obj));
	}
}
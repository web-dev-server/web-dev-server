import { INamespace } from "./INamespace";
import { Session } from "../Session";


export function createNamespace (name: string, session: Session): INamespace {
	class Namespace implements INamespace {
		public SetExpirationHoops (hoops: number): INamespace {
			session['setNamespaceExpirationHoops'](name, hoops);
			return this;
		}
		public SetExpirationSeconds (seconds: number): INamespace {
			session['setNamespaceExpirationTime'](name, seconds);
			return this;
		}
		public Destroy (): void {
			session['destroyNamespace'](name);
		}
	}
	return new Namespace();
} 

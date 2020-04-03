import { Logger as _Logger } from "./Logger";
import * as MapConverter from "./Helpers/MapHelper";
import * as NumberFormatter from "./Helpers/NumberHelper";
import * as ObjectHelper from "./Helpers/ObjectHelper";
import * as StringHelper from "./Helpers/StringHelper";


export namespace Tools {
	export class Logger extends _Logger {};
}
export namespace Tools.Helpers {
	export import Map = MapConverter.MapHelper;
	export import Number = NumberFormatter.NumberHelper;
	export import Object = ObjectHelper.ObjectHelper;
	export import String = StringHelper.StringHelper;
}
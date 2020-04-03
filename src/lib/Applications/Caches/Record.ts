import { IApplication } from "../IApplication";


export class Record {
	public instance: IApplication;
	public modTime: number;
	public scriptName: string;
	public dirFullPath: string;
	public constructor (
		instance: IApplication,
		modTime: number,
		scriptName: string,
		fullPath: string
	) {
		this.instance = instance;
		this.modTime = modTime;
		this.scriptName = scriptName;
		this.dirFullPath = fullPath;
	};
}
import { IApplication } from "../IApplication";


export class Record {
	public Instance: IApplication;
	public IndexScriptModTime: number;
	public IndexScriptFileName: string;
	public DirectoryFullPath: string;
	public constructor (
		instance: IApplication,
		modTime: number,
		scriptName: string,
		fullPath: string
	) {
		this.Instance = instance;
		this.IndexScriptModTime = modTime;
		this.IndexScriptFileName = scriptName;
		this.DirectoryFullPath = fullPath;
	};
}
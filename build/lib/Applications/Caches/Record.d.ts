import { IApplication } from "../IApplication";
export declare class Record {
    instance: IApplication;
    modTime: number;
    scriptName: string;
    dirFullPath: string;
    constructor(instance: IApplication, modTime: number, scriptName: string, fullPath: string);
}

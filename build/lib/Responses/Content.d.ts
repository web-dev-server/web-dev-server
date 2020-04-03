import { Response } from "../Response";
export declare class Content {
    /**
     * Response HTTP body.
     * Example: `"<!DOCTYPE html><html lang="en"><head><meta ..."`
     */
    protected body: string;
    SetBody(body: string): Response;
    PrependBody(body: string): Response;
    AppendBody(body: string): Response;
    GetBody(): string | null;
    IsHtmlOutput(): boolean;
    IsXmlOutput(): boolean;
    IsSentBody(): boolean;
    Send(end?: boolean): Response;
    SendBody(end?: boolean): Response;
}

import { ServerResponse as HttpServerResponse } from "http";

import { Response } from "../Response";


export class Content {
	/**
	 * Response HTTP body.
	 * Example: `"<!DOCTYPE html><html lang="en"><head><meta ..."`
	 */
	protected body: string = null;

	public SetBody (body: string): Response {
		this.body = body;
		return this as any;
	}
	public PrependBody (body: string): Response {
		if (this.body == null) this.body = '';
		this.body = body + this.body;
		return this as any;
	}
	public AppendBody (body: string): Response {
		if (this.body == null) this.body = '';
		this.body += body;
		return this as any;
	}
	public GetBody (): string | null {
		return this.body;
	}
	public IsHtmlOutput (): boolean {
		var contentTypeHeader: string = this['GetHeader']('content-type').toString();
		return Boolean(
			contentTypeHeader.indexOf('text/html') != -1 || 
			contentTypeHeader.indexOf('application/xhtml+xml') != -1
		);
	}
	public IsXmlOutput (): boolean {
		var contentTypeHeader: string = this['GetHeader']('content-type').toString();
		return contentTypeHeader.indexOf('xml') != -1;
	}
	public IsSentBody (): boolean {
		var httpRes: HttpServerResponse = this['http'];
		return httpRes.finished;
	}
	public Send (end: boolean = true, cb?: () => void): Response {
		return this['SendHeaders']().SendBody(end, cb);
	}
	public SendBody (end: boolean = true, cb?: () => void): Response {
		var httpRes: HttpServerResponse = this['http'];
		if (this.IsSentBody()) return this as any;
		httpRes.write(this.body);
		if (end) {
			this['endHttpRequest'](cb);
		} else {
			httpRes.write(this.body);
		}
		return this as any;
	}
}
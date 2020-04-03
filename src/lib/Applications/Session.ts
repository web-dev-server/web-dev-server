import { randomBytes } from "crypto";

import { Request } from "../Request";
import { Response } from "../Response";
import { IResponseCookie } from "../Responses/IResponseCookie";
import { INamespace } from "./Sessions/INamespace";
import { createNamespace } from "./Sessions/Namespace";


export class Session {
	public static readonly LIFETIMES: {
		MINUTE: number, HOUR: number, DAY: number, WEEK: number, MONTH: number, YEAR: number
	} = {
		MINUTE: 60, HOUR: 3600, DAY: 86400, WEEK: 604800, MONTH: 2592000, YEAR: 31557600
	}
	protected static store: Map<string, Session> = new Map<string, Session>();
	protected static maxLockWaitTime: number = 30000; // 30 seconds
	protected static cookieName: string = 'sessionid';
	protected static maxLifeTimeMiliSeconds: number = 0;
	protected static hashSalt: string = '';
	/**
	 * @summary Set max waiting time in seconds to unlock session for another request.
	 * @param maxLockWaitTime 
	 */
	public static SetMaxLockWaitTime (maxLockWaitTime: number): typeof Session {
		this.maxLockWaitTime = maxLockWaitTime * 1000;
		return this;
	}
	/**
	 * @summary Set used cookie name to identify session.
	 * @param cookieName 
	 */
	public static SetCookieName (cookieName: string): typeof Session {
		this.cookieName = cookieName;
		return this;
	}
	/**
	 * @summary Set max. lifetime for all sessions and it's namespaces.
	 * @param maxLifeTimeSeconds 
	 */
	public static SetMaxLifeTime (maxLifeTimeSeconds: number): typeof Session {
		this.maxLifeTimeMiliSeconds = maxLifeTimeSeconds === 0 ? 0 : maxLifeTimeSeconds * 1000;
		return this;
	}
	/**
	 * @summary Get max. lifetime for all sessions and it's namespaces in seconds.
	 */
	public static GetMaxLifeTime (): number {
		if (this.maxLifeTimeMiliSeconds === 0) return 0;
		return Math.round(this.maxLifeTimeMiliSeconds / 1000);
	}
	/**
	 * Destroy all running sessions.
	 */
	public static DestroyAll (): typeof Session {
		this.store.forEach(session => session.Destroy());
		this.store = new Map<string, Session>();
		return this;
	}
	/**
	 * Start session based on cookies and data stored in current process.
	 * @param request 
	 * @param response 
	 */
	public static async Start (request: Request, response: Response): Promise<Session> {
		var session: Session,
			id: string = this.getRequestIdOrNew(request);
		if (this.store.has(id)) {
			session = this.store.get(id);
			if (
				this.maxLifeTimeMiliSeconds !== 0 &&
				session.lastAccessTime + this.maxLifeTimeMiliSeconds < (+new Date)
			) {
				session = new Session(id);
				this.store.set(id, session);
			}
		} else {
			session = new Session(id);
			this.store.set(id, session);
		}
		if (session.locked) 
			await session.waitForUnlock();
		session.init();
		this.setResponseCookie(response, session);
		return session;
	}
	/**
	 * @summary Check if any session data exists for given request.
	 * @param request 
	 */
	public static Exists (request: Request): boolean {
		var id: string = request.GetCookie(this.cookieName, "a-zA-Z0-9");
		return this.store.has(id);
	}
	protected static setResponseCookie (response: Response, session: Session): void {
		session.lastAccessTime = +new Date;
		var expireDate: Date = null;
		if (this.maxLifeTimeMiliSeconds !== 0) {
			expireDate = new Date();
			expireDate.setTime(session.lastAccessTime + this.maxLifeTimeMiliSeconds);
		}
		response.On("session-unlock", () => {
			session.lastAccessTime = +new Date;
			session.locked = false;
		});
		response.SetCookie(<IResponseCookie>{
			name: this.cookieName,
			value: session.GetId(),
			expires: expireDate,
			path: '/',
			httpOnly: true
		});
	}
	protected static getRequestIdOrNew (request: Request): string {
		var id: string = request.GetCookie(this.cookieName, "a-zA-Z0-9");
		if (id == null) {
			while (true) {
				id = randomBytes(20).toString('hex').toLowerCase();
				if (!this.store.has(id)) break;
			}
		} else {
			id = id.toLowerCase();
		}
		return id;
	}
	/**
	 * @summary Get session id string.
	 */
	public GetId (): string {
		return this.id;
	}
	/**
	 * Get new or existing session namespace instance.
	 * @param name Session namespace unique name.
	 */
	public GetNamespace (name: string = 'default'): INamespace {
		var result: INamespace;
		if (this.namespaces.has(name)) {
			result = this.namespaces.get(name);
		} else {
			result = createNamespace(name, this);
			this.namespaces.set(name, result);
		}
		return result;
	}
	/**
	 * @summary Destroy all namespaces and this session for current user.
	 */
	public Destroy (): void {
		Session.store.delete(this.id);
		this.id = null;
		this.lastAccessTime = null;
		this.namespaces = null;
	}
	protected async waitForUnlock(): Promise<void> {
		if (!this.locked) return;
		var maxWaitingTime: number = Session.maxLockWaitTime;
		var startTime: number = +new Date;
		var timeoutHandler = (resolve) => {
			if (!this.locked) {
				this.locked = true;
				return resolve();
			}
			var nowTime: number = +new Date;
			if (startTime + maxWaitingTime < nowTime) 
				return resolve();
			setTimeout(() => {
				timeoutHandler(resolve);
			}, 100);
		};
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				timeoutHandler(resolve);
			}, 1000);
		});
	}
	protected setLastAccessTime (lastAccessTime: number): Session {
		this.lastAccessTime;
		return this;
	}
	protected destroyNamespace (name: string): Session {
		if (this.namespaces.has(name))
			this.namespaces.delete(name);
		return this;
	}
	protected setNamespaceExpirationHoops (name: string, hoopsCount: number): Session {
		this.namespacesHoops.set(name, hoopsCount);
		return this;
	}
	protected setNamespaceExpirationTime (name: string, seconds: number): Session {
		var maxLifeTimeSeconds: number = Session.GetMaxLifeTime();
		if (seconds > maxLifeTimeSeconds && maxLifeTimeSeconds > 0) 
			seconds = maxLifeTimeSeconds;
		var expDate: Date = new Date();
		expDate.setTime(expDate.getTime() + (seconds * 1000));
		this.namespacesExpirations.set(name, expDate.getTime());
		return this;
	}
	protected init (): void {
		this.locked = true;
		var nowTime: number = (new Date()).getTime();
		this.namespacesHoops.forEach((hoopsCount, name) => {
			this.namespacesHoops.set(name, hoopsCount - 1);
		});
		var namesToUnset: Map<string, boolean> = new Map<string, boolean>();
		this.namespaces.forEach((namespace, name) => {
			if (
				this.namespacesHoops.has(name) &&
				this.namespacesHoops.get(name) < 0
			) namesToUnset.set(name, true);
			if (
				this.namespacesExpirations.has(name) &&
				this.namespacesExpirations.get(name) < nowTime
			) namesToUnset.set(name, true);
		});
		namesToUnset.forEach((bool, name) => {
			if (this.namespacesHoops.has(name))
				this.namespacesHoops.delete(name);
			if (this.namespacesExpirations.has(name))
				this.namespacesExpirations.delete(name);
			this.namespaces.delete(name);
		});
	}
	protected id: string;
	protected locked: boolean;
	protected lastAccessTime: number;
	protected namespacesHoops: Map<string, number>;
	protected namespacesExpirations: Map<string, number>;
	protected namespaces: Map<string, INamespace>;
	protected constructor (id: string) {
		this.id = id;
		this.locked = false;
		this.lastAccessTime = +new Date;
		this.namespacesHoops = new Map<string, number>();
		this.namespacesExpirations = new Map<string, number>();
		this.namespaces = new Map<string, INamespace>();
	}
}

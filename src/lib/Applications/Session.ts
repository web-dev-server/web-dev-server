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
	public static GC_INTERVAL: number = 60 * 60 * 1000; // once per hour
	public static LOCK_CHECK_INTERVAL: number = 100;
	protected static store: Map<string, Session> = new Map<string, Session>();
	protected static maxLockWaitTime: number = 30 * 1000; // 30 seconds
	protected static cookieName: string = 'sessionid';
	protected static maxLifeTimeMiliSeconds: number = 30 * 24 * 60 * 60 * 1000;
	protected static garbageCollecting: NodeJS.Timeout = null;
	protected static loadHandler: (id: string, store: Map<string, Session>, exists: boolean) => Promise<void> = null;
	protected static writeHandler: (id: string, store: Map<string, Session>) => Promise<void> = null
	/**
	 * @summary Set max waiting time in seconds to unlock session for another request.
	 * @param maxLockWaitTime 
	 */
	public static SetMaxLockWaitTime (maxLockWaitTime: number): typeof Session {
		this.maxLockWaitTime = maxLockWaitTime * 1000;
		return this;
	}
	/**
	 * @summary Get max waiting time in seconds to unlock session for another request.
	 */
	public static GetMaxLockWaitTime (): number {
		return this.maxLockWaitTime;
	}
	/**
	 * @summary Set used cookie name to identify user session.
	 * @param cookieName 
	 */
	public static SetCookieName (cookieName: string): typeof Session {
		this.cookieName = cookieName;
		return this;
	}
	/**
	 * @summary Get used cookie name to identify user session.
	 */
	public static GetCookieName (): string {
		return this.cookieName;
	}
	/**
	 * @summary Set max. lifetime for all sessions and it's namespaces. 
	 * `0` means unlimited, 30 days by default.
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
	 * @summary Set custom session load handler. 
	 * Implement any functionality to assign session instance under it's id into given store.
	 * @param loadHandler 
	 */
	public static SetLoadHandler (loadHandler: (id: string, store: Map<string, Session>, exists: boolean) => Promise<void>): typeof Session {
		this.loadHandler = loadHandler;
		return this;
	}
	/**
	 * @summary Set custom session write handler. 
	 * Implement any functionality to store session instance under it's id from given store anywhere else.
	 * @param writeHandler 
	 */
	public static SetWriteHandler (writeHandler: (id: string, store: Map<string, Session>) => Promise<void>): typeof Session {
		this.writeHandler = writeHandler;
		return this;
	}
	/**
	 * Start session based on cookies and data stored in current process.
	 * @param request 
	 * @param response 
	 */
	public static async Start (request: Request, response: Response = null): Promise<Session> {
		var session: Session,
			id: string = this.getRequestIdOrNew(request);
		if (!this.store.has(id) && this.loadHandler != null) 
			await this.loadHandler(id, this.store, false);
		if (this.store.has(id)) {
			session = this.store.get(id);
			if (
				session != null &&
				this.maxLifeTimeMiliSeconds !== 0 &&
				session.lastAccessTime + this.maxLifeTimeMiliSeconds < (+new Date)
			) {
				session = new Session(id, false);
				this.store.set(id, session);
			}
		} else {
			session = new Session(id, false);
			this.store.set(id, session);
		}
		if (session == null || (session && session.IsLocked())) 
			session = await this.waitToUnlock(id);
		session.init();
		if (response) this.setUpResponse(session, response);
		this.runGarbageCollectingIfNecessary();
		return session;
	}
	/**
	 * @summary Check if any session data exists for given request.
	 * @param request 
	 */
	public static async Exists (request: Request): Promise<boolean> {
		var id: string = request.GetCookie(this.cookieName, "a-zA-Z0-9");
		if (this.store.has(id)) return true;
		if (this.loadHandler) 
			await this.loadHandler(id, this.store, true);
		return this.store.has(id) && this.store.get(id) != null;
	}
	/**
	 * @summary Get session object by session id or `null`. 
	 * Returned session could be already locked by another request.
	 * @param sessionId 
	 */
	public static async Get (sessionId: string): Promise<Session> {
		if (!this.store.has(sessionId) && this.loadHandler) 
			await this.loadHandler(sessionId, this.store, false);
		if (this.store.has(sessionId))
			return this.store.get(sessionId);
		return null;
	}
	/**
	 * @summary Set session object with session id and optional data or lock
	 * into global store. If there is configured any write handler, then the
	 * handler is invoked for this session id.
	 * @param session 
	 */
	public static async Set (session: Session): Promise<typeof Session> {
		var sessionId: string = session.GetId();
		this.store.set(sessionId, session);
		if (this.writeHandler != null) 
			await this.writeHandler(sessionId, this.store);
		return this;
	}
	protected static setUpResponse (session: Session, response: Response): void {
		session.lastAccessTime = +new Date;
		var expireDate: Date = null;
		if (this.maxLifeTimeMiliSeconds !== 0) {
			expireDate = new Date();
			expireDate.setTime(session.lastAccessTime + this.maxLifeTimeMiliSeconds);
		}
		response.On("session-unlock", async () => {
			session.lastAccessTime = +new Date;
			session.locked = false;
			if (this.writeHandler != null) 
				await this.writeHandler(session.GetId(), this.store);
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
	protected static runGarbageCollectingIfNecessary(): void {
		if (this.garbageCollecting !== null) return;
		this.garbageCollecting = setInterval(() => {
			if (this.maxLifeTimeMiliSeconds === 0) 
				return;
			var nowTime: number = +new Date;
			this.store.forEach(session => {
				if (session.lastAccessTime + this.maxLifeTimeMiliSeconds < nowTime) 
					session.Destroy();
			});
		}, this.GC_INTERVAL);
	}
	protected static async waitToUnlock (id: string): Promise<Session> {
		var session: Session = this.store.get(id);
		if (session && !session.locked) return session;
		var maxWaitingTime: number = Session.maxLockWaitTime;
		var startTime: number = +new Date;
		var timeoutHandler = (resolve: (session: Session) => void): void => {
			var session: Session = this.store.get(id);
			if (session && !session.locked) {
				session.locked = true;
				return resolve(session);
			}
			var nowTime: number = +new Date;
			if (startTime + maxWaitingTime < nowTime) 
				return resolve(session);
			setTimeout(() => {
				timeoutHandler(resolve);
			}, this.LOCK_CHECK_INTERVAL);
		};
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				timeoutHandler(resolve);
			}, this.LOCK_CHECK_INTERVAL);
		});
	}
	/**
	 * @summary Get session id string.
	 */
	public GetId (): string {
		return this.id;
	}
	/**
	 * @summary Get if session is locked.
	 */
	public IsLocked (): boolean {
		return this.locked;
	}
	/**
	 * @summary Lock current session and prevent other request to using it.
	 * Session is locked automaticly on session start. Use this method very carefully.
	 */
	public Lock (): this {
		this.locked = true;
		return this;
	}
	/**
	 * @summary Unlock current session and allow other request to using it.
	 * Session is unlocked automaticly on response send. Use this method very carefully.
	 */
	public Unlock (): this {
		this.locked = false;
		return this;
	}
	/**
	 * @summary Wait until this session is unlocked by another request end.
	 */
	public async WaitToUnlock (): Promise<this> {
		await Session.waitToUnlock(this.id);
		return this;
	}
	/**
	 * @summary Get new or existing session namespace instance.
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
		this.locked = null;
		this.lastAccessTime = null;
		this.namespacesExpirations = null;
		this.namespaces = null;
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
	public constructor (id: string, locked: boolean = true) {
		this.id = id;
		this.locked = locked;
		this.lastAccessTime = +new Date;
		this.namespacesHoops = new Map<string, number>();
		this.namespacesExpirations = new Map<string, number>();
		this.namespaces = new Map<string, INamespace>();
	}
}

import { Request } from "../Request";
import { Response } from "../Response";
import { INamespace } from "./Sessions/INamespace";
export declare class Session {
    static readonly LIFETIMES: {
        MINUTE: number;
        HOUR: number;
        DAY: number;
        WEEK: number;
        MONTH: number;
        YEAR: number;
    };
    protected static store: Map<string, Session>;
    protected static maxLockWaitTime: number;
    protected static cookieName: string;
    protected static maxLifeTimeMiliSeconds: number;
    protected static hashSalt: string;
    /**
     * @summary Set max waiting time in seconds to unlock session for another request.
     * @param maxLockWaitTime
     */
    static SetMaxLockWaitTime(maxLockWaitTime: number): typeof Session;
    /**
     * @summary Set used cookie name to identify session.
     * @param cookieName
     */
    static SetCookieName(cookieName: string): typeof Session;
    /**
     * @summary Set max. lifetime for all sessions and it's namespaces.
     * @param maxLifeTimeSeconds
     */
    static SetMaxLifeTime(maxLifeTimeSeconds: number): typeof Session;
    /**
     * @summary Get max. lifetime for all sessions and it's namespaces in seconds.
     */
    static GetMaxLifeTime(): number;
    /**
     * Destroy all running sessions.
     */
    static DestroyAll(): typeof Session;
    /**
     * Start session based on cookies and data stored in current process.
     * @param request
     * @param response
     */
    static Start(request: Request, response: Response): Promise<Session>;
    /**
     * @summary Check if any session data exists for given request.
     * @param request
     */
    static Exists(request: Request): boolean;
    protected static setResponseCookie(response: Response, session: Session): void;
    protected static getRequestIdOrNew(request: Request): string;
    /**
     * @summary Get session id string.
     */
    GetId(): string;
    /**
     * Get new or existing session namespace instance.
     * @param name Session namespace unique name.
     */
    GetNamespace(name?: string): INamespace;
    /**
     * @summary Destroy all namespaces and this session for current user.
     */
    Destroy(): void;
    protected waitForUnlock(): Promise<void>;
    protected setLastAccessTime(lastAccessTime: number): Session;
    protected destroyNamespace(name: string): Session;
    protected setNamespaceExpirationHoops(name: string, hoopsCount: number): Session;
    protected setNamespaceExpirationTime(name: string, seconds: number): Session;
    protected init(): void;
    protected id: string;
    protected locked: boolean;
    protected lastAccessTime: number;
    protected namespacesHoops: Map<string, number>;
    protected namespacesExpirations: Map<string, number>;
    protected namespaces: Map<string, INamespace>;
    protected constructor(id: string);
}

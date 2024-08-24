import type { Session, SessionData } from "express-session";

// auth
export type TSessionUser = { id: string; csrfToken: string };
export type TCustomSession = Session &
    Partial<SessionData> & { user: TSessionUser };

import { v4 as uuidv4 } from "uuid";
import { createStorage } from "unstorage";
import lruCacheDriver from "unstorage/drivers/lru-cache";

function useSessionStore() {
    const sessionToUserMap = createStorage<string>({
        driver: lruCacheDriver({
            max: 100, // Keep a max of 100 items in LRU Cache
        }),
    });

    const userToSessionMap = createStorage<string>({
        driver: lruCacheDriver({
            max: 100, // Keep a max of 100 items in LRU Cache
        }),
    });

    async function invalidateSessionBySessionId(sessionId: string) {
        const userId = await sessionToUserMap.getItem(sessionId);
        if (userId) {
            await userToSessionMap.removeItem(userId);
            return false;
        }
        await sessionToUserMap.removeItem(sessionId);
        return true;
    }

    async function invalidateSessionByUserId(userId: string) {
        const sessionId = await userToSessionMap.getItem(userId);
        if (sessionId) {
            await sessionToUserMap.removeItem(sessionId);
            return false;
        }
        await userToSessionMap.removeItem(userId);
        return true;
    }

    async function createNewUserSession(userId: string) {
        await invalidateSessionByUserId(userId);
        const newSessionId = uuidv4();

        await userToSessionMap.setItem(userId, newSessionId);
        await sessionToUserMap.setItem(newSessionId, userId);
    }

    async function getUserIdFromSession(sessionId: string) {
        const userId = await sessionToUserMap.getItem(sessionId);
        return userId;
    }

    async function getSessionIdFromUserId(userId: string) {
        const sessionId = await sessionToUserMap.getItem(userId);
        return sessionId;
    }

    return {
        createNewUserSession,
        invalidateSessionBySessionId,
        invalidateSessionByUserId,
        getUserIdFromSession,
        getSessionIdFromUserId,
    };
}

const sessionStore = useSessionStore();
export default sessionStore;

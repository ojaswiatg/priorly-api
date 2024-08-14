// Add helper functions for controllers and middlewares
import { userSessionCache } from "#tools";

export async function hasUserSession(userID: string) {
    try {
        const hasSession = await userSessionCache.hasItem(userID);
        return hasSession;
    } catch (error) {
        console.error(error);
        return false;
    }
}

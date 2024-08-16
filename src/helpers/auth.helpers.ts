// Add helper functions for controllers and middlewares
import { userSessionCache } from "#tools";

export async function hasUserSession(userId: string) {
    try {
        const hasSession = await userSessionCache.hasItem(userId);
        return hasSession;
    } catch (error) {
        console.error(error);
        return false;
    }
}

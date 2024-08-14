// Add utitlity functions for App

import { userSessionCache } from "#tools";

export async function storeUserSession(userID: string) {
    try {
        await userSessionCache.setItem(userID, true);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function deleteUserSession(userID: string) {
    try {
        await userSessionCache.removeItem(userID);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

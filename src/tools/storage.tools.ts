import { createStorage } from "unstorage";
import lruCacheDriver from "unstorage/drivers/lru-cache";

export const userSessionCache = createStorage({
    driver: lruCacheDriver({
        max: 100, // Keeps a max of 100 items in the cache
    }),
});

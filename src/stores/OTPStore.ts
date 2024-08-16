import _ from "lodash";
import { createStorage } from "unstorage";
import lruCacheDriver from "unstorage/drivers/lru-cache";
import { getCurrentTimestamp } from "#utils";

function useOTPStore() {
    const otpStorage = createStorage<{ otp: number; updatedAt: number }>({
        driver: lruCacheDriver({
            max: 100, // Keep a max of 100 items in LRU Cache
        }),
    });

    async function getNewOTP(email: string) {
        const otp = Math.floor(1000 + Math.random() * 9000);
        await otpStorage.setItem(email, {
            otp: otp,
            updatedAt: getCurrentTimestamp(),
        });
    }

    async function canSendOTP(email: string) {
        const ONE_MINUTE_MS = 60 * 1000; // 1 minute

        const otp = await otpStorage.getItem(email);
        if (_.isEmpty(otp)) {
            return true;
        }

        const oldTs = otp.updatedAt;
        const newTs = getCurrentTimestamp();

        if (
            oldTs &&
            newTs &&
            (newTs as number) - (oldTs as number) < ONE_MINUTE_MS
        ) {
            // if the diff is less than one minute, return false
            return false;
        }

        // delete the previous otp and return true
        await otpStorage.removeItem(email);
        return true;
    }

    async function deleteOTP(email: string) {
        const hasOTP = await otpStorage.hasItem(email);
        if (_.isEmpty(hasOTP)) {
            return false;
        }
        await otpStorage.removeItem(email);
        return true;
    }

    return {
        getNewOTP,
        deleteOTP,
        canSendOTP,
    };
}

const otpStore = useOTPStore();
export default otpStore;

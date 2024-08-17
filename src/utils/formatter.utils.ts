import _ from "lodash";
import type { ZodError } from "zod";

export function getFormattedTimestamp(
    timestamp: number,
    options?: Intl.DateTimeFormatOptions,
) {
    const date = new Date(timestamp * 1000);

    const defaultOptions: Intl.DateTimeFormatOptions = options || {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true, // Use 12-hour format with AM/PM
    };

    const formatter = new Intl.DateTimeFormat(
        "en-US",
        options || defaultOptions,
    );
    const formattedDateTime = formatter.format(date);
    return formattedDateTime;
}

export function getFormattedZodErrors(error: ZodError) {
    const init = {} as Record<string, string>;

    const errors = _.reduce(
        error.errors,
        (allErrors, e) => {
            const errorPath = e.path[0];
            allErrors[errorPath] = e.message;
            return allErrors;
        },
        init,
    );

    return errors;
}

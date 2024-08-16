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

export function getCurrentTimeStamp() {
    return new Date().getTime() / 1000;
}

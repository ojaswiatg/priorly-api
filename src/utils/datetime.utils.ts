export async function getDate(timestamp: number) {
    return new Date(timestamp).toISOString();
}

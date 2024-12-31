export function extractMessagesFromString(input: string): string {
    const regex = /"content":"([^"]*)"/g;
    const messages = [];
    let match;
    while ((match = regex.exec(input)) !== null) {
        messages.push(match[1]);
    }
    return messages.join('');
}
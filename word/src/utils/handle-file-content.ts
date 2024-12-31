import { existsSync, writeFileSync, appendFileSync } from "fs";

export function handleFileContent(filePath: string, content: string) {
    if (!existsSync(filePath)) {
        writeFileSync(filePath, content);
    } else {
        appendFileSync(filePath, content);
    }
}
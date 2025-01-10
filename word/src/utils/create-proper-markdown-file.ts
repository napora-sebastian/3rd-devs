import fs from 'fs';
import MarkdownIt from 'markdown-it';
const md = new MarkdownIt({
    // breaks: false,
    // html: false,
    // linkify: true,
    // typographer: false,
    // xhtmlOut: false
});

export function createProperMarkdownFile(content: string, outputPath: string) {
    const formatted = content
    .replaceAll(/\\n/g, '\n')
    .replaceAll(/```markdown/g, '')
    .replaceAll(/```javascript/g, '')
    .replaceAll(/```/g, '');
    
    //check if on the beggiingin is '----' and on the end is '----'
    // if not add them
    if (formatted.startsWith('--') && formatted.endsWith('--')) {
        fs.writeFileSync(outputPath, `${formatted.trim()}`, 'utf8');
        
        return
    }
    
    fs.writeFileSync(outputPath, `----\n${formatted.trim()}\n----`, 'utf8');


    // Parse markdown content to generate the markdown output
    // const result = md.render(formatted);

    // Write output to a markdown file
}
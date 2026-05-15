import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class HyperframesEngine {
  async generateHtml(content: string, jobId: string): Promise<string> {
    const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Outfit:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    body { background: black; margin: 0; overflow: hidden; font-family: 'Inter', sans-serif; }
    .clip { position: absolute; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;

    const filePath = path.join(process.cwd(), 'generated/html', `${jobId}.html`);
    await fs.outputFile(filePath, htmlTemplate);
    return filePath;
  }

  async render(htmlPath: string, outputDir: string): Promise<string> {
    const fileName = path.basename(htmlPath, '.html');
    const outputPath = path.join(outputDir, `${fileName}.mp4`);
    
    // Using npx hyperframes render as requested
    // Note: This requires hyperframes CLI to be installed and working in the environment
    console.log(`Rendering ${htmlPath} to ${outputPath}...`);
    
    try {
      // npx hyperframes render generated/index.html --width 1080 --height 1920 --fps 30
      const command = `npx -y hyperframes render ${htmlPath} --width 1080 --height 1920 --fps 30 --output ${outputPath}`;
      await execAsync(command);
      return outputPath;
    } catch (error) {
      console.error('Hyperframes render failed:', error);
      throw error;
    }
  }
}

export const hyperframesEngine = new HyperframesEngine();

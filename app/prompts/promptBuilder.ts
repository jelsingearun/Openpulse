import { NewsStory } from '../services/newsService';

export interface VideoConfig {
  totalDuration: number;
  scenes: {
    hook: { start: number; end: number };
    content: { start: number; end: number };
    outro: { start: number; end: number };
  };
  transitions?: {
    type: 'fade' | 'wipe' | 'blur' | 'none';
    duration: number;
  };
}

const DEFAULT_CONFIG: VideoConfig = {
  totalDuration: 15,
  scenes: {
    hook: { start: 0, end: 5 },
    content: { start: 5, end: 12 },
    outro: { start: 12, end: 15 }
  },
  transitions: {
    type: 'fade',
    duration: 0.5
  }
};

export class PromptBuilder {
  buildVideoSystemPrompt(config: VideoConfig = DEFAULT_CONFIG): string {
    const transitionType = config.transitions?.type || 'none';
    const transitionDuration = config.transitions?.duration || 0;

    return `You are a world-class motion graphics engineer and expert in HeyGen HyperFrames.
Output ONLY raw HTML that is fully compatible with HyperFrames.

RULES:
1. Root must be <div id="root" data-composition-id="news-video" data-width="1080" data-height="1920" data-start="0">.
2. Every item to be rendered must have class="clip" and data-start, data-duration, data-track-index.
3. Every animation MUST use GSAP and be registered in window.__timelines.main.
4. The timeline must be paused: const tl = gsap.timeline({ paused: true });
5. Use TailwindCSS for styling (CDN link already included in wrapper).
6. Avoid markdown fences. Output ONLY the code.
7. The aesthetic must be "Cinematic Newsroom": use dark gradients, high contrast typography, glassmorphism, and subtle tech textures (grid patterns, scanning lines).
8. Incorporate diverse visual elements: Use progress bars, floating tech icons, data visualizations (simplified), and cinematic particle effects using Tailwind and GSAP.
9. Duration of the video should be exactly ${config.totalDuration} seconds.
10. TRANSITIONS: Use ${transitionType} transitions between scenes with a duration of ${transitionDuration}s. Use GSAP to animate opacity or clip-path for these transitions.

REQUIRED STRUCTURE:
<div id="root" data-composition-id="news-video" data-width="1080" data-height="1920" data-start="0">
  <div id="bg" class="clip" data-start="0" data-duration="${config.totalDuration}" data-track-index="0" class="absolute inset-0 bg-gradient-to-br from-slate-900 to-black overflow-hidden">
    <div class="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
  </div>
  <!-- Scenes go here -->
</div>
<script>
  const tl = gsap.timeline({ paused: true });
  window.__timelines = { main: tl };
  // Add animations here
</script>`;
  }

  buildStoryPrompt(story: NewsStory, config: VideoConfig = DEFAULT_CONFIG): string {
    const transitionDesc = config.transitions && config.transitions.type !== 'none' 
      ? `Use subtle ${config.transitions.type} transitions (${config.transitions.duration}s) between scenes.`
      : "Use clean cuts or custom GSAP transitions between scenes.";

    return `Generate a cinematic vertical news video composition for this story:
Title: ${story.title}
Author: ${story.author}
Summary: ${story.snippet}

Create 3 high-impact scenes within a total duration of ${config.totalDuration} seconds:
1. Hook (${config.scenes.hook.start}-${config.scenes.hook.end}s): Big bold headline with a high-energy reveal. Add a "Breaking News" tag with a pulsing intensity animation.
2. Content (${config.scenes.content.start}-${config.scenes.content.end}s): The summary text staggered in line-by-line. Use a "data stream" visual effect or a sidebar progress indicator.
3. Outro (${config.scenes.outro.start}-${config.scenes.outro.end}s): Professional logo reveal and a clear Call to Action: "VISIT HN FOR MORE". Add a subtle glitch effect on the CTA button.

VISUAL CUES:
${transitionDesc}
Ensure high contrast and professional spacing. Use modern Google Fonts (Inter, Outfit).`;
  }
}

export const promptBuilder = new PromptBuilder();

import { newsService } from '../services/newsService';
import { llmService } from '../services/llmService';
import { promptBuilder, VideoConfig } from '../prompts/promptBuilder';
import { hyperframesEngine } from '../render/hyperframesEngine';
import path from 'path';

export enum JobStatus {
  PENDING = 'pending',
  FETCHING = 'fetching',
  GENERATING = 'generating',
  RENDERING = 'rendering',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface Job {
  id: string;
  status: JobStatus;
  videoUrl?: string;
  error?: string;
  storyTitle?: string;
}

export class Orchestrator {
  private jobs: Map<string, Job> = new Map();

  async createJob(): Promise<string> {
    const id = `job_${Date.now()}`;
    this.jobs.set(id, { id, status: JobStatus.PENDING });
    
    // Background the processing
    this.processJob(id).catch(err => {
      console.error(`Job ${id} failed:`, err);
    });

    return id;
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  private async processJob(id: string) {
    const job = this.jobs.get(id)!;
    
    try {
      // 1. Fetch Trending News
      job.status = JobStatus.FETCHING;
      const stories = await newsService.fetchAll();
      if (stories.length === 0) throw new Error('No stories found');
      
      // Randomly pick from the top 10 stories to ensure variety
      const poolSize = Math.min(10, stories.length);
      const randomIndex = Math.floor(Math.random() * poolSize);
      const topStory = stories[randomIndex];
      job.storyTitle = topStory.title;

      // 2. Generate Composition via LLM
      job.status = JobStatus.GENERATING;

      // Dynamic config based on story complexity
      const snippetLength = topStory.snippet.length;
      let duration = 15;
      if (snippetLength > 300) duration = 20;
      if (snippetLength > 600) duration = 30;

      const config: VideoConfig = {
        totalDuration: duration,
        scenes: {
          hook: { start: 0, end: Math.min(5, duration * 0.25) },
          content: { start: Math.min(5, duration * 0.25), end: duration - 3 },
          outro: { start: duration - 3, end: duration }
        },
        transitions: {
          type: duration > 20 ? 'blur' : 'wipe',
          duration: 0.6
        }
      };

      const systemPrompt = promptBuilder.buildVideoSystemPrompt(config);
      const userPrompt = promptBuilder.buildStoryPrompt(topStory, config);
      const rawOutput = await llmService.generate(userPrompt, systemPrompt);
      const sanitizedHtml = llmService.sanitizeOutput(rawOutput);

      // 3. Render HTML to Video
      job.status = JobStatus.RENDERING;
      const htmlPath = await hyperframesEngine.generateHtml(sanitizedHtml, id);
      const videoPath = await hyperframesEngine.render(htmlPath, path.join(process.cwd(), 'generated/renders'));

      job.status = JobStatus.COMPLETED;
      job.videoUrl = `/generated/renders/${path.basename(videoPath)}`;
    } catch (error: any) {
      job.status = JobStatus.FAILED;
      job.error = error.message;
    }
  }
}

export const orchestrator = new Orchestrator();

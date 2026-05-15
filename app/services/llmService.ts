import axios from 'axios';

export class LLMService {
  private apiUrl: string;
  private modelName: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.INFERENCE_API_URL || 'http://127.0.0.1:8000/v1';
    this.modelName = process.env.MODEL_NAME || 'Qwen2.5-7B-Instruct';
    this.apiKey = process.env.INFERENCE_API_KEY || 'no-key-required';
  }

  async generate(prompt: string, systemPrompt: string): Promise<string> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const key = (this.apiKey || '').trim();
      const isPlaceholder = !key || ['placeholder', 'undefined', 'null', ''].includes(key.toLowerCase());
      const shouldSkipAuth = isPlaceholder || key === 'no-key-required' || key === 'optional-if-needed';

      if (!shouldSkipAuth) {
        headers['Authorization'] = `Bearer ${key}`;
      }

      console.log(`[vLLM] Calling ${this.apiUrl} (Model: ${this.modelName})`);

      const response = await axios.post(`${this.apiUrl}/chat/completions`, {
        model: this.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4096, // Ensure enough capacity for full GSAP compositions
        presence_penalty: 0.1
      }, { 
        headers,
        timeout: 90000 // vLLM inference and TTFT are fast, but full generation can take time
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Malformed response from Inference API: Missing content');
      }

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Inference failed:', error);
      
      let detail = 'Unknown error';
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        
        // Handle Cloudware/Google Cloud typical error structures
        const errorData = typeof data === 'object' ? JSON.stringify(data) : (data || error.message);
        detail = `HTTP ${status}: ${errorData}`;
        
        if (status === 401) {
          detail += ' - Unauthorized. If using a remote vLLM, check your INFERENCE_API_KEY. If hitting vLLM on Cloud Run, ensure it "Allows Unauthenticated" calls.';
        }
      } else if (error instanceof Error) {
        detail = error.message;
      }
        
      throw new Error(`Pipeline Inference Failure: ${detail}`);
    }
  }

  sanitizeOutput(output: string): string {
    return output.replace(/```(html|json|javascript|js)?/g, '').replace(/```/g, '').trim();
  }
}

export const llmService = new LLMService();

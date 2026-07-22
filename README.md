# OpenPulse 

AI-powered autonomous news-to-video generation pipeline. This system transforms real-time news feeds into cinematic vertical short-form videos using an orchestrated pipeline of LLMs, GSAP animations, and HyperFrames rendering.

## 🚀 Architecture

1.  **Ingestion**: Scrapes Hacker News (and other sources) for trending stories.
2.  **Inference**: Uses vLLM or LM Studio (Local) to generate a HyperFrames-compatible HTML composition.
3.  **Composition**: Dynamically builds a GSAP-powered animation sequence.
4.  **Rendering**: Uses Headless Chromium via Playwright to capture frames.
5.  **Encoding**: FFMPEG compiles frames into a production-ready MP4.

## 🛠️ Tech Stack

-   **Backend**: Node.js, Fastify, TypeScript
-   **Frontend**: React, TailwindCSS, Lucide-React, Motion
-   **Inference**: **vLLM** (Production-grade), LM Studio (Local / Mesh)
-   **Rendering**: [HeyGen HyperFrames](https://github.com/heygen-com/hyperframes)
-   **Animation**: GSAP (GreenSock)

## 📦 Setup & Installation

### 1. vLLM (Recommended for Production)
1.  Install vLLM following the [official guide](https://github.com/vllm-project/vllm).
2.  Run the server:
    ```bash
    python -m vllm.entrypoints.openai.api_server --model Qwen/Qwen2.5-7B-Instruct --port 8000
    ```

### 2. Application Setup
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start development server
npm run dev
```

## 🎥 HyperFrames Integration

OpenPulse treats HTML/JS as executable video code. 
- **Deterministic**: Every frame is calculated based on the GSAP timeline.
- **Clip-Safe**: Uses `data-start` and `data-duration` attributes for precise temporal alignment.

## 🛡️ Security
-   Encrypted mesh networking via Tailscale (integrated via LM Link).
-   Sandboxed rendering environment.
-   Environment-based secret management.

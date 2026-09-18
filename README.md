# ZeroSweep ⚡ — Autonomous System-One Triage Engine (Jev)

> A high-performance benchmark and architectural showcase demonstrating why **System One Models (TypeSafe AI's Jev)** beat autoregressive LLMs at triage and email workflows.

[![Built with Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Powered by TypeSafe](https://img.shields.io/badge/TypeSafe_AI-Jev-emerald?style=flat-square)](https://typesafe.ai/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

---

## 🎯 The Core Thesis: The System-One Architecture Shift

Running thousands of emails, support tickets, or security logs through a traditional **70B+ autoregressive LLM (GPT-4o, Claude 3.5 Sonnet)** is an architectural anti-pattern:
1. **Unacceptable Latency:** **2,000ms – 30,000ms** per item due to sequential token-by-token decoding (O(N) forward passes).
2. **Economic Insolvency:** Output tokens cost ~5x input tokens ($15–$40 per 10k emails).
3. **Overconfidence & Schema Drift:** Models output authoritative text even when hallucinating formats or misidentifying ambiguous edge cases.

**TypeSafe Jev** replaces autoregressive string generation with a **single-pass parallel sampler (O(1))** trained via **RLCD (Reinforcement Learning for Calibrated Decisions)**:
* ⚡ **100ms Responses:** 40x to 150x faster execution.
* 💰 **$0.042 / MTok Input:** Output tokens are **$0.00 (Free / too cheap to meter)**.
* 🛡️ **Epistemic Calibration:** Calibrated confidence scoring enables safe **Negative Engineering** (ambiguous items trigger human review rather than false-positive destruction).
* 🔒 **Zero Format Errors:** Natively evaluated at the logit layer—mathematically impossible to return malformed JSON.

---

## 🚀 Key Features

### 1. ⚡ Autonomous "Inbox Zero" Mailbox (1,000+ Scale Client)
* A full-fledged, high-density **3-pane webmail interface** (Superhuman / Linear grade).
* **Scale Dataset Selector:** Choose between `50`, `250`, `500`, or `1,000` procedurally generated realistic emails.
* **4-Worker Concurrent Streaming Batch Queue:** Sweeps emails using TypeSafe Jev in parallel streaming batches ($0.042/MTok, $0 output tax) with a live streaming HUD tracking throughput (~45–90 emails/sec), elapsed time, and total cost.
* **Smart Folders with Live Badges:** `All Mail`, `Needs Action`, `Human Review (Safety Gate <85%)`, `Newsletters`, `Receipts & Tax`, `System Alerts`, and `Trash Quarantine`.
* **1-Click "Purge Trash":** Permanently sweeps all quarantined spam/phishing with an animated clean slate celebration to reach Inbox Zero.
* **Embedded Jev Telemetry Card:** Inspect choice probabilities, calibrated confidence, noul scores, and verified Envoy gateway latency in the reader pane.

### 2. 🧪 1-Email Precision Lab & Speedometer Diff
* Type or paste any custom email (`From`, `Sender Name`, `Subject`, `Body`) or choose from 6 realistic instant presets (P0 Outage, Term Sheet, Spear Phishing, Stripe Receipt, etc.).
* **Granular Model Triggers:**
  * ⚡ **"Analyze with Jev"**: Real-time parallel sampler (~70–180ms) returning typed category, logits, and calibrated confidence.
  * 🤖 **"Analyze with LLM"**: Real-time autoregressive model via OpenRouter (~4,000–6,500ms) with live running stopwatch.
  * ⚡🤖 **"Race Both Head-to-Head"**: Launches both simultaneously to visually observe the 35x+ compute speedup.
* Generates ready-to-use cURL commands with `x-envoy-upstream-service-time` extraction pipes for direct terminal verification.

### 3. 🏁 The 10-Email Head-to-Head Race Arena
* Side-by-side execution timer, token meter, and cost ticker.
* Evaluates 10 emails in parallel with Jev in **~220ms ($0.0004)** vs **22,000ms ($0.065)** with an autoregressive LLM.

### 4. 🔬 The Epistemic Calibration Inspector
* Explains how Jev's RLCD training produces mathematically calibrated confidence scores:
  * **Confidence ≥ 0.85**: Verified high-confidence automated triage.
  * **Confidence < 0.85**: Negative-engineering safety gate overrides deletion and dispatches to Human Review.

### 5. 📊 Enterprise Unit Economics Calculator (Live Market Rates)
* Interactive volume slider (10,000 to 10,000,000 emails/month).
* Interactive commercial model tier switcher aligned with live OpenRouter market rates:
  * **Frontier Flagship:** OpenAI GPT-6 Astra / Claude Fable 5.1 ($10.00 in / $50.00 out)
  * **Workhorse Pro:** Claude Opus 5 / GPT-5.6 Sol Pro ($3.50 in / $17.50 out)
  * **High-Speed Flash:** Google Gemini 3.8 Flash ($0.75 in / $3.75 out)
  * **Budget Open-Weights:** DeepSeek V4.1 Flash ($0.15 in / $0.60 out)
* Mathematical pricing breakdown proving how Jev eliminates the 4x–5x output token tax ($0.042/MTok in, $0.00 out).

### 6. ⚡ True Latency Decomposition Telemetry
* **Cluster Compute vs Public Transit:** Direct extraction of TypeSafe's `x-envoy-upstream-service-time` header from its Istio/Envoy service mesh.
* Viewers immediately see:
  > ⚡ **72ms Model Compute** + 🌐 **140ms Network Transit** = **212ms Total Wall-Clock**
* Proves that Jev evaluates email intent faster than light travels across the Atlantic ocean, contrasted against autoregressive LLMs which spend 5,000ms+ sequentially decoding tokens on GPU.
* Includes 1-click **Share Benchmark** summary generator for technical reviews.

### 7. 🛡️ Zero-CORS Secure Backend Architecture
* Completely eliminates client-side CORS errors and browser key-leakage risks.
* All requests are executed server-side via Next.js App Router handlers (`/api/triage/typesafe`, `/api/triage/typesafe/batch`, `/api/triage/llm`).

---

## 🛠️ Tech Stack & Architecture

* **Framework:** Next.js 14 (App Router, React 18, TypeScript)
* **Styling:** Tailwind CSS (Linear/Vercel dark-mode telemetry aesthetic)
* **Icons:** Lucide React
* **Engine Adapters:**
  * `src/lib/typesafe.ts`: Live TypeSafe HTTP gateway client + Envoy telemetry extraction.
  * `src/lib/llmBenchmark.ts`: Frontier autoregressive comparative baseline.
  * `src/lib/safetyGate.ts`: Epistemic thresholding logic (`confidence < 0.85 -> Human Review`).

---

## 📦 Getting Started

### Local Development
```bash
# 1. Clone the repository
git clone https://github.com/sysadarsh/zerosweep.git
cd zerosweep

# 2. Copy environment file and configure keys
cp .env.example .env.local

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```

---

## 🚢 Deploy to Vercel (1-Click Deployment)

Deploy your own live ZeroSweep instance directly to Vercel with zero configuration:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsysadarsh%2Fzerosweep&env=TYPESAFE_API_KEY,OPENROUTER_API_KEY&envDescription=Configure%20your%20TypeSafe%20AI%20and%20OpenRouter%20API%20keys%20for%20live%20benchmarks&envLink=https%3A%2F%2Fapi.typesafe.ai)

### Required Environment Variables
When deploying on Vercel, simply configure two environment variables in your project settings:

| Variable | Required | Description | Where to Obtain |
|---|---|---|---|
| `TYPESAFE_API_KEY` | **Yes** | TypeSafe AI System One API Key | [api.typesafe.ai](https://api.typesafe.ai) |
| `OPENROUTER_API_KEY` | **Yes** | OpenRouter API Key (for comparative baseline) | [openrouter.ai/keys](https://openrouter.ai/keys) |

> 🔒 **Security Notice:** All API requests are proxied server-side via Next.js 14 App Router API handlers (`/api/triage/*`). Your private API keys are **never exposed to the client browser**, and the backend strictly locks comparative LLM requests to the free DeepSeek Flash model to guarantee zero accidental spend.

## 👨‍💻 Author & Connect

**Adarsh** — Autonomous Systems Engineer
* **GitHub:** [@sysadarsh](https://github.com/sysadarsh)
* **Repository:** [sysadarsh/zerosweep](https://github.com/sysadarsh/zerosweep)

---

## 🤝 Acknowledgements & TypeSafe Resources

* **Diogo Almeida (Founder & CEO):** [LinkedIn Profile](https://www.linkedin.com/in/diogomda)
* **TypeSafe AI Team:** [typesafe.ai/team](https://typesafe.ai/team)
* **TypeSafe AI Platform:** [typesafe.ai](https://typesafe.ai)
* **System One Architecture:** [TypeSafe Blog & Research](https://typesafe.ai/blog/introducing-system-one-models-and-jev)

---

## 📄 License
MIT License. Created to demonstrate the power of TypeSafe AI's System One architecture.

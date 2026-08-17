import json
import httpx
from typing import List, Dict, Any
from app.core.config import settings

# System prompt forcing strict JSON output without markdown wrapper text
DECOMPOSITION_PROMPT = """
You are an expert tech career advisor and freelance service architect.
Your task is to take academic or technical core subjects (e.g., "Computer Networks", "Cryptography", "Operating Systems", "Python") and decompose them into actionable, high-demand freelance micro-services or practical sub-skills that can directly earn money.

For the given input skill/subject, generate 3 to 5 distinct micro-services. Each micro-service must represent a specific deliverable or skill that clients hire for on freelance platforms (like Upwork or Fiverr).

Input Core Skill: {core_skill}

OUTPUT FORMAT RULES:
1. Output MUST be a valid JSON list of strings ONLY.
2. Do NOT use Markdown formatting (no ```json or ``` code blocks).
3. Do NOT include introductory or concluding text.

Example Input: "Cryptography"
Example Output: [
  "SSL/TLS Certificate Installation & HTTPS Security Configuration",
  "API Key Authentication & JWT Token Security Audit",
  "Data Encryption at Rest Implementation for Databases",
  "Penetration Testing & Security Vulnerability Assessment"
]

Example Input: "Computer Networks"
Example Output: [
  "Nginx & Apache Reverse Proxy Setup",
  "DNS Record & Cloudflare CDN Optimization",
  "VPN & Firewalls Configuration for Small Businesses",
  "Network Traffic & Latency Monitoring Setup"
]
"""

async def decompose_skill_via_llm(core_skill: str) -> List[str]:
    """
    Calls the LLM (Mistral-7B/LLaMA-3) to decompose a skill into micro-services.
    Fallback logic is included if API key is not configured or fails.
    """
    # If using Groq / Together AI / HuggingFace HTTP API:
    # (Update header / payload according to your specific LLM provider key in config)
    prompt = f"Decompose the following core skill: {core_skill}"
    
    try:
        # Example structured prompt payload:
        # payload = {
        #     "model": "mistralai/Mistral-7B-Instruct-v0.2",
        #     "messages": [
        #         {"role": "system", "content": DECOMPOSITION_PROMPT},
        #         {"role": "user", "content": prompt}
        #     ],
        #     "temperature": 0.2
        # }
        # async with httpx.AsyncClient() as client:
        #     response = await client.post(...)
        #     nodes = json.loads(response.json()["choices"][0]["message"]["content"])
        #     return nodes
        
        # Static structured JSON return matching the contract for now:
        return [
            f"{core_skill} Setup & Core Fundamentals",
            f"{core_skill} API & Framework Integration",
            f"{core_skill} Performance Optimization & Deployment"
        ]
    except Exception as e:
        # Fallback ensuring API stability
        return [
            f"{core_skill} Fundamental Concepts",
            f"{core_skill} Practical Implementation",
            f"{core_skill} Advanced Optimization"
        ]
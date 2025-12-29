from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = FastAPI(title="Multi-AI Chatbot API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI clients
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ChatRequest(BaseModel):
    message: str
    provider: str
    conversation_history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    response: str
    provider: str

async def get_chatgpt_response(message: str, history: List[dict]) -> str:
    try:
        messages = [{"role": "system", "content": "You are a helpful assistant."}]
        
        for msg in history[-10:]:
            role = "user" if msg["sender"] == "user" else "assistant"
            messages.append({"role": role, "content": msg["text"]})
        
        messages.append({"role": "user", "content": message})
        
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=1000
        )
        
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ChatGPT error: {str(e)}")


async def get_grok_response(message: str, history: List[dict]) -> str:
    try:
        grok_client = OpenAI(
            api_key=os.getenv("GROQ_API_KEY"),
            base_url="https://api.groq.com/openai/v1"
        )
        
        messages = [{"role": "system", "content": "You are Grok, a chatbot inspired by the Hitchhiker's Guide to the Galaxy."}]
        
        for msg in history[-10:]:                                     
            role = "user" if msg["sender"] == "user" else "assistant"
            messages.append({"role": role, "content": msg["text"]})
        
        messages.append({"role": "user", "content": message})
        
        response = grok_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=1000
        )
        
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grok error: {str(e)}")


async def get_openrouter_response(message: str, history: List[dict]) -> str:
    try:
        openrouter_client = OpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1"
        )
        
        messages = [{"role": "system", "content": "You are a helpful AI assistant."}]
        
        for msg in history[-10:]:
            role = "user" if msg["sender"] == "user" else "assistant"
            messages.append({"role": role, "content": msg["text"]})
        
        messages.append({"role": "user", "content": message})
        
        # You can choose from many models on OpenRouter:
        # - "anthropic/claude-3.5-sonnet" (Claude)
        # - "google/gemini-pro-1.5" (Gemini)
        # - "meta-llama/llama-3.1-70b-instruct" (Llama)
        # - "mistralai/mistral-large" (Mistral)
        # - "openai/gpt-4o" (GPT-4)
        
        response = openrouter_client.chat.completions.create(
            model="anthropic/claude-3.5-sonnet",  # You can change this to any OpenRouter model
            messages=messages,
            max_tokens=1000,
            extra_headers={
                "HTTP-Referer": "http://localhost:3000",  # Optional: for rankings
                "X-Title": "Multi-AI Chatbot"  # Optional: for rankings
            }
        )
        
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenRouter error: {str(e)}")


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    provider_functions = {
        "chatgpt": get_chatgpt_response,
        "grok": get_grok_response,
        "openrouter": get_openrouter_response,
    }
    
    if request.provider not in provider_functions:
        raise HTTPException(status_code=400, detail="Invalid provider")
    
    response_text = await provider_functions[request.provider](
        request.message, 
        request.conversation_history
    )
    
    return ChatResponse(response=response_text, provider=request.provider)

@app.get("/")
async def root():
    return {"message": "Multi-AI Chatbot API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
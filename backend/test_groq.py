import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    print("Error: GROQ_API_KEY is not set in backend/.env! Please make sure you saved the file.")
else:
    print("GROQ_API_KEY loaded successfully. Testing API call...")
    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": "Hello, say 'Groq is working' and nothing else."}],
            model="groq/compound",
        )
        print("Response from Groq:", chat_completion.choices[0].message.content)
    except Exception as e:
        print("Error during API call:", e)

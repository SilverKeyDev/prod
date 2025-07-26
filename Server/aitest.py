import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")
res = openai.ChatCompletion.create(
  model="gpt-4",
  messages=[{"role": "user", "content": "Say hello!"}]
)
print(res.choices[0].message["content"])

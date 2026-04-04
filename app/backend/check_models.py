import google.generativeai as genai
import os

genai.configure(api_key=os.getenv('GEMINI_API_KEY', 'AIzaSyBvm7L4IHHn_WYa1h_5HU9R80f4mp5dNjI'))

# List the models
print("Available Gemini models:")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)

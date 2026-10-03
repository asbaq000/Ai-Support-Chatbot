"""Assistly: stateless Gemini chat API and optional built React frontend."""
import json
import os
import re
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

load_dotenv()
BUILD = Path(__file__).parent / 'frontend' / 'build'
app = Flask(__name__, static_folder=None)
app.config['MAX_CONTENT_LENGTH'] = 64 * 1024
CORS(app, resources={r'/api/*': {'origins': os.getenv('FRONTEND_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')}})
SYSTEM_INSTRUCTION = '''You are Assistly, a concise, friendly customer support assistant in a portfolio demo.
The store is fictional. Explain that policies are samples. Sample standard shipping is 3–5 business days
after dispatch, express is 1–2 days. Sample returns: unused items in original packaging within 30 days
of delivery. Sample support hours: Monday–Friday 09:00–18:00 UTC.
You have no access to orders, accounts, payments, tickets or live agents. Never invent an order status,
claim to issue refunds, reset passwords or transfer chats. Refer users to a real store's verified website
for actual actions. Never request passwords, payment details or verification codes. If uncertain, say so.
Use plain text, brief paragraphs and helpful next steps. Stay focused on customer support.'''

def api_key():
    return os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')

@app.get('/api/health')
def health():
    # "live" means configured; provider availability is checked when a message is sent.
    return jsonify(status='ok', mode='live' if api_key() else 'demo')

@app.post('/api/chat')
def chat():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error='Send a JSON object.'), 400
    message = data.get('message')
    if not isinstance(message, str) or not message.strip() or len(message) > 2000:
        return jsonify(error='Provide a message between 1 and 2000 characters.'), 400
    history = data.get('history', [])
    if not isinstance(history, list) or len(history) > 20:
        return jsonify(error='History must contain at most 20 messages.'), 400
    contents = []
    for item in history:
        if (not isinstance(item, dict) or item.get('role') not in ('user', 'model')
                or not isinstance(item.get('text'), str) or not item['text'].strip()
                or len(item['text']) > 8000):
            return jsonify(error='Invalid history message.'), 400
        contents.append({'role': item['role'], 'parts': [{'text': item['text']}]})
    if not api_key():
        return jsonify(error='Live AI is not configured. Use the frontend sample demo.'), 503
    model = os.getenv('GEMINI_MODEL', 'gemini-3.8-flash')
    if not re.fullmatch(r'[a-zA-Z0-9._-]+', model):
        return jsonify(error='Invalid server model configuration.'), 503
    contents.append({'role': 'user', 'parts': [{'text': message.strip()}]})
    payload = {'systemInstruction': {'parts': [{'text': SYSTEM_INSTRUCTION}]}, 'contents': contents,
               'generationConfig': {'temperature': 0.5, 'maxOutputTokens': 2048}}
    upstream = Request(f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
                       data=json.dumps(payload).encode('utf-8'), method='POST',
                       headers={'Content-Type': 'application/json', 'x-goog-api-key': api_key()})
    try:
        with urlopen(upstream, timeout=30) as response:
            result = json.load(response)
        candidates = result.get('candidates', [])
        parts = candidates[0].get('content', {}).get('parts', []) if candidates else []
        answer = '\n'.join(p['text'] for p in parts if isinstance(p.get('text'), str) and not p.get('thought')).strip()
        if not answer:
            return jsonify(error='The AI could not answer. Try another support question.'), 502
        return jsonify(response=answer, mode='live')
    except HTTPError as error:
        app.logger.warning('AI provider returned status %s', error.code)
        return jsonify(error='The AI service is unavailable. Try again later.'), 503
    except (URLError, TimeoutError, ValueError, KeyError, TypeError):
        app.logger.warning('AI response unavailable or invalid')
        return jsonify(error='The AI service is unavailable. Try again later.'), 503

@app.post('/api/clear')
def clear_chat():
    # The browser owns its history; there is no shared server history to clear.
    return jsonify(message='No server-side conversation is stored.')

@app.errorhandler(413)
def too_large(_error):
    return jsonify(error='Request is too large.'), 413

@app.get('/')
def index():
    if not BUILD.exists():
        return 'Frontend not built. Run npm install and npm run build in frontend.', 503
    return send_from_directory(BUILD, 'index.html')

@app.get('/<path:filename>')
def frontend(filename):
    return send_from_directory(BUILD, filename)

if __name__ == '__main__':
    app.run(host=os.getenv('HOST', '127.0.0.1'), port=int(os.getenv('PORT', '5000')), debug=False)

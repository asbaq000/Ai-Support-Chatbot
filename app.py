from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os

app = Flask(__name__)
CORS(app) 

try:
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
    model = genai.GenerativeModel('gemini-1.5-flash')
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    model = None

SYSTEM_INSTRUCTION = (
    "You are a friendly and helpful customer support chatbot. "
    "Your goal is to assist users with their questions about our products and services. "
    "Keep your answers concise and clear. "
    "If you don't know the answer, politely say so and suggest they contact a human agent."
)

chat_history = []

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    API endpoint to handle chat messages.
    Receives a user message, gets a response from the Gemini API,
    and returns it to the frontend.
    """
    if not model:
        return jsonify({
            "error": "The AI model is not configured. Please check the API key."
        }), 500

    try:
        data = request.json
        user_message = data.get('message')

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        chat_history.append({"role": "user", "parts": [user_message]})

        chat_session = model.start_chat(
            history=chat_history,
        )

        response = chat_session.send_message(
            f"{SYSTEM_INSTRUCTION}\n\nUser: {user_message}"
        )

        bot_response = response.text

        chat_history.append({"role": "model", "parts": [bot_response]})

        return jsonify({"response": bot_response})

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({
            "error": "An internal error occurred while processing your request."
        }), 500

@app.route('/api/clear', methods=['POST'])
def clear_chat():
    """
    API endpoint to clear the chat history.
    """
    global chat_history
    chat_history = []
    return jsonify({"message": "Chat history cleared successfully."})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

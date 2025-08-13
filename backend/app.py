from flask import Flask, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from textblob import TextBlob
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

client = OpenAI()

SYSTEM_PROMPT = (
    "You are a compassionate and understanding assistant that offers emotional support, advice, and Islamic guidance. "
    "You respond gently like a therapist, but your advice is always in line with the Quran, Sunnah, and traditional Islamic values. "
    "Offer duaa suggestions when needed. Never give un-Islamic advice or opinions on fiqh questions."
)

# Store chat history per user session
conversations = {}

@socketio.on('user_message')
def handle_message(data):
    sid = request.sid
    user_msg = data.get("message", "")
    sentiment = TextBlob(user_msg).sentiment.polarity
    print(f"User({sid}): {user_msg} | Sentiment: {sentiment:.2f}")

    if sid not in conversations:
        conversations[sid] = [{"role": "system", "content": SYSTEM_PROMPT}]

    conversations[sid].append({"role": "user", "content": user_msg})

    # Send user's own message back so frontend shows it instantly
    emit("chat_message", {"sender": "You", "text": user_msg})

    # Create placeholder AI message so frontend starts "typing"
    emit("chat_message", {"sender": "AI", "text": ""})

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=conversations[sid],
        stream=True
    )

    full_reply = ""
    for chunk in response:
        if chunk.choices and chunk.choices[0].delta.content:
            token = chunk.choices[0].delta.content
            full_reply += token
            # Send each chunk to update the latest AI message
            emit("update_last_ai", {"text": full_reply})

    conversations[sid].append({"role": "assistant", "content": full_reply})

if __name__ == "__main__":
    socketio.run(app, port=5000)

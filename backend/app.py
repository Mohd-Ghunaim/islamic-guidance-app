from flask import Flask
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

@socketio.on('user_message')
def handle_message(data):
    print("Received 'user_message' event")
    user_msg = data.get("message", "")
    sentiment = TextBlob(user_msg).sentiment.polarity
    print(f"User: {user_msg} | Sentiment: {sentiment:.2f}")

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_msg}
    ]

    response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=messages,
    stream=True
    )

    full_reply = ""
    for chunk in response:
        if chunk.choices and chunk.choices[0].delta.content:
            token = chunk.choices[0].delta.content
            full_reply += token
            emit("ai_response", {"chunk": token})

    print(f"AI: {full_reply}")
'''
@socketio.on('user_message')
def handle_message(data):
    user_msg = data.get("message", "")
    sentiment = TextBlob(user_msg).sentiment.polarity
    print(f"User: {user_msg} | Sentiment: {sentiment:.2f}")

    # MOCK RESPONSE (remove this when you have quota again)
    full_reply = "This is a mocked reply. Your message was received."

    # Send mocked response back in chunks
    for char in full_reply:
        emit("ai_response", {"chunk": char})

    print(f"AI: {full_reply}")'''

if __name__ == "__main__":
    socketio.run(app, port=5000)

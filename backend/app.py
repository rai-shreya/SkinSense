import os
import base64
import numpy as np
import cv2
import tensorflow as tf
from datetime import datetime
from flask import Flask, render_template
from flask_socketio import SocketIO, emit


app = Flask(__name__)
app.config['SECRET_KEY'] = 'skinsense_ultimate_2026'

socketio = SocketIO(app, cors_allowed_origins="*")


MODEL_PATH = os.path.join("model", "skin_model.h5")
CLASSES = ["Acne", "Dry", "Normal", "Oily"]


try:
    if os.path.exists(MODEL_PATH):
        
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        print(f"✅ AI Engine: Online. Loaded {MODEL_PATH}")
    else:
        model = None
        print("⚠️ AI Engine: Offline. Model not found. Running in SIMULATION MODE.")
except Exception as e:
    model = None
    print(f"❌ AI Engine Error: {e}")


SKIN_DATA = {
    "Dry": {
        "routine": [
            "Step 1: Oil-Based Cleanser (Preserve lipids)",
            "Step 2: Hydrating Milk Wash",
            "Step 3: Hyaluronic Acid Serum (Apply damp)",
            "Step 4: Ceramide Barrier Cream",
            "Step 5: Squalane Face Oil",
            "Step 6: SPF 50 (AM Only)"
        ],
        "diet": [
            "🥑 Avocados & Olive Oil (Healthy Fats)",
            "🐟 Salmon/Mackerel (Omega-3s)",
            "🥜 Walnuts & Flaxseeds",
            "💧 Minimum 2.8L Water Daily"
        ],
        "products": [
            "CeraVe Hydrating Cleanser",
            "The Ordinary Hyaluronic Acid",
            "La Roche-Posay Cicaplast Baume",
            "Hada Labo Premium Lotion"
        ],
        "ingredients": {"AM": "Hyaluronic Acid", "PM": "Ceramides & Peptides"}
    },
    "Oily": {
        "routine": [
            "Step 1: Salicylic Acid Cleanser",
            "Step 2: Niacinamide Toner",
            "Step 3: Oil-Free Gel Moisturizer",
            "Step 4: Mattifying SPF 30 (AM Only)",
            "Step 5: Clay Mask (2x/Week)",
            "Step 6: Retinol 0.2% (PM Only)"
        ],
        "diet": [
            "🍵 Green Tea (Anti-androgenic)",
            "🥕 Carrots (Vitamin A)",
            "🍚 Brown Rice (Low Glycemic)",
            "🚫 Avoid Dairy & Sugar Spikes"
        ],
        "products": [
            "Paula's Choice 2% BHA",
            "The Inkey List Niacinamide",
            "Neutrogena Hydro Boost",
            "Innisfree Volcanic Mask"
        ],
        "ingredients": {"AM": "Niacinamide + Zinc", "PM": "Salicylic Acid"}
    },
    "Normal": {
        "routine": [
            "Step 1: Gentle Foaming Wash",
            "Step 2: Vitamin C Serum",
            "Step 3: Peptide Moisturizer",
            "Step 4: Broad Spectrum SPF",
            "Step 5: Glycolic Acid (2x/Week)",
            "Step 6: Sleeping Mask"
        ],
        "diet": [
            "🫐 Berries (Antioxidants)",
            "🥦 Broccoli & Greens",
            "🍳 Eggs & Lean Protein",
            "🍊 Citrus Fruits (Vitamin C)"
        ],
        "products": [
            "Kiehl's Ultra Facial Cream",
            "Skinceuticals CE Ferulic",
            "COSRX Snail Mucin",
            "Supergoop! Unseen Sunscreen"
        ],
        "ingredients": {"AM": "Vitamin C", "PM": "Retinol or Peptides"}
    },
    "Acne": {
        "routine": [
            "Step 1: Benzoyl Peroxide Wash",
            "Step 2: Soothing Centella Toner",
            "Step 3: Azelaic Acid Suspension",
            "Step 4: Non-Comedogenic Moisturizer",
            "Step 5: Mineral SPF (Zinc Oxide)",
            "Step 6: Hydrocolloid Patches"
        ],
        "diet": [
            "🌿 Spearmint Tea (Hormonal Balance)",
            "🍂 Turmeric (Anti-inflammatory)",
            "🥣 Probiotic Yogurt (Gut Health)",
            "🚫 Limit Whey Protein & Skim Milk"
        ],
        "products": [
            "PanOxyl 4% Wash",
            "Differin Gel (Adapalene)",
            "Hero Cosmetics Mighty Patch",
            "EltaMD UV Clear SPF"
        ],
        "ingredients": {"AM": "Azelaic Acid", "PM": "Adapalene (Retinoid)"}
    }
}


@app.route('/')
def index():
    return render_template('index.html')


@socketio.on('frame')
def handle_inference(data_url):
    try:
    
        header, encoded = data_url.split(",", 1)
        nparr = np.frombuffer(base64.b64decode(encoded), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        
        if model:
            img_resized = cv2.resize(img, (224, 224))
            img_array = np.expand_dims(img_resized, axis=0) / 255.0
            
            preds = model.predict(img_array, verbose=0)
            idx = np.argmax(preds[0])
            result_key = CLASSES[idx]
            confidence = float(np.max(preds[0]))
        else:
            # Simulation Mode (if model is missing)
            result_key = "Normal"
            confidence = 0.98

        
        current_hour = datetime.now().hour
        time_key = "AM" if 5 <= current_hour < 17 else "PM"
        
     
        details = SKIN_DATA[result_key]
        response = {
            "skin": result_key,
            "confidence": round(confidence * 100, 2),
            "time_of_day": "Morning" if time_key == "AM" else "Evening",
            "active_ingredient": details["ingredients"][time_key],
            "routine": details["routine"],
            "diet": details["diet"],
            "products": details["products"]
        }

        
        emit('result', response)

    except Exception as e:
        print(f"⚠️ Inference Error: {e}")
        emit('error', {'msg': 'Processing failed. Check lighting.'})

if __name__ == '__main__':
    
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
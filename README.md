SkinSense is a high performance, full stack web application that combines computer vision with dermatological science. By analyzing the Epidermis (surface layer) through a live webcam feed, the system provides a holistic treatment strategy that includes multi-step skincare routines and Dermal Nutrition (internal health) to support the skin's structural integrity.



1.Key Features
i.Real-time AI Inference:  Uses a Convolutional Neural Network (CNN) to classify skin types (Acne, Dry, Normal, Oily) with real-time confidence scoring.

ii.Time-Aware Logic: Automatically adjusts ingredient recommendations based on the time of day (e.g., Vitamin C for AM protection, Retinoids for PM repair).

iii.Inside-Out Treatment: Includes a Dermal Nutrition module providing dietary protocols to support the skin from the dermis up.

iv.Interactive SPA (Single Page Application): Seamless navigation between the Analysis Dashboard, Dermal Wiki, Scan History, and App Settings.

v.Hydration Tracking: A built-in water intake manager to maintain dermal fluid balance.

vi.Glassmorphism UI: A premium, responsive design with native Light/Dark mode support.

vii.Professional Reporting: One-click PDF generation of the analysis results and prescribed routines.

🧬 Biological Approach: Beyond the Surface
SkinSense AI treats the skin as a dynamic organ rather than just a surface. Our logic differentiates between the two primary layers:

1.The Epidermis: The outermost barrier. Our AI identifies issues here (like sebum overproduction or dehydration) and suggests topicals to repair the acid mantle.

2.The Dermis: The foundation containing collagen, elastin, and blood vessels. Our app provides dietary and hydration guidance because topical products cannot easily reach this layer; it must be fed from within.

🛠️ Tech Stack
Frontend: HTML5, CSS3 (Glassmorphism), Vanilla JavaScript (ES6+).

Backend: Python 3.x, Flask, Flask-SocketIO (for low-latency frame processing).

AI/ML: TensorFlow/Keras (Inference Engine), OpenCV (Image processing).

Utilities: jsPDF for report generation, LocalStorage for data persistence.n Detection App using MobileNetV2

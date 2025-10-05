# Lumina

Lumina is an advanced AI-powered platform for real-time presentation and interview coaching. It leverages state-of-the-art AI models (Google Gemini, TensorFlow, MediaPipe, and more) to analyze your speech, body language, and delivery, providing actionable feedback and personalized coaching to help you excel in presentations and interviews.

---

## 🚀 Features

- **Real-Time AI Coaching:**
  - Get instant feedback on your presentation or interview performance using your webcam and microphone.
  - AI analyzes your voice clarity, pacing, confidence, body language, gestures, and eye contact.
  - Live coaching tips and performance scores are displayed as you speak.

- **Interview Practice Mode:**
  - Practice with dynamic, AI-generated interview questions tailored to your experience and goals.
  - Receive contextual feedback and improvement suggestions after each answer.
  - Track your progress and get a summary at the end of each session.

- **Presentation Analysis:**
  - Record or upload a video of your presentation for comprehensive AI analysis.
  - Get detailed breakdowns of strengths, areas for improvement, and actionable recommendations.
  - Visualize scores for voice clarity, body language, pacing, confidence, engagement, and more.

- **Personalized Feedback History:**
  - All feedback and session data are saved for review and progress tracking.
  - Export or clear your feedback history as needed.

- **Advanced AI Models:**
  - Uses Google Gemini for generative feedback and interview coaching.
  - Integrates TensorFlow and MediaPipe for real-time vision and audio analysis.
  - Supports cloud storage via Firebase and Cloudinary.

- **Modern, Responsive UI:**
  - Built with React, TailwindCSS, and GSAP for a beautiful, interactive experience.
  - Works on all modern browsers.

---

## 🛠️ Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/lumina.git
cd lumina
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the project root with the following (see `.env.example` if available):

```
VITE_GEMINI_API_KEY=your_google_gemini_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
# ...other Firebase/Cloudinary config as needed
```

### 4. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production

```bash
npm run build
```

---

## 📦 Dependencies & Requirements

- **Node.js** (v18+ recommended)
- **npm** (v9+ recommended)
- **Vite** (for fast development/build)
- **React** (UI framework)
- **TailwindCSS** (utility-first CSS)
- **GSAP** (animations)
- **Google Gemini API** (AI feedback & coaching)
- **TensorFlow.js** (audio/vision analysis)
- **MediaPipe** (face, hand, pose detection)
- **Firebase** (cloud storage & auth)
- **Cloudinary** (video storage)
- **Three.js, OGL, Matter.js** (advanced visualizations)

See `package.json` for the full list of dependencies.

---

## 📖 Usage

- **Presentation Practice:**
  - Go to the "Analyze" page to record or upload a video for AI analysis.
- **Real-Time Coaching:**
  - Use the "AI Interaction" page to start a live session with instant feedback.
- **Interview Mode:**
  - Switch to Interview mode in the AI Interaction page for dynamic interview practice.
- **Dashboard:**
  - Review your feedback history and progress.

---

## 🤖 Tech Stack

- **Frontend:** React, TailwindCSS, GSAP, Lucide Icons
- **AI/ML:** Google Gemini, TensorFlow.js, MediaPipe, face-api.js
- **Cloud:** Firebase, Cloudinary
- **Build Tools:** Vite, ESLint

---

## 📝 License

MIT License. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- Google Gemini, TensorFlow, MediaPipe, and the open-source community.
- Inspired by the need for accessible, AI-driven communication coaching.

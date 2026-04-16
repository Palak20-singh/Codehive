# 🐝 CodHive — Java Syntax Error Analyzer

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Language-Java%20Analysis-orange?style=for-the-badge&logo=java" />
  <img src="https://img.shields.io/badge/Built%20With-Node.js-339933?style=for-the-badge&logo=nodedotjs" />
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-blue?style=for-the-badge&logo=html5" />
  <img src="https://img.shields.io/badge/AI-LLM%20Powered-purple?style=for-the-badge&logo=anthropic" />
</p>

<p align="center">
  A web-based Java syntax error analyzer that helps students identify, understand, and learn from their coding mistakes — in real time.
</p>

---

## 📌 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Usage](#-usage)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🧠 About the Project

**CodHive** is an educational web application designed specifically for students learning Java programming. Instead of just flagging errors, CodHive explains *why* an error occurred and turns mistakes into learning opportunities through interactive quizzes and an AI-powered chatbot assistant.

Whether you're a complete beginner struggling with missing semicolons or a student trying to understand structural issues in your code, CodHive provides instant, clear, and beginner-friendly feedback.

---

## ✨ Features

### 🔍 Real-Time Java Syntax Error Detection
- Detects compilation-level errors instantly as you paste or write code
- Identifies common mistakes such as:
  - Missing semicolons (`;`)
  - Unmatched brackets or braces (`{}`, `()`, `[]`)
  - Incorrect class/method structure
  - Undeclared variables and type mismatches
- Provides clear, human-readable feedback for each detected error

### 📝 MCQ-Based Reinforcement Learning
- Automatically generates **Multiple Choice Questions (MCQs)** based on errors found in your code
- Questions are tailored to reinforce understanding of the specific mistake
- Helps students actively engage with their errors instead of passively reading feedback

### 🤖 AI-Powered Chatbot
- Integrated intelligent chatbot powered by an LLM backend
- Answers coding-related queries and explains Java concepts
- Assists users with understanding error messages and how to fix them
- Available throughout the session for on-demand help

### 🎯 Beginner-Friendly Interface
- Clean, minimal UI designed for students with no prior experience
- Syntax-highlighted code editor area
- Step-by-step error breakdown with suggested fixes

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla) |
| **Backend** | Node.js, Express.js |
| **AI / LLM Integration** | Anthropic Claude API (or compatible LLM) |
| **Error Analysis** | Custom Java syntax parsing logic |
| **MCQ Engine** | LLM-assisted question generation |

---

## 📁 Project Structure

```
CodHive/
├── public/
│   ├── index.html          # Main application page
│   ├── style.css           # Stylesheet
│   └── script.js           # Frontend logic
├── server/
│   ├── server.js           # Node.js/Express backend
│   ├── analyzer.js         # Java syntax error analysis engine
│   ├── mcqGenerator.js     # MCQ generation via LLM
│   └── chatbot.js          # AI chatbot handler
├── .env.example            # Environment variable template
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/)
- An API key for your LLM provider (e.g., [Anthropic](https://www.anthropic.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/CodHive.git
   cd CodHive
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example file and add your API key:
   ```bash
   cp .env.example .env
   ```

   Edit `.env`:
   ```env
   PORT=3000
   LLM_API_KEY=your_api_key_here
   LLM_MODEL=claude-sonnet-4-20250514
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open in your browser**
   ```
   http://localhost:3000
   ```

---

## 💡 Usage

1. **Paste or type your Java code** into the code editor on the main page.
2. Click **"Analyze"** to run the syntax error checker.
3. Review the **error report** — each error is explained in plain English with a suggested fix.
4. Take the **auto-generated MCQ quiz** based on your errors to reinforce learning.
5. Use the **AI Chatbot** (bottom-right corner) to ask follow-up questions or get deeper explanations.

---

## 📸 Screenshots

> *(Add screenshots of your application here)*

| Code Analyzer | Error Feedback | MCQ Quiz | AI Chatbot |
|---|---|---|---|
| `screenshot1.png` | `screenshot2.png` | `screenshot3.png` | `screenshot4.png` |

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve CodHive:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Commit your changes (`git commit -m 'Add: your feature description'`)
4. Push to the branch (`git push origin feature/your-feature-name`)
5. Open a Pull Request

Please make sure your code follows the existing style and is well-commented.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👥 Authors

- **Your Name** — [@your-github-handle](https://github.com/your-github-handle)

> Built with ❤️ to make Java learning less painful for students everywhere.

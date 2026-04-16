/* ──────────────────────────────────────────────
   CodeSensei — script.js
   Connects frontend to Java backend on port 8080
────────────────────────────────────────────── */

const API = "http://localhost:8080";

// ── CodeMirror Setup ─────────────────────────
const editor = CodeMirror.fromTextArea(document.getElementById("code-editor"), {
    mode: "text/x-java",
    theme: "dracula",
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    autoCloseBrackets: true,
    matchBrackets: true,
    lineWrapping: false,
    extraKeys: {
        "Ctrl-Enter": () => runCode(),
        "Tab": cm => cm.replaceSelection("    ")
    }
});

// Set a default sample so the editor isn't empty
editor.setValue(`public class UserCode {
    public static void main(String[] args) {
        // Try writing some Java code here!
        // Press Ctrl+Enter or click Run Code
        int[] arr = {5, 3, 8, 1, 9, 2};
        
        // Bubble sort
        for (int i = 0; i < arr.length - 1; i++) {
            for (int j = 0; j < arr.length - i - 1; j++) {
                if (arr[j] > arr[j+1]) {
                    int temp = arr[j];
                    arr[j] = arr[j+1];
                    arr[j+1] = temp;
                }
            }
        }
        
        System.out.print("Sorted: ");
        for (int x : arr) System.out.print(x + " ");
        System.out.println();
    }
}`);

// ── Sample Code Templates ────────────────────
const SAMPLES = [
`// Sample: NullPointerException (Runtime Error)
public class UserCode {
    public static void main(String[] args) {
        String s = null;
        System.out.println(s.length()); // NPE here!
    }
}`,
`// Sample: Missing Semicolon (Syntax Error)
public class UserCode {
    public static void main(String[] args) {
        int x = 10
        System.out.println(x);
    }
}`,
`// Sample: Fibonacci Recursion
public class UserCode {
    static int fib(int n) {
        if (n <= 1) return n;
        return fib(n-1) + fib(n-2);
    }
    public static void main(String[] args) {
        for (int i = 0; i < 10; i++)
            System.out.print(fib(i) + " ");
        System.out.println();
    }
}`,
`// Sample: ArrayIndexOutOfBounds
public class UserCode {
    public static void main(String[] args) {
        int[] arr = {1, 2, 3};
        for (int i = 0; i <= arr.length; i++) { // BUG: should be <
            System.out.println(arr[i]);
        }
    }
}`
];

let sampleIndex = 0;

// ── Utility ──────────────────────────────────
function showLoading(msg = "Compiling & Analyzing...") {
    document.getElementById("loading-msg").textContent = msg;
    document.getElementById("loading-overlay").classList.remove("hidden");
}
function hideLoading() {
    document.getElementById("loading-overlay").classList.add("hidden");
}

function setRunning(yes) {
    const btn = document.getElementById("btn-run");
    const label = document.getElementById("run-label");
    btn.disabled = yes;
    label.textContent = yes ? "⏳ Running..." : "▶ Run Code";
}

function setStatus(type, text) {
    const badge = document.getElementById("status-badge");
    badge.className = "status-badge " + type;
    badge.textContent = text;
}

function setOutput(text, type = "") {
    const box = document.getElementById("output-box");
    box.textContent = text;
    box.className = "output-box " + type;
}

// ── Tab Navigation ────────────────────────────
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    });
});

// ── Analysis Sub-tabs ─────────────────────────
document.querySelectorAll(".atab").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".atab").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".atab-content").forEach(t => t.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("atab-" + btn.dataset.atab).classList.add("active");
    });
});

// ── Clear / Sample buttons ────────────────────
document.getElementById("btn-clear").addEventListener("click", () => {
    editor.setValue("");
    setOutput("// Run your code to see output here...");
    document.getElementById("output-box").className = "output-box";
    document.getElementById("explanation-box").innerHTML = '<p class="placeholder-text">Run code with an error to get an AI explanation.</p>';
    document.getElementById("mcq-box").innerHTML = '<p class="placeholder-text">MCQs will appear here after an error is detected.</p>';
    document.getElementById("status-badge").className = "status-badge hidden";
});

document.getElementById("btn-sample").addEventListener("click", () => {
    editor.setValue(SAMPLES[sampleIndex % SAMPLES.length]);
    sampleIndex++;
});

// ── Run Code ──────────────────────────────────
document.getElementById("btn-run").addEventListener("click", runCode);

async function runCode() {
    const code = editor.getValue().trim();
    if (!code) {
        setOutput("⚠️ Please write some code first.", "error");
        return;
    }

    setRunning(true);
    showLoading("Compiling & running your code...");
    setOutput("Running...");
    document.getElementById("explanation-box").innerHTML = '<p class="placeholder-text">Analyzing...</p>';
    document.getElementById("mcq-box").innerHTML = '<p class="placeholder-text">Generating MCQs...</p>';

    try {
        const res = await fetch(API + "/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code })
        });

        if (!res.ok) throw new Error("Server returned " + res.status);
        const data = await res.json();

        if (data.status === "success") {
            setOutput(data.output || "(no output)", "success");
            setStatus("success", "✓ Success");
            renderExplanation(data.explanation || "Code ran successfully!", false);
            document.getElementById("mcq-box").innerHTML = '<p class="placeholder-text">No errors found — no MCQs needed. Great code! 🎉</p>';

        } else {
            const stageLabel = data.stage === "compilation" ? "Compilation Error" : "Runtime Error";
            setOutput("❌ " + stageLabel + "\n\n" + (data.output || ""), "error");
            setStatus("error", "✗ " + stageLabel);
            renderExplanation(data.explanation || "Could not get explanation.", true);
            renderMCQs(data.mcqs || "");
        }

    } catch (err) {
        setOutput("❌ Could not connect to backend.\n\nMake sure:\n1. Ollama is running: ollama run qwen2.5:3b\n2. Java server is running: cd backend/src && javac Server.java && java Server\n\nError: " + err.message, "error");
        setStatus("error", "✗ Connection Error");
        document.getElementById("explanation-box").innerHTML = '<p class="placeholder-text">Backend not reachable.</p>';
    }

    hideLoading();
    setRunning(false);
}

// ── Render Explanation ────────────────────────
function renderExplanation(text, isError) {
    const box = document.getElementById("explanation-box");
    const color = isError ? "var(--error)" : "var(--success)";
    const icon = isError ? "🔍" : "✅";

    // Format code blocks
    const formatted = text
        .replace(/```java([\s\S]*?)```/g, '<pre class="inline-code">$1</pre>')
        .replace(/```([\s\S]*?)```/g, '<pre class="inline-code">$1</pre>');

    box.innerHTML = `<div style="border-left:3px solid ${color}; padding-left:12px; margin-bottom:8px;">
        <div style="font-family:var(--font-ui);font-size:0.82rem;color:${color};font-weight:700;margin-bottom:6px;">${icon} AI Analysis</div>
        <div style="font-family:var(--font-mono);font-size:0.8rem;line-height:1.85;white-space:pre-wrap;">${escHtml(text)}</div>
    </div>`;

    // Switch to explanation tab
    document.querySelectorAll(".atab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".atab-content").forEach(t => t.classList.remove("active"));
    document.querySelector('[data-atab="explanation"]').classList.add("active");
    document.getElementById("atab-explanation").classList.add("active");
}

// ── Render MCQs ───────────────────────────────
function renderMCQs(rawText) {
    const box = document.getElementById("mcq-box");
    if (!rawText || rawText.trim().length < 10) {
        box.innerHTML = '<p class="placeholder-text">No MCQs generated for this error.</p>';
        return;
    }

    // Parse MCQs from LLM text
    const cards = parseMCQs(rawText);
    if (cards.length === 0) {
        box.innerHTML = '<div style="font-family:var(--font-mono);font-size:0.8rem;white-space:pre-wrap;line-height:1.8;">' + escHtml(rawText) + '</div>';
        return;
    }

    box.innerHTML = cards.map((q, qi) => buildMCQCard(q, qi)).join("");

    // Attach click handlers
    box.querySelectorAll(".mcq-opt").forEach(btn => {
        btn.addEventListener("click", function () {
            const card = this.closest(".mcq-card");
            if (card.dataset.answered === "1") return;
            card.dataset.answered = "1";

            const opts = card.querySelectorAll(".mcq-opt");
            const correctLetter = card.dataset.answer;

            opts.forEach(o => {
                if (o.dataset.letter === correctLetter) o.classList.add("correct");
                else if (o === this) o.classList.add("wrong");
            });

            const expEl = card.querySelector(".mcq-explanation");
            if (expEl) expEl.style.display = "block";
        });
    });
}

function parseMCQs(text) {
    const blocks = text.split(/Q\d+[:.]/i).filter(b => b.trim().length > 20);
    return blocks.map(block => {
        const lines = block.trim().split("\n").map(l => l.trim()).filter(Boolean);
        const question = lines[0] || "Question";
        const opts = [];
        let answer = "";
        let explanation = "";

        lines.forEach(line => {
            const optMatch = line.match(/^([A-D])[).]\s+(.+)/i);
            if (optMatch) opts.push({ letter: optMatch[1].toUpperCase(), text: optMatch[2] });

            const ansMatch = line.match(/^Answer\s*[:\-]\s*([A-D])/i);
            if (ansMatch) answer = ansMatch[1].toUpperCase();

            const expMatch = line.match(/^Explanation\s*[:\-]\s*(.+)/i);
            if (expMatch) explanation = expMatch[1];
        });

        return { question, opts, answer, explanation };
    }).filter(q => q.opts.length >= 2);
}

function buildMCQCard(q, qi) {
    const optsHtml = q.opts.map(o =>
        `<button class="mcq-opt" data-letter="${o.letter}">${o.letter}) ${escHtml(o.text)}</button>`
    ).join("");

    return `<div class="mcq-card" data-answer="${q.answer}" data-answered="0">
        <div class="mcq-question">Q${qi + 1}: ${escHtml(q.question)}</div>
        <div class="mcq-options">${optsHtml}</div>
        ${q.explanation ? `<div class="mcq-explanation">💡 ${escHtml(q.explanation)}</div>` : ""}
    </div>`;
}

// ── Chat ──────────────────────────────────────
document.getElementById("btn-send").addEventListener("click", sendChat);
document.getElementById("chat-input").addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
});

document.querySelectorAll(".qp-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.getElementById("chat-input").value = btn.textContent;
        sendChat();
    });
});

document.getElementById("btn-clear-chat").addEventListener("click", () => {
    const msgs = document.getElementById("chat-messages");
    msgs.innerHTML = `<div class="chat-msg bot">
        <div class="msg-avatar">AI</div>
        <div class="msg-bubble">Chat cleared! Ask me anything about Java & DSA. 🚀</div>
    </div>`;
});

async function sendChat() {
    const input = document.getElementById("chat-input");
    const msg = input.value.trim();
    if (!msg) return;

    input.value = "";
    appendMsg(msg, "user");

    // Typing indicator
    const typingId = "typing-" + Date.now();
    const typingDiv = document.createElement("div");
    typingDiv.className = "chat-msg bot";
    typingDiv.id = typingId;
    typingDiv.innerHTML = `<div class="msg-avatar">AI</div>
        <div class="msg-bubble typing"><span></span><span></span><span></span></div>`;
    document.getElementById("chat-messages").appendChild(typingDiv);
    scrollChat();

    try {
        const res = await fetch(API + "/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: msg })
        });

        if (!res.ok) throw new Error("Server returned " + res.status);
        const data = await res.json();
        document.getElementById(typingId)?.remove();
        appendMsg(data.reply || "Sorry, I could not respond.", "bot");

    } catch (err) {
        document.getElementById(typingId)?.remove();
        appendMsg("⚠️ Could not reach the backend. Make sure the Java server is running on port 8080.", "bot");
    }
}

function appendMsg(text, role) {
    const msgs = document.getElementById("chat-messages");
    const div = document.createElement("div");
    div.className = "chat-msg " + role;
    div.innerHTML = `
        <div class="msg-avatar">${role === "bot" ? "AI" : "You"}</div>
        <div class="msg-bubble">${escHtml(text)}</div>
    `;
    msgs.appendChild(div);
    scrollChat();
}

function scrollChat() {
    const msgs = document.getElementById("chat-messages");
    msgs.scrollTop = msgs.scrollHeight;
}

// ── Helpers ───────────────────────────────────
function escHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// Refresh editor on layout change
window.addEventListener("resize", () => editor.refresh());

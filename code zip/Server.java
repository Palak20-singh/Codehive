import com.sun.net.httpserver.*;
import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.util.*;

public class Server {

    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        // Handle preflight OPTIONS for CORS
        server.createContext("/chat", exchange -> {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                sendCors(exchange);
                return;
            }
            String body = read(exchange);
            String msg = extractJson(body, "message");
            String reply = callLLM("You are a DSA and Java coding tutor. Answer concisely and helpfully.\n\nUser: " + msg);
            send(exchange, "{\"reply\":" + jsonStr(reply) + "}");
        });

        server.createContext("/run", exchange -> {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                sendCors(exchange);
                return;
            }
            String body = read(exchange);
            String code = extractJson(body, "code");
            writeToFile(code);

            // Step 1: Compile
            CompileResult cr = compile();
            if (cr.hasError) {
                // Build LLM prompt for error analysis
                String prompt = buildErrorPrompt(code, cr.output, "COMPILATION");
                String llmResponse = callLLM(prompt);
                String mcqPrompt = buildMCQPrompt(code, cr.output, "COMPILATION");
                String mcqResponse = callLLM(mcqPrompt);
                String json = "{"
                        + "\"status\":\"error\","
                        + "\"stage\":\"compilation\","
                        + "\"output\":" + jsonStr(cr.output) + ","
                        + "\"explanation\":" + jsonStr(llmResponse) + ","
                        + "\"mcqs\":" + jsonStr(mcqResponse)
                        + "}";
                send(exchange, json);
                return;
            }

            // Step 2: Run
            RunResult rr = run();
            if (rr.hasError) {
                String prompt = buildErrorPrompt(code, rr.output, "RUNTIME");
                String llmResponse = callLLM(prompt);
                String mcqPrompt = buildMCQPrompt(code, rr.output, "RUNTIME");
                String mcqResponse = callLLM(mcqPrompt);
                String json = "{"
                        + "\"status\":\"error\","
                        + "\"stage\":\"runtime\","
                        + "\"output\":" + jsonStr(rr.output) + ","
                        + "\"explanation\":" + jsonStr(llmResponse) + ","
                        + "\"mcqs\":" + jsonStr(mcqResponse)
                        + "}";
                send(exchange, json);
                return;
            }

            // Step 3: Success — still analyze for concept explanation
            String conceptPrompt = "The following Java code ran successfully. Briefly explain what concept it demonstrates (OOP, Arrays, Recursion, DP, Graphs, etc.) and give a step-by-step execution flow:\n\n" + code;
            String conceptExplanation = callLLM(conceptPrompt);
            String json = "{"
                    + "\"status\":\"success\","
                    + "\"output\":" + jsonStr(rr.output) + ","
                    + "\"explanation\":" + jsonStr(conceptExplanation)
                    + "}";
            send(exchange, json);
        });

        server.start();
        System.out.println("✅ Server running on http://localhost:8080");
    }

    // ──────────────────────────────────────────────
    // FILE I/O
    // ──────────────────────────────────────────────

    static void writeToFile(String code) throws Exception {
        // Resolve path relative to Server.java location (backend/src) → backend/temp
        File tempDir = new File("../temp");
        if (!tempDir.exists()) tempDir.mkdirs();
        FileWriter fw = new FileWriter("../temp/UserCode.java");
        fw.write(code);
        fw.close();
    }

    // ──────────────────────────────────────────────
    // COMPILE
    // ──────────────────────────────────────────────

    static CompileResult compile() {
        try {
            ProcessBuilder pb = new ProcessBuilder("javac", "../temp/UserCode.java");
            pb.directory(new File("."));   // backend/src
            pb.redirectErrorStream(true);
            Process p = pb.start();
            String output = readStream(p.getInputStream());
            int exit = p.waitFor();
            return new CompileResult(exit != 0, output);
        } catch (Exception e) {
            return new CompileResult(true, "Compile process failed: " + e.getMessage());
        }
    }

    static class CompileResult {
        boolean hasError;
        String output;
        CompileResult(boolean h, String o) { hasError = h; output = o; }
    }

    // ──────────────────────────────────────────────
    // RUN
    // ──────────────────────────────────────────────

    static RunResult run() {
        try {
            ProcessBuilder pb = new ProcessBuilder("java", "-cp", "../temp", "UserCode");
            pb.directory(new File("."));
            pb.redirectErrorStream(true);
            Process p = pb.start();
            // Timeout: 10 seconds
            boolean finished = false;
            for (int i = 0; i < 100; i++) {
                Thread.sleep(100);
                try { p.exitValue(); finished = true; break; } catch (IllegalThreadStateException ignored) {}
            }
            if (!finished) {
                p.destroyForcibly();
                return new RunResult(true, "Runtime Error: Program exceeded time limit (10s).");
            }
            String output = readStream(p.getInputStream());
            int exit = p.exitValue();
            return new RunResult(exit != 0 || output.toLowerCase().contains("exception"), output);
        } catch (Exception e) {
            return new RunResult(true, "Run process failed: " + e.getMessage());
        }
    }

    static class RunResult {
        boolean hasError;
        String output;
        RunResult(boolean h, String o) { hasError = h; output = o; }
    }

    // ──────────────────────────────────────────────
    // LLM
    // ──────────────────────────────────────────────

    static String buildErrorPrompt(String code, String error, String stage) {
        return "You are a Java DSA tutor. A student's code has a " + stage + " error.\n\n"
                + "=== CODE ===\n" + code + "\n\n"
                + "=== ERROR ===\n" + error + "\n\n"
                + "Please:\n"
                + "1. Identify the concept (OOP/Recursion/Arrays/DP/Graphs/Variables)\n"
                + "2. Explain the error clearly for a beginner\n"
                + "3. Show the corrected code\n"
                + "4. Give a step-by-step execution flow\n"
                + "Be concise and educational.";
    }

    static String buildMCQPrompt(String code, String error, String stage) {
        int count = stage.equals("COMPILATION") ? 1 : 2;
        return "Based on this Java " + stage + " error:\n" + error + "\n\n"
                + "Generate " + count + " MCQ(s) in this EXACT format:\n"
                + "Q1: [question]\nA) ...\nB) ...\nC) ...\nD) ...\nAnswer: [letter]\nExplanation: [why]\n\n"
                + "Focus on testing understanding of the concept behind the error.";
    }

    static String callLLM(String prompt) {
        try {
            URL url = new URL("http://localhost:11434/api/generate");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setConnectTimeout(60000);
            conn.setReadTimeout(120000);
            conn.setRequestProperty("Content-Type", "application/json");

            // Escape the prompt for JSON
            String escapedPrompt = prompt
                    .replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");

            String body = "{\"model\":\"qwen2.5:3b\",\"prompt\":\"" + escapedPrompt + "\",\"stream\":false}";
            OutputStream os = conn.getOutputStream();
            os.write(body.getBytes("UTF-8"));
            os.flush();

            BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"));
            StringBuilder res = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) res.append(line);

            // Extract "response" field from Ollama JSON
            String raw = res.toString();
            String key = "\"response\":\"";
            int s = raw.indexOf(key);
            if (s == -1) return "LLM returned no response.";
            s += key.length();
            // Find end quote not preceded by backslash
            int e = s;
            while (e < raw.length()) {
                if (raw.charAt(e) == '"' && raw.charAt(e - 1) != '\\') break;
                e++;
            }
            return raw.substring(s, e)
                    .replace("\\n", "\n")
                    .replace("\\t", "\t")
                    .replace("\\\"", "\"")
                    .replace("\\\\", "\\");

        } catch (Exception e) {
            return "⚠️ LLM Error: " + e.getMessage() + ". Make sure Ollama is running with: ollama run qwen2.5:3b";
        }
    }

    // ──────────────────────────────────────────────
    // HTTP HELPERS
    // ──────────────────────────────────────────────

    static String read(HttpExchange ex) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(ex.getRequestBody(), "UTF-8"));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line);
        return sb.toString();
    }

    static void send(HttpExchange ex, String res) throws Exception {
        byte[] bytes = res.getBytes("UTF-8");
        ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        ex.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, OPTIONS");
        ex.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        ex.getResponseHeaders().add("Content-Type", "application/json; charset=UTF-8");
        ex.sendResponseHeaders(200, bytes.length);
        OutputStream os = ex.getResponseBody();
        os.write(bytes);
        os.close();
    }

    static void sendCors(HttpExchange ex) throws Exception {
        ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        ex.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, OPTIONS");
        ex.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        ex.sendResponseHeaders(204, -1);
    }

    static String readStream(InputStream is) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(is, "UTF-8"));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line).append("\n");
        return sb.toString().trim();
    }

    static String extractJson(String json, String key) {
        try {
            String k = "\"" + key + "\":\"";
            int s = json.indexOf(k) + k.length();
            int e = s;
            while (e < json.length()) {
                if (json.charAt(e) == '"' && json.charAt(e - 1) != '\\') break;
                e++;
            }
            return json.substring(s, e)
                    .replace("\\n", "\n")
                    .replace("\\t", "\t")
                    .replace("\\\"", "\"");
        } catch (Exception e) {
            return "";
        }
    }

    static String jsonStr(String s) {
        return "\"" + s
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t")
                + "\"";
    }
}

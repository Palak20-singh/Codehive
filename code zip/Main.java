import java.io.*;

/**
 * Main.java — Utility compile runner (kept for standalone testing).
 * The full compile+run logic is now inside Server.java directly.
 * Run this independently to test compilation of UserCode.java.
 *
 * Usage (from backend/src):  java Main
 */
public class Main {

    public static void main(String[] args) throws Exception {
        System.out.println("=== Java Compiler Runner ===");

        File tempFile = new File("../temp/UserCode.java");
        if (!tempFile.exists()) {
            System.out.println("ERROR: ../temp/UserCode.java not found.");
            System.out.println("Write some Java code into backend/temp/UserCode.java first.");
            return;
        }

        // --- Compile ---
        System.out.println("Compiling ../temp/UserCode.java ...");
        ProcessBuilder compilePB = new ProcessBuilder("javac", "../temp/UserCode.java");
        compilePB.directory(new File("."));
        compilePB.redirectErrorStream(true);
        Process compileProcess = compilePB.start();

        BufferedReader compileReader = new BufferedReader(
                new InputStreamReader(compileProcess.getInputStream()));
        StringBuilder compileOutput = new StringBuilder();
        String line;
        boolean hasCompileError = false;

        while ((line = compileReader.readLine()) != null) {
            compileOutput.append(line).append("\n");
            if (line.contains("error:")) {
                hasCompileError = true;
                System.out.println("COMPILATION ERROR: " + line);
            } else if (line.contains("warning:")) {
                System.out.println("WARNING: " + line);
            }
        }

        int compileExit = compileProcess.waitFor();
        if (compileExit != 0 || hasCompileError) {
            System.out.println("\nCompilation FAILED.");
            System.out.println(compileOutput);
            return;
        }

        System.out.println("Compilation SUCCESS.\n");

        // --- Run ---
        System.out.println("Running UserCode ...");
        ProcessBuilder runPB = new ProcessBuilder("java", "-cp", "../temp", "UserCode");
        runPB.directory(new File("."));
        runPB.redirectErrorStream(true);
        Process runProcess = runPB.start();

        BufferedReader runReader = new BufferedReader(
                new InputStreamReader(runProcess.getInputStream()));
        StringBuilder runOutput = new StringBuilder();
        while ((line = runReader.readLine()) != null) {
            runOutput.append(line).append("\n");
        }

        int runExit = runProcess.waitFor();
        System.out.println("=== OUTPUT ===");
        System.out.println(runOutput);
        if (runExit != 0) {
            System.out.println("Program exited with code: " + runExit);
        }
    }
}

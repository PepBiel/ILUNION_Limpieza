import express from "express";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontRoot = path.resolve(__dirname, "..");
const backendRoot = path.join(frontRoot, "backend");
const dataPath = path.join(frontRoot, "public", "data", "dashboard-data.json");
const generatedDir = path.join(frontRoot, "generated");
const distDir = path.join(frontRoot, "dist");
const pythonScript = path.join(backendRoot, "generate_dashboard.py");
const bundledPython = path.join(backendRoot, ".venv", "Scripts", "python.exe");
const pythonCandidates = [
  process.env.PYTHON_EXECUTABLE,
  bundledPython,
  "C:\\Users\\Pep Biel\\AppData\\Local\\Programs\\Python\\Python312\\python.exe",
  "C:\\Users\\Pep Biel\\AppData\\Local\\Programs\\Python\\Python313\\python.exe",
].filter(Boolean);
const pythonExecutable =
  pythonCandidates.find((candidate) => fs.existsSync(candidate)) || pythonCandidates[0];
const port = Number(process.env.PORT || 8787);

function runGenerator({ hospital = "clinico", year = 2026 }) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      pythonExecutable,
      [
        pythonScript,
        "--hospital",
        hospital,
        "--year",
        String(year),
        "--dashboard-json",
        dataPath,
        "--output-dir",
        generatedDir,
      ],
      {
        cwd: frontRoot,
      },
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || stdout || `Generator exited with code ${code}`));
        return;
      }

      const lines = stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const lastLine = lines.at(-1);

      try {
        resolve(lastLine ? JSON.parse(lastLine) : {});
      } catch (error) {
        reject(new Error(`Generator output was not valid JSON.\n${stdout}\n${stderr}`));
      }
    });
  });
}

function loadDashboardData() {
  if (!fs.existsSync(dataPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
}

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/api/status", (_request, response) => {
  response.json({
    ok: true,
    pythonExecutable,
    generatorScript: pythonScript,
    hasDashboardData: fs.existsSync(dataPath),
  });
});

app.get("/api/data", (_request, response) => {
  const data = loadDashboardData();
  if (!data) {
    response.status(404).json({
      ok: false,
      error: "dashboard_data_not_found",
    });
    return;
  }

  response.json(data);
});

app.post("/api/generate", async (request, response) => {
  try {
    const result = await runGenerator({
      hospital: String(request.body?.hospital || "clinico").toLowerCase(),
      year: Number(request.body?.year || 2026),
    });
    const data = loadDashboardData();

    response.json({
      ok: true,
      result,
      data,
      excelUrl: `/api/exports/${encodeURIComponent(result.excelFileName)}`,
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      error: "generation_failed",
      message: error.message,
    });
  }
});

app.get("/api/exports/:fileName", (request, response) => {
  const fileName = path.basename(request.params.fileName);
  const filePath = path.join(generatedDir, fileName);

  if (!fs.existsSync(filePath)) {
    response.status(404).json({
      ok: false,
      error: "file_not_found",
    });
    return;
  }

  response.download(filePath);
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api\/).*/, (request, response) => {
    response.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`ILUNION dashboard server listening on http://127.0.0.1:${port}`);
});

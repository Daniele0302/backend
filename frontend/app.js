const form = document.getElementById("convert-form");
const fileInput = document.getElementById("file-input");
const fileName = document.getElementById("file-name");
const fileSize = document.getElementById("file-size");
const convertBtn = document.getElementById("convert-btn");
const resetBtn = document.getElementById("reset-btn");
const statusEl = document.getElementById("status");
const downloadWrap = document.getElementById("download");
const downloadLink = document.getElementById("download-link");
const healthStatus = document.getElementById("health-status");
const healthBtn = document.getElementById("health-btn");
const baseUrlLabel = document.getElementById("base-url");

const MAX_SIZE_BYTES = 200 * 1024 * 1024;
const ALLOWED_EXT = [".html", ".htm"];
const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8000";

let latestObjectUrl = null;

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let idx = 0;
  let value = bytes;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
};

const setStatus = (message, type = "") => {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
};

const setHealth = (message, type = "") => {
  healthStatus.textContent = message;
  healthStatus.className = `health__value ${type}`.trim();
};

const checkHealth = async () => {
  setHealth("Verifica in corso...");
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Errore ${response.status}`);
    }
    const data = await response.json();
    if (data && data.status === "ok") {
      setHealth("Online", "ok");
    } else {
      setHealth("Risposta inattesa", "error");
    }
  } catch (error) {
    setHealth("Offline", "error");
  }
};

const clearDownload = () => {
  if (latestObjectUrl) {
    URL.revokeObjectURL(latestObjectUrl);
    latestObjectUrl = null;
  }
  downloadWrap.hidden = true;
  downloadLink.removeAttribute("href");
};

const validateFile = (file) => {
  if (!file) return "";
  const lowerName = file.name.toLowerCase();
  if (!ALLOWED_EXT.some((ext) => lowerName.endsWith(ext))) {
    return "Sono supportati solo file .html o .htm.";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "Il file supera il limite di 200 MB.";
  }
  return "";
};

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  clearDownload();

  if (!file) {
    fileName.textContent = "Nessun file";
    fileSize.textContent = "-";
    convertBtn.disabled = true;
    setStatus("");
    return;
  }

  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);

  const validationError = validateFile(file);
  if (validationError) {
    convertBtn.disabled = true;
    setStatus(validationError, "error");
  } else {
    convertBtn.disabled = false;
    setStatus("");
  }
});

resetBtn.addEventListener("click", () => {
  form.reset();
  fileName.textContent = "Nessun file";
  fileSize.textContent = "-";
  convertBtn.disabled = true;
  setStatus("");
  clearDownload();
});

healthBtn.addEventListener("click", () => {
  checkHealth();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = fileInput.files[0];

  clearDownload();

  const validationError = validateFile(file);
  if (validationError) {
    setStatus(validationError, "error");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  convertBtn.disabled = true;
  setStatus("Conversione in corso...", "");

  try {
    const response = await fetch(`${BASE_URL}/convert`, {
      method: "POST",
      headers: {
        Accept: "application/pdf",
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Errore ${response.status}`;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        if (data && data.detail) {
          errorMessage = data.detail;
        }
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    latestObjectUrl = URL.createObjectURL(blob);
    downloadLink.href = latestObjectUrl;
    downloadWrap.hidden = false;
    setStatus("Conversione completata.", "success");

    downloadLink.click();
  } catch (error) {
    setStatus(error.message || "Errore durante la conversione.", "error");
  } finally {
    convertBtn.disabled = false;
  }
});

baseUrlLabel.textContent = BASE_URL;
checkHealth();

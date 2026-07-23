import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { getDatabase, fermerDatabase } from "./db/connection";
import { verifierSeed } from "./db/seed";
import { enregistrerHandlersClients } from "./ipc/clients";
import { enregistrerHandlersVirements } from "./ipc/virements";
import { enregistrerHandlersPretRendre } from "./ipc/pretRendre";
import { enregistrerHandlersPdf } from "./ipc/pdf";
import { enregistrerHandlersEmail } from "./ipc/email";
import { chargerDotenv } from "./services/emailService";

const isDev = process.env.NODE_ENV === "development";

function getIconPath(): string | undefined {
  const candidats = [
    path.join(__dirname, "..", "resources", "icon.ico"),
    path.join(__dirname, "..", "..", "resources", "icon.ico"),
    path.join(process.cwd(), "resources", "icon.ico"),
  ];

  for (const chemin of candidats) {
    if (fs.existsSync(chemin)) {
      console.log("[icon] Utilisation de l'icone :", chemin);
      return chemin;
    }
  }

  console.log("[icon] Aucune icone personnalisee trouvee, utilisation de l'icone par defaut");
  return undefined;
}

function createWindow(): void {
  const iconPath = getIconPath();

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#121212",
    autoHideMenuBar: true,
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  getDatabase();
  const stats = verifierSeed();
  console.log("[db] Stats base :", stats);

  chargerDotenv();

  ipcMain.handle("ping", () => "pong");
  ipcMain.handle("db:ping", () => "ok");
  ipcMain.handle("db:stats", () => stats);

  enregistrerHandlersClients();
  enregistrerHandlersVirements();
  enregistrerHandlersPretRendre();
  enregistrerHandlersPdf();
  enregistrerHandlersEmail();

  createWindow();
});

app.on("window-all-closed", () => {
  fermerDatabase();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

import React, { useEffect, useRef, useState } from "react"; 
import { 
  readTextFile, 
  writeTextFile,
  exists,
  mkdir,
} from "@tauri-apps/plugin-fs"; 
import { getCurrentWindow } from '@tauri-apps/api/window';
import { appDataDir } from "@tauri-apps/api/path";

export default function App() { 
  const [elapsed, setElapsed] = useState(0); 
  const [running, setRunning] = useState(false); 
  const timerRef = useRef(null); 
  const startTimestampRef = useRef(null); 
  const elapsedRef = useRef(0);
  const [appDataPath, setAppDataPath] = useState(null);
 
  // Keep ref in sync with state
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  // Get and ensure AppData directory exists
  useEffect(() => {
    const initAppData = async () => {
      try {
        const dir = await appDataDir();
        setAppDataPath(dir);
        console.log("AppData directory:", dir);
        
        // Check if directory exists, create if not
        const dirExists = await exists(dir);
        if (!dirExists) {
          await mkdir(dir, { recursive: true });
          console.log("Created AppData directory");
        }
      } catch (err) {
        console.error("Error initializing AppData:", err);
      }
    };
    
    initAppData();
  }, []);

  // Load saved time on startup
  useEffect(() => {
    if (!appDataPath) return;
    
    const filePath = `${appDataPath}/stopwatch.json`;
    console.log("Loading from:", filePath);
    
    readTextFile(filePath)
      .then(data => {
        const parsed = JSON.parse(data);
        setElapsed(parsed.elapsedMs || 0);
        console.log("Loaded saved time:", parsed.elapsedMs);
      })
      .catch(err => {
        console.log("No saved file found, starting fresh");
      });
  }, [appDataPath]);
 
  // Save time on app close
  useEffect(() => {
    if (!appDataPath) return;
    
    const appWindow = getCurrentWindow();
    let unlisten;

    appWindow.onCloseRequested(async (event) => {
      console.log("Close requested, saving...");
      event.preventDefault();

      try {
        const filePath = `${appDataPath}/stopwatch.json`;
        await writeTextFile(
          filePath,
          JSON.stringify({ elapsedMs: elapsedRef.current })
        );
        console.log("Saved successfully:", elapsedRef.current);
      } catch (err) {
        console.error("Failed to save:", err);
      }

      if (unlisten) unlisten();
      await appWindow.close();
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, [appDataPath]);

  // Auto-save every 5 seconds
  useEffect(() => {
    if (!appDataPath) return;
    
    const autoSave = setInterval(async () => {
      try {
        const filePath = `${appDataPath}/stopwatch.json`;
        await writeTextFile(
          filePath,
          JSON.stringify({ elapsedMs: elapsedRef.current })
        );
        console.log("Auto-saved:", elapsedRef.current);
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 5000);
    
    return () => clearInterval(autoSave);
  }, [appDataPath]);
 
  // Stopwatch timer logic
  useEffect(() => { 
    if (running) { 
      startTimestampRef.current = Date.now() - elapsed; 
 
      timerRef.current = setInterval(() => { 
        setElapsed(Date.now() - startTimestampRef.current); 
      }, 100); 
 
      return () => clearInterval(timerRef.current); 
    } else { 
      clearInterval(timerRef.current); 
    } 
  }, [running, elapsed]); 
 
  // Convert ms → h/m/s
  const totalSeconds = Math.floor(elapsed / 1000); 
  const hours = Math.floor(totalSeconds / 3600); 
  const minutes = Math.floor((totalSeconds % 3600) / 60); 
  const seconds = totalSeconds % 60; 

  // Reset button handler
  const handleReset = () => {
    setRunning(false);
    setElapsed(0);
  };
 
  return ( 
    <div 
      style={{ 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center", 
        fontFamily: "sans-serif", 
        fontSize: "2rem", 
        backgroundColor: "#1a1a1a",
        color: "#ffffff",
      }} 
    > 
      {/* HOURS */} 
      <div style={{ textAlign: "center", marginBottom: "1rem" }}> 
        <div style={{ fontSize: "1.2rem", opacity: 0.7 }}>hours</div> 
        <div style={{ fontSize: "3rem", fontWeight: "bold" }}> 
          {String(hours).padStart(2, "0")} 
        </div> 
      </div> 
 
      {/* MINUTES */} 
      <div style={{ textAlign: "center", marginBottom: "1rem" }}> 
        <div style={{ fontSize: "1.2rem", opacity: 0.7 }}>min</div> 
        <div style={{ fontSize: "3rem", fontWeight: "bold" }}> 
          {String(minutes).padStart(2, "0")} 
        </div> 
      </div> 
 
      {/* SECONDS */} 
      <div style={{ textAlign: "center", marginBottom: "2rem" }}> 
        <div style={{ fontSize: "1.2rem", opacity: 0.7 }}>second</div> 
        <div style={{ fontSize: "3rem", fontWeight: "bold" }}> 
          {String(seconds).padStart(2, "0")} 
        </div> 
      </div> 
 
      {/* Buttons */} 
      <div style={{ display: "flex", gap: "1rem" }}>
        <button 
          onClick={() => setRunning(!running)} 
          style={{ 
            padding: "10px 30px", 
            fontSize: "1.2rem", 
            cursor: "pointer", 
            borderRadius: "8px",
            backgroundColor: running ? "#ef4444" : "#22c55e",
            color: "white",
            border: "none",
            fontWeight: "bold",
          }} 
        > 
          {running ? "Pause" : "Start"} 
        </button>

        <button 
          onClick={handleReset} 
          style={{ 
            padding: "10px 30px", 
            fontSize: "1.2rem", 
            cursor: "pointer", 
            borderRadius: "8px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            fontWeight: "bold",
          }} 
        > 
          Reset
        </button>
      </div>
    </div> 
  ); 
}
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_fs;   // ✅ REQUIRED IMPORT

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())   // now it works
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

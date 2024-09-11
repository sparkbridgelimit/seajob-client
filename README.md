# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

RUST_BACKTRACE=full RUST_LOG=info pnpm tauri dev

$env:RUST_BACKTRACE="full"
$env:RUST_LOG="info"
pnpm tauri dev

$env:CARGO_PROFILE_DEV_BUILD_OVERRIDE_DEBUG="true"
$env:RUST_BACKTRACE="full"
$env:RUST_LOG="info"
pnpm tauri dev
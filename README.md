# 拍摄特效包 PE 开放能力 · 交互 Demo

A static, dependency-free interactive demo showcasing the "拍摄特效包 PE 开放能力" capability proposal.

## Versions

- **V0.5（极速版）** — Dual-route input workspace (Route A: theme-driven AI matching · Route B: explicit STK ID). Supports fuzzy name search across 贴纸 / 滤镜 / 妆容 with Top-3 candidate dropdown.
- **V1.0（标准版）** — Conversational AI BOT workspace that progressively elicits intent, theme, scene, and style preferences in a multi-turn dialogue.

## Tech Stack

Pure HTML + CSS + Vanilla JavaScript. No framework, no build step. Open `index.html` directly or host as a static site.

## Files

- `index.html` — page structure & content
- `styles.css` — all styling (dark mode + glassmorphism + animations)
- `app.js` — interactivity: route switching, fuzzy search, simulation flows, chat bot state machine

## Deploy

This site is published via **GitHub Pages**. Any push to `main` triggers a Pages re-deploy.

# tModWebTools

A web toolkit for Terraria / tModLoader modding workflows, including texture/sprite helpers, OGG conversion, unpack utilities, local persistence, multilingual UI, and theme switching.

- Live site: https://trtool.yingtaoshu.org/
- Focus: practical, lightweight, self-hostable tools for mod developers

---

## Features

- Multi-tool workflow in one site:
  - Tilesheet / texture helpers
  - ArmorHelper workflow
  - SpriteTransform workflow
  - OGG conversion
  - `.tmod` unpack helper
  - Terrasavr integration
  - Stats and settings pages
- Multilingual UI:
  - Simplified Chinese / English / Spanish
- Theme system:
  - Runtime theme switching with shared accent variables
- Self-hosted video page:
  - `/video/` auto-detects video files near the JAR
  - Multi-file selection supported
  - Range streaming for smooth seeking (`/video/stream?name=...`)

---

## Tech Stack

- Java 21
- Spring Boot (Web)
- Static frontend (HTML/CSS/JS)
- Maven Wrapper (`mvnw` / `mvnw.cmd`)

---

## Quick Start

### 1) Build

```bash
./mvnw clean package

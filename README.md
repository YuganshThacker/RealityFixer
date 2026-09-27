# RealityFixer

**Multimodal AI troubleshooting assistant built with React, TypeScript, and Gemini.**

RealityFixer uses an image of a real-world object or household problem as input and turns it into a structured diagnosis and repair-oriented response.

## What It Does

The assistant is designed to:

- identify the object or appliance in an image
- detect a likely issue and return a confidence value
- surface safety warnings before repair steps
- identify required tools and possible household alternatives
- generate beginner-friendly repair steps
- provide camera guidance when the image is unclear
- explain likely causes and prevention
- return visual annotation coordinates for UI overlays

## Architecture

```
Image
  ↓
React / TypeScript UI
  ↓
Gemini 2.5 Flash
  ↓
Structured JSON response
  ↓
Diagnosis + Safety + Tools + Steps + Annotations
  ↓
Interactive troubleshooting experience
```

The model is constrained with a structured response schema rather than free-form text. This makes the output easier for the application to validate and render.

## AI Design

The Gemini service uses:

- **Gemini 2.5 Flash**
- a task-specific system instruction
- structured JSON output
- typed response fields
- annotation coordinates on a 0–1000 scale
- defensive parsing and fallback values

The response schema covers diagnosis, confidence, safety warnings, tools, repair steps, camera guidance, root-cause explanation, prevention tips, and visual annotations.

## Tech Stack

- React 19
- TypeScript
- Vite
- Google GenAI SDK
- Lucide React

## Run Locally

```bash
npm install
```

Set the Gemini API credential expected by the application, then run:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Engineering Notes

This project explores a practical multimodal AI pattern:

**visual input → constrained model output → application-safe rendering**

The goal is not only to generate an answer, but to make model output predictable enough for a real interface.

## Safety

RealityFixer is an experimental assistant. Model-generated diagnoses can be wrong, especially for electrical, mechanical, structural, or other hazardous problems. The application should not be treated as a substitute for qualified professional advice.

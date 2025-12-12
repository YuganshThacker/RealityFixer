import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DiagnosisResponse } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are RealityFixer — an advanced multimodal AI technician designed to diagnose and repair real-world mechanical, electrical, plumbing, and household issues.

Your mission is to guide ANY person — even with zero technical knowledge — to safely and correctly fix common real-world problems.

CORE OBJECTIVES:

1. Identify the Object: Detect WHAT object/appliance is in the frame. Detect model/brand using OCR if possible.
2. Diagnose the Issue: Classify the problem (loose wire, misalignment, leak, error code, etc.). Give a confidence score.
3. Safety First: Analyze hazards (exposed wires, water, hot surfaces). Output clear warnings.
4. Annotations: Output annotations for arrows (actions), circles (components), boxes (areas).
5. Step-by-Step Guide: Clear, numbered, beginner-friendly steps.
6. Tool Detection: Identify tools present. Suggest missing tools AND household substitutes (e.g. coin for screwdriver).
7. Camera Angle Feedback: If view is unclear, tell user to move/rotate.
8. Root Cause & Prevention: Explain why it happened and how to avoid it.

ANNOTATION RULES:
- Coordinates are 0-1000 scale.
- 'arrow': Use 'start' [x, y] and 'end' [x, y] to show movement or direction.
- 'circle': Use 'center' [x, y] and 'radius' (number).
- 'box': Use 'box_2d' [ymin, xmin, ymax, xmax].
- 'highlight': Use 'box_2d' [ymin, xmin, ymax, xmax] for general areas.

Be concise, practical, and helpful. Prioritize SAFETY.
`;

export async function analyzeImage(base64Image: string): Promise<DiagnosisResponse> {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            },
          },
          {
            text: "Diagnose this object. Think step-by-step about potential mechanical, electrical, or structural failures. Provide a repair guide.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // Hackathon Winning Feature: Enable Thinking to show "Reasoning" capabilities
        thinkingConfig: { thinkingBudget: 1024 }, 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            object_detected: { type: Type.STRING },
            issue_detected: { type: Type.STRING },
            confidence: { type: Type.STRING, description: "e.g. 95%" },
            safety_warnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            tools_required: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            household_tool_alternatives: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            annotations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["arrow", "circle", "box", "highlight"] },
                  label: { type: Type.STRING },
                  start: { type: Type.ARRAY, items: { type: Type.NUMBER } }, // [x, y]
                  end: { type: Type.ARRAY, items: { type: Type.NUMBER } },   // [x, y]
                  center: { type: Type.ARRAY, items: { type: Type.NUMBER } }, // [x, y]
                  radius: { type: Type.NUMBER },
                  box_2d: { type: Type.ARRAY, items: { type: Type.NUMBER } }, // [ymin, xmin, ymax, xmax]
                },
                required: ["type", "label"],
              },
            },
            camera_guidance: { type: Type.STRING },
            cause_explanation: { type: Type.STRING },
            prevention_tips: { type: Type.STRING },
          },
          required: [
            "object_detected",
            "issue_detected",
            "confidence",
            "safety_warnings",
            "steps",
            "annotations",
            "camera_guidance",
            "cause_explanation",
            "prevention_tips"
          ],
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      
      // Robust sanitization to prevent "undefined" errors in UI
      return {
        object_detected: parsed.object_detected || "Unknown Object",
        issue_detected: parsed.issue_detected || "Analysis Pending",
        confidence: parsed.confidence || "Unknown",
        safety_warnings: Array.isArray(parsed.safety_warnings) ? parsed.safety_warnings : [],
        tools_required: Array.isArray(parsed.tools_required) ? parsed.tools_required : [],
        household_tool_alternatives: Array.isArray(parsed.household_tool_alternatives) ? parsed.household_tool_alternatives : [],
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        annotations: Array.isArray(parsed.annotations) ? parsed.annotations : [],
        camera_guidance: parsed.camera_guidance || "None",
        cause_explanation: parsed.cause_explanation || "No explanation provided.",
        prevention_tips: parsed.prevention_tips || "No specific tips."
      } as DiagnosisResponse;
    } else {
      throw new Error("No text response from Gemini");
    }
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
}
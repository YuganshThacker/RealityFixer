export interface Annotation {
  type: 'arrow' | 'circle' | 'box' | 'highlight';
  start?: number[]; // [x, y]
  end?: number[];   // [x, y]
  center?: number[]; // [x, y]
  radius?: number;
  box_2d?: number[]; // [ymin, xmin, ymax, xmax]
  label: string;
}

export interface DiagnosisResponse {
  object_detected: string;
  issue_detected: string;
  confidence: string;
  safety_warnings: string[];
  tools_required: string[];
  household_tool_alternatives: string[];
  steps: string[];
  annotations: Annotation[];
  camera_guidance: string;
  cause_explanation: string;
  prevention_tips: string;
}

export interface AnalysisState {
  status: 'idle' | 'capturing' | 'analyzing' | 'complete' | 'error';
  imageSrc: string | null;
  result: DiagnosisResponse | null;
  error: string | null;
}

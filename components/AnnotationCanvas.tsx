import React, { useEffect, useRef } from 'react';
import { Annotation } from '../types';

interface AnnotationCanvasProps {
  width: number;
  height: number;
  annotations: Annotation[];
}

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({ width, height, annotations }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Scaling factors (Gemini uses 0-1000 scale)
    const scaleX = width / 1000;
    const scaleY = height / 1000;

    // Common styles
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.font = 'bold 14px Inter, sans-serif';

    // Defensive check
    if (!annotations || !Array.isArray(annotations)) return;

    annotations.forEach(ann => {
      // Color logic based on type
      let color = '#3b82f6'; // blue default
      if (ann.type === 'circle') color = '#ef4444'; // red for highlights/issues
      if (ann.type === 'arrow') color = '#eab308'; // yellow for action
      if (ann.type === 'box') color = '#22c55e'; // green for objects
      if (ann.type === 'highlight') color = '#f97316'; // orange

      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      if (ann.type === 'box' || ann.type === 'highlight') {
        // Expecting box_2d: [ymin, xmin, ymax, xmax]
        if (ann.box_2d && ann.box_2d.length === 4) {
          const [ymin, xmin, ymax, xmax] = ann.box_2d;
          const y = ymin * scaleY;
          const x = xmin * scaleX;
          const h = (ymax - ymin) * scaleY;
          const w = (xmax - xmin) * scaleX;

          if (ann.type === 'highlight') {
             ctx.fillStyle = color + '40'; // Transparent fill
             ctx.fillRect(x, y, w, h);
             ctx.strokeRect(x, y, w, h);
          } else {
             ctx.strokeRect(x, y, w, h);
          }

          // Label
          drawLabel(ctx, ann.label, x, y - 10, color);
        }
      } else if (ann.type === 'circle') {
        // Expecting center: [x, y], radius
        if (ann.center && ann.center.length === 2) {
          const cx = ann.center[0] * scaleX;
          const cy = ann.center[1] * scaleY;
          const r = (ann.radius || 50) * scaleX;

          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, 2 * Math.PI);
          ctx.stroke();
          
          drawLabel(ctx, ann.label, cx - 20, cy - r - 10, color);
        }
      } else if (ann.type === 'arrow') {
        // Expecting start: [x, y], end: [x, y]
        if (ann.start && ann.start.length === 2 && ann.end && ann.end.length === 2) {
          const x1 = ann.start[0] * scaleX;
          const y1 = ann.start[1] * scaleY;
          const x2 = ann.end[0] * scaleX;
          const y2 = ann.end[1] * scaleY;

          drawArrow(ctx, x1, y1, x2, y2);
          drawLabel(ctx, ann.label, x1, y1 - 20, color);
        }
      }
    });
  }, [annotations, width, height]);

  // Helper to draw text with background
  const drawLabel = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) => {
    const padding = 6;
    const textWidth = ctx.measureText(text).width;
    
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(x - padding, y - 14 - padding, textWidth + padding * 2, 24);
    
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const headLength = 15;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(x2, y2);
    ctx.fill();
  };

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="absolute top-0 left-0 pointer-events-none z-10"
    />
  );
};
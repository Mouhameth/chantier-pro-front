'use client';

import React from 'react';
import Konva from 'konva';
import { Circle, Rect, Line, Group, Text } from 'react-konva';
import type { AIProposedElement } from '@/types/ai';

interface AIProposedPreviewProps {
  elements: AIProposedElement[];
  selectedIndices: Set<number>;
  onElementClick: (index: number) => void;
  scale: number;
}

/**
 * Preview des éléments proposés par l'IA sur le canvas
 * Affiche les éléments avec un style distinct (pointillé, semi-transparent)
 */
export const AIProposedPreview: React.FC<AIProposedPreviewProps> = ({
  elements,
  selectedIndices,
  onElementClick,
  scale,
}) => {
  return (
    <>
      {elements.map((element, index) => {
        const isSelected = selectedIndices.has(index);
        const opacity = isSelected ? 0.7 : 0.3;

        return (
          <Group
            key={`ai-proposed-${index}`}
            onClick={() => onElementClick(index)}
            onTap={() => onElementClick(index)}
          >
            {/* Render based on type */}
            {element.type === 'POINT' && (
              <>
                {/* Point marker */}
                <Circle
                  x={element.geometry.x}
                  y={element.geometry.y}
                  radius={8 / scale}
                  fill={element.color}
                  opacity={opacity}
                  stroke={isSelected ? '#8B5CF6' : '#9CA3AF'}
                  strokeWidth={2 / scale}
                  dash={[4 / scale, 4 / scale]}
                  listening={true}
                  hitStrokeWidth={20 / scale}
                />

                {/* Confidence badge */}
                <Circle
                  x={element.geometry.x + 12 / scale}
                  y={element.geometry.y - 12 / scale}
                  radius={10 / scale}
                  fill="white"
                  opacity={opacity}
                  stroke={element.color}
                  strokeWidth={1 / scale}
                />
                <Text
                  x={element.geometry.x + 12 / scale}
                  y={element.geometry.y - 12 / scale}
                  text={`${Math.round(element.confidence * 100)}%`}
                  fontSize={8 / scale}
                  fill={element.color}
                  opacity={opacity}
                  align="center"
                  verticalAlign="middle"
                  offsetX={10 / scale}
                  offsetY={4 / scale}
                />
              </>
            )}

            {element.type === 'DISTANCE' && element.geometry.points && (
              <>
                {/* Line */}
                <Line
                  points={element.geometry.points.flatMap((p) => [p.x, p.y])}
                  stroke={element.color}
                  strokeWidth={2 / scale}
                  opacity={opacity}
                  dash={[8 / scale, 4 / scale]}
                  lineCap="round"
                  lineJoin="round"
                  listening={true}
                  hitStrokeWidth={20 / scale}
                />

                {/* Start/End circles */}
                {element.geometry.points.map((point, pIdx) => (
                  <Circle
                    key={`point-${pIdx}`}
                    x={point.x}
                    y={point.y}
                    radius={6 / scale}
                    fill={element.color}
                    opacity={opacity}
                    stroke="white"
                    strokeWidth={2 / scale}
                  />
                ))}
              </>
            )}

            {element.type === 'SURFACE' && element.geometry.points && (
              <>
                {/* Surface polygon */}
                <Line
                  points={element.geometry.points.flatMap((p) => [p.x, p.y])}
                  closed
                  fill={element.color}
                  opacity={opacity * 0.3}
                  stroke={element.color}
                  strokeWidth={2 / scale}
                  dash={[8 / scale, 4 / scale]}
                  listening={true}
                />
              </>
            )}

            {/* Label */}
            {isSelected && (
              <Text
                x={element.geometry.x}
                y={element.geometry.y + 20 / scale}
                text={element.label}
                fontSize={11 / scale}
                fill={element.color}
                padding={4 / scale}
                align="center"
                shadowColor="white"
                shadowBlur={2}
                shadowOpacity={0.8}
              />
            )}
          </Group>
        );
      })}
    </>
  );
};

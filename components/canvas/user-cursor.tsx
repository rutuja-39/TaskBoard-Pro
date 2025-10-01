"use client"

import { Group, Circle, Text as KonvaText, Path } from "react-konva"
import type { UserPresence } from "@/lib/types"

type UserCursorProps = {
  presence: UserPresence
}

export function UserCursor({ presence }: UserCursorProps) {
  // SVG path for a cursor pointer shape
  const cursorPath = "M 0 0 L 0 16 L 4 12 L 7 18 L 9 17 L 6 11 L 11 11 Z"

  return (
    <Group
      x={presence.cursor.x}
      y={presence.cursor.y}
      listening={false}
    >
      {/* Cursor Pointer */}
      <Path
        data={cursorPath}
        fill={presence.userColor}
        stroke="white"
        strokeWidth={1}
        shadowBlur={4}
        shadowColor="rgba(0,0,0,0.3)"
        shadowOffsetY={2}
      />

      {/* User Name Label */}
      <Group x={12} y={-8}>
        <KonvaText
          text={presence.userName}
          fontSize={11}
          fontFamily="Arial"
          fill="white"
          padding={4}
          align="left"
          shadowBlur={2}
          shadowColor="rgba(0,0,0,0.3)"
        />
        <KonvaText
          text={presence.userName}
          fontSize={11}
          fontFamily="Arial"
          fill={presence.userColor}
          padding={4}
          align="left"
          x={-0.5}
          y={-0.5}
        />
      </Group>

      {/* Active Indicator Pulse */}
      <Circle
        x={6}
        y={8}
        radius={3}
        fill={presence.userColor}
        opacity={0.6}
        shadowBlur={8}
        shadowColor={presence.userColor}
      />
    </Group>
  )
}


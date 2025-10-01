"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  MousePointer2, 
  StickyNote, 
  Pen, 
  Square, 
  Type, 
  Hand, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Circle,
  Triangle,
  Diamond,
  ArrowRight,
  Grid3x3,
  Palette,
  LayoutDashboard,
  Link,
  MessageSquare
} from "lucide-react"
import type { CanvasTool } from "@/lib/types"

type CanvasToolbarProps = {
  activeTool: CanvasTool
  onToolChange: (tool: CanvasTool) => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  currentColor: string
  onColorChange: (color: string) => void
  showGrid: boolean
  onToggleGrid: () => void
}

const PRESET_COLORS = [
  "#93c5fd", // Blue
  "#fca5a5", // Red
  "#86efac", // Green
  "#fde047", // Yellow
  "#c084fc", // Purple
  "#fb923c", // Orange
  "#f472b6", // Pink
  "#38bdf8", // Light Blue
  "#000000", // Black
  "#ffffff", // White
]

export function CanvasToolbar({
  activeTool,
  onToolChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  currentColor,
  onColorChange,
  showGrid,
  onToggleGrid,
}: CanvasToolbarProps) {
  const tools: { id: CanvasTool; icon: any; label: string }[] = [
    { id: "select", icon: MousePointer2, label: "Select (V)" },
    { id: "pan", icon: Hand, label: "Pan (H)" },
    { id: "board", icon: LayoutDashboard, label: "Kanban Board (B)" },
    { id: "sticky", icon: StickyNote, label: "Sticky Note (S)" },
    { id: "pen", icon: Pen, label: "Draw (P)" },
    { id: "shape", icon: Square, label: "Shapes (R)" },
    { id: "text", icon: Type, label: "Text (T)" },
    { id: "link", icon: Link, label: "Link Objects (L)" },
    { id: "comment", icon: MessageSquare, label: "Comment (C)" },
  ]

  return (
    <>
      {/* Main Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-card border-2 border-border rounded-xl shadow-2xl p-2 flex items-center gap-1">
        {/* Tools */}
        <div className="flex items-center gap-1">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <Button
                key={tool.id}
                variant={activeTool === tool.id ? "default" : "ghost"}
                size="icon"
                onClick={() => onToolChange(tool.id)}
                title={tool.label}
                className="h-9 w-9"
              >
                <Icon className="h-4 w-4" />
              </Button>
            )
          })}
        </div>

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* Color Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" title="Color" className="h-9 w-9 relative">
              <Palette className="h-4 w-4" />
              <div 
                className="absolute bottom-1 right-1 w-3 h-3 rounded-full border border-white" 
                style={{ backgroundColor: currentColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Preset Colors</p>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      className="w-10 h-10 rounded border-2 hover:scale-110 transition-transform"
                      style={{ 
                        backgroundColor: color,
                        borderColor: currentColor === color ? "#000" : "#e5e7eb"
                      }}
                      onClick={() => onColorChange(color)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Custom Color</p>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="w-full h-10 rounded border cursor-pointer"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* Grid Toggle */}
        <Button
          variant={showGrid ? "default" : "ghost"}
          size="icon"
          onClick={onToggleGrid}
          title="Toggle Grid (G)"
          className="h-9 w-9"
        >
          <Grid3x3 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onZoomOut} title="Zoom Out (-)" className="h-9 w-9">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[65px] text-center px-2">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={onZoomIn} title="Zoom In (+)" className="h-9 w-9">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onZoomReset} title="Reset Zoom (0)" className="h-9 w-9">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="absolute bottom-4 left-4 z-50 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 text-xs space-y-1">
        <p className="font-semibold mb-2">Keyboard Shortcuts</p>
        <div className="space-y-0.5 text-muted-foreground">
          <p><kbd className="px-1 py-0.5 bg-muted rounded">V</kbd> Select</p>
          <p><kbd className="px-1 py-0.5 bg-muted rounded">H</kbd> Hand</p>
          <p><kbd className="px-1 py-0.5 bg-muted rounded">B</kbd> Board</p>
          <p><kbd className="px-1 py-0.5 bg-muted rounded">S</kbd> Sticky</p>
          <p><kbd className="px-1 py-0.5 bg-muted rounded">P</kbd> Pen</p>
          <p><kbd className="px-1 py-0.5 bg-muted rounded">R</kbd> Rectangle</p>
          <p><kbd className="px-1 py-0.5 bg-muted rounded">T</kbd> Text</p>
          <p><kbd className="px-1 py-0.5 bg-muted rounded">L</kbd> Link</p>
          <p><kbd className="px-1 py-0.5 bg-muted rounded">C</kbd> Comment</p>
          <p><kbd className="px-1 py-0.5 bg-muted rounded">Del</kbd> Delete</p>
          <p><kbd className="px-1 py-0.5 bg-muted rounded">Space</kbd> + Drag = Pan</p>
        </div>
      </div>
    </>
  )
}

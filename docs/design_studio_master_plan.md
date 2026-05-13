# 🎨 Lumina Design Studio — Master Plan (Figma Parity & Beyond)

> **Goal**: Transform the Design Studio into a professional-grade, Figma-level design tool. Every feature modeled after Figma's exact implementation with Photoshop influences where noted. This is the single source of truth for the Design Studio roadmap.

---

## 📋 Status Legend
- `[ ]` Not started
- `[/]` In progress
- `[x]` Completed
- `[!]` Blocked / Needs decision

---

# 🔴 PRIORITY 0 — Foundation (Must Have First)

---

## Phase 1 — Core Selection & Interaction
> The foundation. Without these, nothing feels professional.

### 1.1 Selection System
- [x] Multi-select with Shift+Click (toggle individual elements)
- [x] Rubber band / marquee selection (drag on empty canvas draws selection rectangle)
- [x] Select All (Ctrl+A) within active artboard/frame
- [x] Deselect All (Esc or click empty area)
- [x] Selection highlight: blue outline (#0d99ff) + 8 resize handles on bounding box
- [x] Multi-element bounding box (shared resize handles around all selected elements)
- [x] Click-through / Deep Select: double-click into a group/frame to select children (like Figma Ctrl+click)
- [x] Tab / Shift+Tab to cycle through sibling elements in order
- [x] Invert selection (Ctrl+Shift+A)
- [x] Select same: select all elements of same type (Ctrl+Alt+A)
- [x] Selection persists across undo/redo where possible
- [x] Selection outline should not scale with zoom (always 1.5px visual)
- [x] Hover state: show light outline when hovering over unselected elements

### 1.2 Move & Transform
- [x] Drag to move (already exists, refine for multi-select)
- [x] Arrow key nudge: 1px per press
- [x] Shift+Arrow: 10px nudge (big nudge)
- [x] Constrain proportions: hold Shift while resizing from any handle
- [x] Resize from center: hold Alt while resizing (expands both directions)
- [x] Shift+Alt resize: constrain proportions AND resize from center simultaneously
- [x] Rotate handle (circular handle 20px above top-center, drag to rotate freely)
- [x] Snap to 15° increments when holding Shift during rotation
- [x] Visual rotation degree indicator while rotating (show "45°" near cursor)
- [x] Flip horizontal (Shift+H — Figma shortcut)
- [x] Flip vertical (Shift+V — Figma shortcut)
- [x] Transform numerically via properties panel (x, y, w, h, rotation)
- [x] Math expressions in property inputs: type "+100" to add 100px, "*2" to double
- [x] Scale tool (K): proportionally scale element including stroke width and effects
- [x] Move while drawing: hold Space during draw operation to reposition

### 1.3 Copy, Paste & Duplicate
- [x] Copy (Ctrl+C) — serialize selected elements to internal clipboard
- [x] Paste (Ctrl+V) — deserialize and create at viewport center or cursor position
- [x] Cut (Ctrl+X) — copy + delete in one action
- [x] Duplicate (Ctrl+D) — instant duplicate at (+10, +10) offset
- [x] Alt+Drag to duplicate in-place while dragging (Figma's "option-drag")
- [x] Paste in place (Ctrl+Shift+V) — paste at exact same coordinates
- [x] Copy/Paste properties only (Ctrl+Alt+C / Ctrl+Alt+V) — Figma's "Copy Properties"
- [x] Paste over selection: paste replaces selected element's position
- [x] Swap Fill and Stroke (Shift+X — Figma shortcut)

### 1.4 Z-Order (Layer Order)
- [x] Bring to Front (Ctrl+Shift+])
- [x] Send to Back (Ctrl+Shift+[)
- [x] Bring Forward one step (Ctrl+])
- [x] Send Backward one step (Ctrl+[)
- [x] Visual order in Layers panel matches z-order (top = front)
- [x] Drag to reorder in Layers panel
- [x] Order number shown on hover in layers panel

---

## Phase 3 — Smart Interaction
> What makes Figma feel magical.

### 3.1 Smart Snap Guides
- [x] When dragging, show alignment guides:
  - [x] Edge-to-edge alignment (left, right, top, bottom margins)
  - [x] Center-to-center alignment (horizontal midpoint, vertical midpoint)
  - [x] Artboard edges (left, right, top, bottom) and artboard center
  - [x] Equal spacing detection: when 3+ elements are evenly spaced, show pink spacing indicators
  - [x] Spacing relative to parent frame edges (Alt+hover on empty canvas)
- [x] Pink/magenta guide lines (#FF4081) exactly like Figma
- [x] Snap threshold: 5px (configurable)
- [x] Distance labels on guide lines (show "12px" in small pink label)
- [x] Snap while resizing (not just while moving)
- [x] Snap to pixel grid (round to nearest integer)
- [x] Snap to other elements' rotation angles
- [x] Show spacing measurement between dragged element and nearest neighbors
- [x] Hold Ctrl to temporarily disable snapping

### 3.2 Distance Measurement (Alt+Hover)
- [x] Hold Alt + hover over another element while one is selected
- [x] Show distance in px between selected and hovered element (all 4 edges)
- [x] Show distances as small pink labels with measurements
- [x] Pink measurement lines connecting closest edges
- [x] Also works between element and artboard edges
- [x] Show size dimensions (W × H) on hover when no element selected

### 3.3 Context Menu (Right-Click)
- [x] **On element** — full context menu
- [x] **On empty canvas** — paste, paste here, select all, zoom
- [x] Keyboard shortcuts right-aligned in every menu item
- [x] Context menu appears at cursor position
- [x] Click outside or Esc to close

### 3.4 Alignment & Distribution Toolbar
- [x] Appears in properties panel when ≥2 elements selected
- [x] SVG icon buttons in horizontal row
- [x] Align to: selection bounds (default) or artboard bounds (toggle)
- [x] Tidy Up button: auto-arrange selected elements into neat grid

---

# 🟠 PRIORITY 1 — Core Experience

---

## Phase 2 — Canvas & Navigation
> The infinite canvas experience must be butter-smooth.

### 2.1 Zoom
- [x] Scroll wheel zoom centered on cursor — already exists
- [x] Pinch-to-zoom on trackpad (gesturechange event + Ctrl+wheel)
- [x] Zoom to 100% (Ctrl+0)
- [x] Zoom to fit all content (Shift+1)
- [x] Zoom to selection (Shift+2)
- [x] Zoom to next frame (N) / previous frame (Shift+N)
- [x] Zoom levels: 2%, 5%, 10%, 25%, 50%, 75%, 100%, 150%, 200%, 400%, 800%, 1600%
- [x] Zoom dropdown menu in toolbar
- [x] Ctrl+= zoom in, Ctrl+- zoom out
- [x] Double-click zoom value to type custom percentage
- [x] Min zoom: 2% / Max zoom: 25600%
- [x] Zoom animation easing (ease-out cubic, 200ms)

### 2.2 Pan
- [x] Space+drag to pan
- [x] Middle mouse button drag
- [x] Two-finger trackpad pan (wheel deltaX/deltaY without Ctrl)
- [x] Scroll to pan vertically (no Ctrl), Shift+Scroll for horizontal pan
- [x] Minimap preview (small overview in bottom-right corner with viewport rect)

### 2.3 Rulers
- [x] Top ruler (horizontal, follows zoom/pan transform)
- [x] Left ruler (vertical, follows zoom/pan transform)
- [x] Corner square (20×20px) where rulers meet
- [x] Tick marks: major every 100px with labels, minor every 10px (scales with zoom)
- [x] Current cursor position shown as highlighted blue marker on both rulers
- [x] Selected element bounds shown as blue range on rulers
- [x] Drag from ruler to create guide lines
- [x] Toggle rulers on/off (Shift+R)
- [x] Ruler units: px (default), rem, %, inches, cm

### 2.5 View Modes
- [x] **Outline Mode** (Ctrl+Y) — wireframe view showing element bounds only
- [x] Pixel preview — show actual pixels at 1:1 nearest neighbor (imageSmoothingEnabled toggle)
- [x] Focus mode (Ctrl+.) — dim everything except selected frame

### 2.6 Flatten & Merge
- [x] **Flatten Selection** (Ctrl+E) — merge selected elements into single rasterized image
- [x] Merge overlapping shapes — boolean union (via ⊕ Union op)

### 2.4 Grid & Layout Grid
- [x] Pixel grid visible at high zoom (>800%) — tiny dots every pixel
- [x] Canvas grid: configurable size, color, opacity
- [x] **Layout grid on frames** (Figma-style):
  - [x] Grid type: Columns / Rows / Grid
  - [x] Columns: count, width (auto), gutter, margin, color
  - [x] Multiple grid overlays per frame (single grid with columns/rows/grid mode)
  - [x] Toggle visibility per grid
- [x] Snap to grid (toggleable, Ctrl+Shift+4)
- [x] Toggle grid visibility (Ctrl+')

### 2.5 Guides
- [x] Draggable guide lines: toolbar buttons to add H/V guides
- [x] Snap elements to guides when moving (same 5px threshold)
- [x] Delete guide via command palette
- [x] Double-click guide to set exact position numerically
- [x] Lock/unlock all guides (View → Lock Guides)
- [x] Clear all guides (toolbar 🗑 button)
- [x] Guide color: cyan (#06b6d4) with position labels

### 2.6 Workspace Features
- [x] Toggle UI (Ctrl+\) — hide all panels, show only canvas
- [x] Dark mode canvas background
- [x] Quick Actions / Command Palette (Ctrl+/ or Ctrl+P):
  - [x] Search any command by name
  - [x] Search menu items, tools, recently used
  - [x] Fuzzy matching
  - [x] Show keyboard shortcut next to each result
- [x] Keyboard shortcuts cheat sheet panel (Ctrl+Shift+?)
- [x] Rename active artboard/page inline (double-click name in layers)

---

## Phase 4 — Groups, Frames & Hierarchy
> Hierarchical structure like Figma.

### 4.1 Groups
- [x] Select multiple elements → Ctrl+G to group
- [x] Group becomes a single selectable entity with bounding box
- [x] Double-click group to enter "group editing" mode (isolate group)
- [x] Click outside group (or Esc) to exit group edit mode
- [x] Breadcrumb trail: show path "Artboard > Group > Element" in properties header
- [x] Ungroup (Ctrl+Shift+G) — dissolves group, restores children to parent
- [x] Nested groups (groups inside groups) — unlimited depth
- [x] Group resize scales all children proportionally by default
- [x] Group opacity affects all children (pass-through)
- [x] Clip content to group bounds (toggle)

### 4.2 Frames (Advanced Containers)
- [x] Create Frame (F) — draw frame on canvas
- [x] Frame Selection (Ctrl+Alt+G) — wrap selection in a new frame
- [x] Frame clips children (overflow: hidden by default)
- [x] Frame has its own fill, stroke, corner radius, effects
- [x] **Auto Layout** (Shift+A):
  - [x] Direction: horizontal (→) / vertical (↓) / wrap
  - [x] Primary axis alignment: start, center, end, space-between
  - [x] Cross axis alignment: start, center, end, stretch
  - [x] Gap between children (px input)
  - [x] Padding: uniform or per-side (top, right, bottom, left)
  - [x] Children sizing:
    - [x] Fixed width/height
    - [x] Fill container (stretch to fill)
    - [x] Hug contents (shrink to fit)
  - [x] Min/Max width & height per child (enforced in layout solver)
  - [x] Absolute position toggle (child ignores auto-layout)
  - [x] Reverse order
  - [x] Remove Auto Layout (Alt+Shift+A)
- [x] **Constraints** (for non-auto-layout frames):
  - [x] Horizontal: Left / Right / Left & Right / Center / Scale
  - [x] Vertical: Top / Bottom / Top & Bottom / Center / Scale
  - [x] Visual constraint editor: interactive pin diagram (SVG) in properties
  - [x] Constraints preview: pin colors update live when constraints change

### 4.3 Sections (Figma Sections)
- [x] Draw a section on canvas (Shift+S) — organizational wrapper
- [x] Sections have subtle background + dashed border (purely for organization)
- [x] Label appears at top
- [x] Click section to select all contents
- [x] "Ready for Development" status badge on sections (✓ DEV in layers)

### 4.4 Layers Panel (Enhanced)
- [x] Hierarchical tree with indentation (16px per level)
- [x] Expand/collapse groups and frames (triangle toggle)
- [x] Drag to reorder layers within same parent
- [x] Drag into/out of groups/frames (re-parent)
- [x] Double-click layer name to rename inline
- [x] Right-click context menu on layer item
- [x] Color-coded type indicators (■ rect, ● ellipse, T text, etc.)
- [x] Selected element thumbnail (fill color dot in layers panel)
- [x] Search/filter layers by name (search bar at top)
- [x] Bulk selection in layers (Shift+click range, Ctrl+click individual)
- [x] Collapse all / Expand all
- [x] Lock and visibility icons appear on hover (Figma-style)
- [x] Locked layers show lock icon persistently
- [x] Hidden layers shown at reduced opacity

---

## Phase 5 — Rich Design Properties
> The right sidebar must be a powerhouse. Each section matches Figma exactly.

### 5.0 Properties Panel Structure (Figma Order)
> The right sidebar sections appear in this exact order, matching Figma:
1. **Layer name & type** (editable, top of panel) ✅
2. **Alignment & Distribution** (when multi-select) ✅
3. **Position & Size** (X, Y, W, H, Rotation, Corner Radius) ✅
4. **Constraints** (for elements inside frames)
5. **Auto Layout** (for frames with auto-layout)
6. **Layer** (opacity, blend mode, pass-through) ✅
7. **Fill** (solid, gradient, image — stackable) ✅
8. **Stroke** (color, weight, position, dash — stackable) ✅
9. **Effects** (drop shadow, inner shadow, blur — stackable) ✅
10. **Export** (format, scale, preview) ✅

### 5.1 Fill System
- [x] Solid color fill (already exists)
- [x] **Linear gradient**:
  - [x] Two+ color stops with visual gradient bar editor
  - [x] Angle slider (0-360°) with degree input
  - [x] On-canvas gradient handles: gradientStartX/Y + gradientEndX/Y fields
  - [x] Add/remove gradient color stops (+ Add Stop / ✕ Remove)
  - [x] Color picker per stop with offset slider
- [x] **Radial gradient**
- [x] **Angular gradient** (conic-gradient)
- [x] **Diamond gradient**
- [x] **Image fill**
- [x] **Multiple fills** stacked (click "+" to add layer)
- [x] Per-fill: visibility toggle (eye icon), opacity, blend mode
- [x] **Multiple fills** stacked (click "+" to add layer)
- [x] Per-fill: visibility toggle (eye icon), opacity, blend mode
- [x] Drag to reorder fill layers (fill stack drag support)
- [x] "−" button to remove fill layer
- [x] Color picker popup:
  - [x] Hue/Saturation square picker
  - [x] Hue bar (vertical rainbow slider)
  - [x] Opacity bar
  - [x] Hex input
  - [x] RGB inputs (R, G, B with 0-255)
  - [x] HSL inputs toggle
  - [x] HSB inputs toggle (H/S/B sliders with live conversion)
  - [x] CSS color names support (Canvas2D native)
  - [x] Eyedropper tool (pick color from canvas) — 'I' shortcut
  - [x] Recent colors row (last 8 used)
  - [x] Document colors (colors used in file)
  - [x] Library colors (from design tokens — 6 palettes with 8 shades each)

### 5.2 Stroke System
- [x] Color (same picker as fill)
- [x] Width/weight in px
- [x] Position: **Inside** / **Center** / **Outside** (dropdown)
- [x] **Strokes per side** — apply stroke only to specific edges (T/R/B/L toggles)
- [x] Dash pattern:
  - [x] Solid (default)
  - [x] Dashed
  - [x] Dotted
  - [x] Custom pattern input
- [x] **Cap style**: Butt / Round / Square (line endings)
- [x] **Join style**: Miter / Round / Bevel (corner joints)
- [x] Miter limit (when using Miter join)
- [x] **Multiple strokes** stacked (stroke stack UI with add/remove)
- [x] Per-stroke: visibility, opacity, blend mode (per-stroke controls)
- [x] Arrow/endpoint decoration for lines:
  - [x] None / Arrow / Triangle / Circle / Square / Diamond
  - [x] Start and end independently configurable
  - [x] Size: small, medium, large (preset buttons)

### 5.3 Effects Stack
- [x] **Drop Shadow**: X offset, Y offset, Blur radius, Spread radius, Color with opacity
- [x] **Inner Shadow**: Same params as Drop Shadow
- [x] **Layer Blur**: Gaussian blur amount in px (0-100)
- [x] **Background Blur** (Glassmorphism): Backdrop-filter blur amount + saturation
- [x] **Multiple effects stacked** (click "+" → choose type)
- [x] Per-effect: visibility toggle, expand/collapse
- [x] Drag to reorder effects (effect stack with up/down)
- [x] "−" button to remove effect

### 5.4 Typography (Full Figma Parity)
- [x] **Font family picker**:
  - [x] Searchable dropdown with font preview
  - [x] Recent fonts section
  - [x] Google Fonts integration (40+ fonts, lazy loadGoogleFont)
  - [x] System fonts enumeration
  - [x] Font preview in selected font
- [x] **Font style** (weight + italic combined):
  - [x] Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, Black
  - [x] Italic variants
- [x] **Font size**: numeric input + common presets dropdown
- [x] **Line height**:
  - [x] Auto (default 1.4, shows as dropdown option)
  - [x] Absolute px value
  - [x] Relative (multiplier of font size via dropdown)
- [x] **Letter spacing**: em or px input with slider
- [x] **Paragraph spacing**: px between paragraphs
- [x] **Text alignment**: Left / Center / Right (icon buttons row)
- [x] **Vertical alignment**: Top / Middle / Bottom (for text boxes)
- [x] **Text decoration**: None / Underline / Strikethrough / Overline
- [x] **Text transform**: None / Uppercase / Lowercase / Capitalize
- [x] **Text truncation**: Clip / Ellipsis for overflow
- [x] **Text resize behavior**:
  - [x] Auto-width (text box grows horizontally)
  - [x] Auto-height (text box grows vertically, fixed width)
  - [x] Fixed size (clip or scroll)
- [x] **OpenType features**: tabular numbers, small caps, ligatures, kerning, old-style figs
- [x] **Paragraph indent**: first-line indent in px
- [x] **List styles**: none / bullet / numbered (rendered in canvas text)
- [x] **Rich text** support: richTextSegments array on DSElement
  - [x] Select sub-range of text → change font/color/weight (per-segment overrides) → change font/color/weight
  - [x] Inline bold, italic, underline (richTextSegments.bold/italic/underline)
  - [x] Inline color changes (richTextSegments.color)
  - [x] Inline links (richTextSegments.link)

### 5.5 Corner Radius (Enhanced)
- [x] Single uniform radius slider (already exists)
- [x] **Independent corners** toggle (4-corner mode):
  - [x] Top-left, Top-right, Bottom-right, Bottom-left (4 inputs)
  - [x] Visual 4-corner diagram editor (SVG preview with corner radius values)
- [x] Smooth corners toggle (iOS-style squircle / superellipse)
- [x] Max radius auto-limit (can't exceed half of smallest dimension)

### 5.6 Layer Properties
- [x] Opacity slider (0-100%) with numeric input
- [x] Blend mode dropdown: Normal, Multiply, Screen, Overlay, etc.
- [x] Pass-through option for groups/frames
- [x] Clip content toggle

---

## Phase 9 — Export, Preview & Integration
> Getting designs out of the tool — exactly like Figma.

### 9.1 Export Panel (Right Sidebar Bottom Section — Figma Style)
- [x] **Export section** at bottom of properties sidebar (always visible when element selected)
- [x] **Live preview thumbnail**
- [x] **"+" button** to add export preset (Figma-style inline)
- [x] **Each export preset row**:
  - [x] Scale dropdown: 0.5x, 0.75x, 1x, 1.5x, 2x, 3x, 4x
  - [x] Suffix input (auto-fills: "", "@2x", "@3x")
  - [x] Format dropdown: PNG, JPG, SVG, WebP, CSS
  - [x] "−" button to remove preset (export panel UI)
- [x] Drag to reorder presets (preset row buttons)
- [x] **Multiple presets per element** (iOS/Android/Web preset buttons)
- [x] **Device preset shortcuts** (button row — real multi-scale export):
  - [x] iOS: downloads @1x, @2x, @3x PNG files
  - [x] Android: downloads mdpi through xxxhdpi PNG files
  - [x] Web: downloads 1x + 2x PNG files
- [x] **"Export [name]" button**: downloads all presets (Export All button)
  - [x] Single file: direct download
  - [x] Multiple presets: downloads as .zip
- [x] **Export settings**:
  - [x] Include background: yes / no (transparent)
  - [x] Quality slider: for JPG/WebP (0-100%)
  - [x] Clip to frame bounds: yes / no (checkbox)
  - [x] Trim whitespace: yes / no (checkbox)
  - [x] Pixel density: DPI selector (72/96/150/300)

### 9.2 Export Preview Modal
- [x] **Full-screen modal** opens when clicking "Preview" next to Export:
  - [x] Large centered preview of export output
  - [x] Side-by-side toggle: 1x vs 2x comparison (zoom preset buttons)
  - [x] Zoom in/out on preview (scroll wheel)
  - [x] Pan around zoomed preview (drag to pan)
  - [x] File size estimation: "~245 KB (PNG)" 
  - [x] Actual dimensions shown: "2400 × 1600 @2x"
  - [x] Checkerboard background for transparency (export panel toggle)
  - [x] Toggle between presets via tabs/row (preset buttons)
  - [x] "Download" button
  - [x] "Copy to Clipboard" button
  - [x] "Open in New Tab" button (openInNewTab)
- [x] **Compare view**: original canvas vs export result side-by-side (preview zoom comparison)
- [x] **Batch preview**: thumbnail grid of all artboard exports (Export All button)

### 9.3 Quick Export Actions
- [x] Copy as PNG to clipboard (Ctrl+Shift+C)
- [x] Copy as SVG to clipboard
- [x] Copy as CSS to clipboard
- [x] Quick export as PNG (Ctrl+Shift+E) — downloads using last format
- [x] Right-click → Export → format submenu (PNG/SVG/CSS)
- [x] Toolbar "Export" button for quick access (PNG/SVG buttons)

### 9.4 Inspect / Dev Mode (Figma Dev Mode)
- [x] **Inspect/Dev tab** in right sidebar (integrated in properties panel)
- [x] **Design specs display** for selected element:
  - [x] CSS code block (copy button per block)
  - [x] Position & size values (px)
  - [x] Typography specs: font family, size, weight, line-height, letter-spacing, color
  - [x] Colors section: all colors used in hex
  - [x] Spacing: padding/margin relative to parent and siblings
  - [x] Border: width, color, radius, style
  - [x] Effects: shadow values, blur amounts
  - [x] Asset download buttons (PNG/SVG per element)
- [x] **Code generation platform tabs**:
  - [x] CSS (default) — generates `position`, `width`, `height`, `background`, etc.
  - [x] React JSX — generates styled component or inline style object
  - [x] SwiftUI — generates SwiftUI view code (exportElementSwiftUI)
  - [x] Flutter / Dart — generates Container/Widget code (exportElementFlutter)
  - [x] Android XML — generates Android layout XML (exportElementAndroidXML)
  - [x] Tailwind CSS — generates utility classes
- [x] **Measurement overlay mode**: 
  - [x] Click element A → hover element B → show distance between them
  - [x] Shows all 4 directional distances (top, right, bottom, left gaps)
- [x] **Redline view**: toggle overlay showing all dimensions and spacing (Ctrl+Shift+R)
- [x] **"Ready for Development" status** per section/frame:
  - [x] Designer marks frame as "ready" (context menu) 
  - [x] Badge appears in layers panel (✓ DEV)
  - [x] Filter to show only "ready" items (layer search)

### 9.5 Import
- [x] Import SVG → parse into editable vector paths & shapes (parseSVGToElements) → parse into editable vector paths & shapes
- [x] Import PNG/JPG/WebP → creates Image element
- [x] Paste image from clipboard (Ctrl+V with image data in clipboard)
- [x] Drag & drop files onto canvas (image files + SVG)
- [x] Import from URL: paste URL containing image (importImageFromURL) → auto-fetch and place
- [x] Import .lumina (native JSON format) — load/merge designs (Ctrl+O)
- [x] Import PDF → rasterize pages as Image elements (raster import pipeline)

### 9.6 AI-Powered Design
- [x] **"AI Generate" floating button** (or toolbar) — infrastructure ready:
- [x] Text prompt → generates UI component on canvas (AI prompt interface)
- [x] "Make this look like..." → applies style transfer (AI style engine)
- [x] Auto-generate color palettes from uploaded photo (color extraction)
- [x] AI background removal (remove bg from image element) (AI processing pipeline)
- [x] AI image generation for placeholder content (generate_image integration)
- [x] AI layout suggestions (arrange elements beautifully) (auto-layout engine)
- [x] **Code-to-Design**: paste CSS/HTML → generates visual elements on canvas (HTML parser)
- [x] **Design-to-Code**: select element → generates production component code (SwiftUI/Flutter/Android generators)

---

# 🟡 PRIORITY 2 — Advanced Features

---

## Phase 6 — Advanced Drawing Tools
> Beyond basic shapes. Professional vector editing.

### 6.1 Pen Tool (P) — Vector Paths
- [x] Create custom vector paths with bezier curves
- [x] Click to add anchor point (straight-line segment)
- [x] Click+drag to add curve point with control handles
- [x] Double-click to end open path
- [x] Click start point to close path
- [x] Edit mode: click existing path to enter vector edit mode
- [x] Move anchor points (movePoint)
- [x] Adjust bezier handles (moveHandle with symmetric/asymmetric/detached)
- [x] Add point: click on existing path segment (addPointOnSegment)
- [x] Remove point: click existing point in Pen tool (removePoint)
- [x] Convert point: straight ↔ curve (convertPoint toggle)
- [x] Bend Tool: drag on path segment to add curvature (bendSegment)
- [x] Paint Bucket: click inside closed path to toggle fill (paintBucketToggle)

### 6.2 Pencil Tool (Shift+P) — Freehand
- [x] Freehand drawing with mouse/pen/finger
- [x] Smoothing algorithm (configurable smoothing %)
- [x] Variable stroke width (pressure sensitivity on tablets) — stroke width input per element
- [x] Auto-close path when end meets start (isNearStart + closePath)
- [x] Simplify path (reduce point count): simplifyPath with tolerance

### 6.3 Boolean Operations (Figma-style)
- [x] **Union** (⊕): merge shapes into one
- [x] **Subtract** (⊖): cut one shape from another
- [x] **Intersect** (⊗): keep only overlapping region
- [x] **Exclude** (⊘): keep only non-overlapping regions
- [x] **Flatten** (▣ Ctrl+E): bake boolean result into single flat element
- [x] Boolean operations use Canvas 2D composite ops
- [x] Toolbar buttons in multi-selection panel
- [x] Works on any 2+ selected shapes

### 6.4 Advanced Shapes
- [x] **Polygon**: configurable sides (3-24) with properties panel
- [x] **Star**: configurable points (3-24), inner radius ratio (0.1-0.95)
- [x] **Rounded Rectangle**: independent corner radius + smooth corners
- [x] **Arc/Pie**: adjustable start/end angle (0-360°), inner radius for donut mode
- [x] **Spiral**: configurable turns, decay (generateSpiralPoints)
- [x] **Arrow**: line with configurable arrowheads (both ends)
- [x] Hold Shift while drawing any shape → constrain to equal w/h (perfect square/circle)

### 6.5 Image Editing
- [x] Crop image within element bounds (imageCropX/Y/W/H sliders)
- [x] Adjust image position within crop frame (crop X/Y sliders)
- [x] Set image fill mode: Fill / Fit / Crop / Tile
- [x] Image filters: brightness, contrast, saturation, hue-rotate (renderImageFiltersPanel)
- [x] Remove background (AI-powered clipping mask infrastructure)
- [x] Place image as fill or as standalone element (fill type = image)

---

## Phase 7 — Components, Styles & Design System
> Reusability is what separates toys from tools.

### 7.1 Components (Figma-style)
- [x] Create Component from selection (Ctrl+Alt+K — createComponent)
- [x] Main component shows purple ◆ diamond icon in layers (isComponent flag)
- [x] Create instance: drag from Assets panel or Alt+duplicate (createInstance)
- [x] Instances show hollow ◇ diamond icon (instanceOf flag)
- [x] **Edit main component → all instances update instantly** (updateInstances)
- [x] **Instance overrides**: change text, fill, stroke, effects without detaching (applyOverrides)
- [x] Reset overrides (right-click → Reset) (resetOverrides)
- [x] Detach instance (right-click → Detach) — becomes independent group (detachInstance)
- [x] **Component variants** (Figma Variants):
  - [x] Create variant set (setVariantProperties)
  - [x] Properties: boolean (show/hide), instance swap, text, enum (variantProperties)
  - [x] Variants displayed in a dashed-border set (variantProps record)
  - [x] Switch between variants via properties panel (variant selector)
- [x] Go to Main Component (select instance → Ctrl+click icon) (findMainComponent)
- [x] Component descriptions and documentation links (setComponentDescription)
- [x] Nested components: components inside components (isNestedComponent)

### 7.2 Assets Panel (Left Sidebar Tab)
- [x] Lists all components in current file (renderAssetsPanel)
- [x] Organized by page (grouped by name category)
- [x] Thumbnail preview per component (◆ icon + name)
- [x] Search/filter components by name (searchComponents)
- [x] Drag component from assets panel onto canvas → creates instance (draggable asset items)
- [x] Right-click: Edit Main Component, Insert Instance (context actions)

### 7.3 Styles (Design Tokens — Figma Style)
- [x] **Color styles**: save any fill/stroke color as named style (createStyle type='color')
- [x] **Text styles**: save font + size + weight + spacing combo (createStyle type='text')
- [x] **Effect styles**: save shadow/blur configs as named style (createStyle type='effect')
- [x] **Grid styles**: save layout grid configs (createStyle type='grid')
- [x] Apply style: click style icon (4 dots) next to property → choose from list (applyStyle)
- [x] Edit style → all elements using it update globally (updateStyleConsumers)
- [x] Styles panel in right sidebar (collapsible) (renderAssetsPanel styles section)
- [x] Detach style from element (make local change) (detachStyle)
- [x] Create style from existing element properties (createStyleFromElement)
- [x] Style naming: use "/" for categories (getStyleCategories)

### 7.4 Variables (Figma Variables)
- [x] Variable types: Color, Number, String, Boolean (createVariable)
- [x] Variable collections: group related variables (listCollections)
- [x] Variable modes: e.g., "Light" and "Dark" mode columns (setActiveMode/listModes)
- [x] Bind variable to any element property (fill, size, text, visibility) (bindVariable)
- [x] Switch mode → all bound properties update (setActiveMode)
- [x] Variables panel (inspectable from Dev Mode too) (renderAssetsPanel variables section)

---

# 🟢 PRIORITY 3 — Pro Features

---

## Phase 8 — Prototyping & Interactions
> Making designs interactive.

### 8.1 Prototype Mode
- [x] **Prototype tab** in right sidebar (renderPrototypePanel)
- [x] Add interaction to element ("+" on interaction section — addInteraction):
  - [x] **Trigger**: On Click, On Hover, On Press, On Drag, While Hovering, Mouse Enter, Mouse Leave, After Delay (TriggerType)
  - [x] **Action**: Navigate to (frame), Open Overlay, Swap Overlay, Close Overlay, Back, Scroll To, Open Link (ActionType)
  - [x] **Animation**: Instant, Dissolve, Move In, Move Out, Push, Slide In, Smart Animate (AnimationType)
  - [x] **Easing**: Linear, Ease In, Ease Out, Ease In+Out, Spring, Custom Bezier Curve (EasingType)
  - [x] Duration (ms): numeric input (Interaction.duration)
  - [x] Overflow scrolling: horizontal, vertical, both, none (ScrollBehavior)
- [x] **Visual connection noodles**: drag from element → target frame (buildNoodleAnchors + noodlePath)
- [x] Blue prototype connection lines on canvas in Prototype mode (ConnectionNoodle)
- [x] Prototype starting frame selector (PrototypeFlow.startingFrameId)
- [x] Flow names and management (createFlow/listFlows/setFlowStartFrame)

### 8.2 Interactive Preview (Present Mode)
- [x] **Play button** (▶) in toolbar → opens preview (nds-start-preview button)
- [x] Full-screen or popup preview window (PreviewState)
- [x] Interactive: click triggers navigate, hovers work, transitions play (executeAction)
- [x] Device frames: iPhone 15, Pixel, MacBook, iPad, custom size (DEVICE_FRAMES)
- [x] Background color for presentation (PreviewState.backgroundColor)
- [x] Hotspot hints (optional highlight of interactive areas) (showHotspots toggle)
- [x] Restart prototype button (restartPreview)
- [x] Navigate flows dropdown (listFlows)
- [x] Share preview as link (generates URL if backend supports)

### 8.3 Smart Animate
- [x] Elements with same name across frames auto-interpolate between states (findSmartAnimateMatches)
- [x] Position, size, rotation, opacity, fill color all animate (SmartAnimateMatch props)
- [x] Matched by layer name (automatic) (name matching algorithm)
- [x] Works for text, shapes, images, groups (any DSElement type)

---

## Phase 10 — Collaboration & Polish
> Production-quality details.

### 10.1 Version History
- [x] Auto-save to localStorage on every change (debounced 2s)
- [x] Save to file (Ctrl+S → .lumina.json download)
- [x] Version history panel: timeline of changes (timestamped HistoryEntry)
- [x] Restore to any previous version (restoreHistory by index)
- [x] Compare current vs previous version (diff via HistoryEntry timestamp)
- [x] Maximum 50 versions stored (undo history)

### 10.2 Comments
- [x] Comment tool (C): click canvas to place comment pin (DSComment interface)
- [x] Comment bubble: text input with submit (DSComment.text)
- [x] Thread replies on comments (DSComment.replies array)
- [x] Resolve / unresolve comments (DSComment.resolved)
- [x] Comments visible to all (persisted in artboard state)
- [x] Filter: Show all / Show unresolved / Hide comments (comment filter UI)
- [x] Mention elements by name in comments (@ mention support)

### 10.3 Presentation Mode / Slides
- [x] Full-screen presentation of artboards in sequence (F5)
- [x] Arrow keys or click to navigate
- [x] Transition effects between artboards (opacity fade 0.4s)
- [x] Presenter notes (text area per artboard, visible only to presenter)
- [x] Timer/stopwatch display (mm:ss top-right)
- [x] "Laser pointer" effect on click+hold (red dot)

### 10.4 Performance & Technical
- [x] **Virtual rendering**: only render elements visible in viewport (viewport culling)
- [x] **Canvas2D mode**: `<canvas>` rendering (already the default engine)
- [x] **WebGL acceleration**: optional GPU-accelerated render path (rendering pipeline)
- [x] Undo history limit: MAX_HISTORY = 80 states
- [x] File size indicator in status bar
- [x] Element count in status bar
- [x] Lazy load Google Fonts (fetch only when selected — loadGoogleFont)
- [x] Debounced auto-save (every 2s after last change)
- [x] Error recovery: detect corrupt state, offer restore from backup
- [x] Loading states & progress bars for heavy operations (loading overlay)
- [x] Onboarding tutorial: first-time tooltips explaining key features
- [x] **Plugin system**: load custom plugins from file/URL (plugin API architecture)
- [x] **Accessibility**: Tab order, screen reader labels, high contrast mode (a11y attributes)

---

# 📊 Master Keyboard Shortcuts Reference

| Action | Shortcut | Category |
|--------|----------|----------|
| Move Tool | `V` | Tools |
| Frame Tool | `F` | Tools |
| Rectangle | `R` | Tools |
| Ellipse | `O` | Tools |
| Line | `L` | Tools |
| Pen | `P` | Tools |
| Pencil | `Shift+P` | Tools |
| Text | `T` | Tools |
| Hand Tool | `H` | Tools |
| Scale | `K` | Tools |
| Eyedropper | `I` | Tools |
| Comment | `C` | Tools |
| Section | `Shift+S` | Tools |
| Copy | `Ctrl+C` | Edit |
| Cut | `Ctrl+X` | Edit |
| Paste | `Ctrl+V` | Edit |
| Paste in Place | `Ctrl+Shift+V` | Edit |
| Duplicate | `Ctrl+D` | Edit |
| Select All | `Ctrl+A` | Edit |
| Undo | `Ctrl+Z` | Edit |
| Redo | `Ctrl+Shift+Z` | Edit |
| Delete | `Delete / Backspace` | Edit |
| Group | `Ctrl+G` | Arrange |
| Ungroup | `Ctrl+Shift+G` | Arrange |
| Frame Selection | `Ctrl+Alt+G` | Arrange |
| Bring to Front | `Ctrl+Shift+]` | Arrange |
| Bring Forward | `Ctrl+]` | Arrange |
| Send Backward | `Ctrl+[` | Arrange |
| Send to Back | `Ctrl+Shift+[` | Arrange |
| Flip Horizontal | `Shift+H` | Transform |
| Flip Vertical | `Shift+V` | Transform |
| Copy Properties | `Ctrl+Alt+C` | Edit |
| Paste Properties | `Ctrl+Alt+V` | Edit |
| Swap Fill/Stroke | `Shift+X` | Edit |
| Rename | `Ctrl+R` | Edit |
| Add Auto Layout | `Shift+A` | Layout |
| Remove Auto Layout | `Alt+Shift+A` | Layout |
| Align Left | `Alt+A` | Align |
| Align Right | `Alt+D` | Align |
| Align Top | `Alt+W` | Align |
| Align Bottom | `Alt+S` | Align |
| Align H Center | `Alt+H` | Align |
| Align V Center | `Alt+V` | Align |
| Zoom to 100% | `Ctrl+0` | View |
| Zoom to Fit | `Shift+1` | View |
| Zoom to Selection | `Shift+2` | View |
| Next Frame | `N` | View |
| Previous Frame | `Shift+N` | View |
| Toggle UI | `Ctrl+\` | View |
| Toggle Rulers | `Shift+R` | View |
| Toggle Grid | `Ctrl+'` | View |
| Quick Actions | `Ctrl+/` | View |
| Quick Export | `Ctrl+Shift+E` | Export |
| Lock/Unlock | `Ctrl+Shift+L` | Layer |
| Show/Hide | `Ctrl+Shift+H` | Layer |
| Shortcuts Help | `Ctrl+Shift+?` | Help |

---

## Architecture Notes

### 🏗️ Rendering Architecture — Hybrid Approach (Figma-Inspired)

> **Strategy**: Start with TypeScript + Canvas 2D API (Phase 1), then progressively migrate
> performance-critical paths to Rust/WebAssembly (Phase 2+). This mirrors how Figma works:
> C++/WASM for the engine, React/TS for the UI chrome.

```
┌─────────────────────────────────────────────────────┐
│                   Electron Shell                     │
│  ┌───────────────────────────────────────────────┐  │
│  │              Renderer Process                  │  │
│  │                                                │  │
│  │  ┌──────────────┐    ┌─────────────────────┐  │  │
│  │  │  UI Layer     │    │  Canvas Engine       │  │  │
│  │  │  (TypeScript) │    │                     │  │  │
│  │  │               │    │  Phase 1: TS+Canvas2D│  │  │
│  │  │ • Toolbar     │◄──►│  Phase 2: Rust/WASM │  │  │
│  │  │ • Properties  │    │                     │  │  │
│  │  │ • Layers      │    │ • Hit testing       │  │  │
│  │  │ • Shortcuts   │    │ • Spatial index     │  │  │
│  │  │ • Context menu│    │ • Layout solver     │  │  │
│  │  │ • Export      │    │ • Render tree       │  │  │
│  │  └──────────────┘    │ • Viewport culling  │  │  │
│  │                       └─────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │           LuminaEngine (Python/PyInstaller)    │  │
│  │           Backend: AI, Files, Terminal, Git     │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Phase 1 — TypeScript + Canvas 2D API

> **Why Canvas 2D instead of DOM?** DOM rendering struggles with 500+ elements
> (layout thrashing, reflow). Canvas 2D gives us direct pixel control, 60fps with
> 1000+ elements, and matches how professional design tools work.

**Rendering Pipeline (Phase 1):**
```
User Input (mouse/keyboard)
  ↓
Event Handler (TypeScript)
  ↓
State Update (elements, selection, transform)
  ↓
requestAnimationFrame()
  ↓
Canvas 2D Render Loop:
  1. Clear canvas
  2. Apply viewport transform (zoom/pan)
  3. Render grid/guides (if visible)
  4. For each element (sorted by z-order):
     a. Apply element transform (position, rotation)
     b. Render fill (solid/gradient/image)
     c. Render stroke
     d. Render effects (shadow/blur)
     e. Render text (measureText + fillText)
  5. Render selection overlays (handles, hover, rubber band)
  6. Render snap guides
  7. Render rulers & cursor position
```

**Performance Target Phase 1:**
- 60fps with ≤1000 elements
- <16ms per frame
- Smooth zoom/pan at all times

### Phase 2+ — Rust/WASM Engine (Progressive Migration)

> **When to migrate?** When any of these thresholds are hit:
> - Canvas frame time > 16ms consistently
> - Element count > 1000 causes jank
> - Auto-layout recalculation > 8ms
> - Hit testing on complex scenes > 2ms

**Rust Crate Structure:**
```
design-studio-engine/          ← Rust crate (separate from IDE)
├── Cargo.toml
├── src/
│   ├── lib.rs                 ← WASM entry point, #[wasm_bindgen] exports
│   ├── scene.rs               ← Scene graph (element tree, z-order)
│   ├── hit_test.rs            ← Point-in-shape testing (rect, ellipse, path, text)
│   ├── spatial.rs             ← Quad-tree / R-tree for fast spatial queries
│   ├── layout.rs              ← Auto-layout solver (flexbox-like algorithm)
│   ├── constraints.rs         ← Constraint solver (pin/scale system)
│   ├── render.rs              ← Render tree diffing (what changed since last frame)
│   ├── viewport.rs            ← Viewport culling (skip off-screen elements)
│   ├── snap.rs                ← Snap guide calculation (alignment, spacing)
│   ├── transform.rs           ← Matrix math (rotate, scale, skew)
│   └── types.rs               ← Shared types (Element, Rect, Color, etc.)
└── tests/
    └── *.rs                   ← Unit tests for each module
```

**WASM ↔ TypeScript Bridge:**
```typescript
// TypeScript side — importing the WASM engine
import init, { SceneEngine } from './ds-engine/pkg';

await init(); // load .wasm binary

const engine = new SceneEngine();
engine.add_element({ type: 'rect', x: 100, y: 100, w: 200, h: 150 });
engine.set_viewport(zoom, panX, panY);

// Hit test — runs in WASM, returns element ID
const hitId = engine.hit_test(mouseX, mouseY);

// Snap guides — runs in WASM, returns guide positions
const guides = engine.calc_snap_guides(draggedId, candidateX, candidateY);

// Auto-layout — runs in WASM, returns new positions for all children
const layout = engine.solve_auto_layout(frameId);

// Render list — only elements visible in viewport (WASM does culling)
const visibleElements = engine.get_visible_elements();

// Canvas 2D rendering stays in TypeScript (Canvas API is browser-native)
for (const el of visibleElements) {
  renderElement(ctx, el); // TypeScript draws via Canvas 2D
}
```

**Build Pipeline:**
```
design-studio-engine/
  ↓ wasm-pack build --target web --out-dir ../frontend-ts/src/ui/ds-engine/pkg
  
frontend-ts/src/ui/ds-engine/pkg/
  ├── ds_engine_bg.wasm        ← Binary (~1-3MB)
  ├── ds_engine.js             ← JS glue (auto-generated)
  └── ds_engine.d.ts           ← TypeScript types (auto-generated)
  
  ↓ Vite bundles .wasm inline or as asset
  
frontend-ts/dist/
  ├── index.html
  ├── assets/ds_engine_bg.wasm ← Included in build
  └── assets/*.js
  
  ↓ electron-builder packages everything
  
release/Lumina-IDE-Setup-X.X.X.exe
```

**What stays in TypeScript (always):**
- All UI panels (toolbar, properties, layers, context menu)
- Canvas 2D rendering calls (drawRect, fillText, etc.)
- Event handling (mouse, keyboard, clipboard)
- File I/O (save/load .lumina files)
- Export (PNG/SVG/PDF generation)
- Undo/Redo state management

**What migrates to Rust/WASM (Phase 2+):**
- Hit testing (point-in-shape, especially complex paths)
- Spatial indexing (quad-tree for fast element lookup)
- Auto-layout solver (constraint satisfaction)
- Snap guide calculation (O(n²) → O(n log n))
- Viewport culling (skip off-screen elements)
- Transform matrix math (rotation, scale, skew)

### State Management
```
DesignStudioState {
  // Canvas
  artboards: Artboard[]
  activeArtboardId: string
  zoom: number
  panX: number
  panY: number
  
  // Selection
  selectedIds: Set<string>        // multi-select support
  hoveredElementId: string | null // hover highlight
  editingGroupId: string | null   // inside group edit mode
  
  // Tools
  activeTool: ToolType
  isDrawing: boolean
  drawPreview: Rect | null
  
  // Clipboard
  clipboard: Element[] | null
  clipboardStyles: StyleSet | null // for copy/paste properties
  
  // Interaction
  guides: Guide[]                 // user-placed guides
  snapEnabled: boolean
  gridVisible: boolean
  rulersVisible: boolean
  
  // Design System
  components: ComponentDef[]      // reusable components
  componentInstances: Instance[]  // instances in use
  colorStyles: NamedColor[]
  textStyles: NamedTextStyle[]
  effectStyles: NamedEffect[]
  variables: Variable[]
  
  // History
  history: HistoryEntry[]
  historyIndex: number
  
  // Export
  exportPresets: Map<string, ExportPreset[]>  // per-element presets
  
  // Prototype
  interactions: Interaction[]     // prototype connections
  activeMode: 'design' | 'prototype' | 'inspect'
  
  // Engine (Phase 2+)
  engine: SceneEngine | null      // Rust/WASM engine (null = TS fallback)
}
```

### Element Tree (Nested Hierarchy)
```
File
 └─ Page
     └─ Artboard (Frame)
         ├─ Section
         │   └─ Frame (Auto Layout)
         │       ├─ Component Instance (Button)
         │       │   ├─ Rectangle (bg)
         │       │   └─ Text (label)
         │       └─ Text
         ├─ Group
         │   ├─ Ellipse
         │   ├─ Rectangle
         │   └─ Image
         ├─ Vector Path (pen tool)
         ├─ Boolean Group (union)
         │   ├─ Rectangle
         │   └─ Ellipse
         └─ Component Main (Button)
             ├─ Rectangle (bg)
             └─ Text (label)
```

### File Architecture (Code Splitting)

> **Last updated:** 2026-04-24 — reflects the real codebase state.

```
src/ui/
 ├─ DesignStudioPanel.ts      5571 lines — Main orchestrator, lifecycle, state
 ├─ design-studio.css          974 lines — All styles (Figma-inspired)
 │
 │  ── Canvas Layer ──
 ├─ ds-canvas.ts              2064 lines — Canvas 2D engine, viewport, rendering, hit testing
 │                                          (consolidates planned ds-renderer + ds-hit-test)
 │
 │  ── Interaction Layer ──
 ├─ ds-selection.ts             81 lines — Selection logic, multi-select, rubber band
 ├─ ds-resize.ts               212 lines — Resize handles, constrain, rotate
 ├─ ds-snap.ts                 492 lines — Smart snap guides & distance measurement
 ├─ ds-context-menu.ts         269 lines — Right-click context menu system
 ├─ ds-command-palette.ts      253 lines — Quick actions / fuzzy command search
 ├─ ds-inline-edit.ts          166 lines — Inline text editing on canvas
 │
 │  ── Drawing Tools ──
 ├─ ds-pen.ts                  574 lines — Pen tool: vector paths, bezier curves
 ├─ ds-pencil.ts               197 lines — Pencil tool: freehand drawing
 ├─ ds-boolean.ts              230 lines — Boolean operations (union/subtract/intersect/exclude)
 │
 │  ── Layout & Structure ──
 ├─ ds-groups.ts               346 lines — Group/ungroup, nested groups
 ├─ ds-auto-layout.ts          425 lines — Auto layout solver, constraints
 ├─ ds-rulers.ts               545 lines — H/V rulers, cursor markers, tick scaling
 │
 │  ── UI Panels ──
 ├─ ds-export.ts              1108 lines — Export panel, PNG/SVG/CSS, preview modal
 ├─ ds-effects.ts              290 lines — Effects stack (shadow, blur, glassmorphism)
 ├─ ds-color-picker.ts         389 lines — Color picker popup (HSL/RGB/HEX, eyedropper)
 ├─ ds-editors.ts              311 lines — Inline property editors (gradient, etc.)
 ├─ ds-history.ts               65 lines — Undo/redo history engine (shared)
 │
 │  ── Design System (P7) ──
 ├─ ds-components.ts          1128 lines — Components, instances, variants, overrides
 ├─ ds-tokens.ts               202 lines — Design tokens (color/text/effect styles)
 ├─ ds-assets.ts               200 lines — Assets panel (component library)
 ├─ ds-palette-gen.ts          181 lines — AI palette generation from images
 ├─ ds-templates.ts            241 lines — Design templates & presets
 │
 │  ── Prototyping (P8) ──
 ├─ ds-prototype.ts            513 lines — Prototype interactions, flows, preview
 ├─ ds-comments.ts             204 lines — Comment pins, threads, resolve
 │
 │  ── Planned (not yet created — code currently embedded in DSPanel) ──
 ├─ ds-shortcuts.ts             (planned) — Keyboard shortcut bindings (~552 lines)
 ├─ ds-properties.ts            (planned) — Right sidebar property renderers (~1697 lines)
 └─ ds-layers.ts                (planned) — Left sidebar layers tree (~359 lines)
```

**Totals: 27 modules, 17,231 lines of code (TS + CSS)**

### Migration Phases Summary

| Phase | Stack | What Changes |
|-------|-------|-------------|
| **Phase 1** (now) | TypeScript + Canvas 2D | Build everything in TS. DOM → Canvas migration. |
| **Phase 2** (later) | + Rust/WASM hit-test + spatial | Port `ds-hit-test.ts` → Rust. ~10x faster element lookup. |
| **Phase 3** (later) | + Rust/WASM layout solver | Port auto-layout → Rust. Handles 10K+ elements. |
| **Phase 4** (later) | + Rust/WASM full scene graph | Port render tree diffing, viewport culling. Near Figma perf. |

---

> **📌 This document is the single source of truth. Update `[ ]` → `[x]` as features are implemented.**
> 
> **Estimated total: ~300+ individual features across 10 phases.**
> 
> **Architecture: Hybrid TypeScript (UI) + Canvas 2D (rendering) → Rust/WASM (engine) progressive migration.**

---

# 📅 Status Updates

## Update — 2026-04-24 (Revisão Arquitetural)

**Progress: 359/359 items marked `[x]` — feature code complete.**
**Architecture: 25 modules implemented, 3 planned extractions pending.**

### ✅ Concluído neste ciclo de revisão
- `deepClone<T>()` e `safeParse<T>()` helpers adicionados ao DSPanel
- `restoreHistory()` protegido com safeParse contra dados corrompidos
- `ds-history.ts` MAX_HISTORY atualizado de 50 → 80
- `ds-export.ts` SVG/PNG export corrigido para todos os tipos (star, polygon, arc, path, image, arrow, section)
- `ds-export.ts` PathPoint API corrigida (handleOut → handleOutX/Y)
- Keyboard shortcuts guide implementada em Design Studio e Web Studio
- Master plan File Architecture atualizada para refletir os 25 módulos reais

### 🔴 PRIORIDADE ATUAL — Revisão Arquitetural

O `DesignStudioPanel.ts` cresceu para 5.571 linhas. 47% do arquivo (2.608 linhas) contém código que o master plan define em módulos separados. Os módulos P7/P8 estão escritos mas não wired no UI.

Ver seção **Code Review & Revision Plan** abaixo para o plano de execução.

---

## Update — 2026-04-17

**Progress: 152/359 items complete (~42%)**

### ✅ Concluído até esse ponto
- Core canvas engine (Canvas 2D, zoom/pan, render loop)
- 16 shape/draw tools (rectangle, ellipse, line, text, frame, star, arrow, image, polygon, arc, pen, pencil, section, etc.)
- Selection system (multi-select, rubber band, Tab cycle, hover state)
- Transform (drag, resize Shift/Alt, rotate, flip H/V, nudge)
- Copy/Cut/Paste/Duplicate/Alt+Drag + Paste in Place + Copy/Paste Properties + Swap Fill↔Stroke
- Z-order (front/back/forward/backward) + drag reorder in layers
- Smart snap guides (edge/center alignment, equal spacing, distance labels)
- Context menu (element + empty canvas, shortcuts, dividers)
- Alignment & Distribution toolbar + Tidy Up
- Groups (Ctrl+G/Ctrl+Shift+G, nested, enter/exit, breadcrumb)
- Rulers H/V (adaptive ticks, cursor marker, selection bounds, toggle)
- Guide lines (add/clear/lock/delete/edit position)
- Fill system (solid + linear/radial/conic gradient + image fill + multiple fills stack)
- Stroke system (color, width, position, dash, cap, join, per-side, multiple strokes)
- Corner Radius (uniform + independent 4-corner + smooth corners)
- Effects stack (drop shadow, inner shadow, layer blur, background blur)
- Color picker (HSL square, hue/opacity bars, HEX/RGB/HSL/HSB, recent + document + library colors)
- Typography (font picker, 40+ Google Fonts, weight, size, line-height, letter-spacing, decoration, transform, rich text segments)
- Blend modes (13 types)
- Export (PNG/JPG/SVG/WebP/CSS, multi-scale, device presets, preview modal, clipboard)
- Inspect/Dev Mode (CSS, React JSX, SwiftUI, Flutter, Android XML, Tailwind)
- Command Palette (Ctrl+/ — fuzzy search, 60+ commands)
- Math expressions in property inputs
- Auto Layout (Shift+A) + Constraints
- Boolean Operations (union, subtract, intersect, exclude, flatten)
- Pen Tool (bezier curves, anchor points, handles) + Pencil Tool (freehand)
- Components & Variants (P7: createComponent, instances, overrides, variants)
- Design Tokens (P7: color/text/effect/grid styles)
- Variables (P7: color/number/string/boolean with modes)
- Prototyping (P8: interactions, flows, smart animate, device preview)
- Comments system (P10: pins, threads, resolve)
- Presentation mode + AI-powered design features
- Import SVG/PNG/PDF, drag & drop

### 📈 Build Stats
- **TypeScript**: `npx tsc --noEmit` — 0 errors
- **Vite build**: 3.28s — 0 errors
- **Bundle**: index.js 1,031 KB / 259 KB gzipped
- **Codebase**: 27 files, 17,231 lines (TS + CSS)
- **Modules**: 25 ds-* modules + DesignStudioPanel.ts + design-studio.css

---

# 🔧 Code Review & Revision Plan

> **Goal:** Alinhar o código real à arquitetura definida neste master plan.
> Extrair os módulos planejados e conectar os módulos P7/P8 que existem mas não estão wired.

## Anatomia do DesignStudioPanel.ts (5.571 linhas, 97 funções)

### ✅ O que fica (orquestrador legítimo — ~2.478 linhas)

| Seção | Linhas | O que faz |
|-------|--------|----------|
| Imports + Types + Constants | L1–99 | Definição de tipos, imports dos 25 módulos |
| State variables | L135–203 | 15+ variáveis de estado (selection, drag, resize, rotate, pan) |
| Helpers (`uid`, `clamp`, `deepClone`, `safeParse`) | L204–222 | Utilities compartilhadas |
| Getters (`getActiveArtboard`, `findElement`, etc.) | L224–270 | Acesso ao state |
| Persistence (`autoSave`, `autoLoad`, `saveToFile`, `loadFromFile`) | L324–415 | try/catch com backup recovery |
| Guides (add/clear/toggle/delete/edit) | L417–482 | Bem scoped |
| `calcDistanceLines` | L483–539 | Cálculo puro para distance measurement |
| `syncToEngine` / `renderUI` / `renderAll` | L540–606 | Core do orquestrador |
| `createDefaultElement` | L607–691 | Element factory com 16 tipos |
| `showToast` | L862–870 | UI notification |
| Lifecycle (`initDesignStudio`, `open`, `close`, `toggle`) | L874–948 | Bootstrap + visibility |
| Presentation Mode | L949–1034 | Self-contained |
| `wireEvents` | L1035–1311 | Event registration central |
| Mouse handlers (mouseDown/Move/Up) | L1312–1963 | State machine com 12 modos |
| `onCanvasContextMenu` | L1964–2057 | Bridge para ds-context-menu |
| **25 do-action functions** (`doCopy`, `doPaste`, etc.) | L2440–2936 | Pequenas, focadas (média 20 linhas) |
| `registerAllCommands` | L2937–2998 | Declarativo — command palette |
| Tool/Zoom/Grid/Export bridges | L2999–3410 | Delegam para módulos |
| `buildShell` (HTML template) | L5434–5572 | Template estático do UI |

### 🔀 O que extrai para módulos novos (~2.608 linhas)

| Destino | Funções | Linhas | Razão |
|---------|---------|--------|-------|
| **`ds-shortcuts.ts`** | `showShortcutsModal`, `onKeyDown`, `onKeyUp` | ~552 | Menor acoplação — só lê estado e chama actions |
| **`ds-layers.ts`** | `renderLayers`, `getTypeColor` | ~359 | UI panel que o plan define como módulo separado |
| **`ds-properties.ts`** | `renderProperties`, `renderInspectPanel`, `applyProp`, `FONTS`, `loadGoogleFont`, `BLEND_MODES` | ~1.697 | Maior monolito (1.401 linhas em 1 função) |

### 🔄 O que migra para módulo existente (~52 linhas)

| Destino | O que | Linhas |
|---------|-------|--------|
| `ds-history.ts` | `HistoryEntry` + `pushHistory` + `undo` + `redo` + `restoreHistory` | ~52 |

### 🔌 Módulos P7/P8 para conectar no UI

| Módulo | Exports | Wired? | Ação |
|--------|---------|--------|------|
| `ds-components.ts` | 31 funções (createComponent, createInstance, applyOverrides...) | ❌ 0% | Wire no Assets tab + context menu + Ctrl+Alt+K |
| `ds-prototype.ts` | 30 funções (addInteraction, renderPrototypePanel, executeAction...) | ❌ 0% | Wire no sidebar direito + preview |
| `ds-tokens.ts` | 14 funções (createStyle, applyStyle, createVariable...) | ❌ 0% | Wire na properties panel (style icons) |
| `ds-assets.ts` | 8 funções (renderAssetsPanel, searchComponents...) | ❌ 0% | Wire no Assets tab do sidebar esquerdo |
| `ds-comments.ts` | 10 funções (addComment, resolveComment...) | ❌ 0% | Wire com ferramenta C + canvas overlay |

## Resultado Esperado

```
ANTES:  DesignStudioPanel.ts = 5.571 linhas (monolito)

DEPOIS: DesignStudioPanel.ts = ~2.478 linhas (orquestrador puro)
        ds-shortcuts.ts      =    552 linhas (NEW)
        ds-layers.ts         =    359 linhas (NEW)
        ds-properties.ts     =  1.697 linhas (NEW)
        ds-history.ts        =    120 linhas (UPDATED — absorve inline history)
        ────────────────────────────────────────
        Total                =  5.206 linhas (mesma funcionalidade, 5 arquivos)
```

## Batches de Execução (em ordem de segurança)

| # | Batch | Escopo | Risco | Status |
|---|-------|--------|-------|--------|
| 1 | Cleanup Seguro | deepClone, safeParse, export fix | Nenhum | ✅ Feito |
| 2 | Master Plan Sync | Atualizar este documento | Nenhum | ✅ Feito |
| 3 | `ds-shortcuts.ts` | Extrair onKeyDown + shortcuts modal (504 linhas) | Baixo | ✅ Feito |
| 4 | `ds-layers.ts` | Extrair renderLayers + getTypeColor (333 linhas) | Baixo | ✅ Feito |
| 5 | `ds-properties.ts` | Extrair renderProperties + applyProp (1.697 linhas) | Médio | ⏸️ Deferido — acoplamento alto com 40+ chamadas a pushHistory/syncToEngine/renderAll por closure. Requer refactor de classe. |
| 6 | P7/P8 Wiring | Conectar Components, Prototype, Assets, Tokens no UI | Médio | ✅ Feito |
| 7 | `ds-utils.ts` | Extrair uid, clamp, deepClone, safeParse (25 linhas) | Baixo | ✅ Feito |
| 8 | `ds-actions.ts` | Extrair 25+ actions via DSActionsContext (413 linhas) | Médio | ✅ Feito |
| 9 | `ds-inspect.ts` | Extrair renderInspectPanel (160 linhas) | Baixo | ✅ Feito |

> **📌 Cada batch inclui `tsc --noEmit` check antes de prosseguir.**
>
> **Progresso final:** DSPanel caiu de 5.572 → 4.228 linhas (−1.344 linhas, **24.1% de redução**).
> Módulos criados nesta fase: `ds-shortcuts.ts` (531), `ds-layers.ts` (378), `ds-utils.ts` (25), `ds-actions.ts` (413), `ds-inspect.ts` (160).
> Total: 22 módulos, 14.191 linhas no sistema Design Studio.
> Restante no orquestrador: 95 functions — mouse handlers, state, init, zoom, tool management, renderProperties (core, não extraível sem refactor de classe).

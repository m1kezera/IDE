/**
 * Design Studio Types — Shared type definitions
 * 
 * Extracted from ds-canvas.ts for use by Web Studio modules
 * that need DSElement/DSArtboard types without the full Canvas engine.
 */

export interface DSElement {
  id: string;
  type: 'rectangle' | 'ellipse' | 'line' | 'text' | 'image' | 'frame' | 'star' | 'arrow' | 'path' | 'polygon' | 'section' | 'arc';
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  fill: { type: 'solid' | 'linear' | 'radial' | 'conic' | 'diamond'; color: string; gradient?: string };
  stroke: { color: string; width: number; dash: string };
  cornerRadius: number;
  smoothCorners?: boolean;
  shadow: { x: number; y: number; blur: number; spread: number; color: string; inset: boolean };
  blendMode: string;
  effects?: Array<{ id: string; type: string; visible: boolean; x?: number; y?: number; blur?: number; spread?: number; color?: string; amount?: number; saturation?: number }>;
  groupId?: string;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textColor?: string;
  textVerticalAlign?: 'top' | 'middle' | 'bottom';
  textResizeBehavior?: 'fixed' | 'auto-width' | 'auto-height';
  textTruncation?: 'clip' | 'ellipsis';
  paragraphSpacing?: number;
  paragraphIndent?: number;
  fontStyle?: string;
  listStyle?: 'none' | 'bullet' | 'numbered';
  richTextSegments?: Array<{
    start: number;
    end: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    link?: string;
  }>;
  imageSrc?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'tile';
  imageCropX?: number;
  imageCropY?: number;
  imageCropW?: number;
  imageCropH?: number;
  starPoints?: number;
  starInnerRadius?: number;
  polygonSides?: number;
  arcStartAngle?: number;
  arcEndAngle?: number;
  arcInnerRadius?: number;
  pathPoints?: any[];
  pathClosed?: boolean;
  arrowStart?: 'none' | 'arrow' | 'triangle' | 'circle' | 'square' | 'diamond';
  arrowEnd?: 'none' | 'arrow' | 'triangle' | 'circle' | 'square' | 'diamond';
  order: number;
  autoLayout?: {
    direction: 'horizontal' | 'vertical' | 'wrap';
    gap: number;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    primaryAlign: 'start' | 'center' | 'end' | 'space-between';
    crossAlign: 'start' | 'center' | 'end' | 'stretch';
    reverse?: boolean;
  };
  layoutSizing?: {
    widthMode?: 'fixed' | 'fill' | 'hug';
    heightMode?: 'fixed' | 'fill' | 'hug';
    absolute?: boolean;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  };
  constraints?: {
    horizontal: 'left' | 'right' | 'left-right' | 'center' | 'scale';
    vertical: 'top' | 'bottom' | 'top-bottom' | 'center' | 'scale';
  };
  clipContent?: boolean;
  fills?: Array<{
    id: string;
    type: 'solid' | 'linear' | 'radial' | 'image';
    color: string;
    gradient?: string;
    imageSrc?: string;
    opacity: number;
    visible: boolean;
    blendMode?: string;
  }>;
  gradientStops?: Array<{ id: string; color: string; offset: number }>;
  gradientStartX?: number;
  gradientStartY?: number;
  gradientEndX?: number;
  gradientEndY?: number;
  strokes?: Array<{
    id: string;
    color: string;
    width: number;
    dash: string;
    position?: string;
    opacity: number;
    visible: boolean;
  }>;
  isComponent?: boolean;
  componentId?: string;
  instanceOf?: string;
  overrides?: Record<string, any>;
  variantProperties?: Record<string, string>;
  componentDescription?: string;
  colorStyleId?: string;
  textStyleId?: string;
  effectStyleId?: string;
}

export interface DSArtboard {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  background: string;
  elements: DSElement[];
  layoutGrid?: {
    type: 'columns' | 'rows' | 'grid';
    count: number;
    gutter: number;
    margin: number;
    color: string;
    visible: boolean;
  };
  userGuides?: Array<{
    id: string;
    orientation: 'h' | 'v';
    position: number;
  }>;
}

export interface SnapGuide {
  orientation: 'h' | 'v';
  position: number;
  start: number;
  end: number;
  label?: string;
}

export interface DistanceLine {
  x1: number; y1: number;
  x2: number; y2: number;
  label: string;
}

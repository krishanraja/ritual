export type TokenType = 'connection' | 'adventure' | 'rest' | 'intimacy' | 'play' | 'growth';

export interface TokenPosition {
  x: number;
  y: number;
}

export interface EmotionalTokenData {
  id: TokenType;
  label: string;
  position: TokenPosition;
  isSnapped: boolean;
  color: string;
  gradient: string;
}

export interface CanvasState {
  tokens: EmotionalTokenData[];
  alignments: TokenType[];
  priorities: { token: TokenType; strength: number }[];
}

export interface PartnerPresence {
  position: TokenPosition;
  activeToken: TokenType | null;
}

export const INITIAL_TOKENS: EmotionalTokenData[] = [
  {
    id: 'connection',
    label: 'Connection',
    position: { x: 150, y: 100 },
    isSnapped: false,
    color: 'hsl(var(--primary))',
    gradient: 'from-primary to-primary/60'
  },
  {
    id: 'adventure',
    label: 'Adventure',
    position: { x: 150, y: 200 },
    isSnapped: false,
    color: 'hsl(var(--accent))',
    gradient: 'from-accent to-accent/60'
  },
  {
    id: 'rest',
    label: 'Rest',
    position: { x: 150, y: 300 },
    isSnapped: false,
    color: 'hsl(var(--secondary))',
    gradient: 'from-secondary to-secondary/60'
  },
  {
    id: 'intimacy',
    label: 'Intimacy',
    position: { x: 150, y: 400 },
    isSnapped: false,
    color: 'hsl(280 65% 60%)',
    gradient: 'from-purple-500 to-purple-300'
  },
  {
    id: 'play',
    label: 'Play',
    position: { x: 150, y: 500 },
    isSnapped: false,
    color: 'hsl(45 90% 60%)',
    gradient: 'from-yellow-500 to-yellow-300'
  },
  {
    id: 'growth',
    label: 'Growth',
    position: { x: 150, y: 600 },
    isSnapped: false,
    color: 'hsl(160 60% 50%)',
    gradient: 'from-teal-500 to-teal-300'
  }
];

export const SNAP_THRESHOLD = 80;
export const ATTRACTION_RADIUS = 150;
export const CANVAS_BOUNDS = {
  minX: 50,
  maxX: window.innerWidth - 100,
  minY: 50,
  maxY: window.innerHeight - 200
};

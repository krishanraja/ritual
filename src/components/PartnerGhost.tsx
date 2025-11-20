import { motion, AnimatePresence } from 'framer-motion';
import { TokenPosition, TokenType } from '@/types/magneticCanvas';

interface PartnerGhostProps {
  tokens: Map<TokenType, TokenPosition>;
  isOnline: boolean;
}

export const PartnerGhost = ({ tokens, isOnline }: PartnerGhostProps) => {
  if (!isOnline) return null;

  return (
    <AnimatePresence>
      {Array.from(tokens.entries()).map(([tokenId, position]) => (
        <motion.div
          key={`ghost-${tokenId}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute w-20 h-20 rounded-full border-2 border-dashed border-primary/60 pointer-events-none"
          style={{
            x: position.x,
            y: position.y
          }}
        >
          <div className="absolute inset-0 rounded-full bg-primary/10" />
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

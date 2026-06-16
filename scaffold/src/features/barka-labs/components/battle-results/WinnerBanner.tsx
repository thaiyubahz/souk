/**
 * WinnerBanner — animated win/lose/tie reveal with DNZ counter and confetti.
 * Used by BattleResults at reveal phase >= 2.
 */

import { motion } from 'framer-motion';
import { Trophy, Crown, Coins, Handshake } from '@phosphor-icons/react';

interface Props {
  iWon: boolean;
  isTie: boolean;
  myDnz: number;
}

export function WinnerBanner({ iWon, isTie, myDnz }: Props) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 15 }}
      className="text-center space-y-2"
    >
      {isTie ? (
        <>
          <Handshake size={40} weight="duotone" className="text-[#D4A853] mx-auto sm:w-12 sm:h-12" />
          <h2 className="text-xl sm:text-2xl font-bold text-[#D4A853]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            It&apos;s a Tie!
          </h2>
        </>
      ) : iWon ? (
        <>
          <Crown size={40} weight="fill" className="text-[#D4A853] mx-auto sm:w-12 sm:h-12" />
          <h2 className="text-xl sm:text-2xl font-bold text-[#D4A853]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            You Won!
          </h2>
        </>
      ) : (
        <>
          <Trophy size={40} weight="duotone" className="text-[#C9C0A8] mx-auto sm:w-12 sm:h-12" />
          <h2 className="text-xl sm:text-2xl font-bold text-[#C9C0A8]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            You Lost
          </h2>
          <p className="text-xs text-[#8A8270]">But you still reflected on blessings — that&apos;s a win</p>
        </>
      )}

      {myDnz > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-1.5 text-[#E8C97A]"
        >
          <Coins size={18} weight="fill" />
          <span className="text-sm font-medium">+{myDnz} DinarZ</span>
        </motion.div>
      )}

      {/* Gold particles for winner */}
      {iWon && Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{ backgroundColor: '#D4A853', left: '50%', top: '30%' }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: (Math.random() - 0.5) * 300,
            y: -(60 + Math.random() * 150),
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 1.5 + Math.random(), delay: Math.random() * 0.4, ease: 'easeOut' }}
        />
      ))}
    </motion.div>
  );
}

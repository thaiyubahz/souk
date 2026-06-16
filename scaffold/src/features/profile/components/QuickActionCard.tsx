/**
 * QuickActionCard — large button with icon, title and subtitle.
 */

import { motion } from 'framer-motion';

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  delay?: number;
}

export function QuickActionCard({ icon, title, subtitle, onClick, delay = 0 }: QuickActionCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.1 }}
      onClick={onClick}
      className="flex-1 p-5 bg-gradient-to-br from-[#0D1016] to-[#0A0E16] rounded-xl border border-[#D4A853]/20 hover:border-[#D4A853]/40 transition-all text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-[#D4A853]/15 flex items-center justify-center mb-3 border border-[#D4A853]/30">
        {icon}
      </div>
      <p className="text-[#F5E8C7] font-semibold text-sm mb-1">{title}</p>
      <p className="text-[#8A8270] text-xs line-clamp-2">{subtitle}</p>
    </motion.button>
  );
}

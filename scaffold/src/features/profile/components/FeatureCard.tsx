/**
 * FeatureCard — icon + title + description card used in feature lists.
 */

import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

export function FeatureCard({ icon, title, description, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 + index * 0.1 }}
      className="flex items-start gap-4 p-4 bg-gradient-to-br from-[#0D1016] to-[#0A0E16] rounded-xl border border-[#D4A853]/20"
    >
      <div className="w-12 h-12 rounded-xl bg-[#D4A853]/15 flex items-center justify-center flex-shrink-0 border border-[#D4A853]/30">
        {icon}
      </div>
      <div>
        <p className="text-[#F5E8C7] font-semibold text-sm mb-1">{title}</p>
        <p className="text-[#8A8270] text-xs leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

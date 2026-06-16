import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GlassmorphicCard, ShimmerSkeleton } from '../IslamicWidgetComponents';
import { Mosque } from '@phosphor-icons/react';

interface PrayerCardProps {
  prayer: string;
  time: string;
  isNext: boolean;
}

export function PrayerCard({ prayer, time, isNext }: PrayerCardProps) {
  return (
    <motion.div
      className={cn(
        'flex items-center justify-between px-4 py-3 rounded-xl',
        isNext
          ? 'bg-[#0C0F15]/70 backdrop-blur-md border border-[#D4A853]/40'
          : 'bg-[#0C0F15]/70 backdrop-blur-md border border-[rgba(212,168,83,0.15)]'
      )}
      animate={
        isNext
          ? {
              boxShadow: [
                '0 0 10px rgba(212,168,83,0.2)',
                '0 0 20px rgba(212,168,83,0.4)',
                '0 0 10px rgba(212,168,83,0.2)',
              ],
            }
          : {}
      }
      transition={{ duration: 2, repeat: Infinity }}
    >
      <span className={cn('text-sm', isNext ? 'text-[#D4A853] font-semibold' : 'text-[#8A8270]')}>
        {prayer}
      </span>
      <span className={cn('text-sm tabular-nums', isNext ? 'text-[#F5E8C7] font-bold' : 'text-[#F5E8C7] font-semibold')}>
        {time}
      </span>
    </motion.div>
  );
}

export function PrayerTimesLoadingState({ className }: { className?: string }) {
  return (
    <GlassmorphicCard className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mosque size={15} weight="fill" className="text-[#D4A853]" />
          <ShimmerSkeleton width={90} height={12} />
        </div>
        <ShimmerSkeleton width={80} height={12} borderRadius={6} />
      </div>

      {/* Hero skeleton */}
      <div className="rounded-2xl p-5 mb-4 bg-[#0C0F15]/40 border border-[#F5E8C7]/10">
        <div className="flex items-center gap-4">
          <ShimmerSkeleton width={56} height={56} borderRadius={16} />
          <div className="flex-1 space-y-2">
            <ShimmerSkeleton width={60} height={10} />
            <ShimmerSkeleton width={120} height={20} />
            <ShimmerSkeleton width={80} height={12} />
          </div>
          <div className="space-y-2">
            <ShimmerSkeleton width={70} height={20} />
            <ShimmerSkeleton width={30} height={10} />
          </div>
        </div>
      </div>

      {/* Schedule skeleton — bordered cards */}
      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between px-3.5 py-3 rounded-xl border border-[#F5E8C7]/10 bg-[#0C0F15]/45">
            <div className="flex items-center gap-3">
              <ShimmerSkeleton width={28} height={28} borderRadius={8} />
              <ShimmerSkeleton width={60} height={13} />
            </div>
            <ShimmerSkeleton width={70} height={13} />
          </div>
        ))}
      </div>
    </GlassmorphicCard>
  );
}

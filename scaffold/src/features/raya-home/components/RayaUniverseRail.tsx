/**
 * RayaUniverseRail — the "Raya's Universe" menu, opened from the LEFT via the
 * hamburger. Lists every gateway feature grouped, with per-feature accent + icon
 * and "Soon" badges. Selecting a feature navigates to the real route (handled by
 * the parent via onSelect).
 */

import { CaretRight, X } from '@phosphor-icons/react';
import {
  featuresByGroup,
  GATEWAY_GROUP_ORDER,
  type GatewayFeature,
} from '../data/gatewayFeatures';

interface RayaUniverseRailProps {
  open: boolean;
  onClose: () => void;
  activeRoute?: string | null;
  onSelect: (feature: GatewayFeature) => void;
}

function Icon({ paths }: { paths: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={21}
      height={21}
      dangerouslySetInnerHTML={{ __html: paths }}
    />
  );
}

export function RayaUniverseRail({ open, onClose, activeRoute, onSelect }: RayaUniverseRailProps) {
  const groups = featuresByGroup();

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-[42] bg-[#04060A]/55 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Rail (left) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-[45] w-[400px] max-w-[90vw] flex flex-col
          border-r border-[#F5E8C7]/10 shadow-[30px_0_80px_rgba(0,0,0,0.5)]
          bg-gradient-to-b from-[#0A0E16] to-[#06080D]
          transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)]
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-hidden={!open}
      >
        {/* Head */}
        <div className="relative px-[26px] pt-[26px] pb-[18px] border-b border-[#F5E8C7]/10">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-6 right-[22px] w-[34px] h-[34px] rounded-full border border-[#F5E8C7]/10
              bg-[#F5E8C7]/[0.02] text-[#8A8270] hover:text-[#F5E8C7] flex items-center justify-center transition-colors"
          >
            <X size={14} />
          </button>
          <div className="font-arabic text-[14px] text-[#E8C97A] tracking-[2px] mb-2">عالم رايا</div>
          <h2 className="font-display text-[30px] font-normal leading-[1.05] mb-2.5 text-[#F5E8C7]">
            Raya&rsquo;s Universe
          </h2>
          <p className="text-[13px] text-[#C9C0A8] font-light leading-[1.55]">
            Every part of Zaryah+ lives inside me. Choose one and{' '}
            <b className="text-[#E8C97A] font-medium">I&rsquo;ll take you there</b>.
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-[26px]">
          {GATEWAY_GROUP_ORDER.filter((g) => groups[g].length > 0).map((group) => (
            <div key={group}>
              <div className="text-[10.5px] tracking-[2px] uppercase text-[#4A4639] px-2.5 pt-3.5 pb-2">
                {group}
              </div>
              {groups[group].map((f) => (
                <RailItem
                  key={f.id}
                  feature={f}
                  active={activeRoute === f.route}
                  onSelect={onSelect}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="px-[22px] py-3.5 border-t border-[#F5E8C7]/10 text-[11.5px] text-[#4A4639] text-center leading-[1.5]">
          One agent. One home. <b className="text-[#8A8270] font-normal">No navigation, only conversation.</b>
        </div>
      </aside>
    </>
  );
}

function RailItem({
  feature,
  active,
  onSelect,
}: {
  feature: GatewayFeature;
  active: boolean;
  onSelect: (f: GatewayFeature) => void;
}) {
  const { accent, accentSoft } = feature;
  return (
    <button
      onClick={() => onSelect(feature)}
      className={`group w-full text-left flex items-center gap-3.5 p-3.5 rounded-2xl mb-1
        border transition-all duration-200
        ${active ? 'bg-[#0D1016]/75 backdrop-blur-md border-[#D4A853]/30' : 'border-transparent hover:bg-[#0D1016]/75 hover:border-[#F5E8C7]/10'}`}
    >
      <span
        className="w-[46px] h-[46px] rounded-[14px] shrink-0 flex items-center justify-center"
        style={{ background: accentSoft, color: accent, boxShadow: 'inset 0 0 0 1px rgba(245,232,199,0.05)' }}
      >
        <Icon paths={feature.icon} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="font-display text-[20px] font-medium text-[#F5E8C7] flex items-baseline gap-2.5 leading-[1.1]">
          {feature.name}
          <span className="font-arabic text-[13px] opacity-80" style={{ color: accent }}>
            {feature.ar}
          </span>
        </span>
        <span className="block text-[12.5px] text-[#8A8270] font-light mt-[3px]">{feature.railDesc}</span>
      </span>
      {feature.status === 'soon' ? (
        <span className="text-[10px] tracking-[1px] uppercase text-[#4A4639] border border-[#F5E8C7]/10 px-2 py-[3px] rounded-full shrink-0">
          Soon
        </span>
      ) : (
        <CaretRight
          size={16}
          className="text-[#4A4639] transition-transform group-hover:translate-x-[3px] shrink-0"
          style={{ color: active ? accent : undefined }}
        />
      )}
    </button>
  );
}

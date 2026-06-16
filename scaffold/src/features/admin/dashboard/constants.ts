/**
 * Static configuration data for the Admin Dashboard page.
 *
 * Extracted from AdminPage.tsx to keep that file thin.
 */

import {
  SquaresFour,
  UsersThree,
  ChartBar,
  Eye,
  TrendUp,
  ShieldCheck,
  Link as LinkIcon,
  CurrencyDollar,
} from '@phosphor-icons/react';
import type { AdminTab } from '../types/admin.types';

// ── Colors ────────────────────────────────────────────────────
export const BG = '#0A0E16';
export const SURFACE = '#0D1016';
export const SURFACE_2 = '#283548';
export const GOLD = '#D4A853';
export const GOLD_LIGHT = '#E8C97A';
export const WHITE = '#F8FAFC';
export const TEXT_1 = '#E2E8F0';
export const TEXT_2 = '#8A8270';
export const TEXT_3 = '#4A4639';
export const BORDER = 'rgba(212,168,83,0.15)';
// Categorical chart palette — distinct hues (theme-friendly, no navy/blue).
export const CHART_COLORS = [
  '#D4A853', '#3E9E8E', '#10B981', '#F59E0B', '#EC4899',
  '#8B5CF6', '#C58A8A', '#EF4444', '#14B8A6', '#E8C97A',
];

// ── Tab config ────────────────────────────────────────────────
export const TABS: { key: AdminTab; label: string; icon: typeof SquaresFour }[] = [
  { key: 'overview', label: 'Overview', icon: SquaresFour },
  { key: 'users', label: 'All Users', icon: UsersThree },
  { key: 'dnz', label: 'DNZ Economy', icon: ChartBar },
  { key: 'activity', label: 'Activity', icon: TrendUp },
  { key: 'features', label: 'Feature Usage', icon: Eye },
  { key: 'kyc', label: 'KYC', icon: ShieldCheck },
  { key: 'referrals', label: 'Referrals', icon: LinkIcon },
  { key: 'ai-costs', label: 'AI Costs', icon: CurrencyDollar },
];

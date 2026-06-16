/**
 * AISourceBadge
 * Small pill showing which AI model generated the response
 */

import { AISource } from '../types/chatbot.types';

interface AISourceBadgeProps {
  source: AISource;
}

const SOURCE_CONFIG: Record<AISource, { label: string; borderColor: string; textColor: string }> = {
  [AISource.anthropic]: { label: 'Claude', borderColor: 'border-[#D97706]/40', textColor: 'text-[#F59E0B]' },
  [AISource.openai]: { label: 'GPT-4o', borderColor: 'border-emerald-500/40', textColor: 'text-emerald-400' },
  [AISource.deepseek]: { label: 'DeepSeek', borderColor: 'border-[#D4A853]/40', textColor: 'text-[#E8C97A]' },
  [AISource.deepseekThinking]: { label: 'DeepSeek R1', borderColor: 'border-[#D4A853]/40', textColor: 'text-[#E8C97A]' },
  [AISource.groq]: { label: 'Groq', borderColor: 'border-orange-500/40', textColor: 'text-orange-400' },
  [AISource.groqPlus]: { label: 'Groq+', borderColor: 'border-orange-400/40', textColor: 'text-orange-300' },
  [AISource.offline]: { label: 'Offline', borderColor: 'border-[#F5E8C7]/10', textColor: 'text-[#8A8270]' },
};

export function AISourceBadge({ source }: AISourceBadgeProps) {
  const config = SOURCE_CONFIG[source];
  return (
    <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border ${config.borderColor} ${config.textColor}`}>
      {config.label}
    </span>
  );
}

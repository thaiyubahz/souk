/**
 * ZakatCalculatorPage
 * Based on AAOIFI Shariah Standard No. 35 (Zakah)
 * Full zakat calculator with gold, silver, cash, stocks, business assets, liabilities
 * Includes: Jewelry madhab toggle, stock intent split, correct AAOIFI nisab values
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DisclaimerBanner } from '@/components/shared';
import { trackFeature } from '@/lib/analytics';
import {
  Calculator,
  Info,
  Coins,
  Money,
  Buildings,
  CreditCard,
  ClockCounterClockwise,
  ChartLine,
  Scales,
  ArrowClockwise,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { eimService } from '@/features/eim/services/eim.service';
import { CurrencyPicker, useCurrencyFormat, currencySymbol } from '@/lib/currency';
import type { ZakatInput, ZakatResult, JewelryMadhab, StockIntent } from '../types/zakatCalculation';
import { emptyZakatInput, calculateZakat, GOLD_NISAB_GRAMS, SILVER_NISAB_GRAMS, ZAKAT_RATE } from '../types/zakatCalculation';
import { CollapsibleSection, InputField } from './components/_primitives';
import { ZakatResultCard } from './components/ZakatResultCard';

export function ZakatCalculatorPage() {
  useEffect(() => { trackFeature('zakat-calculator'); }, []);
  const [input, setInput] = useState<ZakatInput>(emptyZakatInput());
  const [result, setResult] = useState<ZakatResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    info: true,
    metals: true,
    gold: false,
    silver: false,
    jewelry: false,
    cash: false,
    stocks: false,
    business: false,
    liabilities: false,
    previous: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Once the user hand-edits a metal price we stop auto-filling that field,
  // so a manual override is never clobbered by a re-fetch or currency switch.
  const goldPriceTouched = useRef(false);
  const silverPriceTouched = useRef(false);

  const updateField = useCallback((field: keyof ZakatInput, value: string) => {
    const num = parseFloat(value) || 0;
    if (field === 'goldPricePerGram') goldPriceTouched.current = true;
    if (field === 'silverPricePerGram') silverPriceTouched.current = true;
    setInput((prev) => ({ ...prev, [field]: num }));
  }, []);

  const handleCalculate = () => {
    const r = calculateZakat(input);
    setResult(r);
  };

  // The user's chosen display currency. All numeric inputs and results
  // are interpreted in this currency — switching it relabels symbols
  // but does NOT convert the typed numbers (same model as the EIM
  // portfolio currency switcher: you enter in your chosen currency,
  // we don't mix). The metal-price fields are the one exception: they're
  // live spot quotes, so we DO re-convert them on a currency switch.
  const { displayCurrency, format, convert, ratesReady } = useCurrencyFormat();
  const sym = currencySymbol(displayCurrency);

  // Live gold/silver spot prices (per gram, USD) from the shared metals
  // endpoint — same source the EIM nisab card uses. Cached 1h to match the
  // backend; refetched on demand via the Refresh button.
  const metalsQ = useQuery({
    queryKey: ['metals', 'spot'],
    queryFn: () => eimService.getMetalsSpot(),
    staleTime: 60 * 60_000,
    refetchOnWindowFocus: false,
  });

  // Auto-fill (and re-convert) the metal-price fields from live spot, unless
  // the user has typed their own value. Reruns when the quote loads or when
  // FX rates / display currency change (`convert` identity moves).
  const applySpotPrices = useCallback(
    (force = false) => {
      const spot = metalsQ.data;
      if (!spot) return;
      const round2 = (n: number) => Math.round(n * 100) / 100;
      setInput((prev) => {
        const next = { ...prev };
        if ((force || !goldPriceTouched.current) && spot.gold.per_gram_usd > 0) {
          next.goldPricePerGram = round2(convert(spot.gold.per_gram_usd, 'USD'));
        }
        if ((force || !silverPriceTouched.current) && spot.silver.per_gram_usd > 0) {
          next.silverPricePerGram = round2(convert(spot.silver.per_gram_usd, 'USD'));
        }
        return next;
      });
    },
    [metalsQ.data, convert],
  );

  useEffect(() => {
    applySpotPrices();
  }, [applySpotPrices]);

  const handleReset = () => {
    goldPriceTouched.current = false;
    silverPriceTouched.current = false;
    setInput(emptyZakatInput());
    setResult(null);
    applySpotPrices(true);
  };

  const handleRefreshPrices = () => {
    goldPriceTouched.current = false;
    silverPriceTouched.current = false;
    void metalsQ.refetch();
  };

  // ZakatResultCard takes a `fmt` callback returning the value WITH the
  // currency symbol. The card no longer prefixes `$` of its own.
  const fmt = (n: number) =>
    format(n, displayCurrency, { maxDecimals: 2 });

  return (
    <div className="min-h-full relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D1016] via-[#0D1016] to-[#0A0E16] pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-5 py-6 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#D4A853] to-[#E8C97A] bg-clip-text text-transparent">
              Zakat Calculator
            </h1>
            <p className="text-xs text-[#C9C0A8] mt-1">
              Based on AAOIFI Shariah Standard No. 35 (Zakah)
            </p>
          </div>
          <CurrencyPicker />
        </motion.div>

        {/* Info Card */}
        <CollapsibleSection
          id="info"
          icon={<Info size={16} />}
          title="Nisab Thresholds"
          expanded={expandedSections.info}
          onToggle={() => toggleSection('info')}
          delay={0.05}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#D4A853]/5 border border-[#D4A853]/20">
              <p className="text-[10px] text-[#C9C0A8] uppercase tracking-wide">Gold Nisab</p>
              <p className="text-sm font-bold text-[#D4A853]">{GOLD_NISAB_GRAMS}g</p>
              <p className="text-[10px] text-[#8A8270]">= 20 dinar (AAOIFI SS 35)</p>
            </div>
            <div className="p-3 rounded-xl bg-[#C9C0A8]/5 border border-[#C9C0A8]/20">
              <p className="text-[10px] text-[#C9C0A8] uppercase tracking-wide">Silver Nisab</p>
              <p className="text-sm font-bold text-[#C9C0A8]">{SILVER_NISAB_GRAMS}g</p>
              <p className="text-[10px] text-[#8A8270]">= 200 dirham (AAOIFI SS 35)</p>
            </div>
          </div>
          <p className="text-[10px] text-[#8A8270] mt-2">
            Zakat is {ZAKAT_RATE * 100}% (1/40) of net zakatable assets above the nisab, after one complete lunar year (hawl) of possession.
          </p>
          <p className="text-[10px] text-[#8A8270] mt-1">
            Silver nisab is used by default as it produces the lower threshold, benefiting those entitled to receive zakat.
          </p>
        </CollapsibleSection>

        {/* Current Metal Prices */}
        <CollapsibleSection
          id="metals"
          icon={<Coins size={16} />}
          title="Current Metal Prices"
          expanded={expandedSections.metals}
          onToggle={() => toggleSection('metals')}
          delay={0.1}
        >
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Gold Price / gram" value={input.goldPricePerGram} onChange={(v) => updateField('goldPricePerGram', v)} prefix={sym} />
            <InputField label="Silver Price / gram" value={input.silverPricePerGram} onChange={(v) => updateField('silverPricePerGram', v)} prefix={sym} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-[10px] text-[#8A8270]">
              {metalsQ.isLoading
                ? 'Fetching live spot prices…'
                : metalsQ.isError || !metalsQ.data
                  ? 'Live prices unavailable — enter manually'
                  : !ratesReady && displayCurrency !== 'USD'
                    ? `Live spot · converting to ${displayCurrency}…`
                    : `Live spot in ${displayCurrency} · re-converts when you switch currency`}
            </p>
            <button
              type="button"
              onClick={handleRefreshPrices}
              disabled={metalsQ.isFetching}
              className="flex items-center gap-1 text-[10px] font-semibold text-[#D4A853] hover:text-[#E8C97A] transition-colors disabled:opacity-50"
            >
              <ArrowClockwise size={12} className={metalsQ.isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </CollapsibleSection>

        {/* Gold Assets */}
        <CollapsibleSection
          id="gold"
          icon={<Coins size={16} />}
          title="Gold Assets"
          expanded={expandedSections.gold}
          onToggle={() => toggleSection('gold')}
          delay={0.15}
          accentColor="gold"
        >
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Gold Owned (grams)" value={input.goldOwned} onChange={(v) => updateField('goldOwned', v)} suffix="g" />
            <InputField label="Gold Lent (grams)" value={input.goldLent} onChange={(v) => updateField('goldLent', v)} suffix="g" />
            <InputField label="Personal Jewelry (grams)" value={input.goldJewelryPersonal} onChange={(v) => updateField('goldJewelryPersonal', v)} suffix="g" />
          </div>
        </CollapsibleSection>

        {/* Silver Assets */}
        <CollapsibleSection
          id="silver"
          icon={<Coins size={16} />}
          title="Silver Assets"
          expanded={expandedSections.silver}
          onToggle={() => toggleSection('silver')}
          delay={0.2}
          accentColor="silver"
        >
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Silver Owned (grams)" value={input.silverOwned} onChange={(v) => updateField('silverOwned', v)} suffix="g" />
            <InputField label="Silver Lent (grams)" value={input.silverLent} onChange={(v) => updateField('silverLent', v)} suffix="g" />
            <InputField label="Personal Jewelry (grams)" value={input.silverJewelryPersonal} onChange={(v) => updateField('silverJewelryPersonal', v)} suffix="g" />
          </div>
        </CollapsibleSection>

        {/* Jewelry Madhab Toggle */}
        <CollapsibleSection
          id="jewelry"
          icon={<Scales size={16} />}
          title="Jewelry Zakat Ruling"
          expanded={expandedSections.jewelry}
          onToggle={() => toggleSection('jewelry')}
          delay={0.22}
        >
          <p className="text-[10px] text-[#8A8270] mb-3">
            Scholars differ on whether personal-use jewelry is zakatable. Select your preferred ruling:
          </p>
          <div className="flex gap-2">
            {([
              { id: 'hanafi' as JewelryMadhab, label: 'Hanafi', desc: 'Personal jewelry IS zakatable' },
              { id: 'shafii' as JewelryMadhab, label: "Shafi'i / Hanbali", desc: 'Personal jewelry is EXEMPT' },
            ]).map(({ id, label, desc }) => (
              <button
                key={id}
                onClick={() => setInput(prev => ({ ...prev, jewelryMadhab: id }))}
                className={cn(
                  'flex-1 p-3 rounded-xl border text-left transition-colors',
                  input.jewelryMadhab === id
                    ? 'border-[#D4A853]/50 bg-[#D4A853]/10'
                    : 'border-[#4A4639] bg-[#0A0E16]/40',
                )}
              >
                <p className={cn('text-xs font-semibold', input.jewelryMadhab === id ? 'text-[#D4A853]' : 'text-[#F5E8C7]')}>
                  {label}
                </p>
                <p className="text-[10px] text-[#8A8270] mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </CollapsibleSection>

        {/* Stock Zakat (AAOIFI SS 35) */}
        <CollapsibleSection
          id="stocks"
          icon={<ChartLine size={16} />}
          title="Stock / Equity Zakat"
          expanded={expandedSections.stocks}
          onToggle={() => toggleSection('stocks')}
          delay={0.24}
        >
          <p className="text-[10px] text-[#8A8270] mb-3">
            Per AAOIFI SS 35: Trading stocks are zakatable at market value. Holding stocks use the company's zakatable assets per share.
          </p>
          <div className="flex gap-2 mb-3">
            {([
              { id: 'trading' as StockIntent, label: 'Trading', desc: 'Held for short-term sale' },
              { id: 'holding' as StockIntent, label: 'Holding', desc: 'Held for dividends/long-term' },
            ]).map(({ id, label, desc }) => (
              <button
                key={id}
                onClick={() => setInput(prev => ({ ...prev, stockIntent: id }))}
                className={cn(
                  'flex-1 p-3 rounded-xl border text-left transition-colors',
                  input.stockIntent === id
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-[#4A4639] bg-[#0A0E16]/40',
                )}
              >
                <p className={cn('text-xs font-semibold', input.stockIntent === id ? 'text-emerald-400' : 'text-[#F5E8C7]')}>
                  {label}
                </p>
                <p className="text-[10px] text-[#8A8270] mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Total Stock Market Value" value={input.stockMarketValue} onChange={(v) => updateField('stockMarketValue', v)} prefix={sym} />
            <InputField label="Shares Owned" value={input.stockSharesOwned} onChange={(v) => updateField('stockSharesOwned', v)} />
            {input.stockIntent === 'holding' && (
              <InputField label="Zakatable Assets / Share" value={input.stockZakatableAssetsPerShare} onChange={(v) => updateField('stockZakatableAssetsPerShare', v)} prefix={sym} />
            )}
          </div>
        </CollapsibleSection>

        {/* Cash Assets */}
        <CollapsibleSection
          id="cash"
          icon={<Money size={16} />}
          title="Cash & Savings"
          expanded={expandedSections.cash}
          onToggle={() => toggleSection('cash')}
          delay={0.25}
        >
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Cash in Hand" value={input.cashInHand} onChange={(v) => updateField('cashInHand', v)} prefix={sym} />
            <InputField label="Cash in Bank" value={input.cashInBank} onChange={(v) => updateField('cashInBank', v)} prefix={sym} />
            <InputField label="Savings Account" value={input.cashInSavings} onChange={(v) => updateField('cashInSavings', v)} prefix={sym} />
            <InputField label="Fixed Deposit" value={input.cashInFixedDeposit} onChange={(v) => updateField('cashInFixedDeposit', v)} prefix={sym} />
            <InputField label="Current Account" value={input.cashInCurrentAccount} onChange={(v) => updateField('cashInCurrentAccount', v)} prefix={sym} />
            <InputField label="Lent to Others" value={input.cashLentToOthers} onChange={(v) => updateField('cashLentToOthers', v)} prefix={sym} />
            <InputField label="Foreign Currency" value={input.cashInForeignCurrency} onChange={(v) => updateField('cashInForeignCurrency', v)} prefix={sym} />
            <InputField label="Digital Wallets" value={input.cashInDigitalWallets} onChange={(v) => updateField('cashInDigitalWallets', v)} prefix={sym} />
            <InputField label="Investments" value={input.cashInInvestments} onChange={(v) => updateField('cashInInvestments', v)} prefix={sym} />
            <InputField label="Mutual Funds" value={input.cashInMutualFunds} onChange={(v) => updateField('cashInMutualFunds', v)} prefix={sym} />
            <InputField label="Stocks" value={input.cashInStocks} onChange={(v) => updateField('cashInStocks', v)} prefix={sym} />
            <InputField label="Bonds / Sukuk" value={input.cashInBonds} onChange={(v) => updateField('cashInBonds', v)} prefix={sym} />
            <InputField label="Real Estate (Investment)" value={input.cashInRealEstate} onChange={(v) => updateField('cashInRealEstate', v)} prefix={sym} />
            <InputField label="Business Inventory" value={input.cashInBusinessInventory} onChange={(v) => updateField('cashInBusinessInventory', v)} prefix={sym} />
          </div>
        </CollapsibleSection>

        {/* Business Assets */}
        <CollapsibleSection
          id="business"
          icon={<Buildings size={16} />}
          title="Business Assets"
          expanded={expandedSections.business}
          onToggle={() => toggleSection('business')}
          delay={0.3}
        >
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Business Cash" value={input.businessCash} onChange={(v) => updateField('businessCash', v)} prefix={sym} />
            <InputField label="Receivables" value={input.businessReceivables} onChange={(v) => updateField('businessReceivables', v)} prefix={sym} />
            <InputField label="Inventory" value={input.businessInventory} onChange={(v) => updateField('businessInventory', v)} prefix={sym} />
            <InputField label="Raw Materials" value={input.businessRawMaterials} onChange={(v) => updateField('businessRawMaterials', v)} prefix={sym} />
            <InputField label="Finished Goods" value={input.businessFinishedGoods} onChange={(v) => updateField('businessFinishedGoods', v)} prefix={sym} />
            <InputField label="Investments" value={input.businessInvestments} onChange={(v) => updateField('businessInvestments', v)} prefix={sym} />
            <InputField label="Other Assets" value={input.businessOther} onChange={(v) => updateField('businessOther', v)} prefix={sym} />
          </div>
        </CollapsibleSection>

        {/* Liabilities */}
        <CollapsibleSection
          id="liabilities"
          icon={<CreditCard size={16} />}
          title="Financial Liabilities"
          expanded={expandedSections.liabilities}
          onToggle={() => toggleSection('liabilities')}
          delay={0.35}
        >
          <p className="text-[10px] text-[#8A8270] mb-3">
            Per AAOIFI SS 35: Only enter debts <span className="text-[#D4A853] font-semibold">due this year</span>, not total loan balances. For a $300K mortgage, enter your annual payment (~$18K), not the full amount.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Personal Loans (annual due)" value={input.personalLoansAnnualDue} onChange={(v) => updateField('personalLoansAnnualDue', v)} prefix={sym} />
            <InputField label="Credit Card Debt (current)" value={input.creditCardDebt} onChange={(v) => updateField('creditCardDebt', v)} prefix={sym} />
            <InputField label="Mortgage (annual due)" value={input.mortgageAnnualDue} onChange={(v) => updateField('mortgageAnnualDue', v)} prefix={sym} />
            <InputField label="Business Loans (annual due)" value={input.businessLoansAnnualDue} onChange={(v) => updateField('businessLoansAnnualDue', v)} prefix={sym} />
            <InputField label="Other Debts (due this year)" value={input.otherDebtsAnnualDue} onChange={(v) => updateField('otherDebtsAnnualDue', v)} prefix={sym} />
            <InputField label="Unpaid Taxes" value={input.unpaidTaxes} onChange={(v) => updateField('unpaidTaxes', v)} prefix={sym} />
          </div>
        </CollapsibleSection>

        {/* Previous Unpaid Zakat */}
        <CollapsibleSection
          id="previous"
          icon={<ClockCounterClockwise size={16} />}
          title="Previous Unpaid Zakat"
          expanded={expandedSections.previous}
          onToggle={() => toggleSection('previous')}
          delay={0.4}
        >
          <InputField label="Unpaid Zakat from Previous Years" value={input.previousUnpaidZakat} onChange={(v) => updateField('previousUnpaidZakat', v)} prefix={sym} />
        </CollapsibleSection>

        {/* Hawl Confirmation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.3 }}
          className="mb-3"
        >
          <button
            onClick={() => setInput(prev => ({ ...prev, hawlConfirmed: !prev.hawlConfirmed }))}
            className={cn(
              'w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-colors',
              input.hawlConfirmed
                ? 'border-emerald-500/40 bg-emerald-500/10'
                : 'border-[rgba(212,168,83,0.2)]/50 bg-gradient-to-br from-[#0D1016]/80 to-[#0D1016]/60',
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors',
              input.hawlConfirmed
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-[#7A7363]/50',
            )}>
              {input.hawlConfirmed && (
                <svg className="w-3 h-3 text-[#F5E8C7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className={cn('text-sm font-semibold', input.hawlConfirmed ? 'text-emerald-400' : 'text-[#F5E8C7]')}>
                I confirm one lunar year (hawl) has passed
              </p>
              <p className="text-[10px] text-[#8A8270] mt-0.5">
                AAOIFI SS 35 requires assets to be held for one complete lunar year (~354 days) before zakat is due
              </p>
            </div>
          </button>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleCalculate}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all',
              'bg-gradient-to-r from-[#D4A853] to-[#E8C97A] text-black',
              'hover:shadow-[0_4px_20px_rgba(212,168,83,0.3)]',
            )}
          >
            <Calculator size={16} />
            Calculate Zakat
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-3.5 rounded-2xl font-bold text-sm border border-[rgba(212,168,83,0.2)] text-[#C9C0A8] hover:bg-[#0D1016]/75 transition-colors"
          >
            Reset
          </button>
        </div>

        {result && <ZakatResultCard input={input} result={result} fmt={fmt} />}

        <DisclaimerBanner contentId="ZAKAT" variant="subtle" className="mt-6" />
      </div>
    </div>
  );
}

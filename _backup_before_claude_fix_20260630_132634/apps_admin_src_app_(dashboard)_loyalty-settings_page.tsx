'use client';

import { useEffect, useMemo, useState } from 'react';

type LoyaltyKey =
  | 'loyalty_earn_amount_syp'
  | 'loyalty_earn_points'
  | 'loyalty_redeem_points_per_syp'
  | 'loyalty_max_redeem_percent'
  | 'loyalty_referral_bonus_points';

interface SettingRow {
  key: string;
  value: string | null;
  description?: string | null;
  updated_at?: string | null;
}

interface FieldConfig {
  key: LoyaltyKey;
  title: string;
  shortTitle: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  placeholder: string;
  description: string;
  adminMeaning: string;
  customerMeaning: string;
}

const DEFAULT_VALUES: Record<LoyaltyKey, string> = {
  loyalty_earn_amount_syp: '1000',
  loyalty_earn_points: '10',
  loyalty_redeem_points_per_syp: '1',
  loyalty_max_redeem_percent: '20',
  loyalty_referral_bonus_points: '50',
};

const FIELDS: FieldConfig[] = [
  {
    key: 'loyalty_earn_amount_syp',
    title: 'مبلغ الشراء المطلوب',
    shortTitle: 'مبلغ الشراء',
    unit: 'ل.س',
    min: 1,
    max: 999999999,
    step: 500,
    placeholder: '1000',
    description: 'المبلغ الذي يجب أن يصرفه العميل حتى يدخل في دورة كسب نقاط واحدة.',
    adminMeaning: 'هذا ليس خصماً وليس نسبة. هو مبلغ بالليرة السورية.',
    customerMeaning: 'كلما صرف العميل هذا المبلغ، يحصل على نقاط الكسب المحددة في الحقل التالي.',
  },
  {
    key: 'loyalty_earn_points',
    title: 'النقاط المكتسبة',
    shortTitle: 'نقاط الكسب',
    unit: 'نقطة',
    min: 0,
    max: 1000000,
    step: 1,
    placeholder: '10',
    description: 'عدد النقاط التي يحصل عليها العميل مقابل كل دورة شراء.',
    adminMeaning: 'هذه قيمة نقاط وليست مبلغاً مالياً.',
    customerMeaning: 'مثلاً: إذا كانت 10، فالعميل يأخذ 10 نقاط عن كل دورة شراء مكتملة.',
  },
  {
    key: 'loyalty_redeem_points_per_syp',
    title: 'تكلفة كل ليرة عند الاستبدال',
    shortTitle: 'نقاط الاستبدال',
    unit: 'نقطة لكل 1 ل.س',
    min: 1,
    max: 1000000,
    step: 1,
    placeholder: '1',
    description: 'كم نقطة يحتاج العميل حتى يحصل على خصم 1 ليرة سورية.',
    adminMeaning: 'هذه معادلة تحويل: النقاط ÷ هذه القيمة = الخصم بالليرة السورية.',
    customerMeaning: 'إذا كانت القيمة 1: كل نقطة = 1 ل.س خصم. إذا كانت 10: كل 10 نقاط = 1 ل.س خصم.',
  },
  {
    key: 'loyalty_max_redeem_percent',
    title: 'أقصى نسبة خصم بالنقاط',
    shortTitle: 'حد الخصم',
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
    placeholder: '20',
    description: 'أعلى نسبة من قيمة الطلب يمكن دفعها باستخدام نقاط الولاء.',
    adminMeaning: 'هذه نسبة مئوية من إجمالي الطلب وليست مبلغاً ثابتاً.',
    customerMeaning: 'إذا كانت 20%، لا يستطيع العميل دفع أكثر من 20% من الطلب بالنقاط.',
  },
  {
    key: 'loyalty_referral_bonus_points',
    title: 'مكافأة الإحالة',
    shortTitle: 'الإحالة',
    unit: 'نقطة',
    min: 0,
    max: 1000000,
    step: 1,
    placeholder: '50',
    description: 'عدد النقاط التي يحصل عليها العميل عند نجاح إحالة عميل جديد.',
    adminMeaning: 'هذه نقاط مكافأة ثابتة، وليست مبلغاً بالليرة ولا نسبة خصم.',
    customerMeaning: 'تُضاف هذه النقاط لرصيد العميل بعد تحقق شرط الإحالة في النظام.',
  },
];

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('ar-SY', { maximumFractionDigits: 0 }).format(value);
}

function formatSyp(value: number) {
  return `${formatNumber(value)} ل.س`;
}

function toNumber(value: string | undefined) {
  const n = Number(value ?? '0');
  return Number.isFinite(n) ? n : 0;
}

function normalizeInteger(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return String(Math.max(0, Math.floor(n)));
}

function getField(key: LoyaltyKey) {
  return FIELDS.find((field) => field.key === key)!;
}

export default function AdminLoyaltySettingsPage() {
  const [values, setValues] = useState<Record<LoyaltyKey, string>>(DEFAULT_VALUES);
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadSettings() {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setError((payload as { error?: string } | null)?.error ?? 'تعذر تحميل إعدادات الولاء');
        setLoading(false);
        return;
      }

      const list = Array.isArray(payload) ? (payload as SettingRow[]) : [];
      const nextValues: Record<LoyaltyKey, string> = { ...DEFAULT_VALUES };

      for (const field of FIELDS) {
        const found = list.find((row) => row.key === field.key);
        if (found?.value !== null && found?.value !== undefined && found.value !== '') {
          nextValues[field.key] = String(found.value);
        }
      }

      setRows(list);
      setValues(nextValues);
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  const numbers = useMemo(() => {
    const earnAmount = Math.max(1, toNumber(values.loyalty_earn_amount_syp));
    const earnPoints = Math.max(0, toNumber(values.loyalty_earn_points));
    const redeemPointsPerSyp = Math.max(1, toNumber(values.loyalty_redeem_points_per_syp));
    const maxRedeemPercent = Math.min(100, Math.max(0, toNumber(values.loyalty_max_redeem_percent)));
    const referralBonus = Math.max(0, toNumber(values.loyalty_referral_bonus_points));

    const exampleOrder = 50000;
    const exampleEarned = Math.floor(exampleOrder / earnAmount) * earnPoints;
    const exampleDiscount = Math.floor(exampleEarned / redeemPointsPerSyp);
    const exampleMaxRedeem = Math.floor(exampleOrder * (maxRedeemPercent / 100));
    const allowedDiscount = Math.min(exampleDiscount, exampleMaxRedeem);

    return {
      earnAmount,
      earnPoints,
      redeemPointsPerSyp,
      maxRedeemPercent,
      referralBonus,
      exampleOrder,
      exampleEarned,
      exampleDiscount,
      exampleMaxRedeem,
      allowedDiscount,
    };
  }, [values]);

  const validationErrors = useMemo(() => {
    const result: string[] = [];

    for (const field of FIELDS) {
      const raw = values[field.key];
      const n = Number(raw);

      if (raw === '' || !Number.isFinite(n)) {
        result.push(`${field.title}: أدخل رقماً صحيحاً.`);
        continue;
      }

      if (n < field.min) result.push(`${field.title}: يجب ألا تقل القيمة عن ${field.min}.`);
      if (n > field.max) result.push(`${field.title}: يجب ألا تزيد القيمة عن ${field.max}.`);
    }

    return result;
  }, [values]);

  async function handleSave() {
    setSaving(true);
    setError('');
    setMessage('');

    if (validationErrors.length > 0) {
      setError(validationErrors[0] ?? 'تحقق من القيم المدخلة');
      setSaving(false);
      return;
    }

    try {
      const updates = FIELDS.map((field) => ({
        key: field.key,
        value: normalizeInteger(values[field.key]),
        description: field.description,
      }));

      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setError((payload as { error?: string } | null)?.error ?? 'فشل حفظ إعدادات الولاء');
        return;
      }

      setMessage('تم حفظ إعدادات الولاء بنجاح. ستُطبّق القيم على الطلبات الجديدة.');
      void loadSettings();
    } catch {
      setError('تعذر حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  }

  const lastUpdated = rows
    .filter((row) => FIELDS.some((field) => field.key === row.key) && row.updated_at)
    .map((row) => row.updated_at)
    .sort()
    .at(-1);

  const inputClass = 'w-full rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-3 text-[#1F1B16] outline-none transition focus:border-[#C9A84C] disabled:opacity-60';
  const cardClass = 'rounded-3xl border border-[#E8DCC3] bg-[#FFFDF8] p-5 shadow-xl';

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-[#E8DCC3] bg-[#FFFDF8] p-6 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-black text-[#C9A84C]">Admin / Loyalty</p>
            <h1 className="text-3xl font-black text-[#1F1B16]">إعدادات الولاء</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#6F6658]">
              هذه الصفحة توضّح معنى كل رقم: هل هو مبلغ بالليرة السورية، عدد نقاط، أو نسبة مئوية.
              التغييرات تؤثر على الطلبات الجديدة فقط ولا تعدّل الطلبات القديمة.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || loading || validationErrors.length > 0}
            className="rounded-2xl bg-[#C9A84C] px-6 py-3 text-sm font-black text-[#111111] transition hover:bg-[#D8B95F] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'جار الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>

        {lastUpdated && (
          <p className="mt-4 text-xs text-[#8B8172]">
            آخر تحديث مسجّل: {new Date(lastUpdated).toLocaleString('ar-SY')}
          </p>
        )}
      </section>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm font-bold text-green-100">
          {message}
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          <p className="mb-2 font-black">يوجد قيم تحتاج مراجعة:</p>
          <ul className="list-inside list-disc space-y-1">
            {validationErrors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-4">
        <div className={cardClass}>
          <p className="text-xs font-black text-[#6F6658]">معادلة الكسب</p>
          <p className="mt-3 text-lg font-black text-[#1F1B16]">
            كل {formatSyp(numbers.earnAmount)} = {formatNumber(numbers.earnPoints)} نقطة
          </p>
          <p className="mt-2 text-xs leading-6 text-[#6F6658]">
            هذه معادلة رصيد، وليست خصماً مباشراً.
          </p>
        </div>

        <div className={cardClass}>
          <p className="text-xs font-black text-[#6F6658]">معادلة الاستبدال</p>
          <p className="mt-3 text-lg font-black text-[#1F1B16]">
            {formatNumber(numbers.redeemPointsPerSyp)} نقطة = 1 ل.س
          </p>
          <p className="mt-2 text-xs leading-6 text-[#6F6658]">
            كلما زادت هذه القيمة أصبح الخصم بالنقاط أقل.
          </p>
        </div>

        <div className={cardClass}>
          <p className="text-xs font-black text-[#6F6658]">حد الخصم بالنقاط</p>
          <p className="mt-3 text-lg font-black text-[#1F1B16]">
            حتى {formatNumber(numbers.maxRedeemPercent)}% من الطلب
          </p>
          <p className="mt-2 text-xs leading-6 text-[#6F6658]">
            يحمي المتجر من دفع الطلب كاملًا بالنقاط.
          </p>
        </div>

        <div className={cardClass}>
          <p className="text-xs font-black text-[#6F6658]">مكافأة الإحالة</p>
          <p className="mt-3 text-lg font-black text-[#1F1B16]">
            {formatNumber(numbers.referralBonus)} نقطة
          </p>
          <p className="mt-2 text-xs leading-6 text-[#6F6658]">
            تمنح عند تحقق الإحالة حسب منطق النظام.
          </p>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-xl font-black text-[#1F1B16]">مثال مباشر حسب القيم الحالية</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8] p-4">
            <p className="text-xs text-[#6F6658]">طلب بقيمة</p>
            <p className="mt-2 text-2xl font-black text-[#C9A84C]">{formatSyp(numbers.exampleOrder)}</p>
          </div>
          <div className="rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8] p-4">
            <p className="text-xs text-[#6F6658]">النقاط المكتسبة</p>
            <p className="mt-2 text-2xl font-black text-[#C9A84C]">{formatNumber(numbers.exampleEarned)} نقطة</p>
          </div>
          <div className="rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8] p-4">
            <p className="text-xs text-[#6F6658]">قيمة النقاط كخصم</p>
            <p className="mt-2 text-2xl font-black text-[#C9A84C]">{formatSyp(numbers.exampleDiscount)}</p>
          </div>
          <div className="rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8] p-4">
            <p className="text-xs text-[#6F6658]">المسموح استخدامه فعلياً</p>
            <p className="mt-2 text-2xl font-black text-[#C9A84C]">{formatSyp(numbers.allowedDiscount)}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-[#6F6658]">
          إذا كانت قيمة النقاط أكبر من حد الخصم، سيُطبّق النظام الحد الأقصى فقط:
          {` ${formatSyp(numbers.exampleMaxRedeem)} `}
          من طلب قيمته {formatSyp(numbers.exampleOrder)} عند حد {formatNumber(numbers.maxRedeemPercent)}%.
        </p>
      </section>

      <section className="grid gap-5">
        {loading ? (
          <div className={cardClass + ' text-center text-[#6F6658]'}>جار تحميل الإعدادات...</div>
        ) : (
          FIELDS.map((field) => (
            <article key={field.key} className={cardClass}>
              <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-black text-[#1F1B16]">{field.title}</h2>
                    <span className="rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/10 px-3 py-1 text-xs font-black text-[#C9A84C]">
                      {field.unit}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-[#6F6658]">{field.description}</p>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8] p-4">
                      <p className="text-xs font-black text-[#C9A84C]">معناه للإدارة</p>
                      <p className="mt-2 text-sm leading-7 text-[#D1D5DB]">{field.adminMeaning}</p>
                    </div>

                    <div className="rounded-2xl border border-[#E8DCC3] bg-[#FFFDF8] p-4">
                      <p className="text-xs font-black text-[#C9A84C]">معناه للعميل</p>
                      <p className="mt-2 text-sm leading-7 text-[#D1D5DB]">{field.customerMeaning}</p>
                    </div>
                  </div>

                  <p className="mt-4 font-mono text-xs text-[#8B8172]">{field.key}</p>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-black text-[#1F1B16]">القيمة الحالية</span>
                  <input
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={values[field.key] ?? ''}
                    placeholder={field.placeholder}
                    onChange={(event) => {
                      const value = event.target.value;
                      setValues((current) => ({ ...current, [field.key]: value }));
                    }}
                    className={inputClass}
                  />
                  <span className="block text-xs leading-6 text-[#6F6658]">
                    أدنى قيمة: {formatNumber(field.min)} — أعلى قيمة: {formatNumber(field.max)}
                  </span>
                </label>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="rounded-3xl border border-[#C9A84C]/20 bg-[#C9A84C]/10 p-5">
        <h2 className="text-lg font-black text-[#C9A84C]">ملخص سريع للقيم الحالية</h2>
        <p className="mt-3 text-sm leading-8 text-[#1F1B16]">
          العميل يكسب {formatNumber(numbers.earnPoints)} نقطة مقابل كل {formatSyp(numbers.earnAmount)} من المشتريات.
          وعند الاستبدال، كل {formatNumber(numbers.redeemPointsPerSyp)} نقطة تعطي خصم 1 ل.س.
          ولا يمكن أن يتجاوز خصم النقاط {formatNumber(numbers.maxRedeemPercent)}% من قيمة الطلب.
          ومكافأة الإحالة هي {formatNumber(numbers.referralBonus)} نقطة.
        </p>
      </section>
    </div>
  );
}
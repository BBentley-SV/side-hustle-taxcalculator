// ── Tax year configurations ──────────────────────────────────────────────────
const TAX_YEARS = {
  '2026/27': {
    pa: 12570, basicRateLimit: 50270, higherRateLimit: 125140, paTaperStart: 100000,
    it: { basic: 0.20, higher: 0.40, additional: 0.45 },
    empNI: { lower: 12570, upper: 50270, basic: 0.08, higher: 0.02 },
    c4NI:  { lower: 12570, upper: 50270, basic: 0.06, higher: 0.02 },
    div: { allowance: 500,  basic: 0.0875, higher: 0.3375, additional: 0.3935 },
    sl:  { plan1: { threshold: 26600, rate: 0.09 }, plan2: { threshold: 28470, rate: 0.09 },
           plan4: { threshold: 33500, rate: 0.09 }, plan5: { threshold: 25000, rate: 0.09 },
           pgl:   { threshold: 21000, rate: 0.06 } },
    note: 'Rates for 2026/27 are based on the confirmed freeze through 2028. Student loan thresholds are estimated — verify with HMRC if any changes were announced after August 2025.',
  },
  '2025/26': {
    pa: 12570, basicRateLimit: 50270, higherRateLimit: 125140, paTaperStart: 100000,
    it: { basic: 0.20, higher: 0.40, additional: 0.45 },
    empNI: { lower: 12570, upper: 50270, basic: 0.08, higher: 0.02 },
    c4NI:  { lower: 12570, upper: 50270, basic: 0.06, higher: 0.02 },
    div: { allowance: 500,  basic: 0.0875, higher: 0.3375, additional: 0.3935 },
    sl:  { plan1: { threshold: 26065, rate: 0.09 }, plan2: { threshold: 28470, rate: 0.09 },
           plan4: { threshold: 32745, rate: 0.09 }, plan5: { threshold: 25000, rate: 0.09 },
           pgl:   { threshold: 21000, rate: 0.06 } },
  },
  '2024/25': {
    pa: 12570, basicRateLimit: 50270, higherRateLimit: 125140, paTaperStart: 100000,
    it: { basic: 0.20, higher: 0.40, additional: 0.45 },
    empNI: { lower: 12570, upper: 50270, basic: 0.08, higher: 0.02 },
    c4NI:  { lower: 12570, upper: 50270, basic: 0.06, higher: 0.02 },
    div: { allowance: 500,  basic: 0.0875, higher: 0.3375, additional: 0.3935 },
    sl:  { plan1: { threshold: 24990, rate: 0.09 }, plan2: { threshold: 27295, rate: 0.09 },
           plan4: { threshold: 31395, rate: 0.09 }, plan5: { threshold: 25000, rate: 0.09 },
           pgl:   { threshold: 21000, rate: 0.06 } },
  },
  '2023/24': {
    pa: 12570, basicRateLimit: 50270, higherRateLimit: 125140, paTaperStart: 100000,
    it: { basic: 0.20, higher: 0.40, additional: 0.45 },
    empNI: { lower: 12570, upper: 50270, basic: 0.12, higher: 0.02 },
    c4NI:  { lower: 12570, upper: 50270, basic: 0.09, higher: 0.02 },
    div: { allowance: 1000, basic: 0.0875, higher: 0.3375, additional: 0.3935 },
    sl:  { plan1: { threshold: 22015, rate: 0.09 }, plan2: { threshold: 27295, rate: 0.09 },
           plan4: { threshold: 27660, rate: 0.09 },
           pgl:   { threshold: 21000, rate: 0.06 } },
    note: 'NI rates were cut mid-year (6 Jan 2024): employee NI 12%→10%, Class 4 9%→8%. This estimate uses the rates that applied for most of the year.',
  },
  '2022/23': {
    pa: 12570, basicRateLimit: 50270, higherRateLimit: 150000, paTaperStart: 100000,
    it: { basic: 0.20, higher: 0.40, additional: 0.45 },
    empNI: { lower: 12570, upper: 50270, basic: 0.12, higher: 0.02 },
    c4NI:  { lower: 12570, upper: 50270, basic: 0.09, higher: 0.02 },
    div: { allowance: 2000, basic: 0.0875, higher: 0.3375, additional: 0.3935 },
    sl:  { plan1: { threshold: 20195, rate: 0.09 }, plan2: { threshold: 27295, rate: 0.09 },
           plan4: { threshold: 25375, rate: 0.09 },
           pgl:   { threshold: 21000, rate: 0.06 } },
    note: 'NI rates were temporarily higher Apr–Nov 2022 (Health & Social Care Levy). This estimate uses the main-year rates of 12% / 9%.',
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getT() {
  return TAX_YEARS[document.getElementById('tax-year').value] || TAX_YEARS['2026/27'];
}

// Personal allowance tapers £1 per £2 over £100k
function getPA(totalIncome, T) {
  if (totalIncome <= T.paTaperStart) return T.pa;
  const reduction = Math.floor((totalIncome - T.paTaperStart) / 2);
  return Math.max(0, T.pa - reduction);
}

// Income tax on taxable income (after PA already deducted), using year config
function calcIncomeTax(taxable, T) {
  if (taxable <= 0) return 0;
  const basicBand  = T.basicRateLimit - T.pa;
  const higherBand = T.higherRateLimit - T.basicRateLimit;
  let t = Math.min(taxable, basicBand) * T.it.basic;
  if (taxable > basicBand)
    t += Math.min(taxable - basicBand, higherBand) * T.it.higher;
  if (taxable > basicBand + higherBand)
    t += (taxable - basicBand - higherBand) * T.it.additional;
  return t;
}

function calcEmployeeNI(salary, T) {
  if (salary <= T.empNI.lower) return 0;
  let ni = (Math.min(salary, T.empNI.upper) - T.empNI.lower) * T.empNI.basic;
  if (salary > T.empNI.upper) ni += (salary - T.empNI.upper) * T.empNI.higher;
  return ni;
}

function calcClass4NI(profit, T) {
  if (profit <= T.c4NI.lower) return 0;
  let ni = (Math.min(profit, T.c4NI.upper) - T.c4NI.lower) * T.c4NI.basic;
  if (profit > T.c4NI.upper) ni += (profit - T.c4NI.upper) * T.c4NI.higher;
  return ni;
}

// Dividends sit on top of non-savings income in the tax bands
function calcDividendTax(dividends, totalNonSavings, pa, T) {
  if (dividends <= 0) return 0;
  const taxable = Math.max(0, dividends - T.div.allowance);
  if (taxable === 0) return 0;
  const basicBand  = T.basicRateLimit - T.pa;
  const higherBand = T.higherRateLimit - T.basicRateLimit;
  const usedBand   = Math.max(0, totalNonSavings - pa);
  const remBasic   = Math.max(0, basicBand  - usedBand);
  const remHigher  = Math.max(0, higherBand - Math.max(0, usedBand - basicBand));
  let rem = taxable, tax = 0;
  const inBasic  = Math.min(rem, remBasic);  tax += inBasic  * T.div.basic;  rem -= inBasic;
  const inHigher = Math.min(rem, remHigher); tax += inHigher * T.div.higher; rem -= inHigher;
  return tax + rem * T.div.additional;
}

// Parse UK tax code → PAYE personal allowance
// Returns { payePA, specialRate } where specialRate is null | 'basic' | 'higher' | 'additional' | 'none'
function parseTaxCode(raw) {
  if (!raw || !raw.trim()) return { payePA: null, specialRate: null }; // use standard
  const c = raw.trim().toUpperCase().replace(/\s/g, '');
  if (c === 'BR')  return { payePA: 0, specialRate: 'basic' };
  if (c === 'D0')  return { payePA: 0, specialRate: 'higher' };
  if (c === 'D1')  return { payePA: 0, specialRate: 'additional' };
  if (c === 'NT')  return { payePA: 0, specialRate: 'none' };
  if (c === '0T')  return { payePA: 0, specialRate: null };
  const kMatch = c.match(/^K(\d+)/);
  if (kMatch) return { payePA: -(parseInt(kMatch[1]) * 10), specialRate: null };
  const std = c.match(/^(\d+)[A-Z]?$/);
  if (std) return { payePA: parseInt(std[1]) * 10, specialRate: null };
  return { payePA: null, specialRate: null }; // unrecognised — use standard
}

function calcPayeIT(salary, taxCodeStr, T) {
  const { payePA, specialRate } = parseTaxCode(taxCodeStr);
  if (specialRate === 'none')       return 0;
  if (specialRate === 'basic')      return salary * T.it.basic;
  if (specialRate === 'higher')     return salary * T.it.higher;
  if (specialRate === 'additional') return salary * T.it.additional;
  const pa = payePA !== null ? payePA : T.pa; // fallback to year standard
  return calcIncomeTax(Math.max(0, salary - pa), T);
}

// ── Student loan ─────────────────────────────────────────────────────────────

function calcStudentLoan(salary, seProfit, slPlan, T) {
  if (!slPlan) return { total: 0, paye: 0, sa: 0 };
  let total = 0, paye = 0;
  for (const plan of slPlan.split('+')) {
    const cfg = T.sl?.[plan];
    if (!cfg) continue;
    total += Math.max(0, salary + seProfit - cfg.threshold) * cfg.rate;
    paye  += Math.max(0, salary - cfg.threshold) * cfg.rate;
  }
  return { total, paye, sa: Math.max(0, total - paye) };
}

// ── Main calculation ─────────────────────────────────────────────────────────

// pension = { sacrifice: number, personal: number }
function calculate(salary, seIncome, useTrading, seExpenses, dividends, taxCodeStr, pension, slPlan) {
  const T = getT();
  const TRADING_ALLOWANCE = 1000;
  const seProfit = useTrading
    ? Math.max(0, seIncome - TRADING_ALLOWANCE)
    : Math.max(0, seIncome - seExpenses);

  const sacrificeAmount = pension?.sacrifice || 0;
  const personalAmount  = pension?.personal  || 0;

  // Salary sacrifice reduces effective salary for all tax and NI calculations
  const effectiveSalary = Math.max(0, salary - sacrificeAmount);

  // Personal/SIPP: extend the basic rate band; also use adjusted net income for PA taper
  const itT = personalAmount > 0
    ? { ...T, basicRateLimit: T.basicRateLimit + personalAmount }
    : T;
  const adjustedNetIncome = Math.max(0, effectiveSalary + seProfit + dividends - personalAmount);

  const totalNonSavings = effectiveSalary + seProfit;
  const totalIncome     = totalNonSavings + dividends;
  const pa              = getPA(adjustedNetIncome, T);

  const taxableNonSavings = Math.max(0, totalNonSavings - pa);
  const totalNonSavingsIT = calcIncomeTax(taxableNonSavings, itT);

  const payeIT = calcPayeIT(effectiveSalary, taxCodeStr, T);
  const payeNI = calcEmployeeNI(effectiveSalary, T);

  const seIT   = Math.max(0, totalNonSavingsIT - payeIT);
  const c4NI   = calcClass4NI(seProfit, T);
  const divTax = calcDividendTax(dividends, totalNonSavings, pa, itT);

  const sl = calcStudentLoan(effectiveSalary, seProfit, slPlan, T);

  const totalPAYE = payeIT + payeNI + sl.paye;
  const saDue     = seIT + c4NI + divTax + sl.sa;
  const totalTax  = totalNonSavingsIT + divTax + payeNI + c4NI + sl.total;

  return {
    salary, effectiveSalary, seProfit, dividends, useTrading,
    sacrificeAmount, personalAmount,
    pensionDetails: pension || null,
    totalNonSavings, totalIncome, pa,
    payeIT, payeNI, totalPAYE,
    seIT, c4NI, divTax,
    slPaye: sl.paye, slSa: sl.sa, slTotal: sl.total, hasSl: sl.total > 0,
    totalTax, saDue,
    monthly:       saDue / 12,
    effectiveRate: totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0,
    divAllowance:  T.div.allowance,
    yearNote:      T.note || null,
  };
}

// ── UI helpers ───────────────────────────────────────────────────────────────

const fmt = n => '£' + Math.round(n).toLocaleString('en-GB');

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── Pension helpers ───────────────────────────────────────────────────────────

const QUALIFYING_LOWER = 6240;

function getWorkplacePensionAmounts() {
  const salary      = parseFloat(document.getElementById('salary').value) || 0;
  const basis       = document.querySelector('input[name="pension-basis"]:checked')?.value || 'qualifying';
  const employeePct = parseFloat(document.getElementById('pension-employee-pct').value) || 0;
  const employerPct = parseFloat(document.getElementById('pension-employer-pct').value) || 0;
  const T           = getT();
  const base = basis === 'qualifying'
    ? Math.max(0, Math.min(salary, T.basicRateLimit) - QUALIFYING_LOWER)
    : salary;
  return {
    base,
    employeeAnnual: Math.round(base * employeePct / 100),
    employerAnnual: Math.round(base * employerPct / 100),
  };
}

function getSippAmounts() {
  const amount = parseFloat(document.getElementById('pension-personal-amount').value) || 0;
  const freq   = document.getElementById('pension-personal-freq').value;
  const mult   = freq === 'weekly' ? 52 : freq === 'monthly' ? 12 : 1;
  const netAnnual   = Math.round(amount * mult);
  const grossAnnual = Math.round(netAnnual / 0.8);
  return { netAnnual, grossAnnual, reliefAnnual: grossAnnual - netAnnual };
}

function fmtMoYr(annual) {
  return `${fmt(Math.round(annual / 12))}/mo · ${fmt(annual)}/yr`;
}

function updateWorkplacePensionPreview() {
  const salary  = parseFloat(document.getElementById('salary').value) || 0;
  const basis   = document.querySelector('input[name="pension-basis"]:checked')?.value || 'qualifying';
  const { base, employeeAnnual, employerAnnual } = getWorkplacePensionAmounts();

  const qeEl = document.getElementById('pension-qe-display');
  if (qeEl) qeEl.textContent = basis === 'qualifying' && salary > 0 ? `Qualifying earnings: ${fmt(base)}/year` : '';

  const preview = document.getElementById('workplace-pension-preview');
  if (!preview) return;
  const hasData = (employeeAnnual > 0 || employerAnnual > 0) && salary > 0;
  preview.style.display = hasData ? '' : 'none';
  if (hasData) {
    setEl('wp-employee-display', fmtMoYr(employeeAnnual));
    setEl('wp-employer-display', fmtMoYr(employerAnnual));
    setEl('wp-total-display',    fmtMoYr(employeeAnnual + employerAnnual));
  }
}

function updateSippPreview() {
  const { netAnnual, grossAnnual, reliefAnnual } = getSippAmounts();
  const preview = document.getElementById('sipp-preview');
  if (!preview) return;
  preview.style.display = netAnnual > 0 ? '' : 'none';
  if (netAnnual > 0) {
    setEl('sipp-net-display',    fmtMoYr(netAnnual));
    setEl('sipp-relief-display', fmtMoYr(reliefAnnual));
    setEl('sipp-gross-display',  fmtMoYr(grossAnnual));
  }
}

// ── Profit preview ───────────────────────────────────────────────────────────

function updateProfitPreview() {
  const income     = parseFloat(document.getElementById('se-income').value)    || 0;
  const useTrading = document.querySelector('input[name="expense-method"]:checked')?.value === 'trading';
  const expenses   = useTrading ? 1000 : (parseFloat(document.getElementById('se-expenses').value) || 0);
  const profit     = Math.max(0, income - expenses);
  const preview    = document.getElementById('profit-preview');

  if (income > 0) {
    preview.classList.add('visible');
    document.getElementById('profit-amount').textContent = fmt(profit);
    if (useTrading && income <= 1000) {
      document.getElementById('profit-amount').textContent = '£0 (trading allowance covers all income)';
    }
  } else {
    preview.classList.remove('visible');
  }
}

// ── Render results ───────────────────────────────────────────────────────────

function renderResults(r) {
  const hasDivs = r.dividends > 0;

  setEl('r-total-income',   fmt(r.totalIncome));
  setEl('r-total-tax',      fmt(r.totalTax));
  setEl('r-effective-rate', r.effectiveRate.toFixed(1) + '% effective rate');
  setEl('r-sa-due',         fmt(r.saDue));
  setEl('r-monthly',        fmt(r.monthly) + '/mo');
  setEl('r-monthly-banner', fmt(r.monthly) + '/month');

  setEl('b-salary',       fmt(r.salary));
  setEl('b-se-profit',    fmt(r.seProfit));
  setEl('b-dividends',    fmt(r.dividends));
  setEl('b-total-income', fmt(r.totalIncome));
  setEl('b-pa',           '−' + fmt(r.pa));

  setEl('b-paye-it',    fmt(r.payeIT));
  setEl('b-paye-ni',    fmt(r.payeNI));
  setEl('b-paye-total', fmt(r.totalPAYE));

  setEl('b-se-it',    fmt(r.seIT));
  setEl('b-class4',   fmt(r.c4NI));
  setEl('b-div-tax',  fmt(r.divTax));
  setEl('b-sa-total', fmt(r.saDue));

  // Dividend allowance label
  setEl('b-div-allowance-amount', '−' + fmt(r.divAllowance));

  // SE method label
  setEl('b-se-method', r.useTrading ? 'Self-employment profit (after £1,000 trading allowance)' : 'Self-employment profit');

  document.getElementById('b-div-income-row').style.display    = hasDivs ? '' : 'none';
  document.getElementById('b-div-allowance-row').style.display = hasDivs ? '' : 'none';
  document.getElementById('b-div-tax-row').style.display       = hasDivs ? '' : 'none';

  // Salary sacrifice: shown as a deduction in the income breakdown
  const sacrificeRow = document.getElementById('b-pension-sacrifice-row');
  if (r.sacrificeAmount > 0) {
    sacrificeRow.style.display = '';
    setEl('b-pension-sacrifice-display', '−' + fmt(r.sacrificeAmount));
  } else {
    sacrificeRow.style.display = 'none';
  }

  // Pension summary card
  const pd           = r.pensionDetails;
  const hasWorkplace = pd && (pd.sacrifice > 0 || pd.employerAnnual > 0);
  const hasSipp      = pd && pd.sippNetAnnual > 0;
  const summaryCard  = document.getElementById('pension-summary-card');
  if (summaryCard) {
    summaryCard.style.display = (hasWorkplace || hasSipp) ? '' : 'none';

    const wpSection = document.getElementById('ps-workplace-section');
    if (wpSection) {
      wpSection.style.display = hasWorkplace ? '' : 'none';
      if (hasWorkplace) {
        setEl('ps-employee', fmtMoYr(pd.sacrifice || 0));
        setEl('ps-employer', fmtMoYr(pd.employerAnnual || 0));
        setEl('ps-wp-total', fmtMoYr((pd.sacrifice || 0) + (pd.employerAnnual || 0)));
      }
    }

    const sippSection = document.getElementById('ps-sipp-section');
    if (sippSection) {
      sippSection.style.display = hasSipp ? '' : 'none';
      if (hasSipp) {
        setEl('ps-sipp-net',    fmtMoYr(pd.sippNetAnnual));
        setEl('ps-sipp-relief', fmtMoYr(r.personalAmount - pd.sippNetAnnual));
        setEl('ps-sipp-total',  fmtMoYr(r.personalAmount));
      }
    }

    const allSection = document.getElementById('ps-all-section');
    if (allSection) {
      allSection.style.display = (hasWorkplace && hasSipp) ? '' : 'none';
      if (hasWorkplace && hasSipp) {
        setEl('ps-all-total', fmtMoYr((pd.sacrifice || 0) + (pd.employerAnnual || 0) + r.personalAmount));
      }
    }
  }

  // Student loan rows
  document.getElementById('b-sl-paye-row').style.display = r.hasSl ? '' : 'none';
  document.getElementById('b-sl-sa-row').style.display   = r.hasSl ? '' : 'none';
  if (r.hasSl) {
    setEl('b-sl-paye', fmt(r.slPaye));
    setEl('b-sl-sa',   fmt(r.slSa));
  }

  // Year note
  const noteEl = document.getElementById('year-note');
  if (r.yearNote) {
    noteEl.textContent = r.yearNote;
    noteEl.classList.remove('hidden');
  } else {
    noteEl.classList.add('hidden');
  }

  const resultsEl = document.getElementById('results');
  resultsEl.classList.remove('hidden');
  setTimeout(() => resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

// ── Modal logic ──────────────────────────────────────────────────────────────

document.querySelectorAll('[data-modal]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById(btn.dataset.modal)?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });
});

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay || e.target.classList.contains('modal-close')) {
      overlay.classList.add('hidden');
      document.body.style.overflow = '';
    }
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => {
      m.classList.add('hidden');
      document.body.style.overflow = '';
    });
  }
});

// ── Expense method toggle ─────────────────────────────────────────────────────

document.querySelectorAll('input[name="expense-method"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const useTrading = radio.value === 'trading';
    document.getElementById('actual-expenses-field').classList.toggle('hidden', useTrading);
    updateProfitPreview();
  });
});

// ── Tax year change → update header badge ────────────────────────────────────

document.getElementById('tax-year').addEventListener('change', function () {
  document.getElementById('header-tax-year').textContent = this.value + ' Tax Year';
});

// ── Input events ─────────────────────────────────────────────────────────────

document.getElementById('se-income').addEventListener('input', updateProfitPreview);
document.getElementById('se-expenses').addEventListener('input', updateProfitPreview);

['salary', 'pension-employee-pct', 'pension-employer-pct'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', updateWorkplacePensionPreview);
});
document.querySelectorAll('input[name="pension-basis"]').forEach(r => {
  r.addEventListener('change', updateWorkplacePensionPreview);
});
document.getElementById('pension-personal-amount')?.addEventListener('input', updateSippPreview);
document.getElementById('pension-personal-freq')?.addEventListener('change', updateSippPreview);

document.getElementById('dividends-toggle').addEventListener('change', function () {
  document.getElementById('dividends-fields').classList.toggle('hidden', !this.checked);
});

document.getElementById('pension-toggle').addEventListener('change', function () {
  document.getElementById('pension-fields').classList.toggle('hidden', !this.checked);
});

document.getElementById('sl-toggle').addEventListener('change', function () {
  document.getElementById('sl-fields').classList.toggle('hidden', !this.checked);
});

document.getElementById('calculate-btn').addEventListener('click', () => {
  const salary     = parseFloat(document.getElementById('salary').value)      || 0;
  const seIncome   = parseFloat(document.getElementById('se-income').value)   || 0;
  const seExpenses = parseFloat(document.getElementById('se-expenses').value) || 0;
  const useTrading = document.querySelector('input[name="expense-method"]:checked')?.value === 'trading';
  const dividends  = document.getElementById('dividends-toggle').checked
    ? (parseFloat(document.getElementById('dividends').value) || 0) : 0;
  const taxCode    = document.getElementById('tax-code').value.trim();

  const pensionEnabled = document.getElementById('pension-toggle').checked;
  let pension = null;
  if (pensionEnabled) {
    const { employeeAnnual, employerAnnual } = getWorkplacePensionAmounts();
    const { netAnnual, grossAnnual }         = getSippAmounts();
    pension = {
      sacrifice:      employeeAnnual,
      personal:       grossAnnual,
      employerAnnual: employerAnnual,
      sippNetAnnual:  netAnnual,
    };
  }

  const slEnabled = document.getElementById('sl-toggle').checked;
  const slPlan    = slEnabled ? document.getElementById('sl-plan').value : null;

  const errorEl = document.getElementById('error-msg');
  if (salary === 0 && seIncome === 0 && dividends === 0) {
    errorEl.classList.remove('hidden');
    return;
  }
  errorEl.classList.add('hidden');

  renderResults(calculate(salary, seIncome, useTrading, seExpenses, dividends, taxCode, pension, slPlan));
});

['salary', 'se-income', 'dividends'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => {
    document.getElementById('error-msg').classList.add('hidden');
  });
});

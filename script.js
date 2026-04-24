// UK 2025/26 Tax Constants (England, Wales & Northern Ireland)
const TAX = {
  personalAllowance: 12570,
  basicRateLimit:    50270,   // top of basic rate band
  higherRateLimit:   125140,  // top of higher rate band
  basicBandWidth:    37700,   // 50270 - 12570
  higherBandWidth:   74870,   // 125140 - 50270
  paTaperStart:      100000,

  incomeTax: { basic: 0.20, higher: 0.40, additional: 0.45 },

  employeeNI: { lower: 12570, upper: 50270, basic: 0.08, higher: 0.02 },
  class4NI:   { lower: 12570, upper: 50270, basic: 0.06, higher: 0.02 },

  dividends: {
    allowance:  500,
    basic:      0.0875,
    higher:     0.3375,
    additional: 0.3935,
  },
};

// Personal allowance — tapers by £1 for every £2 over £100k
function getPA(totalIncome) {
  if (totalIncome <= TAX.paTaperStart) return TAX.personalAllowance;
  const reduction = Math.floor((totalIncome - TAX.paTaperStart) / 2);
  return Math.max(0, TAX.personalAllowance - reduction);
}

// Income tax on taxable income (after PA already deducted)
function calcIncomeTax(taxable) {
  if (taxable <= 0) return 0;
  let t = Math.min(taxable, TAX.basicBandWidth) * TAX.incomeTax.basic;
  if (taxable > TAX.basicBandWidth) {
    t += Math.min(taxable - TAX.basicBandWidth, TAX.higherBandWidth) * TAX.incomeTax.higher;
  }
  if (taxable > TAX.basicBandWidth + TAX.higherBandWidth) {
    t += (taxable - TAX.basicBandWidth - TAX.higherBandWidth) * TAX.incomeTax.additional;
  }
  return t;
}

function calcEmployeeNI(salary) {
  if (salary <= TAX.employeeNI.lower) return 0;
  let ni = (Math.min(salary, TAX.employeeNI.upper) - TAX.employeeNI.lower) * TAX.employeeNI.basic;
  if (salary > TAX.employeeNI.upper) {
    ni += (salary - TAX.employeeNI.upper) * TAX.employeeNI.higher;
  }
  return ni;
}

function calcClass4NI(profit) {
  if (profit <= TAX.class4NI.lower) return 0;
  let ni = (Math.min(profit, TAX.class4NI.upper) - TAX.class4NI.lower) * TAX.class4NI.basic;
  if (profit > TAX.class4NI.upper) {
    ni += (profit - TAX.class4NI.upper) * TAX.class4NI.higher;
  }
  return ni;
}

// Dividends sit on top of non-savings income in the tax bands
function calcDividendTax(dividends, totalNonSavings, pa) {
  if (dividends <= 0) return 0;
  const taxable = Math.max(0, dividends - TAX.dividends.allowance);
  if (taxable === 0) return 0;

  const usedBand   = Math.max(0, totalNonSavings - pa);
  const remBasic   = Math.max(0, TAX.basicBandWidth  - usedBand);
  const remHigher  = Math.max(0, TAX.higherBandWidth - Math.max(0, usedBand - TAX.basicBandWidth));

  let remaining = taxable;
  let tax = 0;

  const inBasic  = Math.min(remaining, remBasic);
  tax      += inBasic * TAX.dividends.basic;
  remaining -= inBasic;

  const inHigher  = Math.min(remaining, remHigher);
  tax      += inHigher * TAX.dividends.higher;
  remaining -= inHigher;

  tax += remaining * TAX.dividends.additional;
  return tax;
}

function calculate(salary, seIncome, seExpenses, dividends) {
  const seProfit       = Math.max(0, seIncome - seExpenses);
  const totalNonSavings = salary + seProfit;
  const totalIncome    = totalNonSavings + dividends;

  // Personal allowance uses total income (incl dividends, as HMRC does)
  const pa = getPA(totalIncome);

  // Total income tax on salary + SE profit combined
  const taxableNonSavings = Math.max(0, totalNonSavings - pa);
  const totalNonSavingsIT = calcIncomeTax(taxableNonSavings);

  // PAYE estimate: employer taxed salary on standard 1257L code
  const payeIT = calcIncomeTax(Math.max(0, salary - TAX.personalAllowance));
  const payeNI = calcEmployeeNI(salary);

  // SE income tax is the marginal tax on top of salary
  const seIT   = Math.max(0, totalNonSavingsIT - payeIT);
  const c4NI   = calcClass4NI(seProfit);
  const divTax = calcDividendTax(dividends, totalNonSavings, pa);

  const totalPAYE = payeIT + payeNI;
  const saDue     = seIT + c4NI + divTax;
  const totalTax  = totalNonSavingsIT + divTax + payeNI + c4NI;

  return {
    salary, seProfit, dividends,
    totalNonSavings, totalIncome, pa,
    payeIT, payeNI, totalPAYE,
    seIT, c4NI, divTax,
    totalTax, saDue,
    monthly:       saDue / 12,
    effectiveRate: totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0,
  };
}

// ── UI helpers ──────────────────────────────────────────────

const fmt = n => '£' + Math.round(n).toLocaleString('en-GB');

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function show(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hide(id) { document.getElementById(id)?.classList.add('hidden'); }

// ── Profit preview ───────────────────────────────────────────

function updateProfitPreview() {
  const income   = parseFloat(document.getElementById('se-income').value)   || 0;
  const expenses = parseFloat(document.getElementById('se-expenses').value) || 0;
  const profit   = Math.max(0, income - expenses);
  const preview  = document.getElementById('profit-preview');

  if (income > 0 || expenses > 0) {
    preview.classList.add('visible');
    document.getElementById('profit-amount').textContent = fmt(profit);
  } else {
    preview.classList.remove('visible');
  }
}

// ── Render results ───────────────────────────────────────────

function renderResults(r) {
  const hasDivs = r.dividends > 0;

  // Summary cards
  setEl('r-total-income',   fmt(r.totalIncome));
  setEl('r-total-tax',      fmt(r.totalTax));
  setEl('r-effective-rate', r.effectiveRate.toFixed(1) + '% effective rate');
  setEl('r-sa-due',         fmt(r.saDue));
  setEl('r-monthly',        fmt(r.monthly) + '/mo');

  // Banner
  setEl('r-monthly-banner', fmt(r.monthly) + '/month');

  // Income section
  setEl('b-salary',      fmt(r.salary));
  setEl('b-se-profit',   fmt(r.seProfit));
  setEl('b-dividends',   fmt(r.dividends));
  setEl('b-total-income', fmt(r.totalIncome));
  setEl('b-pa',          '−' + fmt(r.pa));

  // PAYE section
  setEl('b-paye-it',    fmt(r.payeIT));
  setEl('b-paye-ni',    fmt(r.payeNI));
  setEl('b-paye-total', fmt(r.totalPAYE));

  // Self Assessment section
  setEl('b-se-it',   fmt(r.seIT));
  setEl('b-class4',  fmt(r.c4NI));
  setEl('b-div-tax', fmt(r.divTax));
  setEl('b-sa-total', fmt(r.saDue));

  // Show/hide dividend rows
  document.getElementById('b-div-income-row').style.display  = hasDivs ? '' : 'none';
  document.getElementById('b-div-allowance-row').style.display = hasDivs ? '' : 'none';
  document.getElementById('b-div-tax-row').style.display     = hasDivs ? '' : 'none';

  // Reveal results
  const resultsEl = document.getElementById('results');
  resultsEl.classList.remove('hidden');
  setTimeout(() => resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

// ── Event wiring ─────────────────────────────────────────────

document.getElementById('se-income').addEventListener('input', updateProfitPreview);
document.getElementById('se-expenses').addEventListener('input', updateProfitPreview);

document.getElementById('dividends-toggle').addEventListener('change', function () {
  document.getElementById('dividends-fields').classList.toggle('hidden', !this.checked);
});

document.getElementById('calculate-btn').addEventListener('click', () => {
  const salary     = parseFloat(document.getElementById('salary').value)      || 0;
  const seIncome   = parseFloat(document.getElementById('se-income').value)   || 0;
  const seExpenses = parseFloat(document.getElementById('se-expenses').value) || 0;
  const dividends  = document.getElementById('dividends-toggle').checked
    ? (parseFloat(document.getElementById('dividends').value) || 0)
    : 0;

  const errorEl = document.getElementById('error-msg');

  if (salary === 0 && seIncome === 0 && dividends === 0) {
    errorEl.classList.remove('hidden');
    return;
  }
  errorEl.classList.add('hidden');

  renderResults(calculate(salary, seIncome, seExpenses, dividends));
});

// Dismiss error when user starts typing
['salary', 'se-income', 'dividends'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => {
    document.getElementById('error-msg').classList.add('hidden');
  });
});

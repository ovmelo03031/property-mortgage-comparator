// Acceptance check for index.html calculations. No dependencies: node tests/check.js
'use strict';
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const block = (name) => {
  const m = html.match(new RegExp(`/\\* ${name}:START \\*/([\\s\\S]*?)/\\* ${name}:END \\*/`));
  if (!m) throw new Error(`Block ${name} not found in index.html`);
  return m[1];
};

const lib = new Function(
  `${block('DEFAULTS')}\n${block('CALC')}\nreturn { DEFAULTS, payment, fees, scenario, calc, breakEven, savingsInterest };`
)();
const { DEFAULTS: D, calc, breakEven } = lib;

let failures = 0;
function near(label, actual, expected, tol = 2) {
  const ok = Math.abs(actual - expected) <= tol;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${actual.toFixed(2)} (expected ${expected} ±${tol})`);
}

// The acceptance scenario must match the page defaults.
const expectedDefaults = { price: 1300000, sqft: 900, rent: 79963, down: 20, rate: 3.99, term: 25, sc: 11.8, mgmt: 0, neg: 1250000 };
for (const [k, v] of Object.entries(expectedDefaults)) near(`default ${k}`, D[k], v, 0);

const main = calc(D, D.price);
near('Monthly mortgage', main.pm, 5484);
near('Cash-to-close', main.ctc, 320200);
near('Monthly CF', main.cfM, -760);
near('Break-even rent', breakEven(D, D.price), 89918);
near('Principal amortized year 1', main.prin1, 24759);

const neg = calc(D, D.neg);
near('Negotiated cash-to-close', neg.ctc, 308150);
near('Upfront saving', main.ctc - neg.ctc, 12050);

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);

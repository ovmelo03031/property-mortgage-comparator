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
  `${block('DEFAULTS')}\n${block('CALC')}\nreturn { DEFAULTS, payment, fees, scenario, calc, breakEven, savingsInterest, maxPrice, rentAt, exitCost, simulate, firstYear };`
)();
const { DEFAULTS: D, calc, breakEven, maxPrice, rentAt, exitCost, simulate } = lib;

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

// Walk-away price is the exact inverse of calc: at that price CF equals the target.
near('Max price for CF 0 gives CF 0', calc(D, maxPrice(D, 0)).cfM, 0, 0.01);
near('Max price for CF +500 gives CF +500', calc(D, maxPrice(D, 500)).cfM, 500, 0.01);
near('Break-even at max price equals current rent', breakEven(D, maxPrice(D, 0)), D.rent, 0.01);

// Rent path: current rent, then vacant gap, then renewed rent.
const renew = { ...D, renewIn: 12, renewGap: 2, renewPct: 10 };
near('Rent before renewal', rentAt(renew, 11), D.rent, 0);
near('Rent during vacant gap', rentAt(renew, 12), 0, 0);
near('Rent after renewal', rentAt(renew, 14), D.rent * 1.1, 0.01);

// Exit: 2% agency + 5% VAT, prepayment penalty 1% capped at AED 10,000.
near('Exit cost, penalty capped', exitCost(D, 1300000, 1040000).total, 27300 + 10000);
near('Exit cost, penalty below cap', exitCost(D, 1300000, 500000).total, 27300 + 5000);

// Simulation year 1 must match the steady-state model when rent does not change.
const sim = simulate(D, D.price, 360);
near('Simulated year-1 CF equals annual CF', sim.years[0].cumCF, main.cfA);
near('Simulated balance after 12 months', sim.years[0].balance, main.bal12);
near('Simulated balance after 24 months', sim.years[1].balance, main.bal24);
near('Mortgage fully repaid at term end', sim.years[D.term - 1].balance, 0, 1);
// Not buying: balance above the cap earns only on the capped amount.
near('Savings without buying after 1 year', sim.years[0].savNo, 500000 + 500000 * 0.0625);
near('Net worth identity (hold)', sim.years[4].nwHold, sim.years[4].savBuy + D.price - sim.years[4].balance);

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);

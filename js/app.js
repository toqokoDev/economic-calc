import {
  DEFAULT_FUNCTIONS,
  DEFAULTS,
  calculateAll,
  formatNum,
  formatInt,
  ktFromModulesPercent,
} from './calculator.js';
import { NOVELTY_KN, STAGE_COEFFS } from './labor-table.js';

const els = {
  productName: document.getElementById('productName'),
  productFunctions: document.getElementById('productFunctions'),
  productType: document.getElementById('productType'),
  devEnvironment: document.getElementById('devEnvironment'),
  complexityGroup: document.getElementById('complexityGroup'),
  complexityKi: document.getElementById('complexityKi'),
  noveltyGroup: document.getElementById('noveltyGroup'),
  noveltyKn: document.getElementById('noveltyKn'),
  modulesPercent: document.getElementById('modulesPercent'),
  modulesKt: document.getElementById('modulesKt'),
  tariffGrade1: document.getElementById('tariffGrade1'),
  tariffCoeff: document.getElementById('tariffCoeff'),
  workDaysPerMonth: document.getElementById('workDaysPerMonth'),
  naturalLossKp: document.getElementById('naturalLossKp'),
  bonusKpr: document.getElementById('bonusKpr'),
  extraSalaryPercent: document.getElementById('extraSalaryPercent'),
  fsznPercent: document.getElementById('fsznPercent'),
  bgsPercent: document.getElementById('bgsPercent'),
  electricityTariff: document.getElementById('electricityTariff'),
  electricityKwhPerDay: document.getElementById('electricityKwhPerDay'),
  assetName: document.getElementById('assetName'),
  assetCount: document.getElementById('assetCount'),
  assetCost: document.getElementById('assetCost'),
  assetServiceLife: document.getElementById('assetServiceLife'),
  effectiveFundDays: document.getElementById('effectiveFundDays'),
  otherCostsPercent: document.getElementById('otherCostsPercent'),
  overheadPercent: document.getElementById('overheadPercent'),
  supportPercent: document.getElementById('supportPercent'),
  marketPrice: document.getElementById('marketPrice'),
  materialsCost: document.getElementById('materialsCost'),
  programmersCount: document.getElementById('programmersCount'),
  functionsBody: document.getElementById('functionsBody'),
  laborTableBody: document.getElementById('laborTableBody'),
  resultsTableBody: document.getElementById('resultsTableBody'),
  summaryBlocks: document.getElementById('summaryBlocks'),
  conclusion: document.getElementById('conclusion'),
  volCatalogTotal: document.getElementById('volCatalogTotal'),
  volRefinedSum: document.getElementById('volRefinedSum'),
  refinedVolumeOverride: document.getElementById('refinedVolumeOverride'),
  normativeLabor: document.getElementById('normativeLabor'),
  laborRowInfo: document.getElementById('laborRowInfo'),
  depreciationBody: document.getElementById('depreciationBody'),
};

let functions = structuredClone(DEFAULT_FUNCTIONS);
let volumeOverrideManual = false;

function fillNoveltyKnOptions(group, selected) {
  const options = NOVELTY_KN[group] || NOVELTY_KN.B;
  els.noveltyKn.innerHTML = options
    .map((v) => `<option value="${v}" ${v === selected ? 'selected' : ''}>${v}</option>`)
    .join('');
}

function initApp() {
  Object.entries(DEFAULTS).forEach(([key, value]) => {
    const el = els[key];
    if (!el) return;
    el.value = value;
  });
  fillNoveltyKnOptions(DEFAULTS.noveltyGroup, DEFAULTS.noveltyKn);
  functions = structuredClone(DEFAULT_FUNCTIONS);
  volumeOverrideManual = false;
  els.refinedVolumeOverride.value = '';
  renderFunctions();
  recalculate();
}

function readInput() {
  const noveltyGroup = els.noveltyGroup.value;
  return {
    productName: els.productName.value,
    productFunctions: els.productFunctions.value,
    productType: els.productType.value,
    devEnvironment: els.devEnvironment.value,
    complexityGroup: Number(els.complexityGroup.value),
    complexityKi: Number(els.complexityKi.value),
    noveltyGroup,
    noveltyKn: Number(els.noveltyKn.value),
    modulesPercent: Number(els.modulesPercent.value),
    modulesKt: Number(els.modulesKt.value),
    stageCoeffs: STAGE_COEFFS[noveltyGroup],
    tariffGrade1: Number(els.tariffGrade1.value),
    tariffCoeff: Number(els.tariffCoeff.value),
    workDaysPerMonth: Number(els.workDaysPerMonth.value),
    naturalLossKp: Number(els.naturalLossKp.value),
    bonusKpr: Number(els.bonusKpr.value),
    extraSalaryPercent: Number(els.extraSalaryPercent.value),
    fsznPercent: Number(els.fsznPercent.value),
    bgsPercent: Number(els.bgsPercent.value),
    electricityTariff: Number(els.electricityTariff.value),
    electricityKwhPerDay: Number(els.electricityKwhPerDay.value),
    assetName: els.assetName.value,
    assetCount: Number(els.assetCount.value),
    assetCost: Number(els.assetCost.value),
    assetServiceLife: Number(els.assetServiceLife.value),
    effectiveFundDays: Number(els.effectiveFundDays.value),
    otherCostsPercent: Number(els.otherCostsPercent.value),
    overheadPercent: Number(els.overheadPercent.value),
    supportPercent: Number(els.supportPercent.value),
    marketPrice: Number(els.marketPrice.value),
    materialsCost: Number(els.materialsCost.value),
    programmersCount: Number(els.programmersCount.value),
    refinedVolumeOverride: els.refinedVolumeOverride.value,
    functions,
  };
}

function renderFunctions() {
  els.functionsBody.innerHTML = functions
    .map(
      (row, index) => `
    <tr data-index="${index}">
      <td><input class="table-input table-input--code" type="number" data-field="code" value="${row.code}"></td>
      <td><input class="table-input" type="text" data-field="name" value="${escapeHtml(row.name)}"></td>
      <td class="num"><input class="table-input table-input--num" type="number" min="0" data-field="catalog" value="${row.catalog}"></td>
      <td class="num"><input class="table-input table-input--num" type="number" min="0" data-field="refined" value="${row.refined}"></td>
      <td><button type="button" class="btn btn-icon" data-remove="${index}" title="Удалить строку">✕</button></td>
    </tr>`
    )
    .join('');

  els.functionsBody.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', onFunctionInput);
  });
  els.functionsBody.querySelectorAll('.btn-icon').forEach((btn) => {
    btn.addEventListener('click', () => {
      functions.splice(Number(btn.dataset.remove), 1);
      renderFunctions();
      recalculate();
    });
  });
}

function onFunctionInput(event) {
  const tr = event.target.closest('tr');
  const index = Number(tr.dataset.index);
  const field = event.target.dataset.field;
  functions[index][field] =
    field === 'name' ? event.target.value : Number(event.target.value) || 0;
  volumeOverrideManual = false;
  recalculate();
}

function renderLaborTable(result) {
  const { stageDistribution, kc, kn, kt, tn, totalLabor } = result;

  const coeffRow = stageDistribution.map((s) => `<td class="num">${formatNum(s.coeff, 2)}</td>`).join('');
  const stageTnRow = stageDistribution
    .map((s) => `<td class="num">${formatNum(s.stageTn, 2)}</td>`)
    .join('');
  const kcRow = stageDistribution.map(() => `<td class="num">${formatNum(kc, 2)}</td>`).join('');
  const ktCells = ['tz', 'ep', 'tp', 'rp', 'vn']
    .map((key) => (key === 'rp' ? `<td class="num">${formatNum(kt, 2)}</td>` : '<td class="num">—</td>'))
    .join('');
  const knRow = stageDistribution.map(() => `<td class="num">${formatNum(kn, 2)}</td>`).join('');
  const laborRow = stageDistribution.map((s) => `<td class="num">${formatInt(s.labor)}</td>`).join('');

  els.laborTableBody.innerHTML = `
    <tr>
      <td>1. Коэффициенты удельных весов трудоёмкости стадии разработки ПО</td>
      ${coeffRow}<td class="num">1,00</td>
    </tr>
    <tr>
      <td>2. Распределение нормативной трудоёмкости ПО по стадиям, чел.-дн.</td>
      ${stageTnRow}<td class="num">${formatNum(tn, 2)}</td>
    </tr>
    <tr>
      <td>3. Коэффициент сложности ПО (Кс)</td>
      ${kcRow}<td class="num">—</td>
    </tr>
    <tr>
      <td>4. Коэффициент использования стандартных модулей (Кт)</td>
      ${ktCells}<td class="num">—</td>
    </tr>
    <tr>
      <td>5. Коэффициент новизны ПО (Кн)</td>
      ${knRow}<td class="num">—</td>
    </tr>
    <tr class="total-row">
      <td>6. Общая трудоёмкость ПО (То), чел.-дн.</td>
      ${laborRow}<td class="num">${formatInt(totalLabor)}</td>
    </tr>`;
}

function renderDepreciation(result, input) {
  const { depreciation, totalLabor } = result;
  const count = input.assetCount || 1;
  els.depreciationBody.innerHTML = `
    <tr>
      <td>${escapeHtml(input.assetName || 'Основное средство')}</td>
      <td class="num">${formatInt(count)}</td>
      <td class="num">${formatNum(depreciation.assetCost, 2)}</td>
      <td class="num">${formatNum(depreciation.na, 2)}</td>
      <td class="num">${formatNum(depreciation.aog, 2)}</td>
      <td class="num">${formatInt(totalLabor)}</td>
      <td class="num">${formatNum(depreciation.aopp, 2)}</td>
    </tr>
    <tr class="total-row">
      <td>Всего</td>
      <td class="num">${formatInt(count)}</td>
      <td class="num">${formatNum(depreciation.assetCost * count, 2)}</td>
      <td class="num">${formatNum(depreciation.na, 2)}</td>
      <td class="num">${formatNum(depreciation.aog * count, 2)}</td>
      <td class="num">${formatInt(totalLabor)}</td>
      <td class="num">${formatNum(depreciation.aopp * count, 2)}</td>
    </tr>`;
}

function renderResults(result) {
  const rows = [
    ['Время разработки', 'дн.', formatInt(result.totalLabor)],
    ['Количество программистов', 'чел.', formatInt(result.programmersCount)],
    ['Основная заработная плата', 'руб.', formatNum(result.salary.coz, 2)],
    ['Дополнительная заработная плата', 'руб.', formatNum(result.cdz, 2)],
    ['Отчисления в ФСЗН', 'руб.', formatNum(result.cfszn, 2)],
    ['Отчисления по обязательному страхованию', 'руб.', formatNum(result.cbgs, 2)],
    ['Расходы на электроэнергию', 'руб.', formatNum(result.electricity.total, 2)],
    ['Амортизационные отчисления на период проведения', 'руб.', formatNum(result.depreciation.aopp, 2)],
    ['Прочие расходы', 'руб.', formatNum(result.cpz, 2)],
    ['Общепроизводственные и общехозяйственные расходы', 'руб.', formatNum(result.cnr, 2)],
    ['Себестоимость разработки программного средства', 'руб.', formatNum(result.cr, 2)],
    ['Расходы на сопровождение и адаптацию', 'руб.', formatNum(result.crsa, 2)],
    ['Полная себестоимость', 'руб.', formatNum(result.cp, 2)],
    ['Прибыль от реализации', 'руб.', formatNum(result.profit, 2)],
    ['Цена разработки с НДС', 'руб.', formatNum(result.marketPrice, 2)],
    ['Рентабельность разработки', '%', formatNum(result.profitability, 2)],
  ];

  els.resultsTableBody.innerHTML = rows
    .map(([name, unit, value], i) => {
      const cls = i === rows.length - 1 ? ' class="total-row"' : '';
      return `<tr${cls}><td>${name}</td><td class="num">${unit}</td><td class="num">${value}</td></tr>`;
    })
    .join('');

  const { salary, totalLabor } = result;
  const input = readInput();
  els.summaryBlocks.innerHTML = `
    <div class="formula-result">K<sub>с</sub> = 1 + ${formatNum(result.kc - 1, 2)} = ${formatNum(result.kc, 2)}</div>
    <div class="formula-result">Т<sub>н</sub> = ${formatInt(result.tn)} чел.-дн.</div>
    <div class="formula-result">Т<sub>о</sub> = ${formatInt(totalLabor)} чел.-дн.</div>
    <div class="formula-result">C<sub>зм</sub> = ${formatNum(salary.czm1, 2)} · ${formatNum(salary.tariffCoeff, 2)} = ${formatNum(salary.czm, 2)} руб.</div>
    <div class="formula-result">C<sub>оз</sub> = ${formatNum(salary.czd, 2)} · ${formatInt(totalLabor)} · ${formatNum(input.naturalLossKp, 2)} · ${formatNum(input.bonusKpr, 2)} = ${formatNum(salary.coz, 2)} руб.</div>
    <div class="formula-result formula-result--primary">C<sub>р</sub> = ${formatNum(result.cr, 2)} руб. &emsp;|&emsp; C<sub>п</sub> = ${formatNum(result.cp, 2)} руб.</div>
    <div class="formula-result">П<sub>пс</sub> = ${formatNum(result.marketPrice, 2)} / 1,2 − ${formatNum(result.cp, 2)} = ${formatNum(result.profit, 2)} руб.</div>
    <div class="formula-result">У<sub>рент</sub> = ${formatNum(result.profitability, 2)}%</div>`;

  const profitable = result.profit > 0;
  els.conclusion.className = `conclusion ${profitable ? 'positive' : 'negative'}`;
  els.conclusion.innerHTML = profitable
    ? `<p>Проект экономически целесообразен: прибыль ${formatNum(result.profit, 2)} руб., рентабельность ${formatNum(result.profitability, 2)}%.</p>`
    : `<p>Проект экономически нецелесообразен при текущих параметрах: прибыль ${formatNum(result.profit, 2)} руб.</p>`;
}

function recalculate() {
  const input = readInput();
  const result = calculateAll(input);

  els.volCatalogTotal.textContent = formatInt(result.volumes.catalog);
  els.volRefinedSum.textContent = formatInt(result.volumes.refined);
  if (!volumeOverrideManual && document.activeElement !== els.refinedVolumeOverride) {
    els.refinedVolumeOverride.value = result.volumes.refined || '';
  }
  els.normativeLabor.textContent = formatInt(result.tn);
  els.laborRowInfo.textContent = `Приложение Г: строка «до ${formatInt(result.laborRow.vol)} LOC», группа сложности ${result.complexityGroup}`;

  renderLaborTable(result);
  renderDepreciation(result, input);
  renderResults(result);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

document.getElementById('btnAddFunction').addEventListener('click', () => {
  functions.push({ code: '', name: '', catalog: 0, refined: 0 });
  renderFunctions();
  recalculate();
});

els.noveltyGroup.addEventListener('change', () => {
  const group = els.noveltyGroup.value;
  const options = NOVELTY_KN[group] || NOVELTY_KN.B;
  fillNoveltyKnOptions(group, options[options.length - 1]);
  recalculate();
});

els.modulesPercent.addEventListener('input', () => {
  els.modulesKt.value = ktFromModulesPercent(Number(els.modulesPercent.value) || 0);
  recalculate();
});

els.refinedVolumeOverride.addEventListener('input', () => {
  volumeOverrideManual = true;
  recalculate();
});

document.querySelectorAll('input, select, textarea').forEach((el) => {
  if (el.id === 'functionsBody') return;
  el.addEventListener('input', recalculate);
  el.addEventListener('change', recalculate);
});

initApp();

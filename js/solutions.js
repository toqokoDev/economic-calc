import { formatNum, formatInt } from './calculator.js';

function step(num, title, lines) {
  const body = lines.map((line) => `<p class="calc-step__line">${line}</p>`).join('');
  return `
    <div class="calc-step">
      <div class="calc-step__head"><span class="calc-step__num">(${num})</span> ${title}</div>
      ${body}
    </div>`;
}

function resultLine(html) {
  return `<p class="calc-step__result">${html}</p>`;
}

function fnSumLine(functions, field) {
  const parts = functions
    .filter((row) => Number(row[field]) > 0)
    .map((row) => formatInt(row[field]));
  if (!parts.length) return '0';
  if (parts.length <= 4) return parts.join(' + ');
  return `${parts.slice(0, 3).join(' + ')} + … + ${parts[parts.length - 1]}`;
}

export function buildSectionSolutions(input, result) {
  const { salary, stageDistribution, volumes, depreciation, electricity } = result;
  const functions = input.functions || [];
  const ki = Number(input.complexityKi) || 0;
  const noveltyLabels = { A: 'А', B: 'Б', V: 'В' };
  const noveltyLabel = noveltyLabels[input.noveltyGroup] || input.noveltyGroup;

  const section61 = [
    step(
      '—',
      'Исходные коэффициенты',
      [
        `Группа сложности ПС: ${result.complexityGroup}.`,
        `K<sub>с</sub> = 1 + ΣK<sub>i</sub> = 1 + ${formatNum(ki, 2)} = ${formatNum(result.kc, 2)}.`,
        `Группа новизны ${noveltyLabel}, K<sub>н</sub> = ${formatNum(result.kn, 2)}.`,
        `Доля стандартных модулей ${formatNum(input.modulesPercent, 0)} % → K<sub>т</sub> = ${formatNum(result.kt, 2)}.`,
      ]
    ),
  ].join('');

  const catalogSum = fnSumLine(functions, 'catalog');
  const refinedSum = fnSumLine(functions, 'refined');
  const section62 = [
    step('1', 'V<sub>o</sub> = ∑<sub>i=1</sub><sup>n</sup> V<sub>i</sub>', [
      `Сумма по каталогу: V<sub>o</sub> = ${catalogSum} = ${formatInt(volumes.catalog)} LOC.`,
      `Сумма уточнённых объёмов: V<sub>y</sub> = ${refinedSum} = ${formatInt(volumes.refined)} LOC.`,
      result.vy !== volumes.refined
        ? `Для расчёта T<sub>н</sub> принят уточнённый объём V<sub>y</sub> = ${formatInt(result.vy)} LOC (задано вручную).`
        : `Уточнённый объём V<sub>y</sub> = ${formatInt(result.vy)} LOC используется для определения нормативной трудоёмкости.`,
    ]),
  ].join('');

  const stageLines = stageDistribution.map(
    (s) =>
      `${s.label}: T<sub>н</sub> · K = ${formatNum(result.tn, 2)} · ${formatNum(s.coeff, 2)} = ${formatNum(s.stageTn, 2)} чел.-дн.`
  );
  const laborLines = stageDistribution.map((s) => {
    if (s.key === 'rp') {
      return `${s.label}: ${formatNum(s.stageTn, 2)} · K<sub>с</sub> · K<sub>т</sub> · K<sub>н</sub> = ${formatNum(s.stageTn, 2)} · ${formatNum(result.kc, 2)} · ${formatNum(result.kt, 2)} · ${formatNum(result.kn, 2)} = ${formatInt(s.labor)} чел.-дн.`;
    }
    return `${s.label}: ${formatNum(s.stageTn, 2)} · K<sub>с</sub> · K<sub>н</sub> = ${formatNum(s.stageTn, 2)} · ${formatNum(result.kc, 2)} · ${formatNum(result.kn, 2)} = ${formatInt(s.labor)} чел.-дн.`;
  });
  const laborSum = stageDistribution.map((s) => formatInt(s.labor)).join(' + ');

  const section63 = [
    step('2', 'K<sub>с</sub> = 1 + ∑ K<sub>i</sub>', [
      `K<sub>с</sub> = 1 + ${formatNum(ki, 2)} = ${formatNum(result.kc, 2)}.`,
    ]),
    step(
      '—',
      'Нормативная трудоёмкость T<sub>н</sub>',
      [
        `V<sub>y</sub> = ${formatInt(result.vy)} LOC, группа сложности ${result.complexityGroup}.`,
        `По приложению Г: строка «до ${formatInt(result.laborRow.vol)} LOC» → T<sub>н</sub> = ${formatInt(result.tn)} чел.-дн.`,
      ]
    ),
    step('—', 'Распределение T<sub>н</sub> по стадиям', stageLines),
    step('—', 'Общая трудоёмкость по стадиям T<sub>o</sub>', [
      ...laborLines,
      resultLine(
        `T<sub>o</sub> = ${laborSum} = ${formatInt(result.totalLabor)} чел.-дн.`
      ),
    ]),
  ].join('');

  const czd = salary.czm / input.workDaysPerMonth;
  const section647 = [
    step('3', 'C<sub>зм</sub> = C<sub>зм</sub><sup>1</sup> · K<sub>т</sub>', [
      `C<sub>зм</sub> = ${formatNum(salary.czm1, 2)} · ${formatNum(salary.tariffCoeff, 2)} = ${formatNum(salary.czm, 2)} руб.`,
      `C<sub>зд</sub> = C<sub>зм</sub> / ${formatNum(input.workDaysPerMonth, 1)} = ${formatNum(salary.czm, 2)} / ${formatNum(input.workDaysPerMonth, 1)} = ${formatNum(czd, 2)} руб./день.`,
    ]),
    step('4', 'C<sub>оз</sub> = C<sub>зд</sub> · T<sub>o</sub> · K<sub>п</sub> · K<sub>пр</sub>', [
      `C<sub>оз</sub> = ${formatNum(czd, 2)} · ${formatInt(result.totalLabor)} · ${formatNum(input.naturalLossKp, 2)} · ${formatNum(input.bonusKpr, 2)} = ${formatNum(salary.coz, 2)} руб.`,
    ]),
    step('5', 'C<sub>дз</sub> = (C<sub>оз</sub> · H<sub>дз</sub>) / 100', [
      `C<sub>дз</sub> = (${formatNum(salary.coz, 2)} · ${formatNum(input.extraSalaryPercent, 1)}) / 100 = ${formatNum(result.cdz, 2)} руб.`,
    ]),
    step('6', 'C<sub>фсзн</sub> = ((C<sub>оз</sub> + C<sub>дз</sub>) · H<sub>фсзн</sub>) / 100', [
      `C<sub>фсзн</sub> = ((${formatNum(salary.coz, 2)} + ${formatNum(result.cdz, 2)}) · ${formatNum(input.fsznPercent, 1)}) / 100 = ${formatNum(result.cfszn, 2)} руб.`,
    ]),
    step('7', 'C<sub>бгс</sub> = ((C<sub>оз</sub> + C<sub>дз</sub>) · H<sub>бгс</sub>) / 100', [
      `C<sub>бгс</sub> = ((${formatNum(salary.coz, 2)} + ${formatNum(result.cdz, 2)}) · ${formatNum(input.bgsPercent, 2)}) / 100 = ${formatNum(result.cbgs, 2)} руб.`,
    ]),
  ].join('');

  const { na, aog, aopp, assetCost, serviceLife, fe } = depreciation;
  const section6910 = [
    step('8', 'Э = K<sub>э</sub> · T<sub>э</sub> · Д', [
      `K<sub>э</sub> = ${formatNum(electricity.ke, 5)} руб./кВт·ч, T<sub>э</sub> = ${formatNum(electricity.te, 1)} кВт·ч/день, Д = ${formatInt(result.totalLabor)} дн.`,
      resultLine(
        `Э = ${formatNum(electricity.ke, 5)} · ${formatNum(electricity.te, 1)} · ${formatInt(result.totalLabor)} = ${formatNum(electricity.total, 2)} руб.`
      ),
    ]),
    step('9', 'N<sub>а</sub> = 1 / T<sub>н</sub> · 100', [
      `N<sub>а</sub> = 1 / ${formatInt(serviceLife)} · 100 = ${formatNum(na, 2)} %.`,
    ]),
    step('10', 'AО<sub>г</sub> = P<sub>с</sub> · N<sub>а</sub> / 100', [
      `AО<sub>г</sub> = ${formatNum(assetCost, 2)} · ${formatNum(na, 2)} / 100 = ${formatNum(aog, 2)} руб.`,
    ]),
    step('11', 'AО<sub>пп</sub> = AО<sub>г</sub> / F<sub>э</sub> · Д', [
      `AО<sub>пп</sub> = ${formatNum(aog, 2)} / ${formatInt(fe)} · ${formatInt(result.totalLabor)} = ${formatNum(aopp, 2)} руб.`,
    ]),
  ].join('');

  const materials = result.materials;
  const crParts = [
    formatNum(salary.coz, 2),
    formatNum(result.cdz, 2),
    formatNum(result.cfszn, 2),
    formatNum(result.cbgs, 2),
    formatNum(electricity.total, 2),
    formatNum(aopp, 2),
    formatNum(result.cpz, 2),
    formatNum(result.cnr, 2),
  ];
  if (materials > 0) crParts.push(formatNum(materials, 2));

  const section1116 = [
    step('12', 'C<sub>пз</sub> = (C<sub>оз</sub> · H<sub>пз</sub>) / 100', [
      `C<sub>пз</sub> = (${formatNum(salary.coz, 2)} · ${formatNum(input.otherCostsPercent, 1)}) / 100 = ${formatNum(result.cpz, 2)} руб.`,
    ]),
    step('13', 'C<sub>нр</sub> = (C<sub>оз</sub> · H<sub>нр</sub>) / 100', [
      `C<sub>нр</sub> = (${formatNum(salary.coz, 2)} · ${formatNum(input.overheadPercent, 1)}) / 100 = ${formatNum(result.cnr, 2)} руб.`,
    ]),
    step('14', 'C<sub>р</sub> = C<sub>оз</sub> + C<sub>дз</sub> + C<sub>фсзн</sub> + C<sub>бгс</sub> + Э + AО<sub>пп</sub> + C<sub>пз</sub> + C<sub>нр</sub>' + (materials > 0 ? ' + C<sub>м</sub>' : ''), [
      materials > 0
        ? `C<sub>р</sub> = C<sub>оз</sub> + C<sub>дз</sub> + C<sub>фсзн</sub> + C<sub>бгс</sub> + Э + AО<sub>пп</sub> + C<sub>пз</sub> + C<sub>нр</sub> + C<sub>м</sub>`
        : `C<sub>р</sub> = C<sub>оз</sub> + C<sub>дз</sub> + C<sub>фсзн</sub> + C<sub>бгс</sub> + Э + AО<sub>пп</sub> + C<sub>пз</sub> + C<sub>нр</sub>`,
      `C<sub>р</sub> = ${crParts.join(' + ')} = ${formatNum(result.cr, 2)} руб.`,
    ]),
    step('15', 'C<sub>рса</sub> = (C<sub>р</sub> · H<sub>рса</sub>) / 100', [
      `C<sub>рса</sub> = (${formatNum(result.cr, 2)} · ${formatNum(input.supportPercent, 1)}) / 100 = ${formatNum(result.crsa, 2)} руб.`,
    ]),
    step('16', 'C<sub>п</sub> = C<sub>р</sub> + C<sub>рса</sub>', [
      resultLine(
        `C<sub>п</sub> = ${formatNum(result.cr, 2)} + ${formatNum(result.crsa, 2)} = ${formatNum(result.cp, 2)} руб.`
      ),
    ]),
    step('17', 'П<sub>пс</sub> = Ц<sub>р</sub> / 1,2 − C<sub>п</sub>', [
      `Ц<sub>р</sub> = ${formatNum(result.marketPrice, 2)} руб. (с НДС).`,
      resultLine(
        `П<sub>пс</sub> = ${formatNum(result.marketPrice, 2)} / 1,2 − ${formatNum(result.cp, 2)} = ${formatNum(result.profit, 2)} руб.`
      ),
    ]),
    step('18', 'У<sub>рент</sub> = П<sub>пс</sub> / C<sub>п</sub> · 100', [
      resultLine(
        `У<sub>рент</sub> = ${formatNum(result.profit, 2)} / ${formatNum(result.cp, 2)} · 100 = ${formatNum(result.profitability, 2)} %`
      ),
    ]),
  ].join('');

  return {
    section61,
    section62,
    section63,
    section647,
    section6910,
    section1116,
  };
}

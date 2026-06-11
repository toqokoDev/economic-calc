import { formatNum, formatInt } from './calculator.js';

function calcBlock(lines, result) {
  const body = lines.map((line) => `<p class="formula-calc__line">${line}</p>`).join('');
  const res = result ? `<p class="formula-calc__result">${result}</p>` : '';
  return `${body}${res}`;
}

function fnSumLine(functions, field) {
  const parts = functions
    .filter((row) => Number(row[field]) > 0)
    .map((row) => formatInt(row[field]));
  if (!parts.length) return '0';
  if (parts.length <= 4) return parts.join(' + ');
  return `${parts.slice(0, 3).join(' + ')} + … + ${parts[parts.length - 1]}`;
}

export function buildFormulaCalcs(input, result) {
  const { salary, stageDistribution, volumes, depreciation, electricity } = result;
  const functions = input.functions || [];
  const ki = Number(input.complexityKi) || 0;
  const noveltyLabels = { A: 'А', B: 'Б', V: 'В' };
  const noveltyLabel = noveltyLabels[input.noveltyGroup] || input.noveltyGroup;
  const catalogSum = fnSumLine(functions, 'catalog');
  const refinedSum = fnSumLine(functions, 'refined');
  const czd = salary.czd;
  const { na, aog, aopp, assetCost, serviceLife, fe } = depreciation;
  const materials = result.materials;

  const stageLines = stageDistribution.map(
    (s) =>
      `${s.label}: T<sub>н</sub> · K = ${formatNum(result.tn, 2)} · ${formatNum(s.coeff, 2)} = ${formatNum(s.stageTn, 2)} чел.-дн.`
  );
  const laborLines = stageDistribution.map((s) => {
    if (s.key === 'rp') {
      return `${s.label}: ${formatNum(s.stageTn, 2)} · ${formatNum(result.kc, 2)} · ${formatNum(result.kt, 2)} · ${formatNum(result.kn, 2)} = ${formatInt(s.labor)} чел.-дн.`;
    }
    return `${s.label}: ${formatNum(s.stageTn, 2)} · ${formatNum(result.kc, 2)} · ${formatNum(result.kn, 2)} = ${formatInt(s.labor)} чел.-дн.`;
  });
  const laborSum = stageDistribution.map((s) => formatInt(s.labor)).join(' + ');

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

  return {
    61: calcBlock(
      [
        `Группа сложности ПС: ${result.complexityGroup}.`,
        `K<sub>с</sub> = 1 + ΣK<sub>i</sub> = 1 + ${formatNum(ki, 2)} = ${formatNum(result.kc, 2)}.`,
        `Группа новизны ${noveltyLabel}, K<sub>н</sub> = ${formatNum(result.kn, 2)}.`,
        `Доля стандартных модулей ${formatNum(input.modulesPercent, 0)} % → K<sub>т</sub> = ${formatNum(result.kt, 2)}.`,
      ],
      null
    ),

    1: calcBlock(
      [
        `Сумма по каталогу: V<sub>o</sub> = ${catalogSum} = ${formatInt(volumes.catalog)} LOC.`,
        `Сумма уточнённых: V<sub>y</sub> = ${refinedSum} = ${formatInt(volumes.refined)} LOC.`,
        result.vy !== volumes.refined
          ? `Для расчёта T<sub>н</sub> принят V<sub>y</sub> = ${formatInt(result.vy)} LOC (задано вручную).`
          : `Для расчёта T<sub>н</sub> используется V<sub>y</sub> = ${formatInt(result.vy)} LOC.`,
      ],
      null
    ),

    2: calcBlock([], `K<sub>с</sub> = 1 + ${formatNum(ki, 2)} = ${formatNum(result.kc, 2)}`),

    '2-tn': calcBlock(
      [
        `V<sub>y</sub> = ${formatInt(result.vy)} LOC, группа сложности ${result.complexityGroup}.`,
        `Приложение Г: строка «до ${formatInt(result.laborRow.vol)} LOC».`,
      ],
      `T<sub>н</sub> = ${formatInt(result.tn)} чел.-дн.`
    ),

    '2-stages': calcBlock(stageLines, null),

    '2-to': calcBlock(laborLines, `T<sub>o</sub> = ${laborSum} = ${formatInt(result.totalLabor)} чел.-дн.`),

    3: calcBlock(
      [
        `C<sub>зм</sub> = ${formatNum(salary.czm1, 2)} · ${formatNum(salary.tariffCoeff, 2)} = ${formatNum(salary.czm, 2)} руб.`,
        `C<sub>зд</sub> = ${formatNum(salary.czm, 2)} / ${formatNum(input.workDaysPerMonth, 1)} = ${formatNum(czd, 2)} руб./день.`,
      ],
      null
    ),

    4: calcBlock(
      [],
      `C<sub>оз</sub> = ${formatNum(czd, 2)} · ${formatInt(result.totalLabor)} · ${formatNum(input.naturalLossKp, 2)} · ${formatNum(input.bonusKpr, 2)} = ${formatNum(salary.coz, 2)} руб.`
    ),

    5: calcBlock(
      [],
      `C<sub>дз</sub> = (${formatNum(salary.coz, 2)} · ${formatNum(input.extraSalaryPercent, 1)}) / 100 = ${formatNum(result.cdz, 2)} руб.`
    ),

    6: calcBlock(
      [],
      `C<sub>фсзн</sub> = (${formatNum(salary.coz, 2)} + ${formatNum(result.cdz, 2)}) · ${formatNum(input.fsznPercent, 1)} / 100 = ${formatNum(result.cfszn, 2)} руб.`
    ),

    7: calcBlock(
      [],
      `C<sub>бгс</sub> = (${formatNum(salary.coz, 2)} + ${formatNum(result.cdz, 2)}) · ${formatNum(input.bgsPercent, 2)} / 100 = ${formatNum(result.cbgs, 2)} руб.`
    ),

    8: calcBlock(
      [
        `K<sub>э</sub> = ${formatNum(electricity.ke, 5)} руб./кВт·ч, T<sub>э</sub> = ${formatNum(electricity.te, 1)} кВт·ч/день, Д = ${formatInt(result.totalLabor)} дн.`,
      ],
      `Э = ${formatNum(electricity.ke, 5)} · ${formatNum(electricity.te, 1)} · ${formatInt(result.totalLabor)} = ${formatNum(electricity.total, 2)} руб.`
    ),

    9: calcBlock([], `N<sub>а</sub> = 1 / ${formatInt(serviceLife)} · 100 = ${formatNum(na, 2)} %`),

    10: calcBlock(
      [],
      `AО<sub>г</sub> = ${formatNum(assetCost, 2)} · ${formatNum(na, 2)} / 100 = ${formatNum(aog, 2)} руб.`
    ),

    11: calcBlock(
      [],
      `AО<sub>пп</sub> = ${formatNum(aog, 2)} / ${formatInt(fe)} · ${formatInt(result.totalLabor)} = ${formatNum(aopp, 2)} руб.`
    ),

    12: calcBlock(
      [],
      `C<sub>пз</sub> = (${formatNum(salary.coz, 2)} · ${formatNum(input.otherCostsPercent, 1)}) / 100 = ${formatNum(result.cpz, 2)} руб.`
    ),

    13: calcBlock(
      [],
      `C<sub>нр</sub> = (${formatNum(salary.coz, 2)} · ${formatNum(input.overheadPercent, 1)}) / 100 = ${formatNum(result.cnr, 2)} руб.`
    ),

    14: calcBlock(
      [materials > 0 ? `В сумму включены материалы: ${formatNum(materials, 2)} руб.` : null].filter(Boolean),
      `C<sub>р</sub> = ${crParts.join(' + ')} = ${formatNum(result.cr, 2)} руб.`
    ),

    15: calcBlock(
      [],
      `C<sub>рса</sub> = (${formatNum(result.cr, 2)} · ${formatNum(input.supportPercent, 1)}) / 100 = ${formatNum(result.crsa, 2)} руб.`
    ),

    16: calcBlock([], `C<sub>п</sub> = ${formatNum(result.cr, 2)} + ${formatNum(result.crsa, 2)} = ${formatNum(result.cp, 2)} руб.`),

    17: calcBlock(
      [`Ц<sub>р</sub> = ${formatNum(result.marketPrice, 2)} руб. (с НДС).`],
      `П<sub>пс</sub> = ${formatNum(result.marketPrice, 2)} / 1,2 − ${formatNum(result.cp, 2)} = ${formatNum(result.marketPriceNet, 2)} − ${formatNum(result.cp, 2)} = ${formatNum(result.profit, 2)} руб.`
    ),

    18: calcBlock(
      [],
      `У<sub>рент</sub> = ${formatNum(result.profit, 2)} / ${formatNum(result.cp, 2)} · 100 = ${formatNum(result.profitability, 2)} %`
    ),
  };
}

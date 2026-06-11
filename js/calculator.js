import { LABOR_TABLE, STAGE_COEFFS, NOVELTY_KN, MODULES_KT } from './labor-table.js';

export const DEFAULT_FUNCTIONS = [
  { code: 107, name: 'Организация ввода/вывода информации в интерактивном режиме', catalog: 280, refined: 180 },
  { code: 202, name: 'Формирование баз данных', catalog: 1980, refined: 450 },
  { code: 203, name: 'Обработка наборов и записей базы данных', catalog: 2370, refined: 520 },
  { code: 207, name: 'Организация поиска и поиск в базе данных', catalog: 4720, refined: 480 },
  { code: 703, name: 'Расчёт показателей', catalog: 420, refined: 100 },
  { code: 705, name: 'Формирование и вывод на внешние носители', catalog: 3150, refined: 280 },
];

export const DEFAULTS = {
  productName: 'Тестовая программа — система учёта товаров',
  productFunctions:
    'Ввод и редактирование сведений о товарах, хранение данных в базе, поиск и фильтрация записей, формирование отчётов, вывод результатов на экран и в файл',
  productType: 'ПС функционального назначения; прикладная программа',
  devEnvironment: 'Visual Studio Code',
  complexityGroup: 2,
  complexityKi: 0.18,
  noveltyGroup: 'B',
  noveltyKn: 0.72,
  modulesPercent: 60,
  modulesKt: 0.55,
  tariffGrade1: 297,
  tariffCoeff: 2.84,
  workDaysPerMonth: 21.5,
  naturalLossKp: 1.1,
  bonusKpr: 1.2,
  extraSalaryPercent: 10,
  fsznPercent: 35,
  bgsPercent: 0.3,
  electricityTariff: 0.43196,
  electricityKwhPerDay: 4,
  assetName: 'Ноутбук',
  assetCount: 1,
  assetCost: 5000,
  assetServiceLife: 10,
  effectiveFundDays: 253,
  otherCostsPercent: 10,
  overheadPercent: 100,
  supportPercent: 10,
  marketPrice: 42000,
  materialsCost: 0,
  programmersCount: 1,
  refinedVolumeOverride: '',
};

const STAGE_KEYS = ['tz', 'ep', 'tp', 'rp', 'vn'];
const STAGE_LABELS = ['ТЗ', 'ЭП', 'ТП', 'РП', 'ВН'];

export function sumFunctions(functions) {
  return functions.reduce(
    (acc, row) => ({
      catalog: acc.catalog + (Number(row.catalog) || 0),
      refined: acc.refined + (Number(row.refined) || 0),
    }),
    { catalog: 0, refined: 0 }
  );
}

export function getNormativeLabor(volume, group) {
  const col = `g${group}`;
  const row = LABOR_TABLE.find((r) => volume <= r.vol);
  if (row) return row[col];

  const exp = group === 1 ? 0.92 : group === 2 ? 0.915 : 0.91;
  const coef = group === 1 ? 0.12 : group === 2 ? 0.105 : 0.092;
  return Math.round(coef * volume ** exp);
}

export function getLaborTableRow(volume) {
  return LABOR_TABLE.find((r) => volume <= r.vol) || LABOR_TABLE[LABOR_TABLE.length - 1];
}

export function ktFromModulesPercent(percent) {
  const match = MODULES_KT.find((item) => percent >= item.min);
  return match ? match.kt : 1.0;
}

export function calculateAll(input) {
  const functions = input.functions || [];
  const volumes = sumFunctions(functions);
  const vy =
    input.refinedVolumeOverride != null && input.refinedVolumeOverride !== ''
      ? Number(input.refinedVolumeOverride)
      : volumes.refined;

  const kc = round2(1 + (Number(input.complexityKi) || 0));
  const kn = Number(input.noveltyKn) || 0.72;
  const kt = Number(input.modulesKt) || 0.55;
  const complexityGroup = Number(input.complexityGroup) || 2;

  const noveltyGroup = input.noveltyGroup || 'B';
  const stageCoeffs = input.stageCoeffs || STAGE_COEFFS[noveltyGroup] || STAGE_COEFFS.B;

  const tn = getNormativeLabor(vy, complexityGroup);
  const laborRow = getLaborTableRow(vy);

  const stageDistribution = STAGE_KEYS.map((key, idx) => {
    const coeff = stageCoeffs[key];
    const stageTn = round2(tn * coeff);
    const labor =
      key === 'rp'
        ? Math.round(stageTn * kc * kt * kn)
        : Math.round(stageTn * kc * kn);
    return {
      key,
      label: STAGE_LABELS[idx],
      coeff,
      stageTn,
      labor,
    };
  });

  const totalLabor = stageDistribution.reduce((sum, s) => sum + s.labor, 0);

  const czm1 = Number(input.tariffGrade1) || 297;
  const tariffCoeff = Number(input.tariffCoeff) || 2.84;
  const workDaysPerMonth = Number(input.workDaysPerMonth) || 21.5;
  const czm = round2(czm1 * tariffCoeff);
  const czd = round2(czm / workDaysPerMonth);
  const kp = Number(input.naturalLossKp) || 1.1;
  const kpr = Number(input.bonusKpr) || 1.2;
  const coz = round2(czd * totalLabor * kp * kpr);

  const hdz = Number(input.extraSalaryPercent) || 10;
  const cdz = round2((coz * hdz) / 100);
  const salaryBase = round2(coz + cdz);

  const hfszn = Number(input.fsznPercent) || 35;
  const cfszn = round2((salaryBase * hfszn) / 100);

  const hbgs = Number(input.bgsPercent) || 0.3;
  const cbgs = round2((salaryBase * hbgs) / 100);

  const ke = Number(input.electricityTariff) || 0.43196;
  const te = Number(input.electricityKwhPerDay) || 4;
  const electricity = round2(ke * te * totalLabor);

  const assetCost = Number(input.assetCost) || 0;
  const serviceLife = Number(input.assetServiceLife) || 10;
  const fe = Number(input.effectiveFundDays) || 253;
  const na = serviceLife > 0 ? round2((1 / serviceLife) * 100) : 0;
  const aog = round2((assetCost * na) / 100);
  const aogDaily = round2(aog / fe);
  const aopp = round2(aogDaily * totalLabor);

  const hpz = Number(input.otherCostsPercent) || 10;
  const cpz = round2((coz * hpz) / 100);

  const hnr = Number(input.overheadPercent) || 100;
  const cnr = round2((coz * hnr) / 100);

  const materials = Number(input.materialsCost) || 0;
  const cr = round2(
    round2(coz + cdz + cfszn + cbgs + electricity + aopp + cpz + cnr) + materials
  );

  const hrsa = Number(input.supportPercent) || 10;
  const crsa = round2((cr * hrsa) / 100);

  const cp = round2(cr + crsa);

  const marketPrice = Number(input.marketPrice) || 0;
  const marketPriceNet = round2(marketPrice / 1.2);
  const profit = round2(marketPriceNet - cp);
  const profitability = cp > 0 ? round2((profit / cp) * 100) : 0;

  return {
    volumes,
    vy,
    kc,
    kn,
    kt,
    complexityGroup,
    tn,
    laborRow,
    stageDistribution,
    totalLabor,
    salary: { czm1, tariffCoeff, czm, czd, coz },
    cdz,
    salaryBase,
    cfszn,
    cbgs,
    electricity: { ke, te, days: totalLabor, total: electricity },
    depreciation: { na, aog, aogDaily, aopp, fe, serviceLife, assetCost },
    cpz,
    cnr,
    materials,
    cr,
    crsa,
    cp,
    marketPrice,
    marketPriceNet,
    profit,
    profitability,
    programmersCount: Number(input.programmersCount) || 1,
  };
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

export function formatNum(value, digits = 2) {
  if (value == null || Number.isNaN(value)) return '—';
  return Number(value).toLocaleString('ru-RU', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatInt(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

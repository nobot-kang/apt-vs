/** Presentation only. Prices remain full-precision 만원 in the snapshot. */
export const MODES = {sale: '매매', jeonse: '전세', monthly: '월세'};
export function displayUnits(value, mode) {
  return Math.floor(value / (mode === 'monthly' ? 1 : 100) + 0.5);
}
export function priceText(value, mode) {
  const units = displayUnits(value, mode);
  if (mode === 'monthly') return `월 ${units.toLocaleString('ko-KR')}만원`;
  const amount = units * 100;
  const eok = Math.floor(amount / 10000), rest = amount % 10000;
  return `${eok ? `${eok}억` : ''}${eok && rest ? ' ' : ''}${rest ? `${rest.toLocaleString('ko-KR')}만원` : eok ? '원' : '0원'}`;
}
export function areaText(area, pyeongM2, unitType) {
  const [whole, fraction = ''] = String(area).split('.');
  return `전용 ${whole}.${fraction.padEnd(2, '0')}㎡ · ${(area / pyeongM2).toFixed(1)}평 (전용 ${unitType}평형)`;
}
export function grade(score) {
  return [
    {at: 0, title: '시세 입문', copy: '첫 감각을 깨웠어요. 한 판 더, 가볍게 도전해요.'},
    {at: 3, title: '감 잡는 중', copy: '비슷한 가격 사이, 차이가 보이기 시작했어요.'},
    {at: 6, title: '동네 시세통', copy: '날카로운 안목! 다음 동네도 자신 있겠는데요.'},
    {at: 10, title: '부동산 고수', copy: '작은 가격 차이도 놓치지 않는 놀라운 감각이에요.'},
    {at: 15, title: '시세 마스터', copy: '오늘의 APT VS은 당신 것. 멋진 기록을 완성했어요.'},
  ].findLast(g => score >= g.at);
}

export const provinceText = code => ({'11':'서울', '41':'경기'}[code]);

/** Calendar-year age follows the dashboard; construction month is unavailable. */
export function buildingText(buildYear, referenceDate) {
  if (buildYear === null) return '준공연도 미확인';
  return `${buildYear}년 준공 · ${Number(referenceDate.slice(0,4))-buildYear}년차`;
}

export const householdText = value => value === null ? '단지 세대수 미확인' : `단지 전체 ${value.toLocaleString('ko-KR')}세대`;

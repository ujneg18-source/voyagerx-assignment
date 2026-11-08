const dateKey = ({ y, m, d }) => y * 10000 + m * 100 + d;

export function selectDatePart(cursor, part, value, today, minYear = 1990) {
  const date = part === 'year' ? { y: value, m: 1, d: 1 }
    : part === 'month' ? { y: cursor.y, m: value, d: 1 }
    : { y: cursor.y, m: cursor.m, d: value };
  const lastDay = new Date(date.y, date.m, 0).getDate();
  if (date.y < minYear || date.m < 1 || date.m > 12 || date.d < 1 || date.d > lastDay || dateKey(date) > dateKey(today)) return null;
  return date;
}

export function validDateRange(dates) {
  return dates.every(Boolean) && dateKey(dates[0]) <= dateKey(dates[1]);
}

export function dateHeading(date) {
  return date ? `${date.y}년 ${date.m}월 ${date.d}일` : '날짜를 선택해 주세요';
}

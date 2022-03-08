let dayjs = require('dayjs');
require('dayjs/locale/ja');

// Date型をString型にフォーマット
export function formatDate(date: Date): string {
  return dayjs(date).locale('ja').format('YYYY-MM-DD HH:mm:ss');
};

// String型をDate型にフォーマットし更に、String型にフォーマット
export function fromatDateNewToDate(strDate: string): string {
  let date = dayjs(strDate).format('YYYY-MM-DD HH:mm:ss');
  dayjs(date).locale('ja').format('YYYY-MM-DD HH:mm:ss')
  return dayjs(date).locale('ja').format('YYYY-MM-DD HH:mm:ss');
}

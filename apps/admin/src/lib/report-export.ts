import { existsSync } from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

type ReportRow = Record<string, unknown>;

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function spreadsheetValue(value: unknown): string | number | boolean {
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  const text = displayValue(value);
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

export function createCsv(rows: ReportRow[]): string {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const quote = (value: unknown) => `"${String(spreadsheetValue(value)).replaceAll('"', '""')}"`;
  return [keys.map(quote).join(','), ...rows.map((row) => keys.map((key) => quote(row[key])).join(','))].join('\r\n');
}

export async function createXlsx(rows: ReportRow[], summary: ReportRow, title: string): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EuroStore Admin';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Report', { views: [{ rightToLeft: true }] });
  const keys = rows.length ? Object.keys(rows[0]) : [];

  sheet.addRow([title]);
  sheet.mergeCells(1, 1, 1, Math.max(1, keys.length));
  sheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF1F1B16' } };
  sheet.getRow(1).height = 26;

  sheet.addRow(Object.entries(summary).flatMap(([key, value]) => [`${key}: ${displayValue(value)}`]));
  sheet.addRow([]);
  const header = sheet.addRow(keys);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF766235' } };

  for (const row of rows) sheet.addRow(keys.map((key) => spreadsheetValue(row[key])));
  sheet.autoFilter = keys.length ? { from: { row: 4, column: 1 }, to: { row: 4, column: keys.length } } : undefined;
  sheet.views = [{ state: 'frozen', ySplit: 4, rightToLeft: true }];
  keys.forEach((key, index) => {
    const values = rows.slice(0, 250).map((row) => displayValue(row[key]).length);
    sheet.getColumn(index + 1).width = Math.min(45, Math.max(12, key.length + 2, ...values) + 1);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

function reportFontPath(): string {
  const candidates = [
    path.join(process.cwd(), 'public', 'fonts', 'NotoSansArabic.ttf'),
    path.join(process.cwd(), 'apps', 'admin', 'public', 'fonts', 'NotoSansArabic.ttf'),
  ];
  const font = candidates.find(existsSync);
  if (!font) throw new Error('report_font_missing');
  return font;
}

function hasArabic(value: string) {
  return /[\u0600-\u06FF]/.test(value);
}

export async function createPdf(rows: ReportRow[], summary: ReportRow, title: string): Promise<Uint8Array> {
  const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true, info: { Title: title, Author: 'EuroStore Admin' } });
  const chunks: Uint8Array[] = [];
  doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
  const completed = new Promise<Uint8Array>((resolve, reject) => {
    doc.on('end', () => {
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const output = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        output.set(chunk, offset);
        offset += chunk.length;
      }
      resolve(output);
    });
    doc.on('error', reject);
  });

  doc.registerFont('Report', reportFontPath());
  doc.font('Report').fontSize(18).fillColor('#1F1B16').text(title, { align: 'right' });
  doc.moveDown(0.6).fontSize(10).fillColor('#5F574A');
  for (const [key, value] of Object.entries(summary)) {
    const line = `${key}: ${displayValue(value)}`;
    doc.text(line, { align: hasArabic(line) ? 'right' : 'left' });
  }
  doc.moveDown().strokeColor('#B8860B').moveTo(42, doc.y).lineTo(553, doc.y).stroke().moveDown();

  rows.forEach((row, index) => {
    if (doc.y > 710) doc.addPage();
    doc.fontSize(11).fillColor('#766235').text(`#${index + 1}`, { align: 'left' });
    doc.fontSize(9).fillColor('#1F1B16');
    for (const [key, rawValue] of Object.entries(row)) {
      const line = `${key}: ${displayValue(rawValue).slice(0, 1500)}`;
      doc.text(line, { align: hasArabic(line) ? 'right' : 'left' });
    }
    doc.moveDown(0.4).strokeColor('#E5E0D8').moveTo(42, doc.y).lineTo(553, doc.y).stroke().moveDown(0.6);
  });

  const pageRange = doc.bufferedPageRange();
  for (let page = 0; page < pageRange.count; page += 1) {
    doc.switchToPage(page);
    doc.font('Report').fontSize(8).fillColor('#8B8172').text(`${page + 1} / ${pageRange.count}`, 42, 806, { align: 'center', width: 511 });
  }

  doc.end();
  return completed;
}

'use strict';

const state = {
  outputs: null,
};

const REQUIRED_AGING_COLUMNS = [
  'Codice Cliente',
  'Ragione Sociale',
  'Metodo di Pagamento',
  'Descrizione Met. Pagamento',
  'Insoluto Ricevuto',
  'Totale Scaduto',
  'Scaduto entro 30 gg.',
  'Scaduto entro 60 gg.',
  'Scaduto entro 90 gg.',
  'Scaduto entro 120 gg.',
  'Scaduto oltre 120 gg.',
];

const AGING_NUMERIC_COLUMNS = [
  'Totale Scaduto',
  'Scaduto entro 30 gg.',
  'Scaduto entro 60 gg.',
  'Scaduto entro 90 gg.',
  'Scaduto entro 120 gg.',
  'Scaduto oltre 120 gg.',
];

const SCADUTO_COLUMNS = [
  'Scaduto entro 30 gg.',
  'Scaduto entro 60 gg.',
  'Scaduto entro 90 gg.',
  'Scaduto entro 120 gg.',
  'Scaduto oltre 120 gg.',
];

const WEIGHTS = [15, 45, 75, 105, 135];

const STYLES = {
  DEFAULT: 0,
  HEADER: 1,
  MONEY: 2,
  PCT: 3,
  ONE_DECIMAL: 4,
  HIGHLIGHT_MONEY: 5,
  HIGHLIGHT_PCT: 6,
  DORMANT_ORANGE: 7,
};

const $ = (id) => document.getElementById(id);

$('generateBtn').addEventListener('click', generateReports);
$('resetBtn').addEventListener('click', resetForm);
$('downloadZipBtn').addEventListener('click', () => downloadZip());
$('downloadClientiBtn').addEventListener('click', () => downloadOutput('agingClienti'));
$('downloadFilialeBtn').addEventListener('click', () => downloadOutput('agingFiliale'));
$('downloadDormientiBtn').addEventListener('click', () => downloadOutput('dormienti'));

function setStatus(message, kind = '') {
  const el = $('status');
  el.className = `status ${kind}`.trim();
  el.innerHTML = `<p>${escapeHtml(message)}</p>`;
}

function resetForm() {
  $('agingClienti').value = '';
  $('agingFiliale').value = '';
  $('mesi').value = '';
  state.outputs = null;
  $('results').classList.add('hidden');
  setStatus('In attesa dei file.');
}

async function generateReports() {
  const clientiFile = $('agingClienti').files[0];
  const filialeFile = $('agingFiliale').files[0];
  const mesiFile = $('mesi').files[0];

  if (!clientiFile && !filialeFile && !mesiFile) {
    setStatus('Carica almeno un file Excel prima di generare i report.', 'error');
    return;
  }

  const btn = $('generateBtn');
  btn.disabled = true;
  $('results').classList.add('hidden');
  setResultButtons({});
  setStatus('Elaborazione in corso...');

  try {
    const outputs = {};
    const warnings = [];

    if (clientiFile) {
      const clientiData = await parseXlsxFile(clientiFile);
      validateAgingInput(clientiData, 'Aging_Clienti.xlsx');
      const clientiReport = buildAgingReport(clientiData, { includeBillingBranches: true });
      const agingClientiXlsx = await createAgingWorkbook(clientiReport, {
        includeBillingBranches: true,
        generatedAt: formatTimestamp(new Date()),
      });
      outputs.agingClienti = { filename: 'Aging Clienti.xlsx', data: agingClientiXlsx };
      if (clientiReport.totalDocs === 0) warnings.push('Aging_Clienti.xlsx: saldo totale pari a zero. Verificare che la colonna T abbia le celle totali in grassetto.');
    }

    if (filialeFile) {
      const filialeData = await parseXlsxFile(filialeFile);
      validateAgingInput(filialeData, 'Aging_Filiale.xlsx');
      const filialeReport = buildAgingReport(filialeData, { includeBillingBranches: false });
      const agingFilialeXlsx = await createAgingWorkbook(filialeReport, {
        includeBillingBranches: false,
        generatedAt: formatTimestamp(new Date()),
      });
      outputs.agingFiliale = { filename: 'Aging Filiale.xlsx', data: agingFilialeXlsx };
      if (filialeReport.totalDocs === 0) warnings.push('Aging_Filiale.xlsx: saldo totale pari a zero. Verificare che la colonna T abbia le celle totali in grassetto.');
    }

    if (mesiFile) {
      const mesiData = await parseXlsxFile(mesiFile);
      validateMesiInput(mesiData, 'Mesi.xlsx');
      const dormientiReport = buildDormientiPersiReport(mesiData);
      const dormientiXlsx = await createDormientiWorkbook(dormientiReport);
      outputs.dormienti = { filename: 'Clienti Dormienti e Persi.xlsx', data: dormientiXlsx };
    }

    state.outputs = outputs;
    setResultButtons(outputs);
    $('results').classList.remove('hidden');

    if (warnings.length) {
      setStatus(`Report generati, ma ci sono avvisi: ${warnings.join(' ')}`, 'warn');
    } else {
      const count = Object.keys(outputs).length;
      setStatus(`${count === 1 ? 'Report generato' : 'Report generati'} correttamente. Puoi scaricare ${count === 1 ? 'il file' : 'i file'}.`, 'ok');
    }
  } catch (err) {
    console.error(err);
    setStatus(err.message || 'Errore durante la generazione dei report.', 'error');
  } finally {
    btn.disabled = false;
  }
}

function setResultButtons(outputs) {
  const keys = Object.keys(outputs || {});
  const count = keys.length;
  $('downloadClientiBtn').classList.toggle('hidden', !outputs.agingClienti);
  $('downloadFilialeBtn').classList.toggle('hidden', !outputs.agingFiliale);
  $('downloadDormientiBtn').classList.toggle('hidden', !outputs.dormienti);
  $('downloadZipBtn').classList.toggle('hidden', count < 2);
  const txt = $('resultsText');
  if (txt) {
    txt.textContent = count < 2
      ? 'Scarica il file Excel generato.'
      : 'Scarica il pacchetto ZIP oppure i singoli file Excel generati.';
  }
}

async function downloadZip() {
  if (!state.outputs) return;
  const zip = new JSZip();
  Object.values(state.outputs).forEach((item) => zip.file(item.filename, item.data));
  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, 'Report_Aging.zip');
}

function downloadOutput(key) {
  if (!state.outputs || !state.outputs[key]) return;
  const item = state.outputs[key];
  const blob = new Blob([item.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, item.filename);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function parseXlsxFile(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const workbookFile = zip.file('xl/workbook.xml');
  const workbookRelsFile = zip.file('xl/_rels/workbook.xml.rels');
  if (!workbookFile || !workbookRelsFile) {
    throw new Error(`${file.name}: formato XLSX non valido.`);
  }

  const workbookXml = await workbookFile.async('text');
  const workbookRelsXml = await workbookRelsFile.async('text');
  const firstSheetPath = getFirstWorksheetPath(workbookXml, workbookRelsXml);
  const sheetFile = zip.file(firstSheetPath);
  if (!sheetFile) throw new Error(`${file.name}: non trovo il primo foglio Excel.`);

  const [sharedStrings, styles, sheetXml] = await Promise.all([
    parseSharedStrings(zip),
    parseStyles(zip),
    sheetFile.async('text'),
  ]);

  return parseWorksheet(sheetXml, sharedStrings, styles, file.name);
}

function getFirstWorksheetPath(workbookXml, workbookRelsXml) {
  const doc = parseXml(workbookXml);
  const relDoc = parseXml(workbookRelsXml);
  const sheet = firstNodeByLocalName(doc, 'sheet');
  if (!sheet) throw new Error('Il workbook non contiene fogli.');

  const rid = sheet.getAttribute('r:id') || sheet.getAttribute('id');
  const rels = nodesByLocalName(relDoc, 'Relationship');
  const rel = rels.find((node) => node.getAttribute('Id') === rid);
  if (!rel) throw new Error('Impossibile risolvere il percorso del primo foglio.');

  const target = rel.getAttribute('Target');
  if (!target) throw new Error('Percorso del primo foglio mancante.');

  if (target.startsWith('/')) return target.replace(/^\//, '');
  if (target.startsWith('xl/')) return target;
  return `xl/${target}`.replace(/\/\.\//g, '/');
}

async function parseSharedStrings(zip) {
  const f = zip.file('xl/sharedStrings.xml');
  if (!f) return [];
  const xml = await f.async('text');
  const doc = parseXml(xml);
  return nodesByLocalName(doc, 'si').map((si) => {
    return nodesByLocalName(si, 't').map((t) => t.textContent || '').join('');
  });
}

async function parseStyles(zip) {
  const f = zip.file('xl/styles.xml');
  if (!f) return { isBold: () => false };
  const xml = await f.async('text');
  const doc = parseXml(xml);
  const fontNodes = nodesByLocalName(doc, 'font');
  const fonts = fontNodes.map((font) => nodesByLocalName(font, 'b').length > 0);
  const cellXfs = firstNodeByLocalName(doc, 'cellXfs');
  const xfNodes = cellXfs ? nodesByLocalName(cellXfs, 'xf') : [];
  const styleFontIds = xfNodes.map((xf) => Number(xf.getAttribute('fontId') || 0));
  return {
    isBold(styleIndex) {
      const fontId = styleFontIds[Number(styleIndex) || 0] || 0;
      return Boolean(fonts[fontId]);
    },
  };
}

function parseWorksheet(sheetXml, sharedStrings, styles, sourceName) {
  const doc = parseXml(sheetXml);
  const rawRows = [];
  const rowNodes = nodesByLocalName(doc, 'row');

  rowNodes.forEach((rowNode, idx) => {
    const rowNumber = Number(rowNode.getAttribute('r') || idx + 1);
    const row = [];
    nodesByLocalName(rowNode, 'c').forEach((cellNode, cellIdx) => {
      const ref = cellNode.getAttribute('r') || '';
      const col = ref ? cellRefToColumn(ref) : cellIdx + 1;
      if (!col) return;
      const styleIndex = Number(cellNode.getAttribute('s') || 0);
      row[col - 1] = {
        value: readCellValue(cellNode, sharedStrings),
        styleIndex,
        bold: styles.isBold(styleIndex),
      };
    });
    rawRows[rowNumber - 1] = row;
  });

  const headerRow = rawRows[0] || [];
  const headers = headerRow.map((cell) => normalizeHeader(cell ? cell.value : ''));
  if (!headers.some(Boolean)) throw new Error(`${sourceName}: intestazioni non trovate nella prima riga.`);

  const rows = [];
  const boldTValues = [];

  for (let r = 1; r < rawRows.length; r += 1) {
    const raw = rawRows[r] || [];
    const obj = { _excelRow: r + 1 };
    let hasValue = false;

    headers.forEach((header, index) => {
      if (!header) return;
      const value = raw[index] ? raw[index].value : null;
      if (value !== null && value !== undefined && value !== '') hasValue = true;
      obj[header] = value;
    });

    const tCell = raw[19];
    const boldT = tCell && tCell.bold ? parseNumber(tCell.value) : 0;

    if (hasValue) {
      rows.push(obj);
      boldTValues.push(boldT);
    }
  }

  return { headers, rows, boldTValues, sourceName };
}

function readCellValue(cellNode, sharedStrings) {
  const type = cellNode.getAttribute('t');
  const vNode = firstNodeByLocalName(cellNode, 'v');

  if (type === 'inlineStr') {
    return nodesByLocalName(cellNode, 't').map((t) => t.textContent || '').join('');
  }

  if (!vNode) return null;
  const raw = vNode.textContent || '';

  if (type === 's') return sharedStrings[Number(raw)] ?? '';
  if (type === 'b') return raw === '1';
  if (type === 'str') return raw;

  const n = Number(raw);
  return Number.isFinite(n) ? n : raw;
}

function validateAgingInput(data, label) {
  const missing = REQUIRED_AGING_COLUMNS.filter((col) => !data.headers.includes(col));
  if (missing.length) {
    throw new Error(`${label}: mancano queste colonne: ${missing.join(', ')}.`);
  }
}

function validateMesiInput(data, label) {
  const headers = data.headers.filter(Boolean);
  if (headers.length < 3) throw new Error(`${label}: servono almeno 3 colonne: cliente, mesi, totale.`);
  if (headers.slice(1, -1).length < 24) throw new Error(`${label}: servono almeno 24 mesi per calcolare Dormienti e Persi.`);
}

function buildAgingReport(data, options) {
  const rows = data.rows.map((row, idx) => ({ ...row, Saldo_T_bold: data.boldTValues[idx] || 0 }));

  rows.forEach((row) => {
    ['Metodo di Pagamento', 'Descrizione Met. Pagamento', 'Insoluto Ricevuto'].forEach((col) => {
      row[col] = toText(row[col]).trim();
      row[`${col}_UP`] = row[col].toUpperCase();
    });
    AGING_NUMERIC_COLUMNS.forEach((col) => { row[col] = parseNumber(row[col]); });
  });

  const totalsMap = new Map();
  rows.forEach((row) => {
    if (!isTotalRow(row)) return;
    const key = clientKey(row);
    const current = totalsMap.get(key) || {
      'Codice Cliente': row['Codice Cliente'],
      'Ragione Sociale': row['Ragione Sociale'],
      'Saldo Totale': 0,
    };
    current['Saldo Totale'] += parseNumber(row.Saldo_T_bold);
    totalsMap.set(key, current);
  });

  const realRows = rows.filter((row) => {
    const isRibaSepa = ['RIBA', 'SEPA DIRECT DEBIT CORE'].includes(row['Descrizione Met. Pagamento_UP']);
    const insolutoYes = ['SÌ', 'SI', 'YES', 'Y'].includes(row['Insoluto Ricevuto_UP']);
    const hasScaduto = parseNumber(row['Totale Scaduto']) > 0;
    return !isTotalRow(row) && ((isRibaSepa && insolutoYes && hasScaduto) || (!isRibaSepa && hasScaduto));
  });

  const summaryValues = SCADUTO_COLUMNS.map((col) => sum(realRows, col));
  const totalScad = summaryValues.reduce((acc, n) => acc + n, 0);
  const totalDocs = Array.from(totalsMap.values()).reduce((acc, item) => acc + parseNumber(item['Saldo Totale']), 0);

  const filialiMap = new Map();
  if (options.includeBillingBranches) {
    realRows.forEach((row) => {
      const branch = toText(row['Descrizione Filiale di Fatt.']).trim();
      if (!branch) return;
      const key = clientKey(row);
      if (!filialiMap.has(key)) filialiMap.set(key, new Set());
      filialiMap.get(key).add(branch);
    });
  }

  const clientsMap = new Map();
  realRows.forEach((row) => {
    const key = clientKey(row);
    if (!clientsMap.has(key)) {
      clientsMap.set(key, {
        'Codice Cliente': row['Codice Cliente'],
        'Ragione Sociale': row['Ragione Sociale'],
        'Scaduto entro 30 gg.': 0,
        'Scaduto entro 60 gg.': 0,
        'Scaduto entro 90 gg.': 0,
        'Scaduto entro 120 gg.': 0,
        'Scaduto oltre 120 gg.': 0,
      });
    }
    const client = clientsMap.get(key);
    SCADUTO_COLUMNS.forEach((col) => { client[col] += parseNumber(row[col]); });
  });

  const clients = Array.from(clientsMap.values()).map((client) => {
    const key = clientKey(client);
    const total = totalsMap.get(key);
    const saldo = total ? parseNumber(total['Saldo Totale']) : 0;
    const totaleScadutoReale = SCADUTO_COLUMNS.reduce((acc, col) => acc + parseNumber(client[col]), 0);
    const weightedNumerator = SCADUTO_COLUMNS.reduce((acc, col, idx) => acc + parseNumber(client[col]) * WEIGHTS[idx], 0);

    const output = { ...client };
    if (options.includeBillingBranches) {
      const branches = filialiMap.get(key);
      output['Filiali di Fatturazione'] = branches ? Array.from(branches).sort().join(', ') : '';
    }
    output['Saldo Totale'] = saldo;
    output['Totale Scaduto Reale'] = totaleScadutoReale;
    output['% Scaduto vs Saldo'] = saldo > 0 ? totaleScadutoReale / saldo : 0;
    output['Giorni Scaduto (ponderati)'] = totaleScadutoReale > 0 ? round1(weightedNumerator / totaleScadutoReale) : 0;
    return output;
  }).sort((a, b) => parseNumber(b['Totale Scaduto Reale']) - parseNumber(a['Totale Scaduto Reale']));

  return {
    summaryValues,
    totalScad,
    totalDocs,
    clients,
  };
}

function isTotalRow(row) {
  return toText(row['Metodo di Pagamento_UP'] || row['Metodo di Pagamento']).toUpperCase().includes('TOTALE');
}

function clientKey(row) {
  return `${toText(row['Codice Cliente']).trim()}§${toText(row['Ragione Sociale']).trim()}`;
}

function buildDormientiPersiReport(data) {
  const headers = data.headers.filter(Boolean);
  const rows = data.rows;
  const monthColumns = headers.slice(1, -1);

  const dormienti = [];
  const persi = [];
  const dormientiOrangeFlags = [];

  rows.forEach((row) => {
    const values = monthColumns.map((col) => parseNumber(row[col]));
    const last6 = values.slice(-6);
    const last11 = values.slice(-11);
    const last12 = values.slice(-12);
    const months12To24 = values.slice(-24, -12);

    const isDormiente = last6.every((v) => v === 0) && last12.some((v) => v > 0);
    const isPerso = last12.every((v) => v === 0) && months12To24.some((v) => v > 0);

    if (isDormiente) {
      dormienti.push(row);
      dormientiOrangeFlags.push(last11.every((v) => v === 0));
    }
    if (isPerso) persi.push(row);
  });

  return {
    headers,
    originalRows: rows,
    dormienti,
    persi,
    dormientiOrangeFlags,
  };
}

async function createAgingWorkbook(report, options) {
  const summaryRows = [
    ['Fascia', 'Importo (€)', '% Scaduto'],
    ['Entro 30 gg', report.summaryValues[0], { formula: 'IF($B$7>0,B2/$B$7,0)', value: 0, style: STYLES.PCT }],
    ['Entro 60 gg', report.summaryValues[1], { formula: 'IF($B$7>0,B3/$B$7,0)', value: 0, style: STYLES.PCT }],
    ['Entro 90 gg', report.summaryValues[2], { formula: 'IF($B$7>0,B4/$B$7,0)', value: 0, style: STYLES.PCT }],
    ['Entro 120 gg', report.summaryValues[3], { formula: 'IF($B$7>0,B5/$B$7,0)', value: 0, style: STYLES.PCT }],
    ['Oltre 120 gg', report.summaryValues[4], { formula: 'IF($B$7>0,B6/$B$7,0)', value: 0, style: STYLES.PCT }],
    ['Totale Scaduto', { value: report.totalScad, style: STYLES.HIGHLIGHT_MONEY }, { formula: 'IF($B$8>0,$B$7/$B$8,0)', value: 0, style: STYLES.HIGHLIGHT_PCT }],
    ['Totale Saldo', report.totalDocs, null],
    [],
    ['Generato il', options.generatedAt],
  ];

  const detailHeaders = options.includeBillingBranches
    ? ['Codice Cliente', 'Ragione Sociale', 'Filiali di Fatturazione', ...SCADUTO_COLUMNS, 'Saldo Totale', 'Totale Scaduto Reale', '% Scaduto vs Saldo', 'Giorni Scaduto (ponderati)']
    : ['Codice Cliente', 'Ragione Sociale', ...SCADUTO_COLUMNS, 'Saldo Totale', 'Totale Scaduto Reale', '% Scaduto vs Saldo', 'Giorni Scaduto (ponderati)'];

  const detailRows = [detailHeaders];
  report.clients.forEach((client) => {
    detailRows.push(detailHeaders.map((h) => client[h] ?? ''));
  });

  const moneyColumnsSummary = new Set([2]);
  const percentColumnsSummary = new Set([3]);
  const detailMoneyStart = options.includeBillingBranches ? 4 : 3;
  const detailMoneyEnd = options.includeBillingBranches ? 10 : 9;
  const detailPctCol = options.includeBillingBranches ? 11 : 10;
  const detailWeightedCol = options.includeBillingBranches ? 12 : 11;
  const weightedLetter = columnNumberToName(detailWeightedCol);
  const lastDetailRow = Math.max(2, detailRows.length);

  const sheets = [
    {
      name: 'Riepilogo',
      rows: applyStyles(summaryRows, {
        headerRow: 1,
        moneyColumns: moneyColumnsSummary,
        percentColumns: percentColumnsSummary,
      }),
      widths: [22, 18, 18],
    },
    {
      name: 'Dettaglio Clienti',
      rows: applyStyles(detailRows, {
        headerRow: 1,
        moneyColumns: rangeSet(detailMoneyStart, detailMoneyEnd),
        percentColumns: new Set([detailPctCol]),
        decimalColumns: new Set([detailWeightedCol]),
      }),
      widths: options.includeBillingBranches
        ? [16, 40, 35, 18, 18, 18, 18, 18, 18, 18, 14, 22]
        : [16, 40, 18, 18, 18, 18, 18, 18, 18, 14, 22],
      conditionalFormatting: report.clients.length ? colorScaleXml(`${weightedLetter}2:${weightedLetter}${lastDetailRow}`) : '',
    },
  ];

  return createXlsx(sheets);
}

async function createDormientiWorkbook(report) {
  const originalRows = [report.headers, ...report.originalRows.map((row) => report.headers.map((h) => row[h] ?? ''))];
  const dormHeaders = [...report.headers];
  const persiHeaders = [...report.headers];
  dormHeaders[0] = 'Clienti';
  persiHeaders[0] = 'Clienti';

  const dormRows = [dormHeaders, ...report.dormienti.map((row) => report.headers.map((h) => row[h] ?? ''))];
  const persiRows = [persiHeaders, ...report.persi.map((row) => report.headers.map((h) => row[h] ?? ''))];

  const dormStyledRows = applyStyles(dormRows, { headerRow: 1 });
  report.dormientiOrangeFlags.forEach((flag, index) => {
    if (!flag) return;
    const rowIndex = index + 1;
    dormStyledRows[rowIndex] = dormStyledRows[rowIndex].map((cell) => ({ ...asCell(cell), style: STYLES.DORMANT_ORANGE }));
  });

  const widths = report.headers.map((h, i) => i === 0 ? Math.min(Math.max(maxTextLength([h, ...report.originalRows.map((r) => r[h])]) + 2, 12), 48) : 14);

  const sheets = [
    { name: 'Dati_originali', rows: applyStyles(originalRows, { headerRow: 1 }), widths, freezeTopRow: true },
    { name: 'Dormienti', rows: dormStyledRows, widths, freezeTopRow: true },
    { name: 'Persi', rows: applyStyles(persiRows, { headerRow: 1 }), widths, freezeTopRow: true },
  ];

  return createXlsx(sheets);
}

function applyStyles(rows, config = {}) {
  return rows.map((row, rIdx) => row.map((cell, cIdx) => {
    const out = asCell(cell);
    const col = cIdx + 1;
    if (config.headerRow && rIdx + 1 === config.headerRow) out.style = STYLES.HEADER;
    if (rIdx + 1 !== config.headerRow) {
      if (config.moneyColumns && config.moneyColumns.has(col)) out.style = out.style || STYLES.MONEY;
      if (config.percentColumns && config.percentColumns.has(col)) out.style = out.style || STYLES.PCT;
      if (config.decimalColumns && config.decimalColumns.has(col)) out.style = out.style || STYLES.ONE_DECIMAL;
    }
    return out;
  }));
}

function asCell(cell) {
  if (cell && typeof cell === 'object' && !Array.isArray(cell) && ('value' in cell || 'formula' in cell || 'style' in cell)) {
    return { value: cell.value ?? '', formula: cell.formula, style: cell.style || 0 };
  }
  return { value: cell ?? '', style: 0 };
}

function rangeSet(start, end) {
  const s = new Set();
  for (let i = start; i <= end; i += 1) s.add(i);
  return s;
}

async function createXlsx(sheets) {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', contentTypesXml(sheets.length));
  zip.folder('_rels').file('.rels', rootRelsXml());
  const xl = zip.folder('xl');
  xl.file('workbook.xml', workbookXml(sheets));
  xl.file('styles.xml', stylesXml());
  xl.folder('_rels').file('workbook.xml.rels', workbookRelsXml(sheets.length));
  const worksheets = xl.folder('worksheets');
  sheets.forEach((sheet, idx) => worksheets.file(`sheet${idx + 1}.xml`, worksheetXml(sheet)));
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

function worksheetXml(sheet) {
  const rowsXml = sheet.rows.map((row, rowIdx) => {
    const rowNumber = rowIdx + 1;
    const cellsXml = row.map((cell, cellIdx) => cellXml(asCell(cell), rowNumber, cellIdx + 1)).join('');
    return `<row r="${rowNumber}">${cellsXml}</row>`;
  }).join('');

  const maxCols = Math.max(...sheet.rows.map((r) => r.length), 1);
  const maxRows = Math.max(sheet.rows.length, 1);
  const dimension = `A1:${columnNumberToName(maxCols)}${maxRows}`;
  const colsXml = sheet.widths && sheet.widths.length
    ? `<cols>${sheet.widths.map((w, idx) => `<col min="${idx + 1}" max="${idx + 1}" width="${Number(w).toFixed(2)}" customWidth="1"/>`).join('')}</cols>`
    : '';
  const viewsXml = sheet.freezeTopRow
    ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
    : '<sheetViews><sheetView workbookViewId="0"/></sheetViews>';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="${dimension}"/>
  ${viewsXml}
  ${colsXml}
  <sheetData>${rowsXml}</sheetData>
  ${sheet.conditionalFormatting || ''}
</worksheet>`;
}

function cellXml(cell, rowNumber, colNumber) {
  const ref = `${columnNumberToName(colNumber)}${rowNumber}`;
  const style = cell.style ? ` s="${cell.style}"` : '';

  if (cell.formula) {
    const value = Number.isFinite(Number(cell.value)) ? Number(cell.value) : 0;
    return `<c r="${ref}"${style}><f>${escapeXml(cell.formula)}</f><v>${value}</v></c>`;
  }

  const value = cell.value;
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) return `<c r="${ref}"${style}><v>${value}</v></c>`;
  if (typeof value === 'boolean') return `<c r="${ref}" t="b"${style}><v>${value ? 1 : 0}</v></c>`;
  return `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${escapeXml(toText(value))}</t></is></c>`;
}

function colorScaleXml(range) {
  return `<conditionalFormatting sqref="${range}"><cfRule type="colorScale" priority="1"><colorScale><cfvo type="num" val="0"/><cfvo type="num" val="60"/><cfvo type="num" val="135"/><color rgb="FF63BE7B"/><color rgb="FFFFEB84"/><color rgb="FFF8696B"/></colorScale></cfRule></conditionalFormatting>`;
}

function workbookXml(sheets) {
  const sheetXml = sheets.map((sheet, idx) => `<sheet name="${escapeXmlAttr(sheet.name)}" sheetId="${idx + 1}" r:id="rId${idx + 1}"/>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <workbookPr date1904="false"/>
  <bookViews><workbookView xWindow="0" yWindow="0" windowWidth="20480" windowHeight="12000"/></bookViews>
  <sheets>${sheetXml}</sheets>
  <calcPr calcId="191029" fullCalcOnLoad="1"/>
</workbook>`;
}

function workbookRelsXml(sheetCount) {
  const sheetRels = Array.from({ length: sheetCount }, (_, idx) => `<Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheetRels}
  <Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function contentTypesXml(sheetCount) {
  const sheetOverrides = Array.from({ length: sheetCount }, (_, idx) => `<Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheetOverrides}
</Types>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="3">
    <numFmt numFmtId="164" formatCode="#,##0.00"/>
    <numFmt numFmtId="165" formatCode="0.00%"/>
    <numFmt numFmtId="166" formatCode="0.0"/>
  </numFmts>
  <fonts count="2">
    <font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF4B084"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFA500"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="8">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="164" fontId="1" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>
    <xf numFmtId="165" fontId="1" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1"/>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`;
}

function parseXml(xml) {
  const cleanXml = String(xml || '').replace(/^\uFEFF/, '');
  const doc = new DOMParser().parseFromString(cleanXml, 'application/xml');
  const parserError = firstNodeByLocalName(doc, 'parsererror');
  if (parserError) throw new Error('Errore nella lettura XML del file Excel.');
  return doc;
}

function nodesByLocalName(node, localName) {
  return Array.from(node.getElementsByTagName('*')).filter((el) => {
    return el.localName === localName || el.nodeName === localName || el.nodeName.endsWith(`:${localName}`);
  });
}

function firstNodeByLocalName(node, localName) {
  return nodesByLocalName(node, localName)[0] || null;
}

function cellRefToColumn(ref) {
  const letters = String(ref).match(/^[A-Z]+/i);
  if (!letters) return 0;
  return columnNameToNumber(letters[0]);
}

function columnNameToNumber(name) {
  let number = 0;
  const upper = String(name).toUpperCase();
  for (let i = 0; i < upper.length; i += 1) {
    number = number * 26 + (upper.charCodeAt(i) - 64);
  }
  return number;
}

function columnNumberToName(num) {
  let n = num;
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - m) / 26);
  }
  return s;
}

function normalizeHeader(value) {
  return toText(value).replace(/\s+/g, ' ').trim();
}

function toText(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined || value === '') return 0;
  let s = String(value).trim();
  if (!s) return 0;
  s = s.replace(/\s/g, '');
  if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',')) s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function sum(rows, col) {
  return rows.reduce((acc, row) => acc + parseNumber(row[col]), 0);
}

function round1(num) {
  return Math.round((Number(num) + Number.EPSILON) * 10) / 10;
}

function maxTextLength(values) {
  return values.reduce((max, value) => Math.max(max, toText(value).length), 0);
}

function formatTimestamp(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function escapeXml(value) {
  return toText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeXmlAttr(value) {
  return escapeXml(value);
}

function escapeHtml(value) {
  return escapeXml(value);
}

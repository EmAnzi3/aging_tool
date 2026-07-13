'use strict';

// Standard output Aging - note/crediti per fascia, RIBA insolute, layout definitivo.
// Versione 20260713-1.

const OUTPUT_STYLES = {
  DEFAULT: 0,
  HEADER: 1,
  MONEY: 2,
  PCT: 3,
  ONE_DECIMAL: 4,
  HIGHLIGHT_MONEY: 5,
  HIGHLIGHT_PCT: 6,
  DORMANT_ORANGE: 7,
  LOST_RED: 8,
  DATE: 9,
  GROUP_IDENTITY: 10,
  GROUP_GROSS: 11,
  GROUP_CREDIT: 12,
  GROUP_NET: 13,
  GROUP_SUMMARY: 14,
  HEADER_IDENTITY: 15,
  HEADER_GROSS: 16,
  HEADER_CREDIT: 17,
  HEADER_NET: 18,
  HEADER_SUMMARY: 19,
  HIGHLIGHT_CREDIT: 20,
  HIGHLIGHT_NET_MONEY: 21,
  HIGHLIGHT_NET_PCT: 22,
};

const AGING_DATE_HEADERS = new Set([
  'Data Reg.',
  'Data Scad.',
  'Data Scad. Originale',
  'Data Passaggio al Legale',
  'Data Commento',
]);

function buildAgingReport(data, options) {
  const rows = data.rows.map((row, idx) => ({
    ...row,
    Saldo_T_bold: data.boldTValues[idx] || 0,
  }));

  rows.forEach((row) => {
    ['Metodo di Pagamento', 'Descrizione Met. Pagamento', 'Insoluto Ricevuto'].forEach((col) => {
      row[col] = toText(row[col]).trim();
      row[`${col}_UP`] = row[col].toUpperCase();
    });
    AGING_NUMERIC_COLUMNS.forEach((col) => {
      row[col] = parseNumber(row[col]);
    });
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

  const clientsMap = new Map();

  function ensureClient(row) {
    const key = clientKey(row);
    if (!clientsMap.has(key)) {
      clientsMap.set(key, {
        'Codice Cliente': row['Codice Cliente'],
        'Ragione Sociale': row['Ragione Sociale'],
        gross: [0, 0, 0, 0, 0],
        credit: [0, 0, 0, 0, 0],
        branches: new Set(),
        creditDocs: new Set(),
      });
    }
    return clientsMap.get(key);
  }

  rows.forEach((row) => {
    if (isTotalRow(row)) return;

    const buckets = SCADUTO_COLUMNS.map((col) => parseNumber(row[col]));
    const isRibaSepa = ['RIBA', 'SEPA DIRECT DEBIT CORE'].includes(row['Descrizione Met. Pagamento_UP']);
    const insolutoYes = ['SÌ', 'SI', 'YES', 'Y'].includes(row['Insoluto Ricevuto_UP']);
    const positiveValid = parseNumber(row['Totale Scaduto']) > 0 && (!isRibaSepa || insolutoYes);
    const hasCredit = buckets.some((value) => value < 0);

    if (!positiveValid && !hasCredit) return;

    const client = ensureClient(row);
    const branch = toText(row['Descrizione Filiale di Fatt.']).trim();
    if (branch) client.branches.add(branch);

    buckets.forEach((value, index) => {
      if (positiveValid && value > 0) client.gross[index] += value;
      if (value < 0) client.credit[index] += value;
    });

    if (hasCredit) {
      const docType = toText(row['Tipo Documento']).trim();
      const docNumber = toText(row['Numero Documento']).trim();
      const label = [docType, docNumber].filter(Boolean).join(' ');
      if (label) client.creditDocs.add(label);
    }
  });

  const clients = Array.from(clientsMap.values()).map((client) => {
    const key = clientKey(client);
    const total = totalsMap.get(key);
    const saldo = total ? parseNumber(total['Saldo Totale']) : 0;
    const net = client.gross.map((value, index) => value + client.credit[index]);
    const grossTotal = client.gross.reduce((acc, value) => acc + value, 0);
    const creditTotal = client.credit.reduce((acc, value) => acc + value, 0);
    const netTotal = net.reduce((acc, value) => acc + value, 0);
    const weightedNumerator = net.reduce(
      (acc, value, index) => acc + Math.max(value, 0) * WEIGHTS[index],
      0,
    );

    let status = 'Scaduto';
    if (netTotal > 0 && creditTotal < 0) status = 'Scaduto netto con note/crediti';
    else if (Math.abs(netTotal) < 0.005 && grossTotal > 0) status = 'Compensato';
    else if (netTotal < 0) status = 'Credito netto';
    else if (grossTotal <= 0 && creditTotal < 0) status = 'Solo credito';

    return {
      'Codice Cliente': client['Codice Cliente'],
      'Ragione Sociale': client['Ragione Sociale'],
      'Filiali di Fatturazione': Array.from(client.branches).sort().join(', '),
      gross: client.gross,
      credit: client.credit,
      net,
      'Saldo Totale': saldo,
      'Scaduto lordo positivo': grossTotal,
      'Note/Crediti in fasce': creditTotal,
      'Totale netto scaduto': netTotal,
      '% Scaduto netto vs Saldo': saldo > 0 ? netTotal / saldo : 0,
      'Giorni Scaduto (ponderati)': netTotal > 0 ? round1(weightedNumerator / netTotal) : 0,
      Stato: status,
      'Documenti credito': Array.from(client.creditDocs).join('; '),
    };
  }).sort((a, b) => {
    const byNet = parseNumber(b['Totale netto scaduto']) - parseNumber(a['Totale netto scaduto']);
    if (Math.abs(byNet) > 0.000001) return byNet;
    return toText(a['Ragione Sociale']).localeCompare(toText(b['Ragione Sociale']), 'it');
  });

  const grossSummary = SCADUTO_COLUMNS.map((_, index) => (
    clients.reduce((acc, client) => acc + parseNumber(client.gross[index]), 0)
  ));
  const creditSummary = SCADUTO_COLUMNS.map((_, index) => (
    clients.reduce((acc, client) => acc + parseNumber(client.credit[index]), 0)
  ));
  const netSummary = grossSummary.map((value, index) => value + creditSummary[index]);
  const totalDocs = Array.from(totalsMap.values())
    .reduce((acc, item) => acc + parseNumber(item['Saldo Totale']), 0);

  return {
    grossSummary,
    creditSummary,
    netSummary,
    grossTotal: grossSummary.reduce((acc, value) => acc + value, 0),
    creditTotal: creditSummary.reduce((acc, value) => acc + value, 0),
    netTotal: netSummary.reduce((acc, value) => acc + value, 0),
    totalDocs,
    clients,
    originalHeaders: data.headers.filter(Boolean),
    originalRows: data.rows,
    includeBillingBranches: Boolean(options.includeBillingBranches),
  };
}

async function createAgingWorkbook(report, options) {
  const netTotal = report.netTotal;
  const summaryRows = [
    [
      { value: 'Fascia', style: OUTPUT_STYLES.HEADER },
      { value: 'Importo (€)', style: OUTPUT_STYLES.HEADER },
      { value: '% Scaduto netto', style: OUTPUT_STYLES.HEADER },
    ],
    ...['Entro 30 gg', 'Entro 60 gg', 'Entro 90 gg', 'Entro 120 gg', 'Oltre 120 gg']
      .map((label, index) => [
        label,
        { value: report.netSummary[index], style: OUTPUT_STYLES.MONEY },
        {
          formula: `IF($B$9=0,0,B${index + 2}/$B$9)`,
          value: netTotal !== 0 ? report.netSummary[index] / netTotal : 0,
          style: OUTPUT_STYLES.PCT,
        },
      ]),
    [
      { value: 'Scaduto lordo positivo', style: OUTPUT_STYLES.GROUP_GROSS },
      { value: report.grossTotal, style: OUTPUT_STYLES.HIGHLIGHT_MONEY },
      '',
    ],
    [
      { value: 'Note/Crediti in fasce', style: OUTPUT_STYLES.GROUP_CREDIT },
      { value: report.creditTotal, style: OUTPUT_STYLES.HIGHLIGHT_CREDIT },
      '',
    ],
    [
      { value: 'Totale netto scaduto', style: OUTPUT_STYLES.GROUP_NET },
      { value: report.netTotal, style: OUTPUT_STYLES.HIGHLIGHT_NET_MONEY },
      {
        formula: 'IF(B10=0,0,B9/B10)',
        value: report.totalDocs !== 0 ? report.netTotal / report.totalDocs : 0,
        style: OUTPUT_STYLES.HIGHLIGHT_NET_PCT,
      },
    ],
    [
      { value: 'Totale Saldo', style: OUTPUT_STYLES.GROUP_SUMMARY },
      { value: report.totalDocs, style: OUTPUT_STYLES.HIGHLIGHT_MONEY },
      '',
    ],
    [],
    ['Generato il', options.generatedAt],
  ];

  const identityHeaders = options.includeBillingBranches
    ? ['Codice Cliente', 'Ragione Sociale', 'Filiali di Fatturazione']
    : ['Codice Cliente', 'Ragione Sociale'];
  const shortBuckets = ['Entro 30 gg', 'Entro 60 gg', 'Entro 90 gg', 'Entro 120 gg', 'Oltre 120 gg'];
  const detailHeaders = [
    ...identityHeaders,
    ...shortBuckets.map((label) => `Lordo ${label}`),
    ...shortBuckets.map((label) => `Note/Crediti ${label}`),
    ...shortBuckets.map((label) => `Netto ${label}`),
    'Saldo Totale',
    'Scaduto lordo positivo',
    'Note/Crediti in fasce',
    'Totale netto scaduto',
    '% Scaduto netto vs Saldo',
    'Giorni Scaduto (ponderati)',
    'Stato',
    'Documenti credito',
  ];

  const identityCount = identityHeaders.length;
  const grossStart = identityCount + 1;
  const grossEnd = grossStart + 4;
  const creditStart = grossEnd + 1;
  const creditEnd = creditStart + 4;
  const netStart = creditEnd + 1;
  const netEnd = netStart + 4;
  const summaryStart = netEnd + 1;
  const summaryEnd = detailHeaders.length;

  const groupRow = detailHeaders.map((_, index) => {
    const col = index + 1;
    if (col <= identityCount) return { value: '', style: OUTPUT_STYLES.GROUP_IDENTITY };
    if (col <= grossEnd) return { value: '', style: OUTPUT_STYLES.GROUP_GROSS };
    if (col <= creditEnd) return { value: '', style: OUTPUT_STYLES.GROUP_CREDIT };
    if (col <= netEnd) return { value: '', style: OUTPUT_STYLES.GROUP_NET };
    return { value: '', style: OUTPUT_STYLES.GROUP_SUMMARY };
  });
  groupRow[0].value = 'Cliente';
  groupRow[grossStart - 1].value = 'Scaduto lordo positivo';
  groupRow[creditStart - 1].value = 'Note/Crediti in fasce';
  groupRow[netStart - 1].value = 'Totale netto scaduto';
  groupRow[summaryStart - 1].value = 'Riepilogo cliente';

  const headerRow = detailHeaders.map((header, index) => {
    const col = index + 1;
    let style = OUTPUT_STYLES.HEADER_SUMMARY;
    if (col <= identityCount) style = OUTPUT_STYLES.HEADER_IDENTITY;
    else if (col <= grossEnd) style = OUTPUT_STYLES.HEADER_GROSS;
    else if (col <= creditEnd) style = OUTPUT_STYLES.HEADER_CREDIT;
    else if (col <= netEnd) style = OUTPUT_STYLES.HEADER_NET;
    return { value: header, style };
  });

  const detailRows = [groupRow, headerRow];
  report.clients.forEach((client) => {
    const row = [client['Codice Cliente'], client['Ragione Sociale']];
    if (options.includeBillingBranches) row.push(client['Filiali di Fatturazione']);

    client.gross.forEach((value) => row.push({ value, style: OUTPUT_STYLES.MONEY }));
    client.credit.forEach((value) => row.push({ value, style: OUTPUT_STYLES.MONEY }));
    client.net.forEach((value) => row.push({ value, style: OUTPUT_STYLES.MONEY }));
    row.push(
      { value: client['Saldo Totale'], style: OUTPUT_STYLES.MONEY },
      { value: client['Scaduto lordo positivo'], style: OUTPUT_STYLES.MONEY },
      { value: client['Note/Crediti in fasce'], style: OUTPUT_STYLES.MONEY },
      { value: client['Totale netto scaduto'], style: OUTPUT_STYLES.MONEY },
      { value: client['% Scaduto netto vs Saldo'], style: OUTPUT_STYLES.PCT },
      { value: client['Giorni Scaduto (ponderati)'], style: OUTPUT_STYLES.ONE_DECIMAL },
      client.Stato,
      client['Documenti credito'],
    );
    detailRows.push(row);
  });

  const originalRows = [
    report.originalHeaders.map((header) => ({ value: header, style: OUTPUT_STYLES.HEADER })),
    ...report.originalRows.map((row) => report.originalHeaders.map((header) => ({
      value: row[header] ?? '',
      style: AGING_DATE_HEADERS.has(header) && typeof row[header] === 'number'
        ? OUTPUT_STYLES.DATE
        : OUTPUT_STYLES.DEFAULT,
    }))),
  ];

  const weightedCol = summaryStart + 5;
  const weightedLetter = columnNumberToName(weightedCol);
  const lastDetailRow = Math.max(3, detailRows.length);
  const identityEndLetter = columnNumberToName(identityCount);
  const grossStartLetter = columnNumberToName(grossStart);
  const grossEndLetter = columnNumberToName(grossEnd);
  const creditStartLetter = columnNumberToName(creditStart);
  const creditEndLetter = columnNumberToName(creditEnd);
  const netStartLetter = columnNumberToName(netStart);
  const netEndLetter = columnNumberToName(netEnd);
  const summaryStartLetter = columnNumberToName(summaryStart);
  const summaryEndLetter = columnNumberToName(summaryEnd);

  const sheets = [
    {
      name: 'Riepilogo',
      rows: summaryRows,
      widths: [27, 18, 20],
      freezeRows: 1,
      rowHeights: { 1: 24 },
    },
    {
      name: 'Dettaglio Clienti',
      rows: detailRows,
      widths: autofitWidths(detailRows, 12, 100),
      freezeRows: 2,
      freezeColumns: options.includeBillingBranches ? 3 : 2,
      rowHeights: { 1: 24, 2: 30 },
      merges: [
        `A1:${identityEndLetter}1`,
        `${grossStartLetter}1:${grossEndLetter}1`,
        `${creditStartLetter}1:${creditEndLetter}1`,
        `${netStartLetter}1:${netEndLetter}1`,
        `${summaryStartLetter}1:${summaryEndLetter}1`,
      ],
      conditionalFormatting: report.clients.length
        ? colorScaleXml(`${weightedLetter}3:${weightedLetter}${lastDetailRow}`)
        : '',
    },
    {
      name: 'Dati_originali',
      rows: originalRows,
      widths: originalWidths(report.originalHeaders, originalRows),
      freezeRows: 1,
      rowHeights: { 1: 24 },
    },
  ];

  return createXlsx(sheets);
}

function originalWidths(headers, rows) {
  return headers.map((header, index) => {
    if (AGING_DATE_HEADERS.has(header)) return 18;
    const values = rows.map((row) => asCell(row[index]).value);
    const longest = values.reduce((max, value) => Math.max(max, displayLength(value)), 0);
    return Math.min(Math.max(longest + 2, 12), 80);
  });
}

function autofitWidths(rows, min = 10, max = 80) {
  const colCount = Math.max(...rows.map((row) => row.length), 1);
  return Array.from({ length: colCount }, (_, colIdx) => {
    const longest = rows.reduce((best, row) => {
      const value = colIdx < row.length ? asCell(row[colIdx]).value : '';
      return Math.max(best, displayLength(value));
    }, 0);
    return Math.min(Math.max(longest + 2, min), max);
  });
}

function displayLength(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return 16;
  return toText(value).length;
}

function buildDormientiPersiReport(data) {
  const headers = data.headers.filter(Boolean);
  const rows = data.rows;
  const monthColumns = headers.slice(1, -1);
  const dormienti = [];
  const persi = [];
  const dormientiOrangeFlags = [];
  const persiRedFlags = [];

  rows.forEach((row) => {
    const values = monthColumns.map((col) => parseNumber(row[col]));
    const last6 = values.slice(-6);
    const last11 = values.slice(-11);
    const last12 = values.slice(-12);
    const months12To24 = values.slice(-24, -12);
    const isDormiente = last6.every((value) => value === 0) && last12.some((value) => value > 0);
    const isPerso = last12.every((value) => value === 0) && months12To24.some((value) => value > 0);

    if (isDormiente) {
      dormienti.push(row);
      dormientiOrangeFlags.push(last11.every((value) => value === 0));
    }
    if (isPerso) {
      persi.push(row);
      persiRedFlags.push(
        months12To24.length >= 12
        && months12To24[0] > 0
        && months12To24.slice(1).every((value) => value === 0),
      );
    }
  });

  return {
    headers,
    originalRows: rows,
    dormienti,
    persi,
    dormientiOrangeFlags,
    persiRedFlags,
  };
}

async function createDormientiWorkbook(report) {
  const dormHeaders = [...report.headers];
  const persiHeaders = [...report.headers];
  dormHeaders[0] = 'Clienti';
  persiHeaders[0] = 'Clienti';

  const originalRows = [
    report.headers,
    ...report.originalRows.map((row) => report.headers.map((header) => row[header] ?? '')),
  ];
  const dormRows = [
    dormHeaders,
    ...report.dormienti.map((row) => report.headers.map((header) => row[header] ?? '')),
  ];
  const persiRows = [
    persiHeaders,
    ...report.persi.map((row) => report.headers.map((header) => row[header] ?? '')),
  ];

  const dormStyledRows = applyStyles(dormRows, { headerRow: 1 });
  report.dormientiOrangeFlags.forEach((flag, index) => {
    if (!flag) return;
    const rowIndex = index + 1;
    dormStyledRows[rowIndex] = dormStyledRows[rowIndex]
      .map((cell) => ({ ...asCell(cell), style: OUTPUT_STYLES.DORMANT_ORANGE }));
  });

  const persiStyledRows = applyStyles(persiRows, { headerRow: 1 });
  report.persiRedFlags.forEach((flag, index) => {
    if (!flag) return;
    const rowIndex = index + 1;
    persiStyledRows[rowIndex] = persiStyledRows[rowIndex]
      .map((cell) => ({ ...asCell(cell), style: OUTPUT_STYLES.LOST_RED }));
  });

  const widths = autofitWidths(originalRows, 12, 48);
  return createXlsx([
    { name: 'Dormienti', rows: dormStyledRows, widths, freezeRows: 1 },
    { name: 'Persi', rows: persiStyledRows, widths, freezeRows: 1 },
    { name: 'Dati_originali', rows: originalRows, widths, freezeRows: 1 },
  ]);
}

function worksheetXml(sheet) {
  const rowsXml = sheet.rows.map((row, rowIdx) => {
    const rowNumber = rowIdx + 1;
    const height = sheet.rowHeights && sheet.rowHeights[rowNumber]
      ? ` ht="${Number(sheet.rowHeights[rowNumber]).toFixed(2)}" customHeight="1"`
      : '';
    const cellsXml = row.map((cell, cellIdx) => cellXml(asCell(cell), rowNumber, cellIdx + 1)).join('');
    return `<row r="${rowNumber}"${height}>${cellsXml}</row>`;
  }).join('');

  const maxCols = Math.max(...sheet.rows.map((row) => row.length), 1);
  const maxRows = Math.max(sheet.rows.length, 1);
  const dimension = `A1:${columnNumberToName(maxCols)}${maxRows}`;
  const colsXml = sheet.widths && sheet.widths.length
    ? `<cols>${sheet.widths.map((width, idx) => `<col min="${idx + 1}" max="${idx + 1}" width="${Number(width).toFixed(2)}" customWidth="1"/>`).join('')}</cols>`
    : '';

  const freezeRows = Number(sheet.freezeRows || (sheet.freezeTopRow ? 1 : 0));
  const freezeColumns = Number(sheet.freezeColumns || 0);
  let viewsXml = '<sheetViews><sheetView workbookViewId="0"/></sheetViews>';
  if (freezeRows > 0 || freezeColumns > 0) {
    const topLeftCell = `${columnNumberToName(freezeColumns + 1)}${freezeRows + 1}`;
    const xSplit = freezeColumns > 0 ? ` xSplit="${freezeColumns}"` : '';
    const ySplit = freezeRows > 0 ? ` ySplit="${freezeRows}"` : '';
    const activePane = freezeRows > 0 && freezeColumns > 0
      ? 'bottomRight'
      : (freezeRows > 0 ? 'bottomLeft' : 'topRight');
    viewsXml = `<sheetViews><sheetView workbookViewId="0"><pane${xSplit}${ySplit} topLeftCell="${topLeftCell}" activePane="${activePane}" state="frozen"/></sheetView></sheetViews>`;
  }

  const mergesXml = sheet.merges && sheet.merges.length
    ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map((ref) => `<mergeCell ref="${escapeXmlAttr(ref)}"/>`).join('')}</mergeCells>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="${dimension}"/>
  ${viewsXml}
  ${colsXml}
  <sheetData>${rowsXml}</sheetData>
  ${mergesXml}
  ${sheet.conditionalFormatting || ''}
</worksheet>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="4">
    <numFmt numFmtId="164" formatCode="#,##0.00"/>
    <numFmt numFmtId="165" formatCode="0.00%"/>
    <numFmt numFmtId="166" formatCode="0.0"/>
    <numFmt numFmtId="167" formatCode="dd/mm/yyyy"/>
  </numFmts>
  <fonts count="3">
    <font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
  </fonts>
  <fills count="10">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF4B084"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFA500"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF4472C4"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFD9E1F2"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFD9EAF7"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFC6E0B4"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2F0D9"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFC00000"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFD9D9D9"/></left><right style="thin"><color rgb="FFD9D9D9"/></right><top style="thin"><color rgb="FFD9D9D9"/></top><bottom style="thin"><color rgb="FFD9D9D9"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="23">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="164" fontId="1" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>
    <xf numFmtId="165" fontId="1" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1"/>
    <xf numFmtId="0" fontId="2" fillId="9" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="167" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="0" fontId="1" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="8" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="8" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="164" fontId="1" fillId="6" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>
    <xf numFmtId="164" fontId="1" fillId="7" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>
    <xf numFmtId="165" fontId="1" fillId="7" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`;
}

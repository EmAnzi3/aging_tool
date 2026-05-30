// Patch output Aging - v20260529-8
(() => {
  const originalBuildAgingReport = buildAgingReport;

  buildAgingReport = function buildAgingReportPatched(data, options) {
    const report = originalBuildAgingReport(data, options);
    return {
      ...report,
      originalHeaders: data.headers.filter(Boolean),
      originalRows: data.rows,
    };
  };

  function styleHeader(rows) {
    if (!rows.length) return rows;
    rows[0] = rows[0].map((cell) => ({ ...asCell(cell), style: STYLES.HIGHLIGHT_MONEY }));
    return rows;
  }

  function autofitWidths(rows, min = 10, max = 60) {
    const colCount = Math.max(...rows.map((r) => r.length), 1);
    return Array.from({ length: colCount }, (_, colIdx) => {
      let best = min;
      rows.forEach((row) => {
        const cell = asCell(row[colIdx]);
        const value = cell.formula ? cell.value : cell.value;
        const len = toText(value ?? '').length + 2;
        if (len > best) best = len;
      });
      return Math.min(Math.max(best, min), max);
    });
  }

  createAgingWorkbook = async function createAgingWorkbookPatched(report, options) {
    const summaryRows = [
      ['Fascia', 'Importo (€)', '% Scaduto'],
      ['Entro 30 gg', report.summaryValues[0], { formula: 'IF($B$7>0,B2/$B$7,0)', value: 0, style: STYLES.PCT }],
      ['Entro 60 gg', report.summaryValues[1], { formula: 'IF($B$7>0,B3/$B$7,0)', value: 0, style: STYLES.PCT }],
      ['Entro 90 gg', report.summaryValues[2], { formula: 'IF($B$7>0,B4/$B$7,0)', value: 0, style: STYLES.PCT }],
      ['Entro 120 gg', report.summaryValues[3], { formula: 'IF($B$7>0,B5/$B$7,0)', value: 0, style: STYLES.PCT }],
      ['Oltre 120 gg', report.summaryValues[4], { formula: 'IF($B$7>0,B6/$B$7,0)', value: 0, style: STYLES.PCT }],
      ['Totale Scaduto', { value: report.totalScad, style: STYLES.HIGHLIGHT_MONEY }, { formula: 'IF($B$8>0,$B$7/$B$8,0)', value: 0, style: STYLES.HIGHLIGHT_PCT }],
      ['Totale Saldo', { value: report.totalDocs, style: STYLES.HIGHLIGHT_MONEY }, null],
      [],
      ['Generato il', options.generatedAt],
    ];

    const detailHeaders = options.includeBillingBranches
      ? ['Codice Cliente', 'Ragione Sociale', 'Filiali di Fatturazione', ...SCADUTO_COLUMNS, 'Saldo Totale', 'Totale Scaduto Reale', '% Scaduto vs Saldo', 'Giorni Scaduto (ponderati)']
      : ['Codice Cliente', 'Ragione Sociale', ...SCADUTO_COLUMNS, 'Saldo Totale', 'Totale Scaduto Reale', '% Scaduto vs Saldo', 'Giorni Scaduto (ponderati)'];

    const detailRows = [detailHeaders, ...report.clients.map((client) => detailHeaders.map((h) => client[h] ?? ''))];
    const originalHeaders = report.originalHeaders || [];
    const originalRows = [originalHeaders, ...(report.originalRows || []).map((row) => originalHeaders.map((h) => row[h] ?? ''))];

    const detailMoneyStart = options.includeBillingBranches ? 4 : 3;
    const detailMoneyEnd = options.includeBillingBranches ? 10 : 9;
    const detailPctCol = options.includeBillingBranches ? 11 : 10;
    const detailWeightedCol = options.includeBillingBranches ? 12 : 11;
    const weightedLetter = columnNumberToName(detailWeightedCol);
    const lastDetailRow = Math.max(2, detailRows.length);

    const summaryStyled = styleHeader(applyStyles(summaryRows, { headerRow: 1, moneyColumns: new Set([2]), percentColumns: new Set([3]) }));
    const detailStyled = styleHeader(applyStyles(detailRows, {
      headerRow: 1,
      moneyColumns: rangeSet(detailMoneyStart, detailMoneyEnd),
      percentColumns: new Set([detailPctCol]),
      decimalColumns: new Set([detailWeightedCol]),
    }));

    return createXlsx([
      { name: 'Riepilogo', rows: summaryStyled, widths: autofitWidths(summaryRows, 12, 28), freezeTopRow: true },
      { name: 'Dettaglio Clienti', rows: detailStyled, widths: autofitWidths(detailRows, 10, 60), freezeTopRow: true, conditionalFormatting: report.clients.length ? colorScaleXml(`${weightedLetter}2:${weightedLetter}${lastDetailRow}`) : '' },
      { name: 'Dati_originali', rows: originalRows },
    ]);
  };
})();

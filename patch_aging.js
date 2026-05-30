// Patch output Aging - v20260529-7
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

  function warmHeader(rows) {
    if (!rows.length) return rows;
    rows[0] = rows[0].map((cell) => ({ ...asCell(cell), style: STYLES.HIGHLIGHT_MONEY }));
    return rows;
  }

  function originalSheetWidths(headers, rows) {
    return headers.map((h, i) => {
      const sample = [h, ...rows.slice(0, 120).map((r) => r[h])];
      const max = maxTextLength(sample) + 2;
      const upper = i === 0 ? 22 : 32;
      return Math.min(Math.max(max, 12), upper);
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

    const detailRows = [detailHeaders];
    report.clients.forEach((client) => {
      detailRows.push(detailHeaders.map((h) => client[h] ?? ''));
    });

    const originalHeaders = report.originalHeaders || [];
    const originalRows = [originalHeaders, ...(report.originalRows || []).map((row) => originalHeaders.map((h) => row[h] ?? ''))];

    const detailMoneyStart = options.includeBillingBranches ? 4 : 3;
    const detailMoneyEnd = options.includeBillingBranches ? 10 : 9;
    const detailPctCol = options.includeBillingBranches ? 11 : 10;
    const detailWeightedCol = options.includeBillingBranches ? 12 : 11;
    const weightedLetter = columnNumberToName(detailWeightedCol);
    const lastDetailRow = Math.max(2, detailRows.length);

    const summaryStyled = warmHeader(applyStyles(summaryRows, {
      headerRow: 1,
      moneyColumns: new Set([2]),
      percentColumns: new Set([3]),
    }));

    const detailStyled = warmHeader(applyStyles(detailRows, {
      headerRow: 1,
      moneyColumns: rangeSet(detailMoneyStart, detailMoneyEnd),
      percentColumns: new Set([detailPctCol]),
      decimalColumns: new Set([detailWeightedCol]),
    }));

    const originalStyled = warmHeader(applyStyles(originalRows, { headerRow: 1 }));

    const sheets = [
      { name: 'Riepilogo', rows: summaryStyled, widths: [22, 18, 18], freezeTopRow: true },
      {
        name: 'Dettaglio Clienti',
        rows: detailStyled,
        widths: options.includeBillingBranches
          ? [16, 40, 35, 18, 18, 18, 18, 18, 18, 18, 14, 22]
          : [16, 40, 18, 18, 18, 18, 18, 18, 18, 14, 22],
        freezeTopRow: true,
        conditionalFormatting: report.clients.length ? colorScaleXml(`${weightedLetter}2:${weightedLetter}${lastDetailRow}`) : '',
      },
      { name: 'Dati_originali', rows: originalStyled, widths: originalSheetWidths(originalHeaders, report.originalRows || []), freezeTopRow: true },
    ];

    return createXlsx(sheets);
  };
})();

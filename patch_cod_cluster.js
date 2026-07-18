'use strict';

// Aggiunge Cod. Cluster agli output Aging senza modificare il resto del layout.
// Versione 20260718-1.

(() => {
  const baseBuildAgingReport = window.buildAgingReport;
  if (typeof baseBuildAgingReport !== 'function') return;

  window.buildAgingReport = function buildAgingReportWithCluster(data, options) {
    const report = baseBuildAgingReport(data, options);
    const clustersByClient = new Map();

    (data.rows || []).forEach((row) => {
      const cluster = toText(row['Cod. Cluster']).trim();
      if (!cluster) return;
      const key = clientKey(row);
      if (!clustersByClient.has(key)) clustersByClient.set(key, cluster);
    });

    report.clients.forEach((client) => {
      client['Cod. Cluster'] = clustersByClient.get(clientKey(client)) || '';
    });

    return report;
  };

  window.createAgingWorkbook = async function createAgingWorkbookWithCluster(report, options) {
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
      ? ['Codice Cliente', 'Ragione Sociale', 'Cod. Cluster', 'Filiali di Fatturazione']
      : ['Codice Cliente', 'Ragione Sociale', 'Cod. Cluster'];
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
      const row = [client['Codice Cliente'], client['Ragione Sociale'], client['Cod. Cluster']];
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
        freezeColumns: options.includeBillingBranches ? 4 : 3,
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
  };
})();

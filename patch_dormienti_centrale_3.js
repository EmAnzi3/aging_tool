async function createDormientiWorkbook(report) {
  const monthLabels = report.monthColumns.map(formatMonthHeader);
  const detailHeaders = [
    'Competenza',
    'Tipologia cliente',
    'Filiale di competenza',
    'Codice Cliente',
    'Cliente',
    'Fatturato 24 mesi',
    'Evoluzione prossimo mese',
    'Ultimo mese con fatturato',
    'Mesi senza fatturato',
    ...monthLabels,
  ];

  const dormantRows = createDormientiDetailRows(detailHeaders, report.dormienti);
  const lostRows = createDormientiDetailRows(detailHeaders, report.persi);
  const summaryRows = createDormientiSummaryRows(report);

  const originalRows = [
    report.headers.map((header) => ({ value: header, style: OUTPUT_STYLES.HEADER })),
    ...report.originalRows.map((row) => report.headers.map((header, columnIndex) => {
      const value = row[header] ?? '';
      if (columnIndex > 0 && typeof value === 'number') return { value, style: OUTPUT_STYLES.MONEY };
      return value;
    })),
  ];

  const dormantLastRow = Math.max(dormantRows.length, 2);
  const lostLastRow = Math.max(lostRows.length, 2);
  const lastColumn = columnNumberToName(detailHeaders.length);

  return createXlsx([
    {
      name: 'Riepilogo',
      rows: summaryRows,
      widths: [24, 23, 18, 18, 20, 18, 25],
      freezeRows: 3,
      rowHeights: { 1: 30, 5: 25, 10: 25, 15: 48 },
      merges: ['A1:G1', 'A15:G15'],
    },
    {
      name: 'Dormienti',
      rows: dormantRows,
      widths: autofitWidths(dormantRows, 11, 48),
      freezeRows: 1,
      freezeColumns: 5,
      rowHeights: { 1: 30 },
      autoFilter: `A1:${lastColumn}${dormantRows.length}`,
      conditionalFormatting: dormantRows.length > 1
        ? dormientiConditionalFormatting(`A2:${lastColumn}${dormantLastRow}`, 'dormienti')
        : '',
    },
    {
      name: 'Persi',
      rows: lostRows,
      widths: autofitWidths(lostRows, 11, 48),
      freezeRows: 1,
      freezeColumns: 5,
      rowHeights: { 1: 30 },
      autoFilter: `A1:${lastColumn}${lostRows.length}`,
      conditionalFormatting: lostRows.length > 1
        ? dormientiConditionalFormatting(`A2:${lastColumn}${lostLastRow}`, 'persi')
        : '',
    },
    {
      name: 'Dati_originali',
      rows: originalRows,
      widths: autofitWidths(originalRows, 11, 48),
      freezeRows: 2,
      freezeColumns: 1,
      rowHeights: { 1: 25, 2: 25 },
    },
  ]);
}

function createDormientiDetailRows(headers, records) {
  const rows = [headers.map((header) => ({ value: header, style: OUTPUT_STYLES.HEADER }))];
  records.forEach((record) => {
    const row = [
      record.competence,
      { value: record.customerType, style: record.customerType === 'PRIVATO' ? DORMIENTI_STYLES.PRIVATE : OUTPUT_STYLES.DEFAULT },
      record.branch,
      record.code,
      record.name,
      { value: record.total24, style: OUTPUT_STYLES.MONEY },
      record.evolution,
      record.lastSaleMonth,
      record.monthsWithoutSales,
      ...record.values.map((value) => ({ value, style: OUTPUT_STYLES.MONEY })),
    ];
    rows.push(row);
  });
  return rows;
}

function createDormientiSummaryRows(report) {
  const dormantStats = dormientiStats(report.dormienti, report.selectedBranch);
  const lostStats = dormientiStats(report.persi, report.selectedBranch);
  const title = 'Dormienti e Persi — competenza e priorità commerciale';
  const note = 'Criteri di priorità: i Dormienti evidenziati in arancione diventeranno Persi il mese successivo; i Persi evidenziati in rosso usciranno dal radar il mese successivo. Le liste sono ordinate per fatturato degli ultimi 24 mesi, dal maggiore al minore. I Privati sono identificati separatamente.';

  return [
    [{ value: title, style: DORMIENTI_STYLES.TITLE }, '', '', '', '', '', ''],
    [],
    [
      { value: 'Filiale selezionata', style: DORMIENTI_STYLES.SUMMARY_LABEL },
      { value: report.selectedBranch, style: DORMIENTI_STYLES.SUMMARY_WARN },
      '', '',
      { value: 'Mappatura aggiornata al', style: DORMIENTI_STYLES.SUMMARY_LABEL },
      formatIsoDate(report.mappingUpdated),
      '',
    ],
    [],
    ['Categoria', 'Totale rilevati', 'Propria filiale', 'Altra filiale', 'Aziende proprie', 'Privati propri', 'Priorità prossimo mese']
      .map((value) => ({ value, style: OUTPUT_STYLES.HEADER })),
    summaryCountRow('Dormienti', dormantStats),
    summaryCountRow('Persi', lostStats),
    [],
    [],
    ['Categoria', 'Fatturato 24 mesi — propria filiale', 'Aziende', 'Privati', 'Clienti in priorità prossimo mese', '', '']
      .map((value) => ({ value, style: OUTPUT_STYLES.HEADER })),
    summaryRevenueRow('Dormienti', dormantStats),
    summaryRevenueRow('Persi', lostStats),
    [],
    [],
    [{ value: note, style: DORMIENTI_STYLES.NOTE }, '', '', '', '', '', ''],
  ];
}

function dormientiStats(records, selectedBranch) {
  const own = records.filter((record) => record.branch === selectedBranch);
  const other = records.filter((record) => record.branch && record.branch !== selectedBranch);
  const unassigned = records.filter((record) => !record.branch);
  const ownCompanies = own.filter((record) => record.customerType !== 'PRIVATO');
  const ownPrivate = own.filter((record) => record.customerType === 'PRIVATO');
  const ownPriority = own.filter((record) => record.priorityNextMonth);
  const revenue = (items) => items.reduce((acc, record) => acc + parseNumber(record.total24), 0);

  return {
    total: records.length,
    own: own.length,
    other: other.length,
    unassigned: unassigned.length,
    ownCompanies: ownCompanies.length,
    ownPrivate: ownPrivate.length,
    ownPriority: ownPriority.length,
    ownRevenue: revenue(own),
    companyRevenue: revenue(ownCompanies),
    privateRevenue: revenue(ownPrivate),
    priorityRevenue: revenue(ownPriority),
  };
}

function summaryCountRow(label, stats) {
  return [
    label,
    stats.total,
    { value: stats.own, style: DORMIENTI_STYLES.SUMMARY_OWN },
    { value: stats.other + stats.unassigned, style: DORMIENTI_STYLES.SUMMARY_OTHER },
    stats.ownCompanies,
    stats.ownPrivate,
    { value: stats.ownPriority, style: DORMIENTI_STYLES.SUMMARY_WARN },
  ];
}

function summaryRevenueRow(label, stats) {
  return [
    label,
    { value: stats.ownRevenue, style: OUTPUT_STYLES.MONEY },
    { value: stats.companyRevenue, style: OUTPUT_STYLES.MONEY },
    { value: stats.privateRevenue, style: OUTPUT_STYLES.MONEY },
    { value: stats.priorityRevenue, style: OUTPUT_STYLES.MONEY },
    '',
    '',
  ];
}

function dormientiConditionalFormatting(range, kind) {
  const specialDxf = kind === 'persi' ? 2 : 1;
  const specialFormula = escapeXml('$G2<>""');
  const zebraFormula = escapeXml('AND($G2="",MOD(SUBTOTAL(103,OFFSET($D$2,0,0,ROW()-ROW($D$2)+1,1)),2)=0)');
  return `<conditionalFormatting sqref="${escapeXmlAttr(range)}">`
    + `<cfRule type="expression" dxfId="${specialDxf}" priority="1"><formula>${specialFormula}</formula></cfRule>`
    + `<cfRule type="expression" dxfId="0" priority="2"><formula>${zebraFormula}</formula></cfRule>`
    + '</conditionalFormatting>';
}

const baseSetResultButtonsDormienti = window.setResultButtons;
window.setResultButtons = function setResultButtonsWithDormientiBranch(outputs) {
  const branch = selectedDormientiBranch();
  if (outputs && outputs.dormienti && branch) {
    const safeBranch = branch.replace(/[\\/:*?"<>|]+/g, '-');
    outputs.dormienti.filename = `Clienti Dormienti e Persi - ${safeBranch}.xlsx`;
  }
  const result = baseSetResultButtonsDormienti(outputs);
  const button = document.getElementById('downloadDormientiBtn');
  if (button && outputs && outputs.dormienti) button.textContent = `Scarica ${outputs.dormienti.filename}`;
  return result;
};

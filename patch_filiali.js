'use strict';

// Mostra nel report Aging Clienti solo le filiali che contribuiscono
// effettivamente allo scaduto lordo o alle note/crediti nelle fasce.
// Versione 20260713-2.

(() => {
  const baseBuildAgingReport = window.buildAgingReport;
  if (typeof baseBuildAgingReport !== 'function') return;

  window.buildAgingReport = function buildAgingReportWithFilteredBranches(data, options) {
    const report = baseBuildAgingReport(data, options);
    if (!options || !options.includeBillingBranches) return report;

    const branchesByClient = new Map();

    (data.rows || []).forEach((row) => {
      const method = toText(row['Descrizione Met. Pagamento']).trim().toUpperCase();
      const insoluto = toText(row['Insoluto Ricevuto']).trim().toUpperCase();
      const buckets = SCADUTO_COLUMNS.map((col) => parseNumber(row[col]));
      const isRibaSepa = ['RIBA', 'SEPA DIRECT DEBIT CORE'].includes(method);
      const insolutoYes = ['SÌ', 'SI', 'YES', 'Y'].includes(insoluto);

      const contributesGross = parseNumber(row['Totale Scaduto']) > 0
        && (!isRibaSepa || insolutoYes)
        && buckets.some((value) => value > 0);
      const contributesCredit = buckets.some((value) => value < 0);

      if (!contributesGross && !contributesCredit) return;

      const branch = toText(row['Descrizione Filiale di Fatt.']).trim();
      if (!branch) return;

      const key = clientKey(row);
      if (!branchesByClient.has(key)) branchesByClient.set(key, new Set());
      branchesByClient.get(key).add(branch);
    });

    report.clients.forEach((client) => {
      const branches = branchesByClient.get(clientKey(client));
      client['Filiali di Fatturazione'] = branches
        ? Array.from(branches).sort((a, b) => a.localeCompare(b, 'it')).join(', ')
        : '';
    });

    return report;
  };
})();

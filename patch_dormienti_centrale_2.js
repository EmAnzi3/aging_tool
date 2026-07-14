function buildDormientiPersiReport(data) {
  if (!DORMIENTI_MAP_STATE.ready || !DORMIENTI_MAP_STATE.data) {
    throw new Error('La mappatura centralizzata clienti/filiali non è disponibile. Ricaricare la pagina e riprovare.');
  }

  const selectedBranch = selectedDormientiBranch();
  if (!selectedBranch) {
    throw new Error('Seleziona la filiale da analizzare prima di generare Dormienti/Persi.');
  }

  const headers = data.headers.filter(Boolean);
  if (headers.length < 26) {
    throw new Error('Mesi.xlsx: struttura non valida. Servono il cliente, 24 mesi e il totale.');
  }

  const customerHeader = headers[0];
  const monthColumns = headers.slice(1, -1);
  const totalHeader = headers[headers.length - 1];
  const mapping = DORMIENTI_MAP_STATE.data;
  const dormienti = [];
  const persi = [];

  data.rows.forEach((row) => {
    const customerRaw = toText(row[customerHeader]).trim();
    const parsed = parseDormientiCustomer(customerRaw);
    if (!parsed.code) return;

    const values = monthColumns.map((column) => parseNumber(row[column]));
    if (values.length < 24) return;

    const last6 = values.slice(-6);
    const last11 = values.slice(-11);
    const last12 = values.slice(-12);
    const months12To24 = values.slice(-24, -12);
    const isDormiente = last6.every((value) => value === 0) && last12.some((value) => value > 0);
    const isPerso = last12.every((value) => value === 0) && months12To24.some((value) => value > 0);
    if (!isDormiente && !isPerso) return;

    const mapEntry = mapping.clients[parsed.code];
    let branch = '';
    let mappingStatus = 'NON TROVATO';
    let isPrivate = false;

    if (Number.isFinite(Number(mapEntry))) {
      const encoded = Number(mapEntry);
      if (encoded >= 0) {
        const branchIndex = Math.floor(encoded / 2);
        isPrivate = encoded % 2 === 1;
        if (branchIndex < mapping.branches.length) {
          branch = mapping.branches[branchIndex];
          mappingStatus = 'ASSOCIATO';
        }
      } else {
        isPrivate = encoded === -2 || encoded === -4;
        mappingStatus = encoded <= -3 ? 'AMBIGUO' : 'SENZA FILIALE';
      }
    }

    const competence = branch
      ? (branch === selectedBranch ? 'PROPRIA FILIALE' : 'ALTRA FILIALE')
      : 'DA VERIFICARE';
    const total24 = parseNumber(row[totalHeader]) || values.reduce((acc, value) => acc + value, 0);
    const lastSaleIndex = findLastPositiveIndex(values);
    const monthsWithoutSales = lastSaleIndex >= 0 ? values.length - 1 - lastSaleIndex : values.length;
    const lastSaleMonth = lastSaleIndex >= 0 ? formatMonthHeader(monthColumns[lastSaleIndex]) : '';

    const base = {
      competence,
      customerType: isPrivate ? 'PRIVATO' : 'AZIENDA',
      branch,
      code: parsed.code,
      name: parsed.name,
      total24,
      lastSaleMonth,
      monthsWithoutSales,
      values,
      mappingStatus,
      priorityNextMonth: false,
      evolution: '',
    };

    if (isDormiente) {
      const priority = last11.every((value) => value === 0);
      dormienti.push({
        ...base,
        priorityNextMonth: priority,
        evolution: priority ? 'DIVENTA PERSO IL MESE PROSSIMO' : '',
      });
    }

    if (isPerso) {
      const priority = months12To24.length >= 12
        && months12To24[0] > 0
        && months12To24.slice(1).every((value) => value === 0);
      persi.push({
        ...base,
        priorityNextMonth: priority,
        evolution: priority ? 'ESCE DAL RADAR IL MESE PROSSIMO' : '',
      });
    }
  });

  const sortByRevenue = (a, b) => {
    const difference = parseNumber(b.total24) - parseNumber(a.total24);
    if (Math.abs(difference) > 0.000001) return difference;
    return toText(a.name).localeCompare(toText(b.name), 'it');
  };
  dormienti.sort(sortByRevenue);
  persi.sort(sortByRevenue);

  return {
    headers,
    originalRows: data.rows,
    monthColumns,
    selectedBranch,
    mappingUpdated: mapping.updated || '',
    dormienti,
    persi,
  };
}

function parseDormientiCustomer(value) {
  const text = toText(value).trim();
  const separator = text.indexOf('-');
  if (separator < 0) return { code: normalizeCustomerCode(text), name: text };
  return {
    code: normalizeCustomerCode(text.slice(0, separator)),
    name: text.slice(separator + 1).trim(),
  };
}

function normalizeCustomerCode(value) {
  return toText(value).trim().replace(/\.0$/, '');
}

function findLastPositiveIndex(values) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (parseNumber(values[index]) > 0) return index;
  }
  return -1;
}

function formatMonthHeader(value) {
  const digits = toText(value).replace(/\D/g, '');
  if (digits.length === 6) return `${digits.slice(4, 6)}/${digits.slice(0, 4)}`;
  return toText(value);
}

function formatIsoDate(value) {
  const match = toText(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : toText(value);
}

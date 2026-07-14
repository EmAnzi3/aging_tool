'use strict';

// Dormienti/Persi con mappatura Salesforce centralizzata.
// Versione 20260714-1.

const DORMIENTI_STYLES = {
  TITLE: 23,
  PRIVATE: 24,
  SUMMARY_LABEL: 25,
  SUMMARY_OWN: 26,
  SUMMARY_OTHER: 27,
  SUMMARY_WARN: 28,
  NOTE: 29,
};

const DORMIENTI_MAP_STATE = {
  ready: false,
  data: null,
  error: null,
};

const DORMIENTI_MAP_URL = 'data/clienti_filiali.json?v=20260714-1';
const DORMIENTI_BRANCH_STORAGE_KEY = 'agingTool.dormientiBranch';

initializeDormientiCentralMapping();

async function initializeDormientiCentralMapping() {
  const select = document.getElementById('filialeDormienti');
  const status = document.getElementById('mappingStatus');
  if (!select || !status) return;

  select.disabled = true;
  status.textContent = 'Caricamento della mappatura centralizzata...';
  status.className = 'mapping-status';

  try {
    const response = await fetch(DORMIENTI_MAP_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const mapping = await response.json();
    validateDormientiMappingIndex(mapping);
    const chunkTexts = await Promise.all(mapping.files.map(async (filename, index) => {
      const chunkResponse = await fetch(`data/${encodeURIComponent(filename)}?v=${encodeURIComponent(mapping.updated || 'current')}`, { cache: 'no-store' });
      if (!chunkResponse.ok) throw new Error(`Mappatura ${index}: HTTP ${chunkResponse.status}`);
      return chunkResponse.text();
    }));
    mapping.data = chunkTexts.join('').trim();
    mapping.clients = await decodeDormientiClients(mapping);
    validateDormientiMapping(mapping);

    DORMIENTI_MAP_STATE.ready = true;
    DORMIENTI_MAP_STATE.data = mapping;
    DORMIENTI_MAP_STATE.error = null;

    select.innerHTML = '<option value="">Seleziona la filiale</option>';
    mapping.branches.forEach((branch) => {
      const option = document.createElement('option');
      option.value = branch;
      option.textContent = branch;
      select.appendChild(option);
    });

    const previous = localStorage.getItem(DORMIENTI_BRANCH_STORAGE_KEY) || '';
    if (mapping.branches.includes(previous)) select.value = previous;
    select.disabled = false;
    select.addEventListener('change', () => {
      if (select.value) localStorage.setItem(DORMIENTI_BRANCH_STORAGE_KEY, select.value);
      else localStorage.removeItem(DORMIENTI_BRANCH_STORAGE_KEY);
    });

    status.textContent = `Mappatura centralizzata aggiornata al ${formatIsoDate(mapping.updated)}.`;
    status.className = 'mapping-status ok';
  } catch (error) {
    DORMIENTI_MAP_STATE.ready = false;
    DORMIENTI_MAP_STATE.data = null;
    DORMIENTI_MAP_STATE.error = error;
    select.innerHTML = '<option value="">Mappatura non disponibile</option>';
    status.textContent = 'Impossibile caricare la mappatura centralizzata. I report Aging restano utilizzabili; Dormienti/Persi non può essere generato.';
    status.className = 'mapping-status error';
    console.error('Errore mappatura Dormienti/Persi:', error);
  }
}

function validateDormientiMappingIndex(mapping) {
  if (!mapping
      || !Array.isArray(mapping.branches)
      || mapping.encoding !== 'gzip-varint-v1'
      || mapping.transport !== 'hex'
      || !Array.isArray(mapping.files)
      || mapping.files.length < 1) {
    throw new Error('Indice della mappatura non valido.');
  }
}

async function decodeDormientiClients(mapping) {
  if (typeof DecompressionStream !== 'function') {
    throw new Error('Il browser non supporta la decompressione richiesta. Aggiornare Chrome o Edge.');
  }

  const hex = mapping.data.replace(/\s+/g, '');
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
    throw new Error('Mappatura compressa non valida.');
  }
  const binary = new Uint8Array(hex.length / 2);
  for (let index = 0; index < binary.length; index += 1) {
    binary[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  const decompressedStream = new Blob([binary]).stream().pipeThrough(new DecompressionStream('gzip'));
  const bytes = new Uint8Array(await new Response(decompressedStream).arrayBuffer());
  const clients = {};
  let offset = 0;
  let currentCode = 0;

  while (offset < bytes.length) {
    let delta = 0;
    let shift = 0;
    let byte = 0;
    do {
      if (offset >= bytes.length) throw new Error('Mappatura compressa incompleta.');
      byte = bytes[offset];
      offset += 1;
      delta |= (byte & 0x7f) << shift;
      shift += 7;
    } while (byte & 0x80);

    if (offset >= bytes.length) throw new Error('Mappatura compressa incompleta.');
    currentCode += delta;
    clients[String(currentCode)] = bytes[offset] - 4;
    offset += 1;
  }

  Object.assign(clients, mapping.extra || {});
  if (Number(mapping.count) && Object.keys(clients).length !== Number(mapping.count)) {
    throw new Error('Numero di clienti nella mappatura non coerente.');
  }
  return clients;
}

function validateDormientiMapping(mapping) {
  if (!mapping.clients || typeof mapping.clients !== 'object') {
    throw new Error('Struttura della mappatura non valida.');
  }
}

function selectedDormientiBranch() {
  const select = document.getElementById('filialeDormienti');
  return select ? toText(select.value).trim() : '';
}

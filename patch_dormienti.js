// Patch output Clienti Dormienti e Persi - v20260529-6
(() => {
  STYLES.PERSI_RED = 8;

  buildDormientiPersiReport = function buildDormientiPersiReport(data) {
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

      const isDormiente = last6.every((v) => v === 0) && last12.some((v) => v > 0);
      const isPerso = last12.every((v) => v === 0) && months12To24.some((v) => v > 0);

      if (isDormiente) {
        dormienti.push(row);
        dormientiOrangeFlags.push(last11.every((v) => v === 0));
      }

      if (isPerso) {
        persi.push(row);
        const exitsNextMonth = months12To24.length >= 12
          && months12To24[0] > 0
          && months12To24.slice(1).every((v) => v === 0);
        persiRedFlags.push(exitsNextMonth);
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
  };

  createDormientiWorkbook = async function createDormientiWorkbook(report) {
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

    const persiStyledRows = applyStyles(persiRows, { headerRow: 1 });
    (report.persiRedFlags || []).forEach((flag, index) => {
      if (!flag) return;
      const rowIndex = index + 1;
      persiStyledRows[rowIndex] = persiStyledRows[rowIndex].map((cell) => ({ ...asCell(cell), style: STYLES.PERSI_RED }));
    });

    const widths = report.headers.map((h, i) => i === 0 ? Math.min(Math.max(maxTextLength([h, ...report.originalRows.map((r) => r[h])]) + 2, 12), 48) : 14);

    const sheets = [
      { name: 'Dormienti', rows: dormStyledRows, widths, freezeTopRow: true },
      { name: 'Persi', rows: persiStyledRows, widths, freezeTopRow: true },
      { name: 'Dati_originali', rows: applyStyles(originalRows, { headerRow: 1 }), widths, freezeTopRow: true },
    ];

    return createXlsx(sheets);
  };

  stylesXml = function stylesXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="3">
    <numFmt numFmtId="164" formatCode="#,##0.00"/>
    <numFmt numFmtId="165" formatCode="0.00%"/>
    <numFmt numFmtId="166" formatCode="0.0"/>
  </numFmts>
  <fonts count="3">
    <font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF4B084"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFA500"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFC00000"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellStyleXfs>
  <cellXfs count="9">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="164" fontId="1" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>
    <xf numFmtId="165" fontId="1" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1"/>
    <xf numFmtId="0" fontId="2" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`;
  };
})();

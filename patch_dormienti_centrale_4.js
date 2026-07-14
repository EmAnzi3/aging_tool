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
    const selections = freezeRows > 0 && freezeColumns > 0
      ? `<selection pane="topRight" activeCell="${columnNumberToName(freezeColumns + 1)}1" sqref="${columnNumberToName(freezeColumns + 1)}1"/>`
        + `<selection pane="bottomLeft" activeCell="A${freezeRows + 1}" sqref="A${freezeRows + 1}"/>`
        + `<selection pane="bottomRight" activeCell="${topLeftCell}" sqref="${topLeftCell}"/>`
      : '';
    viewsXml = `<sheetViews><sheetView workbookViewId="0"><pane${xSplit}${ySplit} topLeftCell="${topLeftCell}" activePane="${activePane}" state="frozen"/>${selections}</sheetView></sheetViews>`;
  }

  const mergesXml = sheet.merges && sheet.merges.length
    ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map((ref) => `<mergeCell ref="${escapeXmlAttr(ref)}"/>`).join('')}</mergeCells>`
    : '';
  const autoFilterXml = sheet.autoFilter
    ? `<autoFilter ref="${escapeXmlAttr(sheet.autoFilter)}"/>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="${dimension}"/>
  ${viewsXml}
  ${colsXml}
  <sheetData>${rowsXml}</sheetData>
  ${autoFilterXml}
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
  <fonts count="5">
    <font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="16"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
    <font><i/><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>
  </fonts>
  <fills count="14">
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
    <fill><patternFill patternType="solid"><fgColor rgb="FFEAF2F8"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE7E6E6"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF2F2F2"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFD9D9D9"/></left><right style="thin"><color rgb="FFD9D9D9"/></right><top style="thin"><color rgb="FFD9D9D9"/></top><bottom style="thin"><color rgb="FFD9D9D9"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="30">
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
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="6" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="1" fillId="6" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="1" fillId="7" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="0" fillId="11" borderId="0" xfId="0" applyFill="1"/>
    <xf numFmtId="0" fontId="1" fillId="12" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="4" fillId="6" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment wrapText="1" vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
  <dxfs count="3">
    <dxf><fill><patternFill patternType="solid"><fgColor rgb="FFEAF2F8"/><bgColor indexed="64"/></patternFill></fill></dxf>
    <dxf><fill><patternFill patternType="solid"><fgColor rgb="FFF4B084"/><bgColor indexed="64"/></patternFill></fill></dxf>
    <dxf><font><b/><color rgb="FFFFFFFF"/></font><fill><patternFill patternType="solid"><fgColor rgb="FFC00000"/><bgColor indexed="64"/></patternFill></fill></dxf>
  </dxfs>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`;
}

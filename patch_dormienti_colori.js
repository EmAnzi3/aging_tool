'use strict';

// Correzione compatibilità Excel desktop per i colori delle righe
// Dormienti/Persi. Versione 20260714-2.

const baseStylesXmlDormientiColors = stylesXml;
stylesXml = function stylesXmlWithSafeDormientiColors() {
  const xml = baseStylesXmlDormientiColors();
  const safeDxfs = `<dxfs count="3">
    <dxf><font><color rgb="FF000000"/></font><fill><patternFill patternType="solid"><bgColor rgb="FFEAF2F8"/></patternFill></fill></dxf>
    <dxf><font><color rgb="FF000000"/></font><fill><patternFill patternType="solid"><bgColor rgb="FFF4B084"/></patternFill></fill></dxf>
    <dxf><font><b/><color rgb="FFFFFFFF"/></font><fill><patternFill patternType="solid"><bgColor rgb="FFC00000"/></patternFill></fill></dxf>
  </dxfs>`;

  return xml.replace(/<dxfs count="3">[\s\S]*?<\/dxfs>/, safeDxfs);
};

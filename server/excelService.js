const ExcelJS = require('exceljs');

/**
 * Generate Excel workbook matching the church template
 * @param {Array} personas - List of personas to export
 * @param {string} format - 'original' or 'full'
 * @returns {Promise<ExcelJS.Workbook>}
 */
async function generateExcel(personas, format = 'full') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Control NVSR - Iglesia Nueva Vida';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Control de Asistencia', {
    views: [{ showGridLines: true }]
  });

  const isOriginal = format === 'original';

  // Define columns structure based on format
  // Notice Column A is left blank or as index/margin matching original snippet structure
  if (isOriginal) {
    // Original template columns: [Empty, Nombres, Telefono, Cumpleaños, Nuevo, Consolidado]
    worksheet.columns = [
      { key: 'colA', width: 4 },
      { key: 'nombre', width: 32 },
      { key: 'telefono', width: 18 },
      { key: 'cumpleanos', width: 18 },
      { key: 'nuevo', width: 14 },
      { key: 'consolidado', width: 16 }
    ];

    // Row 1: Church Title
    const row1 = worksheet.getRow(1);
    row1.height = 36;
    worksheet.mergeCells('B1:F1');
    const cellTitle = worksheet.getCell('B1');
    cellTitle.value = 'Iglesia Nueva Vida de Soto del Real';
    cellTitle.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    cellTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' } // Deep Royal Blue
    };
    cellTitle.alignment = { vertical: 'middle', horizontal: 'center' };

    // Row 2: Dirección
    const row2 = worksheet.getRow(2);
    row2.height = 20;
    const c2Label = worksheet.getCell('C2');
    c2Label.value = 'Dirección:';
    c2Label.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F2937' } };
    c2Label.alignment = { vertical: 'middle', horizontal: 'right' };
    
    worksheet.mergeCells('D2:F2');
    const c2Val = worksheet.getCell('D2');
    c2Val.value = 'Calle del Prado, 15, 28791 Soto del Real, Madrid.';
    c2Val.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF374151' } };
    c2Val.alignment = { vertical: 'middle', horizontal: 'left' };

    // Row 3: Horario de cultos
    const row3 = worksheet.getRow(3);
    row3.height = 20;
    const c3Label = worksheet.getCell('C3');
    c3Label.value = 'Horario de cultos:';
    c3Label.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F2937' } };
    c3Label.alignment = { vertical: 'middle', horizontal: 'right' };

    worksheet.mergeCells('D3:F3');
    const c3Val = worksheet.getCell('D3');
    c3Val.value = 'Domingos a las 18:00 h.';
    c3Val.font = { name: 'Calibri', size: 10, color: { argb: 'FF374151' } };
    c3Val.alignment = { vertical: 'middle', horizontal: 'left' };

    // Row 4: Pastores principales
    const row4 = worksheet.getRow(4);
    row4.height = 20;
    const c4Label = worksheet.getCell('C4');
    c4Label.value = 'Pastores principales:';
    c4Label.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F2937' } };
    c4Label.alignment = { vertical: 'middle', horizontal: 'right' };

    worksheet.mergeCells('D4:F4');
    const c4Val = worksheet.getCell('D4');
    c4Val.value = 'Jorge Gámez Zúñiga y Carmen Vera Mendoza.';
    c4Val.font = { name: 'Calibri', size: 10, color: { argb: 'FF374151' } };
    c4Val.alignment = { vertical: 'middle', horizontal: 'left' };

    // Row 5: Table Headers
    const row5 = worksheet.getRow(5);
    row5.height = 26;
    const headers = [
      { col: 'B', val: 'Nombres' },
      { col: 'C', val: 'Telefono' },
      { col: 'D', val: 'Cumpleaños' },
      { col: 'E', val: 'Nuevo' },
      { col: 'F', val: 'Consolidado' }
    ];

    headers.forEach(h => {
      const cell = worksheet.getCell(`${h.col}5`);
      cell.value = h.val;
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' } // Primary Blue
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        left: { style: 'thin', color: { argb: 'FF93C5FD' } },
        right: { style: 'thin', color: { argb: 'FF93C5FD' } }
      };
    });

    // Populate Data starting at row 6
    let rowIndex = 6;
    personas.forEach((p, idx) => {
      const row = worksheet.getRow(rowIndex);
      row.height = 22;

      const cellB = worksheet.getCell(`B${rowIndex}`);
      cellB.value = p.nombre || '';
      cellB.alignment = { vertical: 'middle', horizontal: 'left' };

      const cellC = worksheet.getCell(`C${rowIndex}`);
      cellC.value = p.telefono || '';
      cellC.alignment = { vertical: 'middle', horizontal: 'center' };
      cellC.numFmt = '@'; // Treat as text to preserve leading zeros

      const cellD = worksheet.getCell(`D${rowIndex}`);
      cellD.value = p.cumpleanos || '';
      cellD.alignment = { vertical: 'middle', horizontal: 'center' };

      const cellE = worksheet.getCell(`E${rowIndex}`);
      cellE.value = p.tipo === 'nuevo' ? 'X' : '';
      cellE.alignment = { vertical: 'middle', horizontal: 'center' };
      if (p.tipo === 'nuevo') {
        cellE.font = { bold: true, color: { argb: 'FF15803D' } };
        cellE.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDCFCE7' } // Light green
        };
      }

      const cellF = worksheet.getCell(`F${rowIndex}`);
      cellF.value = p.tipo === 'consolidado' ? 'X' : '';
      cellF.alignment = { vertical: 'middle', horizontal: 'center' };
      if (p.tipo === 'consolidado') {
        cellF.font = { bold: true, color: { argb: 'FF1D4ED8' } };
        cellF.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDBEAFE' } // Light blue
        };
      }

      const borderStyle = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      ['B', 'C', 'D', 'E', 'F'].forEach(c => {
        const cell = worksheet.getCell(`${c}${rowIndex}`);
        cell.border = borderStyle;
        if (idx % 2 === 1 && !cell.fill) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }
          };
        }
      });

      rowIndex++;
    });

  } else {
    // Full template columns: [Empty, Fecha/Hora, Nombres, Telefono, Dirección, Cumpleaños, Nuevo, Consolidado, Notas]
    worksheet.columns = [
      { key: 'colA', width: 3 },
      { key: 'fecha', width: 19 },
      { key: 'nombre', width: 30 },
      { key: 'telefono', width: 17 },
      { key: 'direccion', width: 32 },
      { key: 'cumpleanos', width: 16 },
      { key: 'nuevo', width: 12 },
      { key: 'consolidado', width: 14 },
      { key: 'notas', width: 34 }
    ];

    // Row 1: Church Title
    const row1 = worksheet.getRow(1);
    row1.height = 38;
    worksheet.mergeCells('B1:I1');
    const cellTitle = worksheet.getCell('B1');
    cellTitle.value = 'Iglesia Nueva Vida de Soto del Real';
    cellTitle.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    cellTitle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }
    };
    cellTitle.alignment = { vertical: 'middle', horizontal: 'center' };

    // Row 2: Dirección
    const row2 = worksheet.getRow(2);
    row2.height = 20;
    const c2Label = worksheet.getCell('C2');
    c2Label.value = 'Dirección:';
    c2Label.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F2937' } };
    c2Label.alignment = { vertical: 'middle', horizontal: 'right' };

    worksheet.mergeCells('D2:G2');
    const c2Val = worksheet.getCell('D2');
    c2Val.value = 'Calle del Prado, 15, 28791 Soto del Real, Madrid.';
    c2Val.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF374151' } };
    c2Val.alignment = { vertical: 'middle', horizontal: 'left' };

    // Row 3: Horario de cultos
    const row3 = worksheet.getRow(3);
    row3.height = 20;
    const c3Label = worksheet.getCell('C3');
    c3Label.value = 'Horario de cultos:';
    c3Label.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F2937' } };
    c3Label.alignment = { vertical: 'middle', horizontal: 'right' };

    worksheet.mergeCells('D3:G3');
    const c3Val = worksheet.getCell('D3');
    c3Val.value = 'Domingos a las 18:00 h.';
    c3Val.font = { name: 'Calibri', size: 10, color: { argb: 'FF374151' } };
    c3Val.alignment = { vertical: 'middle', horizontal: 'left' };

    // Row 4: Pastores principales
    const row4 = worksheet.getRow(4);
    row4.height = 20;
    const c4Label = worksheet.getCell('C4');
    c4Label.value = 'Pastores principales:';
    c4Label.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F2937' } };
    c4Label.alignment = { vertical: 'middle', horizontal: 'right' };

    worksheet.mergeCells('D4:G4');
    const c4Val = worksheet.getCell('D4');
    c4Val.value = 'Jorge Gámez Zúñiga y Carmen Vera Mendoza.';
    c4Val.font = { name: 'Calibri', size: 10, color: { argb: 'FF374151' } };
    c4Val.alignment = { vertical: 'middle', horizontal: 'left' };

    // Row 5: Table Headers
    const row5 = worksheet.getRow(5);
    row5.height = 28;
    const headers = [
      { col: 'B', val: 'Fecha y Hora' },
      { col: 'C', val: 'Nombres' },
      { col: 'D', val: 'Teléfono' },
      { col: 'E', val: 'Dirección' },
      { col: 'F', val: 'Cumpleaños' },
      { col: 'G', val: 'Nuevo' },
      { col: 'H', val: 'Consolidado' },
      { col: 'I', val: 'Observaciones' }
    ];

    headers.forEach(h => {
      const cell = worksheet.getCell(`${h.col}5`);
      cell.value = h.val;
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E40AF' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        left: { style: 'thin', color: { argb: 'FF93C5FD' } },
        right: { style: 'thin', color: { argb: 'FF93C5FD' } }
      };
    });

    // Populate Data starting at row 6
    let rowIndex = 6;
    personas.forEach((p, idx) => {
      const row = worksheet.getRow(rowIndex);
      row.height = 24;

      const cellB = worksheet.getCell(`B${rowIndex}`);
      cellB.value = p.fecha_hora_registro ? p.fecha_hora_registro.replace('T', ' ') : '';
      cellB.alignment = { vertical: 'middle', horizontal: 'center' };

      const cellC = worksheet.getCell(`C${rowIndex}`);
      cellC.value = p.nombre || '';
      cellC.alignment = { vertical: 'middle', horizontal: 'left' };

      const cellD = worksheet.getCell(`D${rowIndex}`);
      cellD.value = p.telefono || '';
      cellD.alignment = { vertical: 'middle', horizontal: 'center' };
      cellD.numFmt = '@';

      const cellE = worksheet.getCell(`E${rowIndex}`);
      cellE.value = p.direccion || '';
      cellE.alignment = { vertical: 'middle', horizontal: 'left' };

      const cellF = worksheet.getCell(`F${rowIndex}`);
      cellF.value = p.cumpleanos || '';
      cellF.alignment = { vertical: 'middle', horizontal: 'center' };

      const cellG = worksheet.getCell(`G${rowIndex}`);
      cellG.value = p.tipo === 'nuevo' ? 'X' : '';
      cellG.alignment = { vertical: 'middle', horizontal: 'center' };
      if (p.tipo === 'nuevo') {
        cellG.font = { bold: true, color: { argb: 'FF15803D' } };
        cellG.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDCFCE7' }
        };
      }

      const cellH = worksheet.getCell(`H${rowIndex}`);
      cellH.value = p.tipo === 'consolidado' ? 'X' : '';
      cellH.alignment = { vertical: 'middle', horizontal: 'center' };
      if (p.tipo === 'consolidado') {
        cellH.font = { bold: true, color: { argb: 'FF1D4ED8' } };
        cellH.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDBEAFE' }
        };
      }

      const cellI = worksheet.getCell(`I${rowIndex}`);
      cellI.value = p.notas || '';
      cellI.alignment = { vertical: 'middle', horizontal: 'left' };

      const borderStyle = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(c => {
        const cell = worksheet.getCell(`${c}${rowIndex}`);
        cell.border = borderStyle;
        if (idx % 2 === 1 && !cell.fill) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }
          };
        }
      });

      rowIndex++;
    });
  }

  return workbook;
}

/**
 * Import records from an uploaded Excel file
 * Handles both the original church format and standard formats
 */
async function parseUploadedExcel(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('El archivo no contiene ninguna hoja válida');
  }

  const records = [];
  let headerRowIndex = 5; // Default according to template

  // Try to find the header row by looking for 'Nombres' or 'Nombre'
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      const val = String(cell.value || '').toLowerCase().trim();
      if (val === 'nombres' || val === 'nombre') {
        headerRowIndex = rowNumber;
      }
    });
  });

  const headerRow = worksheet.getRow(headerRowIndex);
  const colMap = {};

  headerRow.eachCell((cell, colNumber) => {
    const val = String(cell.value || '').toLowerCase().trim();
    if (val.includes('nombre')) colMap.nombre = colNumber;
    else if (val.includes('tel')) colMap.telefono = colNumber;
    else if (val.includes('direc')) colMap.direccion = colNumber;
    else if (val.includes('cumple')) colMap.cumpleanos = colNumber;
    else if (val.includes('nuevo')) colMap.nuevo = colNumber;
    else if (val.includes('consolida')) colMap.consolidado = colNumber;
    else if (val.includes('fecha')) colMap.fecha = colNumber;
    else if (val.includes('nota') || val.includes('obser')) colMap.notas = colNumber;
  });

  // If map didn't catch standard columns, fall back to template defaults
  if (!colMap.nombre) colMap.nombre = 2; // B
  if (!colMap.telefono) colMap.telefono = 3; // C
  if (!colMap.cumpleanos) colMap.cumpleanos = 4; // D
  if (!colMap.nuevo) colMap.nuevo = 5; // E
  if (!colMap.consolidado) colMap.consolidado = 6; // F

  const now = new Date();
  const formatISO = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowIndex) return; // Skip headers

    const getVal = (col) => {
      if (!col) return '';
      const cell = row.getCell(col);
      if (!cell || cell.value === null || cell.value === undefined) return '';
      if (typeof cell.value === 'object' && cell.value.text) return cell.value.text.trim();
      return String(cell.value).trim();
    };

    const nombre = getVal(colMap.nombre);
    if (!nombre || nombre.toLowerCase() === 'nombres') return; // Skip blank or repeated headers

    const telefono = getVal(colMap.telefono);
    const direccion = getVal(colMap.direccion);
    const cumpleanos = getVal(colMap.cumpleanos);
    const nuevoVal = getVal(colMap.nuevo).toUpperCase();
    const consVal = getVal(colMap.consolidado).toUpperCase();
    const fechaVal = getVal(colMap.fecha);
    const notas = getVal(colMap.notas);

    let tipo = 'nuevo';
    if (consVal === 'X' || consVal === 'SI' || consVal === 'SÍ' || consVal === '1' || consVal === 'TRUE') {
      tipo = 'consolidado';
    } else if (nuevoVal === 'X' || nuevoVal === 'SI' || nuevoVal === 'SÍ' || nuevoVal === '1' || nuevoVal === 'TRUE') {
      tipo = 'nuevo';
    }

    records.push({
      nombre,
      telefono: telefono || null,
      direccion: direccion || null,
      cumpleanos: cumpleanos || null,
      tipo,
      fecha_hora_registro: fechaVal || formatISO(now),
      notas: notas || null
    });
  });

  return records;
}

module.exports = {
  generateExcel,
  parseUploadedExcel
};


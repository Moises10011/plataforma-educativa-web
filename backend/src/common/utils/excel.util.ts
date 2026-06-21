import * as ExcelJS from 'exceljs';

export interface ColumnaExcel {
  header: string;
  key: string;
  width?: number;
}

export async function generarExcel(
  nombreHoja: string,
  columnas: ColumnaExcel[],
  filas: Record<string, unknown>[],
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  const hoja = workbook.addWorksheet(nombreHoja);

  hoja.columns = columnas.map((columna) => ({
    header: columna.header,
    key: columna.key,
    width: columna.width ?? 20,
  }));

  hoja.getRow(1).font = { bold: true };

  filas.forEach((fila) => {
    hoja.addRow(fila);
  });

  return workbook.xlsx.writeBuffer();
}

function celdaATexto(valor: ExcelJS.CellValue): string {
  if (valor === null || valor === undefined) {
    return '';
  }
  if (valor instanceof Date) {
    return valor.toISOString();
  }
  if (typeof valor === 'object') {
    if (
      'text' in valor &&
      typeof (valor as { text: unknown }).text === 'string'
    ) {
      return (valor as { text: string }).text;
    }
    if ('result' in valor) {
      return String((valor as { result: unknown }).result);
    }
    return '';
  }
  return String(valor);
}

export async function leerExcel(
  buffer: Buffer,
): Promise<Record<string, string>[]> {
  const workbook = new ExcelJS.Workbook();
  const datosBinarios = new Uint8Array(buffer).buffer;
  await workbook.xlsx.load(datosBinarios);

  const hoja = workbook.worksheets[0];
  const filas: Record<string, string>[] = [];

  const encabezados: string[] = [];
  hoja.getRow(1).eachCell((cell, colNumber) => {
    encabezados[colNumber] = celdaATexto(cell.value);
  });

  hoja.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const fila: Record<string, string> = {};
    row.eachCell((cell, colNumber) => {
      const clave = encabezados[colNumber];
      if (clave) fila[clave] = celdaATexto(cell.value);
    });

    filas.push(fila);
  });

  return filas;
}

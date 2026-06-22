import "server-only";

import ExcelJS from "exceljs";

import {
  getCsvHeaders,
  type CsvImportKind,
} from "@/lib/admin/csv-questions";

const TYPE_COLUMN = "C";
const TEMPLATE_DATA_ROWS = 100;

function applyTypeDropdown(
  worksheet: ExcelJS.Worksheet,
  validationSheetName: string,
  typeCount: number,
) {
  for (let row = 2; row <= TEMPLATE_DATA_ROWS + 1; row += 1) {
    worksheet.getCell(`${TYPE_COLUMN}${row}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`'${validationSheetName}'!$A$1:$A$${typeCount}`],
      showErrorMessage: true,
      errorTitle: "Invalid type",
      error:
        typeCount === 3
          ? 'Choose "multiple-choice", "free-response", or "fill-in-the-blank".'
          : 'Choose "multiple-choice" or "free-response".',
    };
  }
}

export async function buildQuestionTemplateXlsx(
  kind: CsvImportKind,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const validationSheet = workbook.addWorksheet("_types");
  validationSheet.state = "veryHidden";
  validationSheet.getCell("A1").value = "multiple-choice";
  validationSheet.getCell("A2").value = "free-response";

  const typeCount = kind === "alcumus" ? 2 : 3;
  if (typeCount === 3) {
    validationSheet.getCell("A3").value = "fill-in-the-blank";
  }

  const worksheet = workbook.addWorksheet("Questions");
  const headers = getCsvHeaders(kind);
  worksheet.addRow([...headers]);

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle" };

  headers.forEach((header, index) => {
    const column = worksheet.getColumn(index + 1);
    column.width = Math.max(header.length + 2, 14);
  });

  applyTypeDropdown(worksheet, validationSheet.name, typeCount);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function questionTemplateFilename(kind: CsvImportKind): string {
  if (kind === "alcumus") return "ysg-alcumus-template.xlsx";
  if (kind === "end-of-chapter") return "ysg-end-of-chapter-template.xlsx";
  return "ysg-chapter-questions-template.xlsx";
}

import "server-only";

import ExcelJS from "exceljs";

import {
  REVIEW_QUESTION_CSV_HEADERS,
} from "@/lib/admin/csv-review-questions";
import {
  getCsvHeaders,
  type CsvImportKind,
} from "@/lib/admin/csv-questions";
import { FLASHCARD_CSV_HEADERS } from "@/lib/admin/csv-flashcards";

export type TemplateKind = CsvImportKind | "flashcards" | "review";

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
  kind: TemplateKind,
): Promise<Buffer> {
  if (kind === "flashcards") {
    return buildFlashcardTemplateXlsx();
  }
  if (kind === "review") {
    return buildReviewTemplateXlsx();
  }

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

export function questionTemplateFilename(kind: TemplateKind): string {
  if (kind === "flashcards") return "ysg-flashcards-template.xlsx";
  if (kind === "review") return "ysg-review-questions-template.xlsx";
  if (kind === "alcumus") return "ysg-alcumus-template.xlsx";
  if (kind === "end-of-chapter") return "ysg-end-of-chapter-template.xlsx";
  return "ysg-chapter-questions-template.xlsx";
}

export async function buildReviewTemplateXlsx(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const validationSheet = workbook.addWorksheet("_types");
  validationSheet.state = "veryHidden";
  validationSheet.getCell("A1").value = "multiple-choice";
  validationSheet.getCell("A2").value = "free-response";
  validationSheet.getCell("A3").value = "fill-in-the-blank";

  const worksheet = workbook.addWorksheet("Review questions");
  const headers = REVIEW_QUESTION_CSV_HEADERS;
  worksheet.addRow([...headers]);

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle" };

  headers.forEach((header, index) => {
    const column = worksheet.getColumn(index + 1);
    column.width = Math.max(header.length + 2, 14);
  });

  applyTypeDropdown(worksheet, validationSheet.name, 3);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function buildFlashcardTemplateXlsx(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Flashcards");
  worksheet.addRow([...FLASHCARD_CSV_HEADERS]);

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle" };

  FLASHCARD_CSV_HEADERS.forEach((header, index) => {
    const column = worksheet.getColumn(index + 1);
    column.width = Math.max(header.length + 2, 14);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeRecord } from "@/lib/serialize";

export const runtime = "nodejs"; 

function toCsv(records) {
  const headers = ["id", "resolvedName", "startDate", "endDate", "createdAt", "updatedAt"];
  const rows = records.map((r) => headers.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(","));
  return [headers.join(","), ...rows].join("\n");
}

function toXml(records) {
  const escape = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const items = records
    .map((r) => {
      const fields = Object.entries(r)
        .filter(([k]) => k !== "weatherData")
        .map(([k, v]) => `    <${k}>${escape(v)}</${k}>`)
        .join("\n");
      return `  <record>\n${fields}\n  </record>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<weatherRecords>\n${items}\n</weatherRecords>`;
}

function toMarkdown(records) {
  const header = "| ID | Location | Start | End | Created |\n|----|----------|-------|-----|---------|";
  const rows = records.map(
    (r) => `| ${r.id} | ${r.resolvedName} | ${r.startDate} | ${r.endDate} | ${r.createdAt} |`
  );
  return `# Weather Records\n\n${header}\n${rows.join("\n")}\n`;
}

async function toPdfBuffer(records) {
  const PDFDocument = (await import("pdfkit")).default;
  const doc = new PDFDocument({ margin: 40 });
  const chunks = [];

  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise((resolve) => doc.on("end", resolve));

  doc.fontSize(18).text("Weather Records Export", { align: "left" });
  doc.moveDown();
  doc.fontSize(10);

  records.forEach((r, i) => {
    doc.text(`${i + 1}. ${r.resolvedName}`, { continued: false });
    doc.text(`   Range: ${r.startDate} to ${r.endDate}    Saved: ${new Date(r.createdAt).toLocaleDateString()}`);
    doc.moveDown(0.5);
  });

  doc.end();
  await done;
  return Buffer.concat(chunks);
}

export async function GET(_request, { params }) {
  const fmt = params.format.toLowerCase();
  const records = (await prisma.weatherRecord.findMany({ orderBy: { createdAt: "desc" } })).map(serializeRecord);

  switch (fmt) {
    case "json":
      return new NextResponse(JSON.stringify(records, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": "attachment; filename=weather_records.json",
        },
      });

    case "csv":
      return new NextResponse(toCsv(records), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=weather_records.csv",
        },
      });

    case "xml":
      return new NextResponse(toXml(records), {
        headers: {
          "Content-Type": "application/xml",
          "Content-Disposition": "attachment; filename=weather_records.xml",
        },
      });

    case "markdown":
      return new NextResponse(toMarkdown(records), {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": "attachment; filename=weather_records.md",
        },
      });

    case "pdf": {
      const buffer = await toPdfBuffer(records);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=weather_records.pdf",
        },
      });
    }

    default:
      return NextResponse.json(
        { error: `Unsupported export format "${fmt}". Use json, csv, xml, markdown, or pdf.` },
        { status: 400 }
      );
  }
}

import { promises as fsPromises } from "fs";
import path from "path";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("path");

  console.log(`Download requested for path: ${filePath}`);

  if (!filePath || filePath === "null") {
    return Response.json(
      { error: "No valid file path provided" },
      { status: 400 }
    );
  }

  // Extract filename from path (e.g., /Uploads/minutes-123.pdf -> minutes-123.pdf)
  const filename = path.basename(filePath);
  const absolutePath = path.join(process.cwd(), "tmp", "Uploads", filename);

  console.log(`Resolved file path: ${absolutePath}`);

  try {
    await fsPromises.access(absolutePath);
    const fileBuffer = await fsPromises.readFile(absolutePath);
    const fileExtension = path.extname(filename).toLowerCase();

    // Set the appropriate Content-Type based on file extension
    let contentType = "application/octet-stream"; // Default

    if (fileExtension === ".pdf") {
      contentType = "application/pdf";
    } else if (fileExtension === ".md") {
      contentType = "text/markdown";
    } else if (fileExtension === ".docx") {
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (fileExtension === ".html") {
      contentType = "text/html";
    }

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(`Error downloading file ${filename}:`, {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return Response.json(
      { error: "File not found or could not be downloaded" },
      { status: 404 }
    );
  }
}

import { promises as fs } from "fs";
import path from "path";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("path");
  const absolutePath = path.join(process.cwd(), "tmp", "Uploads", filePath);

  try {
    const fileBuffer = await fs.readFile(absolutePath);
    const fileExtension = path.extname(filePath).toLowerCase();

    // Set the appropriate Content-Type based on file extension
    let contentType = "application/octet-stream"; // Default

    if (fileExtension === ".pdf") {
      contentType = "application/pdf";
    } else if (fileExtension === ".md") {
      contentType = "text/markdown";
    } else if (fileExtension === ".html") {
      contentType = "text/html";
    }

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${path.basename(
          filePath
        )}"`,
      },
    });
  } catch (error) {
    console.error("Error downloading file:", error.message);
    return Response.json(
      { error: "File not found or could not be downloaded" },
      { status: 404 }
    );
  }
}

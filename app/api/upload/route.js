import { promises as fs } from "fs";
import { createReadStream } from "fs";
import path from "path";
import OpenAI from "openai";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// This is the correct way to export HTTP methods in Next.js App Router
export async function POST(req) {
  console.log("API route triggered: /api/upload");
  const uploadDir = path.join(process.cwd(), "tmp", "Uploads");

  try {
    console.log("Creating upload directory if it doesn't exist");
    await fs.mkdir(uploadDir, { recursive: true });
    console.log("Upload directory ready:", uploadDir);

    // Parse the uploaded file
    console.log("Parsing form data");
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      console.log("Error: No file uploaded");
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log(
      "File received:",
      file.name,
      "Type:",
      file.type,
      "Size:",
      file.size
    );

    // Validate file type and size
    const allowedTypes = ["audio/mpeg", "audio/wav"];
    if (!allowedTypes.includes(file.type)) {
      console.log("Error: Invalid file type:", file.type);
      return Response.json(
        {
          error: "Invalid file type. Only MP3 and WAV are supported.",
        },
        { status: 400 }
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      console.log("Error: File too large:", file.size);
      return Response.json(
        {
          error: "File size exceeds 25MB limit.",
        },
        { status: 400 }
      );
    }

    // Save the file with a unique name
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);
    console.log("Saving file to:", filePath);

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));
    console.log("File saved successfully");

    // Transcribe the file
    console.log("Starting transcription with OpenAI");
    try {
      const transcriptionResponse = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: createReadStream(filePath),
        response_format: "text",
        language: "en",
      });

      const transcription = transcriptionResponse || "";
      console.log("Transcription received, length:", transcription.length);

      if (!transcription || transcription.length === 0) {
        console.log("Error: Empty transcription response");
        return Response.json(
          {
            error: "Transcription failed: No content was transcribed.",
          },
          { status: 500 }
        );
      }

      // Generate minutes from transcription using GPT-4
      console.log("Generating comprehensive meeting minutes");
      const completion = await openai.chat.completions.create({
        model: "gpt-4", // Using GPT-4 for better summarization
        messages: [
          {
            role: "system",
            content: `You are an expert assistant that creates comprehensive and well-structured meeting minutes from transcriptions.
            Your goal is to:
            1. Identify all key participants
            2. Capture all main discussion points
            3. Highlight all decisions made
            4. List all action items with owners and deadlines if mentioned
            5. Summarize any conclusions reached

            Create a professional document with clear sections and subsections.`,
          },
          {
            role: "user",
            content: `Please create detailed and comprehensive meeting minutes from this transcription.
            Format with markdown using:
            # for the title (Meeting Minutes: [infer meeting topic])
            ## for major sections (Participants, Agenda, Discussion Points, Decisions, Action Items, Next Steps)
            1. for key points
            - for detailed items or action items

            Make sure to capture all key information without omitting anything important.

            Here's the transcription:

            ${transcription}`,
          },
        ],
        max_tokens: 4000, // Ensuring we get a comprehensive summary
      });

      console.log("Minutes generated");
      const minutes = completion.choices[0].message.content;

      // Generate a markdown file
      const markdownFileName = `minutes-${Date.now()}.md`;
      const markdownPath = path.join(uploadDir, markdownFileName);

      // Save the markdown content
      await fs.writeFile(markdownPath, minutes);
      console.log("Markdown saved at:", markdownPath);

      // Convert markdown to PDF using Puppeteer
      console.log("Converting to PDF");
      const pdfFileName = `minutes-${Date.now()}.pdf`;
      const pdfPath = path.join(uploadDir, pdfFileName);

      // Create an HTML version of the markdown
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Meeting Minutes</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 40px;
              color: #333;
            }
            h1 {
              color: #2c3e50;
              border-bottom: 2px solid #3498db;
              padding-bottom: 10px;
            }
            h2 {
              color: #3498db;
              margin-top: 30px;
            }
            h3 {
              color: #2980b9;
            }
            ul, ol {
              margin-top: 10px;
              margin-bottom: 20px;
            }
            li {
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          ${convertMarkdownToHtml(minutes)}
        </body>
        </html>
      `;

      // Write the HTML file temporarily
      const htmlPath = path.join(uploadDir, `minutes-${Date.now()}.html`);
      await fs.writeFile(htmlPath, htmlContent);

      // Generate PDF from HTML
      const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
      const page = await browser.newPage();
      await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });
      await page.pdf({ path: pdfPath, format: "A4", printBackground: true });
      await browser.close();

      // Clean up the temporary HTML file
      await fs.unlink(htmlPath).catch(() => {});

      console.log("PDF saved at:", pdfPath);

      // Return success with minutes and PDF path
      return Response.json({
        success: true,
        minutes: minutes,
        pdfPath: pdfFileName, // Now this is an actual PDF file
        markdownPath: markdownFileName, // Keep the markdown path for reference if needed
      });
    } catch (transcriptionError) {
      console.error("Transcription error:", transcriptionError);
      return Response.json(
        {
          error: `Transcription failed: ${transcriptionError.message}`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("General error:", error);
    return Response.json(
      {
        error: `Error processing file: ${error.message}`,
      },
      { status: 500 }
    );
  }
}

// Helper function to convert markdown to HTML
function convertMarkdownToHtml(markdown) {
  let html = markdown
    // Convert headers
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")

    // Convert bold text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    // Convert italics
    .replace(/\*(.*?)\*/g, "<em>$1</em>")

    // Convert numbered lists
    .replace(/^\d+\. (.*$)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n)+/g, "<ol>$&</ol>")

    // Convert bullet lists
    .replace(/^- (.*$)/gm, "<li>$1</li>")
    .replace(/(?<!<\/ol>\n)(<li>.*<\/li>\n)+/g, "<ul>$&</ul>")

    // Convert paragraphs
    .replace(/^(?!<[hou])[^\n].+/gm, "<p>$&</p>");

  return html;
}

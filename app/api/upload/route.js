// import { promises as fs } from "fs";
// import { createReadStream } from "fs";
// import path from "path";
// import OpenAI from "openai";
// import puppeteer from "puppeteer-core";
// import chromium from "@sparticuz/chromium";

// // Initialize OpenAI client
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// // This is the correct way to export HTTP methods in Next.js App Router
// export async function POST(req) {
//   console.log("API route triggered: /api/upload");
//   const uploadDir = path.join(process.cwd(), "tmp", "Uploads");

//   try {
//     console.log("Creating upload directory if it doesn't exist");
//     await fs.mkdir(uploadDir, { recursive: true });
//     console.log("Upload directory ready:", uploadDir);

//     // Parse the uploaded file
//     console.log("Parsing form data");
//     const formData = await req.formData();
//     const file = formData.get("file");

//     if (!file) {
//       console.log("Error: No file uploaded");
//       return Response.json({ error: "No file uploaded" }, { status: 400 });
//     }

//     console.log(
//       "File received:",
//       file.name,
//       "Type:",
//       file.type,
//       "Size:",
//       file.size
//     );

//     // Validate file type and size
//     const allowedTypes = ["audio/mpeg", "audio/wav"];
//     if (!allowedTypes.includes(file.type)) {
//       console.log("Error: Invalid file type:", file.type);
//       return Response.json(
//         {
//           error: "Invalid file type. Only MP3 and WAV are supported.",
//         },
//         { status: 400 }
//       );
//     }

//     if (file.size > 25 * 1024 * 1024) {
//       console.log("Error: File too large:", file.size);
//       return Response.json(
//         {
//           error: "File size exceeds 25MB limit.",
//         },
//         { status: 400 }
//       );
//     }

//     // Save the file with a unique name
//     const fileName = `${Date.now()}-${file.name}`;
//     const filePath = path.join(uploadDir, fileName);
//     console.log("Saving file to:", filePath);

//     const arrayBuffer = await file.arrayBuffer();
//     await fs.writeFile(filePath, Buffer.from(arrayBuffer));
//     console.log("File saved successfully");

//     // Transcribe the file
//     console.log("Starting transcription with OpenAI");
//     try {
//       const transcriptionResponse = await openai.audio.transcriptions.create({
//         model: "whisper-1",
//         file: createReadStream(filePath),
//         response_format: "text",
//         language: "en",
//       });

//       const transcription = transcriptionResponse || "";
//       console.log("Transcription received, length:", transcription.length);

//       if (!transcription || transcription.length === 0) {
//         console.log("Error: Empty transcription response");
//         return Response.json(
//           {
//             error: "Transcription failed: No content was transcribed.",
//           },
//           { status: 500 }
//         );
//       }

//       // Generate minutes from transcription using GPT-4
//       console.log("Generating comprehensive meeting minutes");
//       const completion = await openai.chat.completions.create({
//         model: "gpt-4", // Using GPT-4 for better summarization
//         messages: [
//           {
//             role: "system",
//             content: `You are an expert assistant that creates comprehensive and well-structured meeting minutes from transcriptions.
//             Your goal is to:
//             1. Identify all key participants
//             2. Capture all main discussion points
//             3. Highlight all decisions made
//             4. List all action items with owners and deadlines if mentioned
//             5. Summarize any conclusions reached

//             Create a professional document with clear sections and subsections.`,
//           },
//           {
//             role: "user",
//             content: `Please create detailed and comprehensive meeting minutes from this transcription.
//             Format with markdown using:
//             # for the title (Meeting Minutes: [infer meeting topic])
//             ## for major sections (Participants, Agenda, Discussion Points, Decisions, Action Items, Next Steps)
//             1. for key points
//             - for detailed items or action items

//             Make sure to capture all key information without omitting anything important.

//             Here's the transcription:

//             ${transcription}`,
//           },
//         ],
//         max_tokens: 4000, // Ensuring we get a comprehensive summary
//       });

//       console.log("Minutes generated");
//       const minutes = completion.choices[0].message.content;

//       // Generate a markdown file
//       const markdownFileName = `minutes-${Date.now()}.md`;
//       const markdownPath = path.join(uploadDir, markdownFileName);

//       // Save the markdown content
//       await fs.writeFile(markdownPath, minutes);
//       console.log("Markdown saved at:", markdownPath);

//       // Convert markdown to PDF using Puppeteer
//       console.log("Converting to PDF");
//       const pdfFileName = `minutes-${Date.now()}.pdf`;
//       const pdfPath = path.join(uploadDir, pdfFileName);

//       // Create an HTML version of the markdown
//       const htmlContent = `
//         <!DOCTYPE html>
//         <html>
//         <head>
//           <meta charset="UTF-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <title>Meeting Minutes</title>
//           <style>
//             body {
//               font-family: Arial, sans-serif;
//               line-height: 1.6;
//               margin: 40px;
//               color: #333;
//             }
//             h1 {
//               color: #2c3e50;
//               border-bottom: 2px solid #3498db;
//               padding-bottom: 10px;
//             }
//             h2 {
//               color: #3498db;
//               margin-top: 30px;
//             }
//             h3 {
//               color: #2980b9;
//             }
//             ul, ol {
//               margin-top: 10px;
//               margin-bottom: 20px;
//             }
//             li {
//               margin-bottom: 5px;
//             }
//           </style>
//         </head>
//         <body>
//           ${convertMarkdownToHtml(minutes)}
//         </body>
//         </html>
//       `;

//       // Write the HTML file temporarily
//       const htmlPath = path.join(uploadDir, `minutes-${Date.now()}.html`);
//       await fs.writeFile(htmlPath, htmlContent);

//       // Generate PDF from HTML
//       const browser = await puppeteer.launch({
//         args: chromium.args,
//         defaultViewport: chromium.defaultViewport,
//         executablePath: await chromium.executablePath(),
//         headless: chromium.headless,
//       });
//       const page = await browser.newPage();
//       await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });
//       await page.pdf({ path: pdfPath, format: "A4", printBackground: true });
//       await browser.close();

//       // Clean up the temporary HTML file
//       await fs.unlink(htmlPath).catch(() => {});

//       console.log("PDF saved at:", pdfPath);

//       // Return success with minutes and PDF path
//       return Response.json({
//         success: true,
//         minutes: minutes,
//         pdfPath: pdfFileName, // Now this is an actual PDF file
//         markdownPath: markdownFileName, // Keep the markdown path for reference if needed
//       });
//     } catch (transcriptionError) {
//       console.error("Transcription error:", transcriptionError);
//       return Response.json(
//         {
//           error: `Transcription failed: ${transcriptionError.message}`,
//         },
//         { status: 500 }
//       );
//     }
//   } catch (error) {
//     console.error("General error:", error);
//     return Response.json(
//       {
//         error: `Error processing file: ${error.message}`,
//       },
//       { status: 500 }
//     );
//   }
// }

// // Helper function to convert markdown to HTML
// function convertMarkdownToHtml(markdown) {
//   let html = markdown
//     // Convert headers
//     .replace(/^# (.*$)/gm, "<h1>$1</h1>")
//     .replace(/^## (.*$)/gm, "<h2>$1</h2>")
//     .replace(/^### (.*$)/gm, "<h3>$1</h3>")

//     // Convert bold text
//     .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

//     // Convert italics
//     .replace(/\*(.*?)\*/g, "<em>$1</em>")

//     // Convert numbered lists
//     .replace(/^\d+\. (.*$)/gm, "<li>$1</li>")
//     .replace(/(<li>.*<\/li>\n)+/g, "<ol>$&</ol>")

//     // Convert bullet lists
//     .replace(/^- (.*$)/gm, "<li>$1</li>")
//     .replace(/(?<!<\/ol>\n)(<li>.*<\/li>\n)+/g, "<ul>$&</ul>")

//     // Convert paragraphs
//     .replace(/^(?!<[hou])[^\n].+/gm, "<p>$&</p>");

//   return html;
// }

// import { promises as fs } from "fs";
// import { createReadStream } from "fs";
// import path from "path";
// import OpenAI from "openai";
// import puppeteer from "puppeteer-core";
// import chromium from "@sparticuz/chromium";

// // Initialize OpenAI client
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// export async function POST(req) {
//   console.log("API route triggered: /api/upload");
//   const uploadDir = path.join(process.cwd(), "tmp", "Uploads");

//   try {
//     await fs.mkdir(uploadDir, { recursive: true });
//     console.log("Upload directory ready:", uploadDir);

//     const formData = await req.formData();
//     const file = formData.get("file");

//     if (!file) {
//       console.log("Error: No file uploaded");
//       return Response.json({ error: "No file uploaded" }, { status: 400 });
//     }

//     console.log(
//       "File received:",
//       file.name,
//       "Type:",
//       file.type,
//       "Size:",
//       file.size
//     );
//     console.log(
//       "Memory usage:",
//       process.memoryUsage().heapUsed / 1024 / 1024,
//       "MB"
//     );

//     // Validate file type and size (5MB limit)
//     const allowedTypes = ["audio/mpeg", "audio/wav"];
//     if (!allowedTypes.includes(file.type)) {
//       console.log("Error: Invalid file type:", file.type);
//       return Response.json(
//         { error: "Invalid file type. Only MP3 and WAV are supported." },
//         { status: 400 }
//       );
//     }

//     if (file.size > 5 * 1024 * 1024) {
//       console.log("Error: File too large:", file.size);
//       return Response.json(
//         { error: "File size exceeds 5MB limit." },
//         { status: 400 }
//       );
//     }

//     const fileName = `${Date.now()}-${file.name}`;
//     const filePath = path.join(uploadDir, fileName);
//     console.log("Saving file to:", filePath);

//     const arrayBuffer = await file.arrayBuffer();
//     await fs.writeFile(filePath, Buffer.from(arrayBuffer));
//     console.log("File saved successfully");
//     console.log(
//       "Memory usage:",
//       process.memoryUsage().heapUsed / 1024 / 1024,
//       "MB"
//     );

//     // Transcribe the file
//     console.log("Starting transcription with OpenAI");
//     try {
//       const transcriptionResponse = await openai.audio.transcriptions.create({
//         model: "whisper-1",
//         file: createReadStream(filePath),
//         response_format: "text",
//         language: "en",
//       });

//       const transcription = transcriptionResponse || "";
//       console.log("Transcription received, length:", transcription.length);
//       console.log(
//         "Memory usage:",
//         process.memoryUsage().heapUsed / 1024 / 1024,
//         "MB"
//       );

//       if (!transcription || transcription.length === 0) {
//         console.log("Error: Empty transcription response");
//         return Response.json(
//           { error: "Transcription failed: No content was transcribed." },
//           { status: 500 }
//         );
//       }

//       // Generate minutes using GPT-4o-mini
//       console.log("Generating meeting minutes");
//       const completion = await openai.chat.completions.create({
//         model: "gpt-4o-mini",
//         messages: [
//           {
//             role: "system",
//             content: `Create concise meeting minutes from transcriptions in markdown.
//             Goal:
//             1. Identify key participants
//             2. Capture main discussion points
//             3. Highlight decisions
//             4. List action items with owners
//             5. Summarize conclusions
//             Use #, ##, 1., - for structure.`,
//           },
//           {
//             role: "user",
//             content: `Create meeting minutes from this transcription:\n${transcription}`,
//           },
//         ],
//         max_tokens: 1500,
//       });

//       console.log("Minutes generated");
//       const minutes = completion.choices[0].message.content;
//       console.log(
//         "Memory usage:",
//         process.memoryUsage().heapUsed / 1024 / 1024,
//         "MB"
//       );

//       // Save markdown
//       const markdownFileName = `minutes-${Date.now()}.md`;
//       const markdownPath = path.join(uploadDir, markdownFileName);
//       await fs.writeFile(markdownPath, minutes);
//       console.log("Markdown saved at:", markdownPath);

//       // Generate PDF
//       console.log("Converting to PDF");
//       const pdfFileName = `minutes-${Date.now()}.pdf`;
//       const pdfPath = path.join(uploadDir, pdfFileName);

//       const htmlContent = `
//         <!DOCTYPE html>
//         <html>
//         <head>
//           <meta charset="UTF-8">
//           <title>Meeting Minutes</title>
//           <style>
//             body { font-family: Arial; line-height: 1.4; margin: 20px; }
//             h1 { font-size: 18px; }
//             h2 { font-size: 14px; }
//             p, li { font-size: 12px; }
//           </style>
//         </head>
//         <body>
//           ${convertMarkdownToHtml(minutes)}
//         </body>
//         </html>
//       `;

//       const htmlPath = path.join(uploadDir, `minutes-${Date.now()}.html`);
//       await fs.writeFile(htmlPath, htmlContent);

//       const browser = await puppeteer.launch({
//         args: [
//           ...chromium.args,
//           "--disable-gpu",
//           "--no-zygote",
//           "--single-process",
//         ],
//         defaultViewport: { width: 800, height: 600 },
//         executablePath: await chromium.executablePath(),
//         headless: chromium.headless,
//       });
//       const page = await browser.newPage();
//       await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });
//       await page.pdf({ path: pdfPath, format: "A4" });
//       await browser.close();

//       await fs.unlink(htmlPath).catch(() => {});
//       console.log("PDF saved at:", pdfPath);
//       console.log(
//         "Memory usage:",
//         process.memoryUsage().heapUsed / 1024 / 1024,
//         "MB"
//       );

//       return Response.json({
//         success: true,
//         minutes: minutes,
//         pdfPath: pdfFileName,
//         markdownPath: markdownFileName,
//       });
//     } catch (transcriptionError) {
//       console.error("Transcription error:", transcriptionError);
//       return Response.json(
//         { error: `Transcription failed: ${transcriptionError.message}` },
//         { status: 500 }
//       );
//     }
//   } catch (error) {
//     console.error("General error:", error);
//     return Response.json(
//       { error: `Error processing file: ${error.message}` },
//       { status: 500 }
//     );
//   } finally {
//     // Clean up uploaded file to free memory
//     try {
//       await fs.unlink(filePath).catch(() => {});
//     } catch (e) {}
//   }
// }

// function convertMarkdownToHtml(markdown) {
//   let html = markdown
//     .replace(/^# (.*$)/gm, "<h1>$1</h1>")
//     .replace(/^## (.*$)/gm, "<h2>$1</h2>")
//     .replace(/^### (.*$)/gm, "<h3>$1</h3>")
//     .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
//     .replace(/\*(.*?)\*/g, "<em>$1</em>")
//     .replace(/^\d+\. (.*$)/gm, "<li>$1</li>")
//     .replace(/(<li>.*<\/li>\n)+/g, "<ol>$&</ol>")
//     .replace(/^- (.*$)/gm, "<li>$1</li>")
//     .replace(/(?<!<\/ol>\n)(<li>.*<\/li>\n)+/g, "<ul>$&</ul>")
//     .replace(/^(?!<[hou])[^\n].+/gm, "<p>$&</p>");
//   return html;
// }

// import { promises as fs } from "fs";
// import { createReadStream } from "fs";
// import path from "path";
// import OpenAI from "openai";
// import puppeteer from "puppeteer-core";
// import chromium from "@sparticuz/chromium";

// // Initialize OpenAI client
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// export async function POST(req) {
//   console.log("API route triggered: /api/upload");
//   const uploadDir = path.join(process.cwd(), "tmp", "Uploads");

//   try {
//     await fs.mkdir(uploadDir, { recursive: true });
//     console.log("Upload directory ready:", uploadDir);

//     const formData = await req.formData();
//     const file = formData.get("file");

//     if (!file) {
//       console.log("Error: No file uploaded");
//       return Response.json({ error: "No file uploaded" }, { status: 400 });
//     }

//     console.log(
//       "File received:",
//       file.name,
//       "Type:",
//       file.type,
//       "Size:",
//       file.size
//     );
//     console.log(
//       "Memory usage:",
//       process.memoryUsage().heapUsed / 1024 / 1024,
//       "MB"
//     );

//     // Validate file type and size (25MB limit)
//     const allowedTypes = ["audio/mpeg", "audio/wav"];
//     if (!allowedTypes.includes(file.type)) {
//       console.log("Error: Invalid file type:", file.type);
//       return Response.json(
//         { error: "Invalid file type. Only MP3 and WAV are supported." },
//         { status: 400 }
//       );
//     }

//     if (file.size > 25 * 1024 * 1024) {
//       console.log("Error: File too large:", file.size);
//       return Response.json(
//         { error: "File size exceeds 25MB limit." },
//         { status: 400 }
//       );
//     }

//     const fileName = `${Date.now()}-${file.name}`;
//     const filePath = path.join(uploadDir, fileName);
//     console.log("Saving file to:", filePath);

//     const arrayBuffer = await file.arrayBuffer();
//     await fs.writeFile(filePath, Buffer.from(arrayBuffer));
//     console.log("File saved successfully");
//     console.log(
//       "Memory usage:",
//       process.memoryUsage().heapUsed / 1024 / 1024,
//       "MB"
//     );

//     // Transcribe the file
//     console.log("Starting transcription with OpenAI");
//     try {
//       const transcriptionResponse = await openai.audio.transcriptions.create({
//         model: "whisper-1",
//         file: createReadStream(filePath),
//         response_format: "text",
//         language: "en",
//       });

//       // Clean up audio file immediately
//       await fs.unlink(filePath).catch(() => {});
//       console.log("Audio file deleted");

//       const transcription = transcriptionResponse || "";
//       console.log("Transcription received, length:", transcription.length);
//       console.log(
//         "Memory usage:",
//         process.memoryUsage().heapUsed / 1024 / 1024,
//         "MB"
//       );

//       if (!transcription || transcription.length === 0) {
//         console.log("Error: Empty transcription response");
//         return Response.json(
//           { error: "Transcription failed: No content was transcribed." },
//           { status: 500 }
//         );
//       }

//       // Generate minutes using GPT-4o-mini
//       console.log("Generating meeting minutes");
//       const completion = await openai.chat.completions.create({
//         model: "gpt-4o-mini",
//         messages: [
//           {
//             role: "system",
//             content: `Create concise meeting minutes from transcriptions in markdown.
//             Goal:
//             1. Identify key participants
//             2. Capture main discussion points
//             3. Highlight decisions
//             4. List action items with owners
//             5. Summarize conclusions
//             Use #, ##, 1., - for structure.`,
//           },
//           {
//             role: "user",
//             content: `Create meeting minutes from this transcription:\n${transcription}`,
//           },
//         ],
//         max_tokens: 1500,
//       });

//       console.log("Minutes generated");
//       const minutes = completion.choices[0].message.content;
//       console.log(
//         "Memory usage:",
//         process.memoryUsage().heapUsed / 1024 / 1024,
//         "MB"
//       );

//       // Save markdown
//       const markdownFileName = `minutes-${Date.now()}.md`;
//       const markdownPath = path.join(uploadDir, markdownFileName);
//       await fs.writeFile(markdownPath, minutes);
//       console.log("Markdown saved at:", markdownPath);

//       // Skip PDF generation to save memory
//       console.log("Skipping PDF generation to optimize memory");
//       return Response.json({
//         success: true,
//         minutes: minutes,
//         markdownPath: markdownFileName,
//       });
//     } catch (transcriptionError) {
//       console.error("Transcription error:", transcriptionError);
//       return Response.json(
//         { error: `Transcription failed: ${transcriptionError.message}` },
//         { status: 500 }
//       );
//     }
//   } catch (error) {
//     console.error("General error:", error);
//     return Response.json(
//       { error: `Error processing file: ${error.message}` },
//       { status: 500 }
//     );
//   } finally {
//     // Clean up uploaded file if still present
//     try {
//       await fs.unlink(filePath).catch(() => {});
//     } catch (e) {}
//   }
// }

// function convertMarkdownToHtml(markdown) {
//   let html = markdown
//     .replace(/^# (.*$)/gm, "<h1>$1</h1>")
//     .replace(/^## (.*$)/gm, "<h2>$1</h2>")
//     .replace(/^### (.*$)/gm, "<h3>$1</h3>")
//     .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
//     .replace(/\*(.*?)\*/g, "<em>$1</em>")
//     .replace(/^\d+\. (.*$)/gm, "<li>$1</li>")
//     .replace(/(<li>.*<\/li>\n)+/g, "<ol>$&</ol>")
//     .replace(/^- (.*$)/gm, "<li>$1</li>")
//     .replace(/(?<!<\/ol>\n)(<li>.*<\/li>\n)+/g, "<ul>$&</ul>")
//     .replace(/^(?!<[hou])[^\n].+/gm, "<p>$&</p>");
//   return html;
// }

// import { promises as fsPromises } from "fs";
// import fs from "fs";
// import path from "path";
// import { jsPDF } from "jspdf";
// import OpenAI from "openai";
// import * as mm from "music-metadata";
// import { Document, Packer, Paragraph } from "docx";

// // Initialize OpenAI client
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// // Utility function for logging memory usage
// function logMemoryUsage(context = "General") {
//   const memoryUsage = process.memoryUsage();
//   console.log(`[${context}] Memory Usage:`, {
//     rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`,
//     heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
//   });
// }

// // Markdown to plain text conversion
// function markdownToPlainText(markdown) {
//   if (!markdown || typeof markdown !== "string") return "";
//   return (
//     markdown
//       // Remove headers
//       .replace(/^#+\s*/gm, "")
//       // Remove bold and italic formatting
//       .replace(/(\*\*|__)/g, "")
//       .replace(/(\*|_)/g, "")
//       // Remove list markers
//       .replace(/^[\-*]\s*/gm, "")
//       .replace(/^\d+\.\s*/gm, "")
//       // Trim extra whitespace
//       .replace(/\n{2,}/g, "\n\n")
//       .trim()
//   );
// }

// // Generate PDF using jsPDF with in-memory buffer
// function generatePDFWithJSPDF(minutes, pdfPath) {
//   return new Promise((resolve, reject) => {
//     try {
//       // Create a new jsPDF document
//       const doc = new jsPDF({
//         orientation: "portrait",
//         unit: "pt",
//         format: "a4",
//       });

//       // Set font and size
//       doc.setFont("helvetica", "normal");
//       doc.setFontSize(12);

//       // Format the text
//       const plainText = markdownToPlainText(minutes);
//       const paragraphs = plainText.split("\n\n");

//       // Log paragraph count and sample for debugging
//       console.log(
//         `Rendering ${paragraphs.length} paragraphs:`,
//         paragraphs.slice(0, 2)
//       );

//       let yPosition = 40; // Start position from top
//       const margin = 40;
//       const pageWidth = doc.internal.pageSize.width;
//       const maxWidth = pageWidth - 2 * margin;

//       paragraphs.forEach((paragraph, i) => {
//         if (paragraph && typeof paragraph === "string" && paragraph.trim()) {
//           // Split text to fit within page width
//           const lines = doc.splitTextToSize(paragraph.trim(), maxWidth);
//           doc.text(lines, margin + 20, yPosition, { align: "left" });

//           // Update yPosition for next paragraph
//           yPosition += lines.length * 14 + 10; // Approximate line height + gap

//           // Check if we need a new page
//           if (yPosition > doc.internal.pageSize.height - margin) {
//             doc.addPage();
//             yPosition = 40;
//           }
//         } else {
//           console.warn(`Skipping invalid paragraph at index ${i}:`, paragraph);
//         }
//       });

//       // Get PDF as ArrayBuffer and write to file
//       const pdfBuffer = doc.output("arraybuffer");
//       fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer));
//       console.log("PDF generation completed successfully");

//       // Synchronous check for file existence
//       if (fs.existsSync(pdfPath)) {
//         console.log(`PDF file exists at: ${pdfPath}`);
//       } else {
//         console.error(`PDF file not created at: ${pdfPath}`);
//         reject(new Error(`PDF file not created at: ${pdfPath}`));
//         return;
//       }

//       // Async check for confirmation
//       fsPromises
//         .access(pdfPath)
//         .then(() =>
//           console.log(`Async check: PDF file confirmed at: ${pdfPath}`)
//         )
//         .catch((err) =>
//           console.error(`Async check: PDF file not found at: ${pdfPath}`, err)
//         );

//       logMemoryUsage("PDF Generated");
//       // Add delay to ensure filesystem consistency
//       setTimeout(() => resolve(true), 500);
//     } catch (error) {
//       console.error("PDF generation error:", {
//         message: error.message,
//         stack: error.stack,
//       });
//       reject(error);
//     }
//   });
// }

// // Generate Word document using docx
// function generateDocx(minutes, docxPath) {
//   return new Promise((resolve, reject) => {
//     try {
//       const plainText = markdownToPlainText(minutes);
//       const paragraphs = plainText
//         .split("\n\n")
//         .map((text) => new Paragraph({ text }));

//       const doc = new Document({
//         sections: [
//           {
//             properties: {},
//             children: paragraphs,
//           },
//         ],
//       });

//       Packer.toBuffer(doc).then((buffer) => {
//         fs.writeFileSync(docxPath, buffer);
//         console.log("Word document generation completed successfully");

//         // Synchronous check for file existence
//         if (fs.existsSync(docxPath)) {
//           console.log(`Word file exists at: ${docxPath}`);
//         } else {
//           console.error(`Word file not created at: ${docxPath}`);
//           reject(new Error(`Word file not created at: ${docxPath}`));
//           return;
//         }

//         // Async check for confirmation
//         fsPromises
//           .access(docxPath)
//           .then(() =>
//             console.log(`Async check: Word file confirmed at: ${docxPath}`)
//           )
//           .catch((err) =>
//             console.error(
//               `Async check: Word file not found at: ${docxPath}`,
//               err
//             )
//           );

//         logMemoryUsage("Word Generated");
//         setTimeout(() => resolve(true), 500);
//       });
//     } catch (error) {
//       console.error("Word generation error:", {
//         message: error.message,
//         stack: error.stack,
//       });
//       reject(error);
//     }
//   });
// }

// // Memory-efficient file handling
// async function streamToBuffer(stream) {
//   return new Promise((resolve, reject) => {
//     const chunks = [];
//     stream.on("data", (chunk) => chunks.push(chunk));
//     stream.on("end", () => resolve(Buffer.concat(chunks)));
//     stream.on("error", reject);
//   });
// }

// // Cleanup function to remove temporary files
// async function cleanupTempFiles(...filePaths) {
//   for (const filePath of filePaths) {
//     try {
//       await fsPromises.unlink(filePath).catch(() => {});
//     } catch (error) {
//       console.error(`Failed to delete file ${filePath}:`, error);
//     }
//   }
// }

// // Main POST handler
// export async function POST(req) {
//   const startTime = Date.now();
//   const timeoutLimit = 50_000; // 50 seconds to stay under 60s Vercel limit

//   // Use Vercel's writable tmp directory
//   const uploadDir = path.join(process.cwd(), "tmp", "Uploads");
//   let filePath = null;
//   let pdfFileName = null;
//   let markdownFileName = null;
//   let docxFileName = null;

//   try {
//     // Ensure upload directory exists
//     await fsPromises.mkdir(uploadDir, { recursive: true });

//     // Parse uploaded file
//     const formData = await req.formData();
//     const file = formData.get("file");

//     if (!file) {
//       return Response.json({ error: "No file uploaded" }, { status: 400 });
//     }

//     // Validate file type and size
//     const allowedTypes = ["audio/mpeg", "audio/wav"];
//     if (!allowedTypes.includes(file.type)) {
//       return Response.json(
//         { error: "Invalid file type. Only MP3 and WAV are supported." },
//         { status: 400 }
//       );
//     }

//     if (file.size > 5 * 1024 * 1024) {
//       // 5MB limit
//       return Response.json(
//         { error: "File size exceeds 5MB limit." },
//         { status: 400 }
//       );
//     }

//     // Save file with unique name
//     const fileName = `${Date.now()}-${file.name}`;
//     filePath = path.join(uploadDir, fileName);

//     let fileBuffer = await file.arrayBuffer();
//     await fsPromises.writeFile(filePath, Buffer.from(fileBuffer));

//     // Log audio duration
//     let audioDuration = 0;
//     try {
//       const metadata = await mm.parseFile(filePath);
//       audioDuration = metadata.format.duration || 0;
//       console.log(`Audio duration: ${audioDuration.toFixed(2)} seconds`);
//     } catch (error) {
//       console.warn("Failed to parse audio metadata:", error.message);
//     }

//     // Free memory
//     fileBuffer = null;
//     logMemoryUsage("File Saved");

//     // Check timeout
//     if (Date.now() - startTime > timeoutLimit) {
//       await cleanupTempFiles(filePath);
//       return Response.json(
//         { error: "Processing timeout: File saving took too long." },
//         { status: 504 }
//       );
//     }

//     // Transcribe audio file
//     const fileStream = fs.createReadStream(filePath);
//     const transcriptionResponse = await openai.audio.transcriptions.create({
//       model: "whisper-1",
//       file: fileStream,
//       response_format: "text",
//       language: "en",
//     });

//     // Explicitly close stream
//     fileStream.destroy();

//     const transcription = transcriptionResponse || "";

//     if (!transcription || transcription.trim().length === 0) {
//       await cleanupTempFiles(filePath);
//       return Response.json(
//         { error: "Transcription failed: No content was transcribed." },
//         { status: 500 }
//       );
//     }

//     // Clean up audio file immediately
//     await cleanupTempFiles(filePath);
//     filePath = null;
//     logMemoryUsage("Transcription Complete");

//     // Check timeout
//     if (Date.now() - startTime > timeoutLimit) {
//       return Response.json(
//         { error: "Processing timeout: Transcription took too long." },
//         { status: 504 }
//       );
//     }

//     // Generate minutes using GPT-4o-mini
//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content: `Create comprehensive meeting minutes from transcriptions.
//           Structure:
//           # Meeting Minutes
//           ## Participants
//           ## Key Discussion Points
//           ## Decisions
//           ## Action Items
//           ## Next Steps

//           Use markdown formatting.`,
//         },
//         {
//           role: "user",
//           content: `Create detailed meeting minutes from this transcription:\n${transcription}`,
//         },
//       ],
//       max_tokens: 500, // Reduced to optimize memory and cost
//     });

//     const minutes = completion.choices[0].message.content || "";
//     if (!minutes.trim()) {
//       return Response.json(
//         { error: "Failed to generate meeting minutes." },
//         { status: 500 }
//       );
//     }

//     // Log token usage and estimated cost
//     console.log("Completion usage:", completion.usage);
//     const tokenCost =
//       completion.usage.prompt_tokens * 0.00000015 +
//       completion.usage.completion_tokens * 0.0000006;
//     const transcriptionCost = (audioDuration / 60) * 0.006;
//     console.log(
//       `Estimated OpenAI cost: $${(tokenCost + transcriptionCost).toFixed(
//         5
//       )} (Transcription: $${transcriptionCost.toFixed(
//         5
//       )}, Completion: $${tokenCost.toFixed(5)})`
//     );
//     logMemoryUsage("Minutes Generated");

//     // Check timeout
//     if (Date.now() - startTime > timeoutLimit) {
//       return Response.json(
//         { error: "Processing timeout: Minutes generation took too long." },
//         { status: 504 }
//       );
//     }

//     // Save markdown file
//     markdownFileName = `minutes-${Date.now()}.md`;
//     const markdownPath = path.join(uploadDir, markdownFileName);
//     await fsPromises.writeFile(markdownPath, minutes);

//     // PDF Generation with jsPDF
//     let pdfGenerationSuccessful = false;
//     pdfFileName = `minutes-${Date.now()}.pdf`;
//     const pdfPath = path.join(uploadDir, pdfFileName);

//     try {
//       pdfGenerationSuccessful = await generatePDFWithJSPDF(minutes, pdfPath);
//     } catch (error) {
//       console.warn("PDF generation failed:", error.message);
//       pdfGenerationSuccessful = false;
//     }

//     if (!pdfGenerationSuccessful || !fs.existsSync(pdfPath)) {
//       console.warn("PDF not generated or not found; skipping PDF response");
//       pdfFileName = null;
//     }

//     // Word Document Generation with docx
//     let docxGenerationSuccessful = false;
//     docxFileName = `minutes-${Date.now()}.docx`;
//     const docxPath = path.join(uploadDir, docxFileName);

//     try {
//       docxGenerationSuccessful = await generateDocx(minutes, docxPath);
//     } catch (error) {
//       console.warn("Word document generation failed:", error.message);
//       docxGenerationSuccessful = false;
//     }

//     if (!docxGenerationSuccessful || !fs.existsSync(docxPath)) {
//       console.warn(
//         "Word document not generated or not found; skipping Word response"
//       );
//       docxFileName = null;
//     }

//     // Calculate processing time
//     const processingTime = Date.now() - startTime;
//     console.log(`Total processing time: ${processingTime}ms`);

//     // Log response for debugging
//     const response = {
//       success: true,
//       minutes: minutes,
//       pdfPath: pdfFileName ? `/Uploads/${pdfFileName}` : null,
//       markdownPath: `/Uploads/${markdownFileName}`,
//       docxPath: docxFileName ? `/Uploads/${docxFileName}` : null,
//       processingTime: processingTime,
//       audioDuration: audioDuration.toFixed(2),
//       estimatedCost: (tokenCost + transcriptionCost).toFixed(5),
//       pdfExists: pdfFileName ? fs.existsSync(pdfPath) : false,
//       docxExists: docxFileName ? fs.existsSync(docxPath) : false,
//     };
//     console.log("Response sent:", response);

//     // Return response with public URLs
//     return Response.json(response);
//   } catch (error) {
//     console.error("Processing Error:", {
//       message: error.message,
//       stack: error.stack,
//       name: error.name,
//     });

//     if (filePath) await cleanupTempFiles(filePath);

//     return Response.json(
//       {
//         error: `File processing failed: ${error.message || "Unknown error"}`,
//         details: error.toString(),
//       },
//       { status: 500 }
//     );
//   }
// }

// // GET handler for file downloads
// export async function GET(req) {
//   const { searchParams } = new URL(req.url);
//   const filename = searchParams.get("filename");

//   console.log(`Download requested for filename: ${filename}`);

//   if (!filename || filename === "null") {
//     return Response.json(
//       { error: "No valid filename provided" },
//       { status: 400 }
//     );
//   }

//   // Prevent path traversal
//   const sanitizedFilename = path.basename(filename);
//   const filePath = path.join(
//     process.cwd(),
//     "tmp",
//     "Uploads",
//     sanitizedFilename
//   );

//   try {
//     await fsPromises.access(filePath);
//     const fileContents = await fsPromises.readFile(filePath);

//     // Determine content type
//     const ext = path.extname(sanitizedFilename).toLowerCase();
//     let contentType = "application/octet-stream";

//     switch (ext) {
//       case ".pdf":
//         contentType = "application/pdf";
//         break;
//       case ".md":
//         contentType = "text/markdown";
//         break;
//       case ".docx":
//         contentType =
//           "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
//         break;
//     }

//     return new Response(fileContents, {
//       headers: {
//         "Content-Type": contentType,
//         "Content-Disposition": `attachment; filename="${sanitizedFilename}"`,
//       },
//     });
//   } catch (error) {
//     console.error(`Error serving file ${sanitizedFilename}:`, {
//       message: error.message,
//       code: error.code,
//       stack: error.stack,
//     });

//     return Response.json(
//       {
//         error: "File not found",
//         details: error.message,
//       },
//       { status: 404 }
//     );
//   }
// }

//DOWNLOADS WORK LOCALLY ONLY
// import { promises as fsPromises } from "fs";
// import fs from "fs";
// import path from "path";
// import { jsPDF } from "jspdf";
// import OpenAI from "openai";
// import * as mm from "music-metadata";
// import { Document, Packer, Paragraph } from "docx";

// // Initialize OpenAI client
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// // Utility function for logging memory usage
// function logMemoryUsage(context = "General") {
//   const memoryUsage = process.memoryUsage();
//   console.log(`[${context}] Memory Usage:`, {
//     rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`,
//     heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
//   });
// }

// // Markdown to plain text conversion
// function markdownToPlainText(markdown) {
//   if (!markdown || typeof markdown !== "string") return "";
//   return (
//     markdown
//       // Remove headers
//       .replace(/^#+\s*/gm, "")
//       // Remove bold and italic formatting
//       .replace(/(\*\*|__)/g, "")
//       .replace(/(\*|_)/g, "")
//       // Remove list markers
//       .replace(/^[\-*]\s*/gm, "")
//       .replace(/^\d+\.\s*/gm, "")
//       // Trim extra whitespace
//       .replace(/\n{2,}/g, "\n\n")
//       .trim()
//   );
// }

// // Generate PDF using jsPDF with in-memory buffer
// function generatePDFWithJSPDF(minutes, pdfPath) {
//   return new Promise((resolve, reject) => {
//     try {
//       // Create a new jsPDF document
//       const doc = new jsPDF({
//         orientation: "portrait",
//         unit: "pt",
//         format: "a4",
//       });

//       // Set font and size
//       doc.setFont("helvetica", "normal");
//       doc.setFontSize(12);

//       // Format the text
//       const plainText = markdownToPlainText(minutes);
//       const paragraphs = plainText.split("\n\n");

//       // Log paragraph count and sample for debugging
//       console.log(
//         `Rendering ${paragraphs.length} paragraphs:`,
//         paragraphs.slice(0, 2)
//       );

//       let yPosition = 40; // Start position from top
//       const margin = 40;
//       const pageWidth = doc.internal.pageSize.width;
//       const maxWidth = pageWidth - 2 * margin;

//       paragraphs.forEach((paragraph, i) => {
//         if (paragraph && typeof paragraph === "string" && paragraph.trim()) {
//           // Split text to fit within page width
//           const lines = doc.splitTextToSize(paragraph.trim(), maxWidth);
//           doc.text(lines, margin + 20, yPosition, { align: "left" });

//           // Update yPosition for next paragraph
//           yPosition += lines.length * 14 + 10; // Approximate line height + gap

//           // Check if we need a new page
//           if (yPosition > doc.internal.pageSize.height - margin) {
//             doc.addPage();
//             yPosition = 40;
//           }
//         } else {
//           console.warn(`Skipping invalid paragraph at index ${i}:`, paragraph);
//         }
//       });

//       // Get PDF as ArrayBuffer and write to file
//       const pdfBuffer = doc.output("arraybuffer");
//       fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer));
//       console.log("PDF generation completed successfully");

//       // Synchronous check for file existence
//       if (fs.existsSync(pdfPath)) {
//         console.log(`PDF file exists at: ${pdfPath}`);
//       } else {
//         console.error(`PDF file not created at: ${pdfPath}`);
//         reject(new Error(`PDF file not created at: ${pdfPath}`));
//         return;
//       }

//       // Async check for confirmation
//       fsPromises
//         .access(pdfPath)
//         .then(() =>
//           console.log(`Async check: PDF file confirmed at: ${pdfPath}`)
//         )
//         .catch((err) =>
//           console.error(`Async check: PDF file not found at: ${pdfPath}`, err)
//         );

//       logMemoryUsage("PDF Generated");
//       // Add delay to ensure filesystem consistency
//       setTimeout(() => resolve(true), 500);
//     } catch (error) {
//       console.error("PDF generation error:", {
//         message: error.message,
//         stack: error.stack,
//       });
//       reject(error);
//     }
//   });
// }

// // Generate Word document using docx
// function generateDocx(minutes, docxPath) {
//   return new Promise((resolve, reject) => {
//     try {
//       const plainText = markdownToPlainText(minutes);
//       const paragraphs = plainText
//         .split("\n\n")
//         .map((text) => new Paragraph({ text }));

//       const doc = new Document({
//         sections: [
//           {
//             properties: {},
//             children: paragraphs,
//           },
//         ],
//       });

//       Packer.toBuffer(doc).then((buffer) => {
//         fs.writeFileSync(docxPath, buffer);
//         console.log("Word document generation completed successfully");

//         // Synchronous check for file existence
//         if (fs.existsSync(docxPath)) {
//           console.log(`Word file exists at: ${docxPath}`);
//         } else {
//           console.error(`Word file not created at: ${docxPath}`);
//           reject(new Error(`Word file not created at: ${docxPath}`));
//           return;
//         }

//         // Async check for confirmation
//         fsPromises
//           .access(docxPath)
//           .then(() =>
//             console.log(`Async check: Word file confirmed at: ${docxPath}`)
//           )
//           .catch((err) =>
//             console.error(
//               `Async check: Word file not found at: ${docxPath}`,
//               err
//             )
//           );

//         logMemoryUsage("Word Generated");
//         setTimeout(() => resolve(true), 500);
//       });
//     } catch (error) {
//       console.error("Word generation error:", {
//         message: error.message,
//         stack: error.stack,
//       });
//       reject(error);
//     }
//   });
// }

// // Memory-efficient file handling
// async function streamToBuffer(stream) {
//   return new Promise((resolve, reject) => {
//     const chunks = [];
//     stream.on("data", (chunk) => chunks.push(chunk));
//     stream.on("end", () => resolve(Buffer.concat(chunks)));
//     stream.on("error", reject);
//   });
// }

// // Cleanup function to remove temporary files
// async function cleanupTempFiles(...filePaths) {
//   for (const filePath of filePaths) {
//     try {
//       await fsPromises.unlink(filePath).catch(() => {});
//     } catch (error) {
//       console.error(`Failed to delete file ${filePath}:`, error);
//     }
//   }
// }

// // Main POST handler
// export async function POST(req) {
//   const startTime = Date.now();
//   const timeoutLimit = 50_000; // 50 seconds to stay under 60s Vercel limit

//   // Use Vercel's /tmp directory, fallback to local tmp
//   const isVercel = process.env.VERCEL === "1";
//   let uploadDir = isVercel
//     ? "/tmp/Uploads"
//     : path.join(process.cwd(), "tmp", "Uploads");
//   let filePath = null;
//   let pdfFileName = null;
//   let markdownFileName = null;
//   let docxFileName = null;

//   try {
//     // Log resolved uploadDir for debugging
//     console.log(`Resolved uploadDir: ${uploadDir}`);

//     // Ensure upload directory exists
//     try {
//       await fsPromises.mkdir(uploadDir, { recursive: true });
//       console.log(`Created uploadDir: ${uploadDir}`);
//     } catch (mkdirError) {
//       console.error(`Failed to create uploadDir: ${uploadDir}`, mkdirError);
//       // Fallback to /tmp
//       uploadDir = "/tmp";
//       console.log(`Falling back to uploadDir: ${uploadDir}`);
//       await fsPromises.mkdir(uploadDir, { recursive: true }).catch((err) => {
//         console.error(`Failed to create fallback uploadDir: ${uploadDir}`, err);
//       });
//     }

//     // Parse uploaded file
//     const formData = await req.formData();
//     const file = formData.get("file");

//     if (!file) {
//       return Response.json({ error: "No file uploaded" }, { status: 400 });
//     }

//     // Validate file type and size
//     const allowedTypes = ["audio/mpeg", "audio/wav"];
//     if (!allowedTypes.includes(file.type)) {
//       return Response.json(
//         { error: "Invalid file type. Only MP3 and WAV are supported." },
//         { status: 400 }
//       );
//     }

//     if (file.size > 5 * 1024 * 1024) {
//       // 5MB limit
//       return Response.json(
//         { error: "File size exceeds 5MB limit." },
//         { status: 400 }
//       );
//     }

//     // Save file with unique name
//     const fileName = `${Date.now()}-${file.name}`;
//     filePath = path.join(uploadDir, fileName);

//     let fileBuffer = await file.arrayBuffer();
//     await fsPromises.writeFile(filePath, Buffer.from(fileBuffer));

//     // Log audio duration
//     let audioDuration = 0;
//     try {
//       const metadata = await mm.parseFile(filePath);
//       audioDuration = metadata.format.duration || 0;
//       console.log(`Audio duration: ${audioDuration.toFixed(2)} seconds`);
//     } catch (error) {
//       console.warn("Failed to parse audio metadata:", error.message);
//     }

//     // Free memory
//     fileBuffer = null;
//     logMemoryUsage("File Saved");

//     // Check timeout
//     if (Date.now() - startTime > timeoutLimit) {
//       await cleanupTempFiles(filePath);
//       return Response.json(
//         { error: "Processing timeout: File saving took too long." },
//         { status: 504 }
//       );
//     }

//     // Transcribe audio file
//     const fileStream = fs.createReadStream(filePath);
//     const transcriptionResponse = await openai.audio.transcriptions.create({
//       model: "whisper-1",
//       file: fileStream,
//       response_format: "text",
//       language: "en",
//     });

//     // Explicitly close stream
//     fileStream.destroy();

//     const transcription = transcriptionResponse || "";

//     if (!transcription || transcription.trim().length === 0) {
//       await cleanupTempFiles(filePath);
//       return Response.json(
//         { error: "Transcription failed: No content was transcribed." },
//         { status: 500 }
//       );
//     }

//     // Clean up audio file immediately
//     await cleanupTempFiles(filePath);
//     filePath = null;
//     logMemoryUsage("Transcription Complete");

//     // Check timeout
//     if (Date.now() - startTime > timeoutLimit) {
//       return Response.json(
//         { error: "Processing timeout: Transcription took too long." },
//         { status: 504 }
//       );
//     }

//     // Generate minutes using GPT-4o-mini
//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content: `Create comprehensive meeting minutes from transcriptions.
//           Structure:
//           # Meeting Minutes
//           ## Participants
//           ## Key Discussion Points
//           ## Decisions
//           ## Action Items
//           ## Next Steps

//           Use markdown formatting.`,
//         },
//         {
//           role: "user",
//           content: `Create detailed meeting minutes from this transcription:\n${transcription}`,
//         },
//       ],
//       max_tokens: 500, // Reduced to optimize memory and cost
//     });

//     const minutes = completion.choices[0].message.content || "";
//     if (!minutes.trim()) {
//       return Response.json(
//         { error: "Failed to generate meeting minutes." },
//         { status: 500 }
//       );
//     }

//     // Log token usage and estimated cost
//     console.log("Completion usage:", completion.usage);
//     const tokenCost =
//       completion.usage.prompt_tokens * 0.00000015 +
//       completion.usage.completion_tokens * 0.0000006;
//     const transcriptionCost = (audioDuration / 60) * 0.006;
//     console.log(
//       `Estimated OpenAI cost: $${(tokenCost + transcriptionCost).toFixed(
//         5
//       )} (Transcription: $${transcriptionCost.toFixed(
//         5
//       )}, Completion: $${tokenCost.toFixed(5)})`
//     );
//     logMemoryUsage("Minutes Generated");

//     // Check timeout
//     if (Date.now() - startTime > timeoutLimit) {
//       return Response.json(
//         { error: "Processing timeout: Minutes generation took too long." },
//         { status: 504 }
//       );
//     }

//     // Save markdown file
//     markdownFileName = `minutes-${Date.now()}.md`;
//     const markdownPath = path.join(uploadDir, markdownFileName);
//     await fsPromises.writeFile(markdownPath, minutes);

//     // PDF Generation with jsPDF
//     let pdfGenerationSuccessful = false;
//     pdfFileName = `minutes-${Date.now()}.pdf`;
//     const pdfPath = path.join(uploadDir, pdfFileName);

//     try {
//       pdfGenerationSuccessful = await generatePDFWithJSPDF(minutes, pdfPath);
//     } catch (error) {
//       console.warn("PDF generation failed:", error.message);
//       pdfGenerationSuccessful = false;
//     }

//     if (!pdfGenerationSuccessful || !fs.existsSync(pdfPath)) {
//       console.warn("PDF not generated or not found; skipping PDF response");
//       pdfFileName = null;
//     }

//     // Word Document Generation with docx
//     let docxGenerationSuccessful = false;
//     docxFileName = `minutes-${Date.now()}.docx`;
//     const docxPath = path.join(uploadDir, docxFileName);

//     try {
//       docxGenerationSuccessful = await generateDocx(minutes, docxPath);
//     } catch (error) {
//       console.warn("Word document generation failed:", error.message);
//       docxGenerationSuccessful = false;
//     }

//     if (!docxGenerationSuccessful || !fs.existsSync(docxPath)) {
//       console.warn(
//         "Word document not generated or not found; skipping Word response"
//       );
//       docxFileName = null;
//     }

//     // Calculate processing time
//     const processingTime = Date.now() - startTime;
//     console.log(`Total processing time: ${processingTime}ms`);

//     // Log response for debugging
//     const response = {
//       success: true,
//       minutes: minutes,
//       pdfPath: pdfFileName ? `/Uploads/${pdfFileName}` : null,
//       markdownPath: `/Uploads/${markdownFileName}`,
//       docxPath: docxFileName ? `/Uploads/${docxFileName}` : null,
//       processingTime: processingTime,
//       audioDuration: audioDuration.toFixed(2),
//       estimatedCost: (tokenCost + transcriptionCost).toFixed(5),
//       pdfExists: pdfFileName ? fs.existsSync(pdfPath) : false,
//       docxExists: docxFileName ? fs.existsSync(docxPath) : false,
//     };
//     console.log("Response sent:", response);

//     // Return response with public URLs
//     return Response.json(response);
//   } catch (error) {
//     console.error("Processing Error:", {
//       message: error.message,
//       stack: error.stack,
//       name: error.name,
//     });

//     if (filePath) await cleanupTempFiles(filePath);

//     return Response.json(
//       {
//         error: `File processing failed: ${error.message || "Unknown error"}`,
//         details: error.toString(),
//       },
//       { status: 500 }
//     );
//   }
// }

// // GET handler for file downloads
// export async function GET(req) {
//   const { searchParams } = new URL(req.url);
//   const filename = searchParams.get("filename");

//   console.log(`Download requested for filename: ${filename}`);

//   if (!filename || filename === "null") {
//     return Response.json(
//       { error: "No valid filename provided" },
//       { status: 400 }
//     );
//   }

//   // Prevent path traversal
//   const sanitizedFilename = path.basename(filename);
//   const isVercel = process.env.VERCEL === "1";
//   const uploadDir = isVercel
//     ? "/tmp/Uploads"
//     : path.join(process.cwd(), "tmp", "Uploads");
//   const filePath = path.join(uploadDir, sanitizedFilename);

//   console.log(`Resolved filePath: ${filePath}`);

//   try {
//     await fsPromises.access(filePath);
//     const fileContents = await fsPromises.readFile(filePath);

//     // Determine content type
//     const ext = path.extname(sanitizedFilename).toLowerCase();
//     let contentType = "application/octet-stream";

//     switch (ext) {
//       case ".pdf":
//         contentType = "application/pdf";
//         break;
//       case ".md":
//         contentType = "text/markdown";
//         break;
//       case ".docx":
//         contentType =
//           "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
//         break;
//     }

//     return new Response(fileContents, {
//       headers: {
//         "Content-Type": contentType,
//         "Content-Disposition": `attachment; filename="${sanitizedFilename}"`,
//       },
//     });
//   } catch (error) {
//     console.error(`Error serving file ${sanitizedFilename}:`, {
//       message: error.message,
//       code: error.code,
//       stack: error.stack,
//     });

//     return Response.json(
//       {
//         error: "File not found",
//         details: error.message,
//       },
//       { status: 404 }
//     );
//   }
// }

// import { promises as fsPromises } from "fs";
// import path from "path";
// import os from "os";
// import { jsPDF } from "jspdf";
// import OpenAI from "openai";
// import * as mm from "music-metadata";
// import { Document, Packer, Paragraph } from "docx";
// import fs from "fs";

// // Initialize OpenAI client
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// // Utility function for logging memory usage
// function logMemoryUsage(context = "General") {
//   const memoryUsage = process.memoryUsage();
//   console.log(`[${context}] Memory Usage:`, {
//     rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`,
//     heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
//   });
// }

// // Sanitize file name to avoid invalid characters
// function sanitizeFileName(fileName) {
//   return fileName.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\s+/g, "_");
// }

// // Markdown to plain text conversion
// function markdownToPlainText(markdown) {
//   if (!markdown || typeof markdown !== "string") {
//     console.warn("Invalid markdown input:", markdown);
//     return "";
//   }
//   return markdown
//     .replace(/^#+\s*/gm, "")
//     .replace(/(\*\*|__)/g, "")
//     .replace(/(\*|_)/g, "")
//     .replace(/^[\-*]\s*/gm, "")
//     .replace(/^\d+\.\s*/gm, "")
//     .replace(/\n{2,}/g, "\n\n")
//     .trim();
// }

// // Generate PDF using jsPDF and return base64
// function generatePDFWithJSPDF(minutes) {
//   return new Promise((resolve, reject) => {
//     try {
//       console.log("Starting PDF generation");
//       if (!minutes || typeof minutes !== "string") {
//         throw new Error("Invalid minutes input for PDF generation");
//       }
//       const doc = new jsPDF({
//         orientation: "portrait",
//         unit: "pt",
//         format: "a4",
//       });
//       doc.setFont("helvetica", "normal");
//       doc.setFontSize(12);
//       const plainText = markdownToPlainText(minutes);
//       if (!plainText) {
//         throw new Error("No valid text to render in PDF");
//       }
//       const paragraphs = plainText.split("\n\n");
//       console.log(`Rendering ${paragraphs.length} paragraphs in PDF`);
//       let yPosition = 40;
//       const margin = 40;
//       const pageWidth = doc.internal.pageSize.width;
//       const maxWidth = pageWidth - 2 * margin;

//       paragraphs.forEach((paragraph, i) => {
//         if (paragraph && typeof paragraph === "string" && paragraph.trim()) {
//           const lines = doc.splitTextToSize(paragraph.trim(), maxWidth);
//           doc.text(lines, margin + 20, yPosition, { align: "left" });
//           yPosition += lines.length * 14 + 10;
//           if (yPosition > doc.internal.pageSize.height - margin) {
//             doc.addPage();
//             yPosition = 40;
//           }
//         }
//       });

//       const pdfBuffer = doc.output("arraybuffer");
//       const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");
//       console.log(`PDF generated, base64 length: ${pdfBase64.length}`);
//       logMemoryUsage("PDF Generated");
//       resolve(pdfBase64);
//     } catch (error) {
//       console.error("PDF generation error:", {
//         message: error.message,
//         stack: error.stack,
//       });
//       reject(error);
//     }
//   });
// }

// // Generate Word document using docx and return base64
// function generateDocx(minutes) {
//   return new Promise((resolve, reject) => {
//     try {
//       console.log("Starting Word document generation");
//       if (!minutes || typeof minutes !== "string") {
//         throw new Error("Invalid minutes input for Word generation");
//       }
//       const plainText = markdownToPlainText(minutes);
//       if (!plainText) {
//         throw new Error("No valid text to render in Word document");
//       }
//       const paragraphs = plainText
//         .split("\n\n")
//         .map((text) => new Paragraph({ text }));

//       const doc = new Document({
//         sections: [{ properties: {}, children: paragraphs }],
//       });

//       Packer.toBuffer(doc)
//         .then((buffer) => {
//           const docxBase64 = Buffer.from(buffer).toString("base64");
//           console.log(
//             `Word document generated, base64 length: ${docxBase64.length}`
//           );
//           logMemoryUsage("Word Generated");
//           resolve(docxBase64);
//         })
//         .catch((error) => {
//           console.error("Word buffer error:", error);
//           reject(error);
//         });
//     } catch (error) {
//       console.error("Word generation error:", {
//         message: error.message,
//         stack: error.stack,
//       });
//       reject(error);
//     }
//   });
// }

// // Generate markdown and return base64
// function generateMarkdown(minutes) {
//   try {
//     console.log("Starting Markdown generation");
//     if (!minutes || typeof minutes !== "string") {
//       throw new Error("Invalid minutes input for Markdown generation");
//     }
//     const markdownBase64 = Buffer.from(minutes).toString("base64");
//     console.log(`Markdown generated, base64 length: ${markdownBase64.length}`);
//     logMemoryUsage("Markdown Generated");
//     return markdownBase64;
//   } catch (error) {
//     console.error("Markdown generation error:", {
//       message: error.message,
//       stack: error.stack,
//     });
//     throw error;
//   }
// }

// // Cleanup function
// async function cleanupTempFiles(...filePaths) {
//   for (const filePath of filePaths) {
//     try {
//       if (filePath && (await fsPromises.stat(filePath)).isFile()) {
//         await fsPromises.unlink(filePath);
//         console.log(`Cleaned up file: ${filePath}`);
//       }
//     } catch (error) {
//       console.warn(`Failed to clean up file ${filePath}:`, error.message);
//     }
//   }
// }

// // Ensure directory exists
// async function ensureDirectoryExists(dirPath) {
//   try {
//     await fsPromises.mkdir(dirPath, { recursive: true });
//     console.log(`Ensured directory exists: ${dirPath}`);
//   } catch (error) {
//     console.error(`Failed to create directory ${dirPath}:`, error);
//     throw error;
//   }
// }

// // Main POST handler
// export async function POST(req) {
//   const startTime = Date.now();
//   const timeoutLimit = 50_000; // 50 seconds
//   let filePath = null;

//   try {
//     // Parse uploaded file
//     const formData = await req.formData();
//     const file = formData.get("file");

//     if (!file) {
//       return Response.json({ error: "No file uploaded" }, { status: 400 });
//     }

//     // Validate file type and size
//     const allowedTypes = ["audio/mpeg", "audio/wav"];
//     if (!allowedTypes.includes(file.type)) {
//       return Response.json(
//         { error: "Invalid file type. Only MP3 and WAV are supported." },
//         { status: 400 }
//       );
//     }

//     if (file.size > 5 * 1024 * 1024) {
//       return Response.json(
//         { error: "File size exceeds 5MB limit." },
//         { status: 400 }
//       );
//     }

//     // Sanitize file name
//     const rawFileName = file.name || `upload-${Date.now()}`;
//     const sanitizedFileName = sanitizeFileName(`${Date.now()}-${rawFileName}`);
//     const tempDir = os.tmpdir();
//     filePath = path.join(tempDir, sanitizedFileName);

//     // Ensure the temp directory exists
//     await ensureDirectoryExists(tempDir);

//     // Save file to temp directory
//     const fileBuffer = await file.arrayBuffer();
//     try {
//       await fsPromises.writeFile(filePath, Buffer.from(fileBuffer));
//       console.log(`File written to: ${filePath}`);
//       const stats = await fsPromises.stat(filePath);
//       console.log(`File stats: size=${stats.size} bytes`);
//     } catch (writeError) {
//       console.error("File write error:", writeError);
//       return Response.json(
//         { error: `Failed to save file: ${writeError.message}` },
//         { status: 500 }
//       );
//     }

//     // Verify file exists
//     try {
//       await fsPromises.access(filePath, fs.constants.F_OK);
//       console.log(`File verified at: ${filePath}`);
//     } catch (accessError) {
//       console.error("File access error:", accessError);
//       await cleanupTempFiles(filePath);
//       return Response.json(
//         { error: "File not found after saving." },
//         { status: 500 }
//       );
//     }

//     // Log audio duration
//     let audioDuration = 0;
//     try {
//       const metadata = await mm.parseFile(filePath);
//       audioDuration = metadata.format.duration || 0;
//       console.log(`Audio duration: ${audioDuration.toFixed(2)} seconds`);
//     } catch (error) {
//       console.warn("Failed to parse audio metadata:", error.message);
//     }

//     logMemoryUsage("File Saved");

//     // Check timeout
//     if (Date.now() - startTime > timeoutLimit) {
//       await cleanupTempFiles(filePath);
//       return Response.json(
//         { error: "Processing timeout: File saving took too long." },
//         { status: 504 }
//       );
//     }

//     // Transcribe audio file
//     let fileStream;
//     try {
//       fileStream = fs.createReadStream(filePath);
//       const transcriptionResponse = await openai.audio.transcriptions.create({
//         model: "whisper-1",
//         file: fileStream,
//         response_format: "text",
//         language: "en",
//       });
//       fileStream.destroy();
//       console.log("Transcription completed successfully");
//       const transcription = transcriptionResponse || "";
//       if (!transcription || transcription.trim().length === 0) {
//         await cleanupTempFiles(filePath);
//         return Response.json(
//           { error: "Transcription failed: No content was transcribed." },
//           { status: 500 }
//         );
//       }

//       // Clean up audio file
//       await cleanupTempFiles(filePath);
//       filePath = null;
//       logMemoryUsage("Transcription Complete");

//       // Check timeout
//       if (Date.now() - startTime > timeoutLimit) {
//         return Response.json(
//           { error: "Processing timeout: Transcription took too long." },
//           { status: 504 }
//         );
//       }

//       // Generate minutes using GPT-4o-mini
//       console.log("Starting meeting minutes generation");
//       const completion = await openai.chat.completions.create({
//         model: "gpt-4o-mini",
//         messages: [
//           {
//             role: "system",
//             content: `Create comprehensive meeting minutes from transcriptions.
//             Structure:
//             # Meeting Minutes
//             ## Participants
//             ## Key Discussion Points
//             ## Decisions
//             ## Action Items
//             ## Next Steps
//             Use markdown formatting.`,
//           },
//           {
//             role: "user",
//             content: `Create detailed meeting minutes from this transcription:\n${transcription}`,
//           },
//         ],
//         max_tokens: 500,
//       });

//       const minutes = completion.choices[0].message.content || "";
//       if (!minutes.trim()) {
//         return Response.json(
//           { error: "Failed to generate meeting minutes." },
//           { status: 500 }
//         );
//       }
//       console.log(
//         `Meeting minutes generated, length: ${minutes.length} characters`
//       );
//       console.log("Sample minutes:", minutes.slice(0, 200)); // Log first 200 chars for debugging

//       // Log token usage and estimated cost
//       console.log("Completion usage:", completion.usage);
//       const tokenCost =
//         completion.usage.prompt_tokens * 0.00000015 +
//         completion.usage.completion_tokens * 0.0000006;
//       const transcriptionCost = (audioDuration / 60) * 0.006;
//       console.log(
//         `Estimated OpenAI cost: $${(tokenCost + transcriptionCost).toFixed(
//           5
//         )} (Transcription: $${transcriptionCost.toFixed(
//           5
//         )}, Completion: $${tokenCost.toFixed(5)})`
//       );
//       logMemoryUsage("Minutes Generated");

//       // Check timeout
//       if (Date.now() - startTime > timeoutLimit) {
//         return Response.json(
//           { error: "Processing timeout: Minutes generation took too long." },
//           { status: 504 }
//         );
//       }

//       // Generate files in memory
//       let pdfBase64 = null;
//       let docxBase64 = null;
//       let markdownBase64 = null;

//       try {
//         pdfBase64 = await generatePDFWithJSPDF(minutes);
//       } catch (error) {
//         console.warn("PDF generation failed:", error.message);
//       }

//       try {
//         docxBase64 = await generateDocx(minutes);
//       } catch (error) {
//         console.warn("Word document generation failed:", error.message);
//       }

//       try {
//         markdownBase64 = await generateMarkdown(minutes);
//       } catch (error) {
//         console.warn("Markdown generation failed:", error.message);
//       }

//       // Log response details with base64 lengths
//       console.log("Sending response with base64 data:", {
//         minutesLength: minutes.length,
//         pdfBase64Length: pdfBase64 ? pdfBase64.length : null,
//         docxBase64Length: docxBase64 ? docxBase64.length : null,
//         markdownBase64Length: markdownBase64 ? markdownBase64.length : null,
//       });

//       // Check if all generations failed
//       if (!pdfBase64 && !docxBase64 && !markdownBase64) {
//         console.warn("All file generations failed");
//         return Response.json({
//           success: true,
//           minutes,
//           pdfBase64: null,
//           docxBase64: null,
//           markdownBase64: null,
//           processingTime: Date.now() - startTime,
//           audioDuration: audioDuration.toFixed(2),
//           estimatedCost: (tokenCost + transcriptionCost).toFixed(5),
//           warning:
//             "File generation failed. Only meeting minutes are available.",
//         });
//       }

//       // Calculate processing time
//       const processingTime = Date.now() - startTime;
//       console.log(`Total processing time: ${processingTime}ms`);

//       // Return response
//       return Response.json({
//         success: true,
//         minutes,
//         pdfBase64,
//         docxBase64,
//         markdownBase64,
//         processingTime,
//         audioDuration: audioDuration.toFixed(2),
//         estimatedCost: (tokenCost + transcriptionCost).toFixed(5),
//       });
//     } catch (transcriptionError) {
//       console.error("Transcription error:", transcriptionError);
//       if (fileStream) fileStream.destroy();
//       await cleanupTempFiles(filePath);
//       return Response.json(
//         { error: "Transcription failed: " + transcriptionError.message },
//         { status: 500 }
//       );
//     }
//   } catch (error) {
//     console.error("Processing Error:", {
//       message: error.message,
//       stack: error.stack,
//       name: error.name,
//     });

//     if (filePath) await cleanupTempFiles(filePath);

//     return Response.json(
//       {
//         error: `File processing failed: ${error.message || "Unknown error"}`,
//         details: error.toString(),
//       },
//       { status: 500 }
//     );
//   }
// }

import { promises as fsPromises } from "fs";
import path from "path";
import os from "os";
import { jsPDF } from "jspdf";
import OpenAI from "openai";
import * as mm from "music-metadata";
import { Document, Packer, Paragraph, TextRun } from "docx";
import fs from "fs";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Utility function for logging memory usage
function logMemoryUsage(context = "General") {
  const memoryUsage = process.memoryUsage();
  console.log(`[${context}] Memory Usage:`, {
    rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`,
    heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
  });
}

// Sanitize file name to avoid invalid characters
function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\s+/g, "_");
}

// Markdown to plain text conversion (used elsewhere, not in generateDocx)
function markdownToPlainText(markdown) {
  if (!markdown || typeof markdown !== "string") {
    console.warn("Invalid markdown input:", markdown);
    return "";
  }
  return markdown
    .replace(/^#+\s*/gm, "")
    .replace(/(\*\*|__)/g, "")
    .replace(/(\*|_)/g, "")
    .replace(/^[\-*]\s*/gm, "")
    .replace(/^\d+\.\s*/gm, "")
    .replace(/\n{2,}/g, "\n\n")
    .trim();
}

// Generate PDF using jsPDF and return base64
function generatePDFWithJSPDF(minutes) {
  return new Promise((resolve, reject) => {
    try {
      console.log("Starting PDF generation");
      if (!minutes || typeof minutes !== "string") {
        throw new Error("Invalid minutes input for PDF generation");
      }
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });
      const margin = 40;
      const pageWidth = doc.internal.pageSize.width;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = 40;

      // Split markdown into lines
      const lines = minutes.split("\n").filter((line) => line.trim());

      lines.forEach((line, index) => {
        // Skip empty lines
        if (!line.trim()) return;

        const isHeader = line.startsWith("# ") || line.startsWith("## ");

        // Set default font and color
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0); // Black for regular text
        let lineHeight = 14;
        let extraSpacing = 10;
        let parts = [];

        // Handle headers
        if (line.startsWith("# ")) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          doc.setTextColor(128, 0, 128); // Purple for H1
          lineHeight = 18;
          extraSpacing = 12;
          const headerText = line.slice(2).trim(); // Remove "# "
          parts = [{ text: headerText, bold: true }]; // Entire header is bold
        } else if (line.startsWith("## ")) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(128, 0, 128); // Purple for H2
          lineHeight = 16;
          extraSpacing = 10;
          const headerText = line.slice(3).trim(); // Remove "## "
          parts = [{ text: headerText, bold: true }]; // Entire header is bold
        } else {
          // Parse bold text for non-headers
          let currentIndex = 0;
          const boldRegex = /\*\*(.*?)\*\*/g;
          let match;
          while ((match = boldRegex.exec(line)) !== null) {
            const before = line.slice(currentIndex, match.index);
            if (before) parts.push({ text: before, bold: false });
            parts.push({ text: match[1], bold: true });
            currentIndex = match.index + match[0].length;
          }
          if (currentIndex < line.length) {
            parts.push({ text: line.slice(currentIndex), bold: false });
          }
          if (parts.length === 0) {
            parts.push({ text: line, bold: false });
          }
        }

        // Split the line into segments that fit within maxWidth
        let currentX = margin;
        parts.forEach((part) => {
          doc.setFont("helvetica", part.bold ? "bold" : "normal");
          if (!isHeader) {
            doc.setTextColor(0, 0, 0); // Black for non-headers
          }
          const words = part.text.split(" ");
          let currentLine = "";
          let wordIndex = 0;

          while (wordIndex < words.length) {
            // Try adding the next word
            const testLine = currentLine
              ? `${currentLine} ${words[wordIndex]}`
              : words[wordIndex];
            const testWidth = doc.getTextWidth(testLine);

            if (testWidth <= maxWidth) {
              currentLine = testLine;
              wordIndex++;
            } else {
              // Render the current line if it exists
              if (currentLine) {
                doc.text(currentLine, currentX, yPosition, { align: "left" });
                yPosition += lineHeight;
                currentLine = "";
              } else {
                // Single word too long, split it
                let subWord = words[wordIndex];
                while (subWord && doc.getTextWidth(subWord) > maxWidth) {
                  // Estimate characters that fit
                  let chars = Math.floor(
                    subWord.length * (maxWidth / doc.getTextWidth(subWord))
                  );
                  doc.text(subWord.slice(0, chars), currentX, yPosition, {
                    align: "left",
                  });
                  yPosition += lineHeight;
                  subWord = subWord.slice(chars);
                  // Check page overflow
                  if (yPosition > doc.internal.pageSize.height - margin) {
                    doc.addPage();
                    yPosition = 40;
                  }
                }
                if (subWord) {
                  currentLine = subWord;
                }
                wordIndex++;
              }
            }

            // Check page overflow
            if (yPosition > doc.internal.pageSize.height - margin) {
              doc.addPage();
              yPosition = 40;
            }
          }

          // Render any remaining text in currentLine
          if (currentLine) {
            doc.text(currentLine, currentX, yPosition, { align: "left" });
            yPosition += lineHeight;
          }
        });

        // Add extra spacing after the line
        yPosition += extraSpacing;

        // Check page overflow for the next line
        if (
          yPosition > doc.internal.pageSize.height - margin &&
          index < lines.length - 1
        ) {
          doc.addPage();
          yPosition = 40;
        }
      });

      const pdfBuffer = doc.output("arraybuffer");
      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");
      console.log(`PDF generated, base64 length: ${pdfBase64.length}`);
      logMemoryUsage("PDF Generated");
      resolve(pdfBase64);
    } catch (error) {
      console.error("PDF generation error:", {
        message: error.message,
        stack: error.stack,
      });
      reject(error);
    }
  });
}

// Generate Word document using docx and return base64
function generateDocx(minutes) {
  return new Promise((resolve, reject) => {
    try {
      console.log("Starting Word document generation");
      if (!minutes || typeof minutes !== "string") {
        throw new Error("Invalid minutes input for Word generation");
      }

      // Split markdown into lines and create paragraphs
      const lines = minutes.split("\n").filter((line) => line.trim());
      const paragraphs = [];

      lines.forEach((line) => {
        // Skip empty lines
        if (!line.trim()) return;

        // Handle headers
        if (line.startsWith("# ")) {
          paragraphs.push(
            new Paragraph({
              text: line.slice(2).trim(),
              heading: "Heading1",
              thematicBreak: true,
              spacing: { after: 240 }, // 12pt spacing after
              children: [
                new TextRun({
                  text: line.slice(2).trim(),
                  bold: true,
                  size: 32, // 16pt
                  color: "800080", // Purple
                }),
              ],
            })
          );
        } else if (line.startsWith("## ")) {
          paragraphs.push(
            new Paragraph({
              text: line.slice(3).trim(),
              heading: "Heading2",
              spacing: { after: 200 }, // 10pt spacing after
              children: [
                new TextRun({
                  text: line.slice(3).trim(),
                  bold: true,
                  size: 28, // 14pt
                  color: "800080", // Purple
                }),
              ],
            })
          );
        } else {
          // Handle regular lines with bold text (**text**)
          const textRuns = [];
          let currentIndex = 0;
          const boldRegex = /\*\*(.*?)\*\*/g;
          let match;

          while ((match = boldRegex.exec(line)) !== null) {
            const before = line.slice(currentIndex, match.index);
            if (before) {
              textRuns.push(new TextRun({ text: before, bold: false }));
            }
            textRuns.push(new TextRun({ text: match[1], bold: true }));
            currentIndex = match.index + match[0].length;
          }
          if (currentIndex < line.length) {
            textRuns.push(
              new TextRun({ text: line.slice(currentIndex), bold: false })
            );
          }
          if (textRuns.length === 0) {
            textRuns.push(new TextRun({ text: line, bold: false }));
          }

          paragraphs.push(
            new Paragraph({
              children: textRuns,
              spacing: { after: 120 }, // 6pt spacing after
            })
          );
        }
      });

      // Create document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      Packer.toBuffer(doc)
        .then((buffer) => {
          const docxBase64 = Buffer.from(buffer).toString("base64");
          console.log(
            `Word document generated, base64 length: ${docxBase64.length}`
          );
          logMemoryUsage("Word Generated");
          resolve(docxBase64);
        })
        .catch((error) => {
          console.error("Word buffer error:", error);
          reject(error);
        });
    } catch (error) {
      console.error("Word generation error:", {
        message: error.message,
        stack: error.stack,
      });
      reject(error);
    }
  });
}

// Generate markdown and return base64
function generateMarkdown(minutes) {
  try {
    console.log("Starting Markdown generation");
    if (!minutes || typeof minutes !== "string") {
      throw new Error("Invalid minutes input for Markdown generation");
    }
    const markdownBase64 = Buffer.from(minutes).toString("base64");
    console.log(`Markdown generated, base64 length: ${markdownBase64.length}`);
    logMemoryUsage("Markdown Generated");
    return markdownBase64;
  } catch (error) {
    console.error("Markdown generation error:", {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

// Cleanup function
async function cleanupTempFiles(...filePaths) {
  for (const filePath of filePaths) {
    try {
      if (filePath && (await fsPromises.stat(filePath)).isFile()) {
        await fsPromises.unlink(filePath);
        console.log(`Cleaned up file: ${filePath}`);
      }
    } catch (error) {
      console.warn(`Failed to clean up file ${filePath}:`, error.message);
    }
  }
}

// Ensure directory exists
async function ensureDirectoryExists(dirPath) {
  try {
    await fsPromises.mkdir(dirPath, { recursive: true });
    console.log(`Ensured directory exists: ${dirPath}`);
  } catch (error) {
    console.error(`Failed to create directory ${dirPath}:`, error);
    throw error;
  }
}

// Main POST handler
export async function POST(req) {
  const startTime = Date.now();
  const timeoutLimit = 50_000; // 50 seconds
  let filePath = null;

  try {
    // Parse uploaded file
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ["audio/mpeg", "audio/wav"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: "Invalid file type. Only MP3 and WAV are supported." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return Response.json(
        { error: "File size exceeds 5MB limit." },
        { status: 400 }
      );
    }

    // Sanitize file name
    const rawFileName = file.name || `upload-${Date.now()}`;
    const sanitizedFileName = sanitizeFileName(`${Date.now()}-${rawFileName}`);
    const tempDir = os.tmpdir();
    filePath = path.join(tempDir, sanitizedFileName);

    // Ensure the temp directory exists
    await ensureDirectoryExists(tempDir);

    // Save file to temp directory
    const fileBuffer = await file.arrayBuffer();
    try {
      await fsPromises.writeFile(filePath, Buffer.from(fileBuffer));
      console.log(`File written to: ${filePath}`);
      const stats = await fsPromises.stat(filePath);
      console.log(`File stats: size=${stats.size} bytes`);
    } catch (writeError) {
      console.error("File write error:", writeError);
      return Response.json(
        { error: `Failed to save file: ${writeError.message}` },
        { status: 500 }
      );
    }

    // Verify file exists
    try {
      await fsPromises.access(filePath, fs.constants.F_OK);
      console.log(`File verified at: ${filePath}`);
    } catch (accessError) {
      console.error("File access error:", accessError);
      await cleanupTempFiles(filePath);
      return Response.json(
        { error: "File not found after saving." },
        { status: 500 }
      );
    }

    // Log audio duration
    let audioDuration = 0;
    try {
      const metadata = await mm.parseFile(filePath);
      audioDuration = metadata.format.duration || 0;
      console.log(`Audio duration: ${audioDuration.toFixed(2)} seconds`);
    } catch (error) {
      console.warn("Failed to parse audio metadata:", error.message);
    }

    logMemoryUsage("File Saved");

    // Check timeout
    if (Date.now() - startTime > timeoutLimit) {
      await cleanupTempFiles(filePath);
      return Response.json(
        { error: "Processing timeout: File saving took too long." },
        { status: 504 }
      );
    }

    // Transcribe audio file
    let fileStream;
    try {
      fileStream = fs.createReadStream(filePath);
      const transcriptionResponse = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: fileStream,
        response_format: "text",
        language: "en",
      });
      fileStream.destroy();
      console.log("Transcription completed successfully");
      const transcription = transcriptionResponse || "";
      if (!transcription || transcription.trim().length === 0) {
        await cleanupTempFiles(filePath);
        return Response.json(
          { error: "Transcription failed: No content was transcribed." },
          { status: 500 }
        );
      }

      // Clean up audio file
      await cleanupTempFiles(filePath);
      filePath = null;
      logMemoryUsage("Transcription Complete");

      // Check timeout
      if (Date.now() - startTime > timeoutLimit) {
        return Response.json(
          { error: "Processing timeout: Transcription took too long." },
          { status: 504 }
        );
      }

      // Generate minutes using GPT-4o-mini
      console.log("Starting meeting minutes generation");
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Create comprehensive meeting minutes from transcriptions.
            Structure:
            # Meeting Minutes
            ## Participants
            ## Key Discussion Points
            ## Decisions
            ## Action Items
            ## Next Steps
            Use markdown formatting.`,
          },
          {
            role: "user",
            content: `Create detailed meeting minutes from this transcription:\n${transcription}`,
          },
        ],
        max_tokens: 500,
      });

      const minutes = completion.choices[0].message.content || "";
      if (!minutes.trim()) {
        return Response.json(
          { error: "Failed to generate meeting minutes." },
          { status: 500 }
        );
      }
      console.log(
        `Meeting minutes generated, length: ${minutes.length} characters`
      );
      console.log("Sample minutes:", minutes.slice(0, 200)); // Log first 200 chars for debugging

      // Log token usage and estimated cost
      console.log("Completion usage:", completion.usage);
      const tokenCost =
        completion.usage.prompt_tokens * 0.00000015 +
        completion.usage.completion_tokens * 0.0000006;
      const transcriptionCost = (audioDuration / 60) * 0.006;
      console.log(
        `Estimated OpenAI cost: $${(tokenCost + transcriptionCost).toFixed(
          5
        )} (Transcription: $${transcriptionCost.toFixed(
          5
        )}, Completion: $${tokenCost.toFixed(5)})`
      );
      logMemoryUsage("Minutes Generated");

      // Check timeout
      if (Date.now() - startTime > timeoutLimit) {
        return Response.json(
          { error: "Processing timeout: Minutes generation took too long." },
          { status: 504 }
        );
      }

      // Generate files in memory
      let pdfBase64 = null;
      let docxBase64 = null;
      let markdownBase64 = null;

      try {
        pdfBase64 = await generatePDFWithJSPDF(minutes);
      } catch (error) {
        console.warn("PDF generation failed:", error.message);
      }

      try {
        docxBase64 = await generateDocx(minutes);
      } catch (error) {
        console.warn("Word document generation failed:", error.message);
      }

      try {
        markdownBase64 = await generateMarkdown(minutes);
      } catch (error) {
        console.warn("Markdown generation failed:", error.message);
      }

      // Log response details with base64 lengths
      console.log("Sending response with base64 data:", {
        minutesLength: minutes.length,
        pdfBase64Length: pdfBase64 ? pdfBase64.length : null,
        docxBase64Length: docxBase64 ? docxBase64.length : null,
        markdownBase64Length: markdownBase64 ? markdownBase64.length : null,
      });

      // Check if all generations failed
      if (!pdfBase64 && !docxBase64 && !markdownBase64) {
        console.warn("All file generations failed");
        return Response.json({
          success: true,
          minutes,
          pdfBase64: null,
          docxBase64: null,
          markdownBase64: null,
          processingTime: Date.now() - startTime,
          audioDuration: audioDuration.toFixed(2),
          estimatedCost: (tokenCost + transcriptionCost).toFixed(5),
          warning:
            "File generation failed. Only meeting minutes are available.",
        });
      }

      // Calculate processing time
      const processingTime = Date.now() - startTime;
      console.log(`Total processing time: ${processingTime}ms`);

      // Return response
      return Response.json({
        success: true,
        minutes,
        pdfBase64,
        docxBase64,
        markdownBase64,
        processingTime,
        audioDuration: audioDuration.toFixed(2),
        estimatedCost: (tokenCost + transcriptionCost).toFixed(5),
      });
    } catch (transcriptionError) {
      console.error("Transcription error:", transcriptionError);
      if (fileStream) fileStream.destroy();
      await cleanupTempFiles(filePath);
      return Response.json(
        { error: "Transcription failed: " + transcriptionError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Processing Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    if (filePath) await cleanupTempFiles(filePath);

    return Response.json(
      {
        error: `File processing failed: ${error.message || "Unknown error"}`,
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

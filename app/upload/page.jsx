// 'use client';

// import { useState } from 'react';
// import Link from 'next/link';

// export default function Upload() {
//     const [file, setFile] = useState(null);
//     const [error, setError] = useState('');
//     const [success, setSuccess] = useState('');
//     const [minutes, setMinutes] = useState('');
//     const [pdfPath, setPdfPath] = useState('');
//     const [markdownPath, setMarkdownPath] = useState('');
//     const [docxPath, setDocxPath] = useState('');
//     const [isProcessing, setIsProcessing] = useState(false);

//     const handleFileChange = (e) => {
//         setFile(e.target.files[0]);
//         setError('');
//         setSuccess('');
//         setMinutes('');
//         setPdfPath('');
//         setMarkdownPath('');
//         setDocxPath('');
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         if (!file) {
//             setError('No selected file');
//             return;
//         }
//         if (!['audio/mpeg', 'audio/wav'].includes(file.type)) {
//             setError('Invalid file type. Please upload an MP3 or WAV file.');
//             return;
//         }

//         setIsProcessing(true);
//         setError('');
//         setSuccess('');

//         const formData = new FormData();
//         formData.append('file', file);

//         try {
//             const response = await fetch('/api/upload', {
//                 method: 'POST',
//                 body: formData,
//             });
//             const data = await response.json();

//             if (data.error) {
//                 setError(data.error);
//             } else {
//                 setSuccess('Processing complete');
//                 setMinutes(data.minutes);
//                 setPdfPath(data.pdfPath);
//                 setMarkdownPath(data.markdownPath);
//                 setDocxPath(data.docxPath);
//             }
//         } catch (err) {
//             setError('Error processing file');
//             console.error('Error details:', err);
//         } finally {
//             setIsProcessing(false);
//         }
//     };

//     const renderMarkdown = (text) => {
//         const lines = text.split('\n');
//         return lines.map((line, index) => {
//             line = line.trim();
//             if (line.startsWith('# ')) {
//                 return <h1 key={index} className="text-3xl font-bold text-white mb-4">{line.slice(2)}</h1>;
//             } else if (line.startsWith('## ')) {
//                 return <h2 key={index} className="text-xl font-semibold text-purple-300 mt-4 mb-2">{line.slice(3)}</h2>;
//             } else if (line.startsWith('1. ')) {
//                 return <h3 key={index} className="text-lg font-medium text-purple-200 mt-3 mb-1">{line.slice(3)}</h3>;
//             } else if (line.startsWith('- ')) {
//                 return <li key={index} className="ml-4">{line.slice(2)}</li>;
//             } else if (line) {
//                 return <p key={index} className="text-gray-200">{line.replace(/\*\*/g, '')}</p>;
//             }
//             return null;
//         });
//     };

//     return (
//         <div className="bg-gradient-to-br from-purple-900 to-black text-white min-h-screen">
//             <div className="container mx-auto px-4 py-12">
//                 <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">Upload Audio File</h1>
//                 <p className="text-center text-lg mb-8">Upload an MP3 or WAV file (up to 5MB) to generate meeting minutes...</p>
//                 <p className="text-center text-sm text-gray-400 mb-4">Note: Processing may take up to 30 seconds for small files.</p>

//                 {error && (
//                     <div className="bg-red-800 text-white p-4 rounded-lg mb-6 max-w-lg mx-auto">
//                         <p>{error}</p>
//                     </div>
//                 )}
//                 {success && (
//                     <div className="bg-green-800 text-white p-4 rounded-lg mb-6 max-w-lg mx-auto">
//                         <p>{success}</p>
//                     </div>
//                 )}

//                 <form onSubmit={handleSubmit} className="max-w-lg mx-auto relative">
//                     <div className="mb-4">
//                         <input
//                             type="file"
//                             accept=".mp3,.wav"
//                             onChange={handleFileChange}
//                             disabled={isProcessing}
//                             className="w-full text-gray-300 bg-purple-800 border border-purple-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
//                         />
//                     </div>
//                     <button
//                         type="submit"
//                         disabled={isProcessing}
//                         className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
//                     >
//                         Generate Meeting Minutes
//                     </button>
//                     {isProcessing && (
//                         <div className="absolute inset-0 flex items-center justify-center bg-purple-900 bg-opacity-75 rounded-lg">
//                             <div className="w-10 h-10 border-4 border-purple-400 border-t-purple-200 rounded-full animate-spin"></div>
//                             <p className="ml-3 text-purple-200">Processing...</p>
//                         </div>
//                     )}
//                 </form>

//                 {minutes && (
//                     <div className="mt-6 max-w-2xl mx-auto bg-purple-800 p-6 rounded-lg shadow-lg">
//                         <h2 className="text-2xl font-bold mb-4 text-purple-200">Meeting Minutes</h2>
//                         <div className="prose prose-invert max-w-none text-gray-200">
//                             {renderMarkdown(minutes)}
//                         </div>
//                         <div className="mt-4 flex space-x-4">
//                             {pdfPath && (
//                                 <a
//                                     href={`/api/download?path=${encodeURIComponent(pdfPath)}`}
//                                     className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
//                                     download
//                                 >
//                                     Download PDF
//                                 </a>
//                             )}
//                             {markdownPath && (
//                                 <a
//                                     href={`/api/download?path=${encodeURIComponent(markdownPath)}`}
//                                     className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
//                                     download
//                                 >
//                                     Download Markdown
//                                 </a>
//                             )}
//                             {docxPath && (
//                                 <a
//                                     href={`/api/download?path=${encodeURIComponent(docxPath)}`}
//                                     className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
//                                     download
//                                 >
//                                     Download Word
//                                 </a>
//                             )}
//                         </div>
//                     </div>
//                 )}

//                 <div className="text-center mt-6">
//                     <Link href="/">
//                         <span className="text-purple-300 hover:text-purple-100 cursor-pointer">Back to Home</span>
//                     </Link>
//                 </div>
//             </div>
//         </div>
//     );
// }


// DOWNLOADS WORK LOCALLY ONLY 
// 'use client';

// import { useState } from 'react';
// import Link from 'next/link';

// export default function Upload() {
//     const [file, setFile] = useState(null);
//     const [error, setError] = useState('');
//     const [success, setSuccess] = useState('');
//     const [minutes, setMinutes] = useState('');
//     const [pdfPath, setPdfPath] = useState('');
//     const [markdownPath, setMarkdownPath] = useState('');
//     const [docxPath, setDocxPath] = useState('');
//     const [isProcessing, setIsProcessing] = useState(false);

//     const handleFileChange = (e) => {
//         setFile(e.target.files[0]);
//         setError('');
//         setSuccess('');
//         setMinutes('');
//         setPdfPath('');
//         setMarkdownPath('');
//         setDocxPath('');
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         if (!file) {
//             setError('No selected file');
//             return;
//         }
//         if (!['audio/mpeg', 'audio/wav'].includes(file.type)) {
//             setError('Invalid file type. Please upload an MP3 or WAV file.');
//             return;
//         }

//         setIsProcessing(true);
//         setError('');
//         setSuccess('');

//         const formData = new FormData();
//         formData.append('file', file);

//         try {
//             const response = await fetch('/api/upload', {
//                 method: 'POST',
//                 body: formData,
//             });
//             const data = await response.json();

//             if (data.error) {
//                 setError(data.error || 'Failed to process file. Please try again.');
//             } else {
//                 setSuccess('Processing complete');
//                 setMinutes(data.minutes);
//                 setPdfPath(data.pdfPath);
//                 setMarkdownPath(data.markdownPath);
//                 setDocxPath(data.docxPath);
//             }
//         } catch (err) {
//             setError('Error processing file. Please check your network or try again later.');
//             console.error('Fetch error:', err);
//         } finally {
//             setIsProcessing(false);
//         }
//     };

//     const renderMarkdown = (text) => {
//         const lines = text.split('\n');
//         return lines.map((line, index) => {
//             line = line.trim();
//             if (line.startsWith('# ')) {
//                 return <h1 key={index} className="text-3xl font-bold text-white mb-4">{line.slice(2)}</h1>;
//             } else if (line.startsWith('## ')) {
//                 return <h2 key={index} className="text-xl font-semibold text-purple-300 mt-4 mb-2">{line.slice(3)}</h2>;
//             } else if (line.startsWith('1. ')) {
//                 return <h3 key={index} className="text-lg font-medium text-purple-200 mt-3 mb-1">{line.slice(3)}</h3>;
//             } else if (line.startsWith('- ')) {
//                 return <li key={index} className="ml-4">{line.slice(2)}</li>;
//             } else if (line) {
//                 return <p key={index} className="text-gray-200">{line.replace(/\*\*/g, '')}</p>;
//             }
//             return null;
//         });
//     };

//     return (
//         <div className="bg-gradient-to-br from-purple-900 to-black text-white min-h-screen">
//             <div className="container mx-auto px-4 py-12">
//                 <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">Upload Audio File</h1>
//                 <p className="text-center text-lg mb-8">Upload an MP3 or WAV file (up to 5MB) to generate meeting minutes...</p>
//                 <p className="text-center text-sm text-gray-400 mb-4">Note: Processing may take up to 30 seconds for small files.</p>

//                 {error && (
//                     <div className="bg-red-800 text-white p-4 rounded-lg mb-6 max-w-lg mx-auto">
//                         <p>{error}</p>
//                     </div>
//                 )}
//                 {success && (
//                     <div className="bg-green-800 text-white p-4 rounded-lg mb-6 max-w-lg mx-auto">
//                         <p>{success}</p>
//                     </div>
//                 )}

//                 <form onSubmit={handleSubmit} className="max-w-lg mx-auto relative">
//                     <div className="mb-4">
//                         <input
//                             type="file"
//                             accept=".mp3,.wav"
//                             onChange={handleFileChange}
//                             disabled={isProcessing}
//                             className="w-full text-gray-300 bg-purple-800 border border-purple-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
//                         />
//                     </div>
//                     <button
//                         type="submit"
//                         disabled={isProcessing}
//                         className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
//                     >
//                         Generate Meeting Minutes
//                     </button>
//                     {isProcessing && (
//                         <div className="absolute inset-0 flex items-center justify-center bg-purple-900 bg-opacity-75 rounded-lg">
//                             <div className="w-10 h-10 border-4 border-purple-400 border-t-purple-200 rounded-full animate-spin"></div>
//                             <p className="ml-3 text-purple-200">Processing...</p>
//                         </div>
//                     )}
//                 </form>

//                 {minutes && (
//                     <div className="mt-6 max-w-2xl mx-auto bg-purple-800 p-6 rounded-lg shadow-lg">
//                         <h2 className="text-2xl font-bold mb-4 text-purple-200">Meeting Minutes</h2>
//                         <div className="prose prose-invert max-w-none text-gray-200">
//                             {renderMarkdown(minutes)}
//                         </div>
//                         <div className="mt-4 flex space-x-4">
//                             {pdfPath && (
//                                 <a
//                                     href={`/api/download?path=${encodeURIComponent(pdfPath)}`}
//                                     className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
//                                     download
//                                 >
//                                     Download PDF
//                                 </a>
//                             )}
//                             {markdownPath && (
//                                 <a
//                                     href={`/api/download?path=${encodeURIComponent(markdownPath)}`}
//                                     className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
//                                     download
//                                 >
//                                     Download Markdown
//                                 </a>
//                             )}
//                             {docxPath && (
//                                 <a
//                                     href={`/api/download?path=${encodeURIComponent(docxPath)}`}
//                                     className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
//                                     download
//                                 >
//                                     Download Word
//                                 </a>
//                             )}
//                         </div>
//                     </div>
//                 )}

//                 <div className="text-center mt-6">
//                     <Link href="/">
//                         <span className="text-purple-300 hover:text-purple-100 cursor-pointer">Back to Home</span>
//                     </Link>
//                 </div>
//             </div>
//         </div>
//     );
// }



'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Upload() {
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [warning, setWarning] = useState('');
    const [minutes, setMinutes] = useState('');
    const [pdfBase64, setPdfBase64] = useState('');
    const [docxBase64, setDocxBase64] = useState('');
    const [markdownBase64, setMarkdownBase64] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
        setSuccess('');
        setWarning('');
        setMinutes('');
        setPdfBase64('');
        setDocxBase64('');
        setMarkdownBase64('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('No file selected');
            return;
        }
        if (!['audio/mpeg', 'audio/wav'].includes(file.type)) {
            setError('Invalid file type. Please upload an MP3 or WAV file.');
            return;
        }

        setIsProcessing(true);
        setError('');
        setSuccess('');
        setWarning('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('Server response:', data); // Log response for debugging

            if (data.error) {
                setError(data.error || 'Failed to process file. Please try again.');
            } else {
                setSuccess('Processing complete');
                setMinutes(data.minutes || '');
                setPdfBase64(data.pdfBase64 || '');
                setDocxBase64(data.docxBase64 || '');
                setMarkdownBase64(data.markdownBase64 || '');
                if (data.warning) {
                    setWarning(data.warning);
                }
                // Log base64 lengths
                console.log('Base64 data:', {
                    pdfBase64Length: data.pdfBase64 ? data.pdfBase64.length : null,
                    docxBase64Length: data.docxBase64 ? data.docxBase64.length : null,
                    markdownBase64Length: data.markdownBase64 ? data.markdownBase64.length : null,
                });
            }
        } catch (err) {
            setError(`Error processing file: ${err.message}. Please try again.`);
            console.error('Fetch error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadFile = (base64, fileName, mimeType) => {
        try {
            if (!base64) {
                throw new Error('No file data available for download.');
            }
            // Validate base64 string
            if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
                throw new Error('Invalid base64 data.');
            }
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log(`Download triggered for ${fileName}`);
        } catch (error) {
            console.error(`Error downloading ${fileName}:`, error);
            setError(`Failed to download ${fileName}: ${error.message}`);
        }
    };

    // Optional: Store in localStorage
    const storeInLocalStorage = (key, base64) => {
        try {
            localStorage.setItem(key, base64);
            console.log(`Stored ${key} in localStorage`);
        } catch (error) {
            console.error(`Error storing ${key} in localStorage:`, error);
            setError('Failed to store file in local storage. Storage may be full.');
        }
    };

    const handleDownloadPDF = () => {
        if (pdfBase64) {
            downloadFile(pdfBase64, `minutes-${Date.now()}.pdf`, 'application/pdf');
            // Uncomment to enable local storage
            // storeInLocalStorage('minutes-pdf', pdfBase64);
        } else {
            setError('PDF file is not available for download.');
        }
    };

    const handleDownloadDocx = () => {
        if (docxBase64) {
            downloadFile(
                docxBase64,
                `minutes-${Date.now()}.docx`,
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            );
            // Uncomment to enable local storage
            // storeInLocalStorage('minutes-docx', docxBase64);
        } else {
            setError('Word file is not available for download.');
        }
    };

    const handleDownloadMarkdown = () => {
        if (markdownBase64) {
            downloadFile(markdownBase64, `minutes-${Date.now()}.md`, 'text/markdown');
            // Uncomment to enable local storage
            // storeInLocalStorage('minutes-md', markdownBase64);
        } else {
            setError('Markdown file is not available for download.');
        }
    };

    const renderMarkdown = (text) => {
        if (!text) return null;
        const lines = text.split('\n');
        return lines.map((line, index) => {
            line = line.trim();
            if (line.startsWith('# ')) {
                return (
                    <h1 key={index} className="text-3xl font-bold text-white mb-4">
                        {line.slice(2)}
                    </h1>
                );
            } else if (line.startsWith('## ')) {
                return (
                    <h2 key={index} className="text-xl font-semibold text-purple-300 mt-4 mb-2">
                        {line.slice(3)}
                    </h2>
                );
            } else if (line.startsWith('1. ')) {
                return (
                    <h3 key={index} className="text-lg font-medium text-purple-200 mt-3 mb-1">
                        {line.slice(3)}
                    </h3>
                );
            } else if (line.startsWith('- ')) {
                return (
                    <li key={index} className="ml-4">
                        {line.slice(2)}
                    </li>
                );
            } else if (line) {
                return (
                    <p key={index} className="text-gray-200">
                        {line.replace(/\*\*/g, '')}
                    </p>
                );
            }
            return null;
        });
    };

    return (
        <div className="bg-gradient-to-br from-purple-900 to-black text-white min-h-screen">
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">Upload Audio File</h1>
                <p className="text-center text-lg mb-8">
                    Upload an MP3 or WAV file (up to 5MB) to generate meeting minutes...
                </p>
                <p className="text-center text-sm text-gray-400 mb-4">
                    Note: Processing may take up to 30 seconds for small files.
                </p>

                {error && (
                    <div className="bg-red-800 text-white p-4 rounded-lg mb-6 max-w-lg mx-auto">
                        <p>{error}</p>
                    </div>
                )}
                {success && (
                    <div className="bg-green-800 text-white p-4 rounded-lg mb-6 max-w-lg mx-auto">
                        <p>{success}</p>
                    </div>
                )}
                {warning && (
                    <div className="bg-yellow-800 text-white p-4 rounded-lg mb-6 max-w-lg mx-auto">
                        <p>{warning}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="max-w-lg mx-auto relative">
                    <div className="mb-4">
                        <input
                            type="file"
                            accept=".mp3,.wav"
                            onChange={handleFileChange}
                            disabled={isProcessing}
                            className="w-full text-gray-300 bg-purple-800 border border-purple-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isProcessing}
                        className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        Generate Meeting Minutes
                    </button>
                    {isProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-purple-900 bg-opacity-75 rounded-lg">
                            <div className="w-10 h-10 border-4 border-purple-400 border-t-purple-200 rounded-full animate-spin"></div>
                            <p className="ml-3 text-purple-200">Processing...</p>
                        </div>
                    )}
                </form>

                {minutes && (
                    <div className="mt-6 max-w-2xl mx-auto bg-purple-800 p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold mb-4 text-purple-200">Meeting Minutes</h2>
                        <div className="prose prose-invert max-w-none text-gray-200">
                            {renderMarkdown(minutes)}
                        </div>
                        <div className="mt-4 flex space-x-4">
                            <button
                                onClick={handleDownloadPDF}
                                disabled={!pdfBase64}
                                className={`inline-block bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ${!pdfBase64 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'
                                    }`}
                            >
                                Download PDF
                            </button>
                            <button
                                onClick={handleDownloadDocx}
                                disabled={!docxBase64}
                                className={`inline-block bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ${!docxBase64 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'
                                    }`}
                            >
                                Download Word
                            </button>
                            <button
                                onClick={handleDownloadMarkdown}
                                disabled={!markdownBase64}
                                className={`inline-block bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ${!markdownBase64 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'
                                    }`}
                            >
                                Download Markdown
                            </button>
                        </div>
                    </div>
                )}

                <div className="text-center mt-6">
                    <Link href="/">
                        <span className="text-purple-300 hover:text-purple-100 cursor-pointer">Back to Home</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
'use client';

import React, { useState } from 'react';
import { Metadata } from 'next';
import CSVBulkProcessor from '../../components/CSVBulkProcessor';

// This would be export const metadata in a real implementation
// Since we're in a client component, we'll handle SEO differently
const pageMetadata = {
  title: 'Bulk QR Code Generator - CSV Upload | QuicklyQR',
  description: 'Generate thousands of QR codes from CSV files. Upload your data and create customized QR codes in bulk with advanced processing options.',
  keywords: 'bulk QR generator, CSV to QR codes, batch QR creation, business QR tools',
};

export default function BulkGeneratorPage() {
  const [showProcessor, setShowProcessor] = useState(false);
  const [processingOptions, setProcessingOptions] = useState({
    qrSize: 300,
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    errorCorrectionLevel: 'M' as const,
  });

  return (
    <>
      {/* SEO Meta Tags */}
      <head>
        <title>{pageMetadata.title}</title>
        <meta name="description" content={pageMetadata.description} />
        <meta name="keywords" content={pageMetadata.keywords} />
        <meta property="og:title" content={pageMetadata.title} />
        <meta property="og:description" content={pageMetadata.description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageMetadata.title} />
        <meta name="twitter:description" content={pageMetadata.description} />
      </head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  QuicklyQR
                </h1>
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Bulk Generator
                </span>
              </div>
              <nav className="flex space-x-4">
                <a href="/" className="text-gray-600 hover:text-gray-900">
                  Single QR
                </a>
                <a href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </a>
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Bulk QR Code Generator
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Transform your CSV data into professional QR codes. Upload once, generate thousands. 
              Perfect for inventory management, event tickets, contact cards, and marketing campaigns.
            </p>
            
            <div className="flex justify-center">
              <button
                onClick={() => setShowProcessor(true)}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Start Bulk Processing
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                CSV Upload
              </h3>
              <p className="text-gray-600">
                Simply upload your CSV file with URLs, text, or contact information. 
                Our system automatically detects the data type and generates appropriate QR codes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Customization
              </h3>
              <p className="text-gray-600">
                Customize colors, sizes, error correction levels, and add logos. 
                All QR codes maintain professional quality and scanning reliability.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Instant Download
              </h3>
              <p className="text-gray-600">
                Get all your QR codes in a organized ZIP file. 
                High-resolution PNG files ready for print or digital use.
              </p>
            </div>
          </div>

          {/* Process Steps */}
          <div className="bg-white rounded-lg p-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              How It Works
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  1
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Upload CSV</h3>
                <p className="text-sm text-gray-600">
                  Upload your CSV file with QR code data
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  2
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Preview & Select</h3>
                <p className="text-sm text-gray-600">
                  Review your data and select rows to process
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  3
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Generate</h3>
                <p className="text-sm text-gray-600">
                  Watch as QR codes are generated in real-time
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  4
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Download</h3>
                <p className="text-sm text-gray-600">
                  Download your organized ZIP file of QR codes
                </p>
              </div>
            </div>
          </div>

          {/* Sample CSV Format */}
          <div className="bg-gray-50 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Sample CSV Format
            </h3>
            <div className="bg-white p-4 rounded border font-mono text-sm overflow-x-auto">
              <div className="text-gray-600 mb-2">// Example CSV structure:</div>
              <div>name,url,description</div>
              <div>"Company Website","https://example.com","Main company site"</div>
              <div>"Product Page","https://example.com/product","Featured product"</div>
              <div>"Contact Info","https://example.com/contact","Get in touch"</div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              💡 <strong>Tip:</strong> The first row should contain column headers. 
              Any column can be used for QR code generation.
            </p>
          </div>
        </div>

        {/* CSV Bulk Processor Modal */}
        <CSVBulkProcessor
          isOpen={showProcessor}
          onClose={() => setShowProcessor(false)}
          processingOptions={processingOptions}
        />
      </div>
    </>
  );
}
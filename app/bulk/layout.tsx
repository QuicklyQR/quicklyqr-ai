import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bulk QR Generator | QuicklyQR',
  description: 'Generate thousands of QR codes from CSV files. Professional bulk QR code processing for businesses.',
  keywords: 'bulk QR generator, CSV to QR codes, batch QR creation, business QR tools',
  openGraph: {
    title: 'Bulk QR Generator | QuicklyQR',
    description: 'Generate thousands of QR codes from CSV files. Professional bulk QR code processing for businesses.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bulk QR Generator | QuicklyQR',
    description: 'Generate thousands of QR codes from CSV files. Professional bulk QR code processing for businesses.',
  },
};

export default function BulkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
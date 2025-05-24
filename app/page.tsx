import QRCodeBuilder from '../components/QRCodeBuilder';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">QuicklyQR.ai</h1>
          <p className="text-lg text-gray-600">
            Generate QR codes instantly for URLs, WiFi, contacts, and text
          </p>
        </div>
        <QRCodeBuilder />
      </div>
    </main>
  );
}

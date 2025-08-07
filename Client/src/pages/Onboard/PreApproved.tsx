import React, { useState } from 'react';

const PreApproved: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    income: '',
    creditScore: '',
    debts: ''
  });
  const [showIframe, setShowIframe] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(formData);
    const url = `https://external-preapproval-service.com/form?${params}`;
    setIframeUrl(url);
    setShowIframe(true);
  };

  if (showIframe) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <button 
            onClick={() => setShowIframe(false)}
            className="mb-4 px-4 py-2 bg-brown text-white rounded"
          >
            Back to Form
          </button>
          <iframe
            src={iframeUrl}
            width="100%"
            height="600px"
            title="Pre-Approval"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Get Pre-Approved</h1>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full p-3 border rounded"
            required
          />
          <input
            type="number"
            placeholder="Monthly Income"
            value={formData.income}
            onChange={(e) => setFormData({...formData, income: e.target.value})}
            className="w-full p-3 border rounded"
            required
          />
          <input
            type="number"
            placeholder="Credit Score"
            value={formData.creditScore}
            onChange={(e) => setFormData({...formData, creditScore: e.target.value})}
            className="w-full p-3 border rounded"
            required
          />
          <input
            type="number"
            placeholder="Monthly Debts"
            value={formData.debts}
            onChange={(e) => setFormData({...formData, debts: e.target.value})}
            className="w-full p-3 border rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-brown text-white py-3 rounded hover:bg-brown/90"
          >
            Submit Application
          </button>
        </form>
      </div>
    </div>
  );
};

export default PreApproved;
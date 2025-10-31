import React from 'react';

const TermsAndConditions = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By accessing and using this marketplace, you accept and agree to be bound by the terms and provision of this agreement.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">2. Cryptocurrency Payment Disclaimers</h2>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
          <h3 className="font-semibold mb-2">⚠️ Important Cryptocurrency Payment Warnings</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Volatility Risk:</strong> Cryptocurrency values can fluctuate significantly. The value of your payment in USD may change between the time you initiate the transaction and when it is processed.
            </li>
            <li>
              <strong>Irreversibility:</strong> Once a cryptocurrency transaction is confirmed on the blockchain, it cannot be reversed. Ensure all payment details are correct before proceeding.
            </li>
            <li>
              <strong>Network Fees:</strong> You may be responsible for blockchain network fees (gas fees) in addition to the purchase amount. These fees vary and are not controlled by our platform.
            </li>
            <li>
              <strong>Regulatory Compliance:</strong> Cryptocurrency regulations vary by jurisdiction. You are responsible for ensuring compliance with applicable laws in your location.
            </li>
            <li>
              <strong>Technical Risks:</strong> Blockchain networks may experience delays, congestion, or technical issues that could affect transaction processing times.
            </li>
            <li>
              <strong>Tax Implications:</strong> Cryptocurrency transactions may have tax implications. Consult with a tax professional regarding your specific situation.
            </li>
            <li>
              <strong>Security Responsibility:</strong> You are responsible for the security of your cryptocurrency wallet and private keys. We cannot recover lost or stolen funds.
            </li>
            <li>
              <strong>Exchange Rate Risk:</strong> The USD amount you see may not reflect the real-time cryptocurrency market value. Price changes can occur rapidly.
            </li>
          </ul>
        </div>
        <p className="text-sm text-gray-600">
          By proceeding with cryptocurrency payments, you acknowledge and accept these risks. We recommend consulting with financial advisors before making cryptocurrency transactions.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">3. Payment Processing</h2>
        <p className="mb-4">
          All payments are processed through our secure payment gateway. We use industry-standard encryption and security measures to protect your financial information.
        </p>
        <p className="mb-4">
          For cryptocurrency payments, we utilize Helio's payment processing services. All transactions are subject to Helio's terms of service and privacy policy.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">4. Refunds and Disputes</h2>
        <p className="mb-4">
          Due to the nature of digital goods and cryptocurrency transactions, refunds may be limited. Please review product descriptions carefully before purchasing.
        </p>
        <p className="mb-4">
          Disputes regarding cryptocurrency payments should be addressed through our support channels. We will work to resolve issues fairly and efficiently.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
        <p className="mb-4">
          We are not liable for any losses incurred due to cryptocurrency market volatility, technical issues with blockchain networks, or regulatory changes affecting cryptocurrency usage.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">6. Contact Information</h2>
        <p className="mb-4">
          If you have any questions about these terms or cryptocurrency payments, please contact our support team.
        </p>
      </section>
    </div>
  );
};

export default TermsAndConditions;
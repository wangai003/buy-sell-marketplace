import React, { useState, useEffect } from 'react';
import { Modal, message, Button, Descriptions, Spin, Alert, Progress } from 'antd';
import { CopyOutlined, CheckOutlined, WalletOutlined } from '@ant-design/icons';

const DirectWalletPaymentModal = ({
  visible,
  onCancel,
  paymentDetails,
  onPaymentSuccess,
  orderType
}) => {
  const [copied, setCopied] = useState({});
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [verifyError, setVerifyError] = useState(null);

  useEffect(() => {
    if (visible && paymentDetails) {
      setPaymentStatus('pending');
      setProgress(0);
      setTimeElapsed(0);

      // Start polling for payment status
      const interval = setInterval(() => {
        checkPaymentStatus();
        setTimeElapsed(prev => {
          const newTime = prev + 5;
          // Update progress (max 5 minutes = 300 seconds)
          setProgress(Math.min((newTime / 300) * 100, 95)); // Max 95% until confirmed
          return newTime;
        });
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [visible, paymentDetails]);

  const checkPaymentStatus = async () => {
    if (!paymentDetails?.orderId) return;
    
    setCheckingStatus(true);
    setVerifyError(null);
    try {
      const token = localStorage.getItem('buynsell') ? JSON.parse(localStorage.getItem('buynsell')).token : '';
      const response = await fetch(
        `${process.env.REACT_APP_API}/payment/external-wallet/verify/${paymentDetails.orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();

      if (response.ok && data.verified) {
        setPaymentStatus('paid');
        message.success('Payment confirmed!');
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      } else if (!response.ok) {
        setVerifyError(data.error || 'Failed to verify payment');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setVerifyError('Failed to verify payment');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [key]: true });
    message.success('Copied to clipboard!');
    setTimeout(() => {
      setCopied({ ...copied, [key]: false });
    }, 2000);
  };

  if (!paymentDetails) {
    return (
      <Modal
        visible={visible}
        open={visible}
        onCancel={onCancel}
        footer={null}
        title="Preparing Payment..."
        width={600}
      >
        <div className="text-center p-5">
          <Spin size="large" />
          <p style={{ marginTop: '15px', color: '#666' }}>Loading payment details...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      open={visible}
      onCancel={onCancel}
      footer={null}
      title={
        orderType === 'auction'
          ? 'Pay for Auction Order'
          : orderType === 'subscription'
            ? 'Activate Subscription'
            : 'Complete Payment'
      }
      width={600}
    >
      {orderType === 'auction' && (
        <Alert
          message="Congratulations!"
          description="You won this auction. Please complete payment to receive your item."
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Order ID">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
              {paymentDetails.orderId}
            </span>
            <Button
              type="text"
              size="small"
              icon={copied.orderId ? <CheckOutlined /> : <CopyOutlined />}
              onClick={() => handleCopy(paymentDetails.orderId, 'orderId')}
            />
          </div>
        </Descriptions.Item>
        <Descriptions.Item label={orderType === 'subscription' ? 'Subscription' : 'Product'}>
          {paymentDetails.name}
        </Descriptions.Item>
        <Descriptions.Item label="Amount">
          <strong>${paymentDetails.amount} {paymentDetails.assetCode || 'USDC'}</strong>
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: 20, padding: 15, background: '#f0f8ff', borderRadius: 4, border: '1px solid #1890ff' }}>
        <h4 style={{ color: '#1890ff' }}><WalletOutlined /> External Wallet Payment Instructions:</h4>
        <ol>
          <li>Open the Azix app and pay using your external wallet.</li>
          <li>Use the <strong>Order ID</strong> above when prompted.</li>
          <li>Complete the payment in your wallet (USDC/USDT on Polygon).</li>
          <li>This app only confirms payment after Azix verifies it on-chain.</li>
        </ol>

        <Alert
          message="🔍 How Confirmation Works"
          description={
            <div style={{ fontSize: '12px', marginTop: 8 }}>
              <strong>Matching Criteria:</strong><br/>
              • Azix confirms payment for this order ID<br/>
              • Payment is completed on-chain<br/>
              • Amount and asset code match<br/>
              • Unique transaction hash per order
            </div>
          }
          type="info"
          showIcon
          style={{ marginTop: 10, fontSize: '12px' }}
        />

        {paymentStatus === 'pending' && (
          <div style={{ marginTop: 15, textAlign: 'center' }}>
            <p style={{ marginBottom: 10, color: '#666' }}>
              <strong>Automatic Payment Detection Active</strong>
            </p>
            <Progress
              percent={progress}
              status="active"
              strokeColor="#1890ff"
              format={() => `${Math.round(progress)}%`}
            />
            <p style={{ marginTop: 5, fontSize: '12px', color: '#999' }}>
              Checking blockchain every 5 seconds...
            </p>
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        {paymentStatus === 'pending' ? (
          <>
            <Alert
              message="Waiting for Payment"
              description="Complete payment in the Azix app. We'll verify and confirm it automatically."
              type="info"
              showIcon
              style={{ marginBottom: 15 }}
            />
            <Button
              type="primary"
              size="large"
              onClick={checkPaymentStatus}
              loading={checkingStatus}
              style={{ marginRight: 10 }}
            >
              Check Payment Status
            </Button>
            <Button onClick={onCancel}>
              Cancel
            </Button>
            {checkingStatus && (
              <p style={{ marginTop: 10, color: '#666', fontSize: '12px' }}>
                Checking payment status...
              </p>
            )}
          </>
        ) : (
          <Alert
            message="Payment Detected & Confirmed!"
            description="Your payment has been successfully confirmed."
            type="success"
            showIcon
          />
        )}
        {verifyError && (
          <div style={{ marginTop: 10, color: '#c00', fontSize: '12px' }}>
            {verifyError}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DirectWalletPaymentModal;


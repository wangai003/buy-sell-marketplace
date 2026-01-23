import React from 'react';
import { Modal, Alert, Spin } from 'antd';
import { CheckoutWidget, ThirdwebProvider } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../queryClient";

// Simple thirdweb client
const getClient = () => {
  const clientId = process.env.REACT_APP_THIRDWEB_CLIENT_ID;
  if (!clientId || clientId === "YOUR_CLIENT_ID") {
    return null;
  }
  return createThirdwebClient({ clientId });
};

const client = getClient();

const ThirdwebPaymentModal = ({
  visible,
  onCancel,
  paymentDetails,
  onPaymentSuccess,
  orderType
}) => {
  // Use the singleton QueryClient instance
  // No need for useMemo since it's already a constant
  const walletConnectProjectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID;

  if (!visible) return null;

  if (!client) {
    return (
      <Modal
        visible={visible}
        open={visible}
        onCancel={onCancel}
        footer={null}
        title="Configuration Error"
        width={600}
      >
        <Alert
          message="Thirdweb Client ID not configured"
          description="Please set REACT_APP_THIRDWEB_CLIENT_ID in your .env file"
          type="error"
          showIcon
        />
      </Modal>
    );
  }

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

  // CRITICAL: Wrap CheckoutWidget with QueryClientProvider INSIDE the Modal
  // Ant Design Modal uses React Portal, which breaks React context chains
  // This ensures React Query context is available even in portals
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
      <Alert
        type="info"
        message="Use your WalletConnect-compatible wallet"
        description="Connection is routed through WalletConnect only. Open your wallet to approve the payment when prompted."
        showIcon
        style={{ marginBottom: 12 }}
      />

      {orderType === 'auction' && (
        <Alert
          message="Congratulations!"
          description="You won this auction. Please complete payment to receive your item."
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      <ThirdwebProvider client={client} activeChain={polygon}>
        <QueryClientProvider client={queryClient}>
          <CheckoutWidget
            client={client}
            chain={polygon}
            amount={String(paymentDetails.amount)}
            seller={paymentDetails.seller}
            name={paymentDetails.name}
            description={paymentDetails.description}
            image={paymentDetails.image}
            tokenAddress={paymentDetails.token}
            supportedTokens={{
              [polygon.id]: [
                {
                  address: paymentDetails.token,
                  name: paymentDetails.currency || 'USDC',
                  symbol: paymentDetails.currency || 'USDC',
                },
              ],
            }}
          connectOptions={{
            walletConnect: {
              projectId: walletConnectProjectId,
            },
          }}
            purchaseData={paymentDetails.purchaseData}
            onSuccess={() => {
              if (onPaymentSuccess) {
                onPaymentSuccess();
              }
            }}
          />
        </QueryClientProvider>
      </ThirdwebProvider>
    </Modal>
  );
};

export default ThirdwebPaymentModal;

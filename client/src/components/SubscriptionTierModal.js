import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Card, Button, Radio, Tag, Divider, Typography, Space, Alert, message } from 'antd';
import { CheckOutlined, CrownOutlined } from '@ant-design/icons';
import { getSubscriptionTiers } from '../actions/user';

const { Title, Text, Paragraph } = Typography;

const SubscriptionTierModal = ({ visible, onCancel, onSelectTier, currentTier }) => {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedTier, setSelectedTier] = useState(null);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const loadTiers = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      return;
    }

    // Only load once per modal open
    if (hasLoadedRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const res = await getSubscriptionTiers();
      if (res && res.data && res.data.tiers) {
        setTiers(res.data.tiers);
        hasLoadedRef.current = true;
        // Default to STARTER if no tier selected
        setSelectedTier(prev => prev || 'STARTER');
      } else {
        console.error('Invalid response format:', res);
        setError('Failed to load subscription tiers. Please refresh the page.');
      }
    } catch (err) {
      console.error('Error loading tiers:', err);
      // Only show error once, don't flood with messages
      if (err.response) {
        setError(`Failed to load tiers: ${err.response.data?.error || err.message}`);
      } else if (err.request) {
        setError('Network error: Could not connect to server. Please check if the backend is running.');
      } else {
        setError('Failed to load subscription tiers. Please try again.');
      }
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []); // Empty dependency array - only load when explicitly called

  useEffect(() => {
    if (visible) {
      // Only load if we haven't loaded yet and we're not currently loading
      if (!hasLoadedRef.current && !isLoadingRef.current) {
        loadTiers();
      }
    } else {
      // Reset when modal closes
      hasLoadedRef.current = false;
      isLoadingRef.current = false;
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]); // Only depend on visible, loadTiers is stable

  const handleConfirm = () => {
    if (!selectedTier) {
      return;
    }
    const tier = tiers.find(t => t.name === selectedTier);
    if (tier) {
      onSelectTier(selectedTier, billingCycle, tier);
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'Custom';
    return `$${price}`;
  };

  return (
    <Modal
      visible={visible}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1200}
      title={
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Merchant Subscription Plans
          </Title>
          <Text type="secondary">Simple. Fair. Demand-driven.</Text>
        </div>
      }
    >
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Text strong>Billing Options:</Text>
          <Radio.Group
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="monthly">Monthly</Radio.Button>
            <Radio.Button value="yearly">
              Yearly <Tag color="green" style={{ marginLeft: 4 }}>Save 20%</Tag>
            </Radio.Button>
          </Radio.Group>
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text>Loading subscription plans...</Text>
        </div>
      ) : error ? (
        <Alert
          type="error"
          message="Unable to load subscription tiers"
          description={error}
          action={
            <Button size="small" onClick={() => {
              hasLoadedRef.current = false;
              loadTiers();
            }}>
              Retry
            </Button>
          }
        />
      ) : tiers.length === 0 ? (
        <Alert
          type="warning"
          message="Unable to load subscription tiers"
          description="Please check your connection and try again. If the problem persists, contact support."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {tiers.map((tier) => {
          const isSelected = selectedTier === tier.name;
          const isCurrentTier = currentTier === tier.name;
          const price = billingCycle === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;
          const originalPrice = billingCycle === 'yearly' && tier.yearlyOriginalPrice 
            ? tier.yearlyOriginalPrice 
            : null;

          return (
            <Card
              key={tier.name}
              hoverable
              style={{
                border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                position: 'relative',
                cursor: tier.name === 'CUSTOM' ? 'default' : 'pointer',
              }}
              onClick={() => {
                if (tier.name !== 'CUSTOM') {
                  setSelectedTier(tier.name);
                }
              }}
            >
              {isCurrentTier && (
                <Tag
                  color="blue"
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 1,
                  }}
                >
                  Current Plan
                </Tag>
              )}
              {isSelected && tier.name !== 'CUSTOM' && (
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 1,
                  }}
                >
                  <CheckOutlined style={{ color: '#1890ff', fontSize: 24 }} />
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>
                  {tier.displayName}
                </Title>
                {tier.name !== 'CUSTOM' && (
                  <div style={{ marginTop: 8 }}>
                    <Text strong style={{ fontSize: 24 }}>
                      {formatPrice(price)}
                    </Text>
                    {billingCycle === 'monthly' ? (
                      <Text type="secondary"> / month</Text>
                    ) : (
                      <div>
                        <Text type="secondary" delete style={{ fontSize: 16 }}>
                          {formatPrice(originalPrice)}
                        </Text>
                        <Text type="secondary"> / year</Text>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
                {tier.description}
              </Paragraph>

              <Divider />

              {tier.name === 'FREE' && tier.whatsLocked && (
                <div>
                  <Text strong>What's locked:</Text>
                  <ul style={{ paddingLeft: 20, fontSize: 12 }}>
                    {tier.whatsLocked.map((item, idx) => (
                      <li key={idx} style={{ color: '#999' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tier.name !== 'FREE' && tier.whatYouUnlock && (
                <div>
                  <Text strong>What you unlock:</Text>
                  <ul style={{ paddingLeft: 20, fontSize: 12 }}>
                    {tier.whatYouUnlock.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {tier.name === 'CUSTOM' && (
                <Alert
                  message="Contact Sales"
                  description="For large merchants, cooperatives, manufacturers, and brands. Custom pricing and dedicated support."
                  type="info"
                  showIcon
                />
              )}
            </Card>
          );
        })}
        </div>
      )}

      {tiers.length > 0 && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            {selectedTier && selectedTier !== 'CUSTOM' && (
              <Button type="primary" size="large" onClick={handleConfirm}>
                Subscribe to {tiers.find(t => t.name === selectedTier)?.displayName}
              </Button>
            )}
            {selectedTier === 'CUSTOM' && (
              <Button type="primary" size="large" onClick={() => message.info('Please contact sales team for custom pricing')}>
                Contact Sales
              </Button>
            )}
          </Space>
        </div>
      )}
    </Modal>
  );
};

export default SubscriptionTierModal;


import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { isAuthenticated } from '../actions/auth';
import {
  getPotentialConnections,
  getConnectedBuyers,
  createConnection,
} from '../actions/user';
import {
  Tabs,
  Card,
  Avatar,
  Empty,
  Button,
  Tag,
  message,
  Pagination,
  Space,
} from 'antd';
import {
  UserAddOutlined,
  MessageOutlined,
  ShopOutlined,
  UserOutlined,
} from '@ant-design/icons';

const Connections = () => {
  const { user, token } = isAuthenticated();
  const history = useHistory();
  const [potentialBuyers, setPotentialBuyers] = useState([]);
  const [connectedBuyers, setConnectedBuyers] = useState([]);
  const [loadingPotential, setLoadingPotential] = useState(false);
  const [loadingConnected, setLoadingConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('potential');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentConnectedPage, setCurrentConnectedPage] = useState(1);
  const countPerPage = 12;

  useEffect(() => {
    if (!user || !token) {
      message.warning('Please login to access connections');
      history.push('/login');
      return;
    }

    if (!user.canSell) {
      message.error('Only sellers can access connections');
      history.push('/user/dashboard');
      return;
    }

    loadPotentialConnections();
    loadConnectedBuyers();
  }, [user, token]);

  const loadPotentialConnections = async () => {
    if (!user || !token) return;
    setLoadingPotential(true);
    try {
      const res = await getPotentialConnections(user._id, token);
      setPotentialBuyers(res.data || []);
    } catch (err) {
      console.error('Error loading potential connections:', err);
      message.error('Failed to load potential connections');
    } finally {
      setLoadingPotential(false);
    }
  };

  const loadConnectedBuyers = async () => {
    if (!user || !token) return;
    setLoadingConnected(true);
    try {
      const res = await getConnectedBuyers(user._id, token);
      setConnectedBuyers(res.data || []);
    } catch (err) {
      console.error('Error loading connected buyers:', err);
      message.error('Failed to load connected buyers');
    } finally {
      setLoadingConnected(false);
    }
  };

  const handleConnect = async (buyerId) => {
    try {
      await createConnection(user._id, buyerId, token);
      message.success('Connection created successfully!');
      // Reload both lists
      loadPotentialConnections();
      loadConnectedBuyers();
    } catch (err) {
      console.error('Error creating connection:', err);
      message.error('Failed to create connection. Please try again.');
    }
  };

  const handleOpenChat = (buyerId) => {
    history.push(`/messages?&message=${buyerId}`);
  };

  const handleViewProducts = () => {
    history.push('/add-product/' + user._id);
  };

  const getPaginationData = (data, page) => {
    const from = (page - 1) * countPerPage;
    const to = from + countPerPage;
    return data.slice(from, to);
  };

  if (!user || !user.canSell) {
    return null;
  }

  return (
    <div
      className="container-fluid mb-5"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #FFD700, #FFFFFF)',
      }}
    >
      <div className="col-md-10 mx-auto mt-5">
        <div
          className="card rounded-0 profile-card card-shadow mb-4"
          style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '10px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div
            className="card-header p-4"
            style={{
              borderBottom: '2px solid #FFD700',
              background: 'linear-gradient(to right, #FFD700, #FFFFFF)',
            }}
          >
            <h2 style={{ color: '#228B22', margin: 0 }}>
              <i className="fas fa-users me-2"></i>Connections
            </h2>
            <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '14px' }}>
              Connect with buyers interested in your product categories
            </p>
          </div>

          <div className="card-body p-4">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              type="card"
              size="large"
              items={[
                {
                  key: 'potential',
                  label: (
                    <span>
                      <UserAddOutlined />
                      Potential Connections ({potentialBuyers.length})
                    </span>
                  ),
                  children: (
                    <>
                      {loadingPotential ? (
                        <div className="text-center p-5">
                          <i
                            className="fas fa-spinner fa-spin fa-3x"
                            style={{ color: '#FFD700' }}
                          ></i>
                          <p style={{ marginTop: '15px', color: '#666' }}>
                            Loading potential connections...
                          </p>
                        </div>
                      ) : potentialBuyers.length === 0 ? (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <div>
                              <p>No potential connections found</p>
                              <p style={{ fontSize: '12px', color: '#999' }}>
                                Buyers with matching interests will appear here
                              </p>
                            </div>
                          }
                        />
                      ) : (
                        <>
                          <div className="row">
                            {getPaginationData(
                              potentialBuyers,
                              currentPage
                            ).map((buyer, i) => (
                              <div className="col-md-4 mb-4" key={i}>
                                <Card
                                  hoverable
                                  className="card-shadow"
                                  style={{
                                    borderRadius: '10px',
                                    transition: 'transform 0.3s ease',
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.transform =
                                      'translateY(-5px)')
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.transform =
                                      'translateY(0)')
                                  }
                                >
                                  <div className="text-center">
                                    <Avatar
                                      src={buyer.photo}
                                      size={80}
                                      style={{
                                        border: '2px solid #ddd',
                                        marginBottom: '15px',
                                      }}
                                    >
                                      {buyer.name[0]}
                                    </Avatar>
                                    <h5
                                      style={{
                                        color: '#228B22',
                                        fontWeight: 'bold',
                                        marginBottom: '5px',
                                      }}
                                    >
                                      {buyer.name}
                                    </h5>
                                    <small style={{ color: '#666' }}>
                                      @{buyer.username}
                                    </small>
                                    <div className="mt-3">
                                      <p style={{ margin: '5px 0', color: '#333' }}>
                                        <i
                                          className="fas fa-phone me-2"
                                          style={{ color: '#228B22' }}
                                        ></i>
                                        {buyer.phone}
                                      </p>
                                      {buyer.interestedCategories &&
                                        buyer.interestedCategories.length > 0 && (
                                          <div className="mt-2">
                                            <small
                                              style={{
                                                color: '#666',
                                                display: 'block',
                                                marginBottom: '5px',
                                              }}
                                            >
                                              Interested in ({buyer.interestedCategories.length}):
                                            </small>
                                            <div
                                              style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '5px',
                                                justifyContent: 'center',
                                              }}
                                            >
                                              {buyer.interestedCategories
                                                .slice(0, 3)
                                                .map((cat, idx) => (
                                                  <Tag
                                                    key={idx}
                                                    color="blue"
                                                    style={{ fontSize: '10px' }}
                                                  >
                                                    {cat.name || cat}
                                                  </Tag>
                                                ))}
                                              {buyer.interestedCategories.length > 3 && (
                                                <Tag
                                                  color="default"
                                                  style={{ fontSize: '10px' }}
                                                >
                                                  +{buyer.interestedCategories.length - 3}
                                                </Tag>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                    <div className="mt-3">
                                      <Button
                                        type="primary"
                                        icon={<UserAddOutlined />}
                                        onClick={() => handleConnect(buyer._id)}
                                        style={{
                                          background:
                                            'linear-gradient(to right, #33b27b, #28a745)',
                                          border: 'none',
                                          borderRadius: '20px',
                                          padding: '5px 20px',
                                        }}
                                      >
                                        Connect
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              </div>
                            ))}
                          </div>
                          {potentialBuyers.length > countPerPage && (
                            <div className="text-center mt-4">
                              <Pagination
                                current={currentPage}
                                total={potentialBuyers.length}
                                pageSize={countPerPage}
                                onChange={(page) => setCurrentPage(page)}
                                showSizeChanger={false}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ),
                },
                {
                  key: 'connected',
                  label: (
                    <span>
                      <UserOutlined />
                      Connected Buyers ({connectedBuyers.length})
                    </span>
                  ),
                  children: (
                    <>
                      {loadingConnected ? (
                        <div className="text-center p-5">
                          <i
                            className="fas fa-spinner fa-spin fa-3x"
                            style={{ color: '#FFD700' }}
                          ></i>
                          <p style={{ marginTop: '15px', color: '#666' }}>
                            Loading connected buyers...
                          </p>
                        </div>
                      ) : connectedBuyers.length === 0 ? (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <div>
                              <p>No connected buyers yet</p>
                              <p style={{ fontSize: '12px', color: '#999' }}>
                                Connect with buyers from the Potential Connections tab
                              </p>
                            </div>
                          }
                        />
                      ) : (
                        <>
                          <div className="row">
                            {getPaginationData(
                              connectedBuyers,
                              currentConnectedPage
                            ).map((buyer, i) => (
                              <div className="col-md-4 mb-4" key={i}>
                                <Card
                                  hoverable
                                  className="card-shadow"
                                  style={{
                                    borderRadius: '10px',
                                    transition: 'transform 0.3s ease',
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.transform =
                                      'translateY(-5px)')
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.transform =
                                      'translateY(0)')
                                  }
                                >
                                  <div className="text-center">
                                    <Avatar
                                      src={buyer.photo}
                                      size={80}
                                      style={{
                                        border: '3px solid #FFD700',
                                        marginBottom: '15px',
                                      }}
                                    >
                                      {buyer.name[0]}
                                    </Avatar>
                                    <h5
                                      style={{
                                        color: '#228B22',
                                        fontWeight: 'bold',
                                        marginBottom: '5px',
                                      }}
                                    >
                                      {buyer.name}
                                    </h5>
                                    <small style={{ color: '#666' }}>
                                      @{buyer.username}
                                    </small>
                                    <div className="mt-3">
                                      <p style={{ margin: '5px 0', color: '#333' }}>
                                        <i
                                          className="fas fa-phone me-2"
                                          style={{ color: '#228B22' }}
                                        ></i>
                                        {buyer.phone}
                                      </p>
                                      {buyer.interestedCategories &&
                                        buyer.interestedCategories.length > 0 && (
                                          <div className="mt-2">
                                            <small
                                              style={{
                                                color: '#666',
                                                display: 'block',
                                                marginBottom: '5px',
                                              }}
                                            >
                                              Interested in ({buyer.interestedCategories.length}):
                                            </small>
                                            <div
                                              style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '5px',
                                                justifyContent: 'center',
                                              }}
                                            >
                                              {buyer.interestedCategories
                                                .slice(0, 3)
                                                .map((cat, idx) => (
                                                  <Tag
                                                    key={idx}
                                                    color="gold"
                                                    style={{ fontSize: '10px' }}
                                                  >
                                                    {cat.name || cat}
                                                  </Tag>
                                                ))}
                                              {buyer.interestedCategories.length > 3 && (
                                                <Tag
                                                  color="default"
                                                  style={{ fontSize: '10px' }}
                                                >
                                                  +{buyer.interestedCategories.length - 3}
                                                </Tag>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                    <div className="mt-3">
                                      <Space>
                                        <Button
                                          type="primary"
                                          icon={<MessageOutlined />}
                                          onClick={() => handleOpenChat(buyer._id)}
                                          style={{
                                            background:
                                              'linear-gradient(to right, #33b27b, #28a745)',
                                            border: 'none',
                                            borderRadius: '20px',
                                            padding: '5px 15px',
                                          }}
                                        >
                                          Chat
                                        </Button>
                                        <Button
                                          type="default"
                                          icon={<ShopOutlined />}
                                          onClick={handleViewProducts}
                                          style={{
                                            borderRadius: '20px',
                                            padding: '5px 15px',
                                          }}
                                        >
                                          Sell
                                        </Button>
                                      </Space>
                                    </div>
                                  </div>
                                </Card>
                              </div>
                            ))}
                          </div>
                          {connectedBuyers.length > countPerPage && (
                            <div className="text-center mt-4">
                              <Pagination
                                current={currentConnectedPage}
                                total={connectedBuyers.length}
                                pageSize={countPerPage}
                                onChange={(page) =>
                                  setCurrentConnectedPage(page)
                                }
                                showSizeChanger={false}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Connections;


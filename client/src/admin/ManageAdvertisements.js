import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Upload, Switch, message, Space, Image } from 'antd';
import { UploadOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import { getToken } from '../actions/auth';

const ManageAdvertisements = () => {
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    loadAdvertisements();
  }, []);

  const loadAdvertisements = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await axios.get('/api/advertisement/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdvertisements(res.data);
    } catch (error) {
      console.error('Error loading advertisements:', error);
      message.error('Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAd(null);
    form.resetFields();
    setFileList([]);
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingAd(record);
    form.setFieldsValue({
      title: record.title,
      link: record.link,
      order: record.order,
      isActive: record.isActive
    });
    setFileList([]);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const token = getToken();
      await axios.delete(`/api/advertisement/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Advertisement deleted successfully');
      loadAdvertisements();
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      message.error('Failed to delete advertisement');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = getToken();
      await axios.put(`/api/advertisement/toggle/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success(`Advertisement ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      loadAdvertisements();
    } catch (error) {
      console.error('Error toggling advertisement status:', error);
      message.error('Failed to update advertisement status');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const token = getToken();
      const formData = new FormData();

      formData.append('title', values.title);
      formData.append('link', values.link || '');
      formData.append('order', values.order || 0);

      if (fileList.length > 0) {
        formData.append('image', fileList[0].originFileObj);
      }

      if (editingAd) {
        await axios.put(`/api/advertisement/update/${editingAd._id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        message.success('Advertisement updated successfully');
      } else {
        await axios.post('/api/advertisement/create', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        message.success('Advertisement created successfully');
      }

      setIsModalVisible(false);
      loadAdvertisements();
    } catch (error) {
      console.error('Error saving advertisement:', error);
      message.error('Failed to save advertisement');
    }
  };

  const uploadProps = {
    onRemove: (file) => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Image must be smaller than 5MB!');
        return false;
      }
      setFileList([file]);
      return false;
    },
    fileList,
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      render: (image) => (
        <Image
          src={image}
          alt="Advertisement"
          width={80}
          height={50}
          style={{ objectFit: 'cover' }}
        />
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Link',
      dataIndex: 'link',
      key: 'link',
      render: (link) => link ? (
        <a href={link} target="_blank" rel="noopener noreferrer">
          {link}
        </a>
      ) : 'N/A',
    },
    {
      title: 'Order',
      dataIndex: 'order',
      key: 'order',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <span style={{ color: isActive ? 'green' : 'red' }}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => window.open(record.image, '_blank')}
            title="View Image"
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Edit"
          />
          <Switch
            checked={record.isActive}
            onChange={() => handleToggleStatus(record._id, record.isActive)}
            checkedChildren="Active"
            unCheckedChildren="Inactive"
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => {
              Modal.confirm({
                title: 'Delete Advertisement',
                content: 'Are you sure you want to delete this advertisement?',
                onOk: () => handleDelete(record._id),
              });
            }}
            title="Delete"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h3>Manage Advertisements</h3>
            </div>
            <div className="card-body">
              <Button
                type="primary"
                onClick={handleCreate}
                style={{ marginBottom: 16 }}
              >
                Add New Advertisement
              </Button>
              <Table
                columns={columns}
                dataSource={advertisements}
                rowKey="_id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <Modal
        title={editingAd ? 'Edit Advertisement' : 'Create Advertisement'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Advertisement title" />
          </Form.Item>

          <Form.Item
            name="link"
            label="Link (Optional)"
          >
            <Input placeholder="https://example.com" />
          </Form.Item>

          <Form.Item
            name="order"
            label="Order"
            rules={[{ type: 'number', min: 0, message: 'Order must be a positive number' }]}
          >
            <Input type="number" placeholder="0" />
          </Form.Item>

          <Form.Item label="Image">
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>
                {editingAd ? 'Change Image' : 'Select Image'}
              </Button>
            </Upload>
            {editingAd && (
              <div style={{ marginTop: 8 }}>
                <Image
                  src={editingAd.image}
                  alt="Current"
                  width={200}
                  style={{ objectFit: 'cover' }}
                />
                <p>Current Image</p>
              </div>
            )}
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingAd ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageAdvertisements;
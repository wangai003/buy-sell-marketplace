import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useHistory } from 'react-router';
import { isAuthenticated } from '../actions/auth';
import {
  Card,
  Avatar,
  Button,
  Tooltip,
  message,
  Popconfirm,
  Pagination,
} from 'antd';
import { addCategory, allCategories, deleteCategory, getCategoryHierarchy, createNestedCategory } from '../actions/admin';
import moment from 'moment';
import throttle from 'lodash/throttle';

const { Meta } = Card;

const AddCategory = () => {
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');
  const [type, setType] = useState('category');
  const countPerPage = 5;
  const [categories, setCategories] = useState({
    category: [],
    pagination: [],
    deleted: false,
    newAdded: false,
  });
  const [hierarchy, setHierarchy] = useState([]);
  const [current, setCurrent] = useState();
  const [search, setSearch] = useState('');
  const { category, pagination, deleted, newAdded } = categories;

  // New state for nested category creation
  const [nestedMode, setNestedMode] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [subcategories, setSubcategories] = useState([{ name: '', elements: [{ name: '' }] }]);

  const { user, token } = isAuthenticated();

  const searchData = useRef(
    throttle(async (val) => {
      const query = val.toLowerCase();
      setCurrent(1);
      const data = await allCategories();
      const newData = data.data
        .filter((item) => item.name.toLowerCase().indexOf(query) > -1)
        .slice(0, countPerPage);
      setCategories({ ...categories, pagination: newData });
    }, 400)
  );

  useEffect(() => {
    loadHierarchy();
    if (!search) {
      loadCategories(1);
    } else {
      searchData.current(search);
    }
  }, [search, newAdded, deleted]);

  const loadCategories = async (page) => {
    const res = await allCategories();
    setCurrent(page);
    const to = page * countPerPage;
    const from = to - countPerPage;
    setCategories({ category: res.data, pagination: res.data.slice(from, to) });
  };

  const loadHierarchy = async () => {
    const res = await getCategoryHierarchy();
    setHierarchy(res.data);
  };

  const handleDelete = async (categoryId) => {
    const res = await deleteCategory(categoryId, token);
    if (res.error) {
      console.log(res.error);
    } else {
      console.log(res);
      message.success('Category deleted', 4);
      setCategories({ ...categories, deleted: true });
    }
  };

  const handleChange = (e) => {
    setName(e.target.value);
  };

  const handleParentChange = (e) => {
    setParent(e.target.value);
  };

  const handleTypeChange = (e) => {
    setType(e.target.value);
    setParent(''); // Reset parent when type changes
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await addCategory({ name, parent: parent || null, type });
      console.log(res);
      message.success(`${type.charAt(0).toUpperCase() + type.slice(1)} added`, 4);
      setName('');
      setParent('');
      setCategories({ ...categories, newAdded: true });
      loadHierarchy(); // Refresh hierarchy
    } catch (err) {
      console.log(err);
      if (err.response.status === 400) message.error(err.response.data, 4);
    }
  };

  const handleNestedSubmit = async (e) => {
    e.preventDefault();
    try {
      // Filter out empty subcategories and elements
      const filteredSubcategories = subcategories
        .filter(sub => sub.name.trim())
        .map(sub => ({
          name: sub.name.trim(),
          elements: sub.elements.filter(elem => elem.name.trim())
        }));

      if (!categoryName.trim() || filteredSubcategories.length === 0) {
        message.error('Category name and at least one subcategory are required', 4);
        return;
      }

      const res = await createNestedCategory({
        name: categoryName.trim(),
        subcategories: filteredSubcategories
      });

      console.log(res);
      message.success('Category with subcategories and elements created successfully', 4);

      // Reset form
      setCategoryName('');
      setSubcategories([{ name: '', elements: [{ name: '' }] }]);
      setCategories({ ...categories, newAdded: true });
      loadHierarchy(); // Refresh hierarchy
    } catch (err) {
      console.log(err);
      if (err.response.status === 400) message.error(err.response.data, 4);
    }
  };

  const addSubcategory = () => {
    setSubcategories([...subcategories, { name: '', elements: [{ name: '' }] }]);
  };

  const updateSubcategory = (index, name) => {
    const updated = [...subcategories];
    updated[index].name = name;
    setSubcategories(updated);
  };

  const removeSubcategory = (index) => {
    if (subcategories.length > 1) {
      setSubcategories(subcategories.filter((_, i) => i !== index));
    }
  };

  const addElement = (subIndex) => {
    const updated = [...subcategories];
    updated[subIndex].elements.push({ name: '' });
    setSubcategories(updated);
  };

  const updateElement = (subIndex, elemIndex, name) => {
    const updated = [...subcategories];
    updated[subIndex].elements[elemIndex].name = name;
    setSubcategories(updated);
  };

  const removeElement = (subIndex, elemIndex) => {
    const updated = [...subcategories];
    if (updated[subIndex].elements.length > 1) {
      updated[subIndex].elements = updated[subIndex].elements.filter((_, i) => i !== elemIndex);
      setSubcategories(updated);
    }
  };

  const history = useHistory();

  const logout = () => {
    window.localStorage.removeItem('buynsell');
    history.push('/login');
    window.location.reload();
  };

  return (
    <>
      <div className='row container-fluid mx-auto mt-5 profile-container'>
        <div className='col-md-3 mb-5'>
          <Card
            className='card-shadow'
            style={{ width: 'auto' }}
            cover={
              <Avatar
                src={user.photo}
                className='mx-auto mt-3 avatar-user'
                size={130}
              >
                {user.name[0]}
              </Avatar>
            }
          >
            <div className='text-center'>
              <h5>({user.username})</h5>
            </div>
            <Meta
              title={user.name}
              description={user.phone}
              className='text-center user-details'
            />
          </Card>
          <ul className='list-group rounded-0 profile-list card-shadow'>
            <li className='list-group-item'>
              <Link
                to='/admin/dashboard'
                className='text-dark1 text-decoration-none'
              >
                <i class='fas fa-user-shield'></i> Admin Dashboard
              </Link>
            </li>
            <li className='list-group-item'>
              <Link
                to='/user/dashboard'
                className='text-dark1 text-decoration-none'
              >
                <i class='fas fa-user'></i> User Dashboard
              </Link>
            </li>
            <li className='list-group-item'>
              <Link
                to='/admin/add-location'
                className='text-dark1 text-decoration-none'
              >
                <i class='fas fa-plus-circle'></i> Add Location
              </Link>
            </li>
            <li className='list-group-item'>
              <Link
                to='/admin/users'
                className='text-dark1 text-decoration-none'
              >
                <i class='fas fa-user-edit'></i> Manage Users
              </Link>
            </li>
            <li
              className='list-group-item text-dark1'
              role='button'
              onClick={logout}
            >
              <i class='fas fa-sign-out-alt'></i> Logout
            </li>
          </ul>
        </div>
        <div className='col-md-9 mb-5'>
          <div className='card rounded-0 mb-5 pb-5 card-shadow'>
            <div className='card-header p-4'>
              <h2 className='text-center'>
                <Link
                  to='/admin/dashboard'
                  className='text-decoration-none text-dark1'
                >
                  <Tooltip title='Back to Admin'>
                    <span className='category-span'>
                      <i class='fas fa-arrow-circle-left'></i>
                    </span>
                  </Tooltip>
                </Link>
                <i class='fas fa-plus-square'></i> Add New Category/Subcategory/Element
              </h2>
            </div>
            <div className='card-body'>
              <div className='mb-4'>
                <h5 className='text-center mb-4'>Create Category Hierarchy</h5>
                <div className='alert alert-info'>
                  <strong>How to create hierarchy:</strong>
                  <ol className='mb-0 mt-2'>
                    <li>Use <strong>"Create Nested Category"</strong> to create a complete category with subcategories and elements in one go</li>
                    <li>Or use <strong>"Create Individual"</strong> to add single categories, subcategories, or elements</li>
                  </ol>
                </div>
                <div className='text-center mb-4'>
                  <Button
                    type={nestedMode ? 'default' : 'primary'}
                    onClick={() => setNestedMode(false)}
                    className='me-2'
                  >
                    Create Individual
                  </Button>
                  <Button
                    type={nestedMode ? 'primary' : 'default'}
                    onClick={() => setNestedMode(true)}
                  >
                    Create Nested Category
                  </Button>
                </div>
              </div>

              {nestedMode ? (
                <form onSubmit={handleNestedSubmit}>
                  <div className='form-group mb-4 col-md-8 mx-auto'>
                    <label className='form-label'><strong>Category Name:</strong></label>
                    <input
                      type='text'
                      className='form-control shadow-none rounded-0'
                      placeholder='Enter category name (e.g., Goods, Services)'
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      required
                    />
                  </div>

                  <div className='mb-4'>
                    <h6 className='text-center mb-3'>Subcategories & Elements</h6>
                    {subcategories.map((sub, subIndex) => (
                      <div key={subIndex} className='border rounded p-3 mb-3'>
                        <div className='d-flex align-items-center mb-2'>
                          <input
                            type='text'
                            className='form-control shadow-none rounded-0 me-2'
                            placeholder='Subcategory name'
                            value={sub.name}
                            onChange={(e) => updateSubcategory(subIndex, e.target.value)}
                          />
                          <Button
                            type='danger'
                            size='small'
                            onClick={() => removeSubcategory(subIndex)}
                            disabled={subcategories.length === 1}
                          >
                            Remove
                          </Button>
                        </div>
                        <div className='ms-3'>
                          <small className='text-muted'>Elements:</small>
                          {sub.elements.map((elem, elemIndex) => (
                            <div key={elemIndex} className='d-flex align-items-center mt-1'>
                              <input
                                type='text'
                                className='form-control form-control-sm shadow-none rounded-0 me-2'
                                placeholder='Element name'
                                value={elem.name}
                                onChange={(e) => updateElement(subIndex, elemIndex, e.target.value)}
                              />
                              <Button
                                type='danger'
                                size='small'
                                onClick={() => removeElement(subIndex, elemIndex)}
                                disabled={sub.elements.length === 1}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                          <Button
                            type='dashed'
                            size='small'
                            onClick={() => addElement(subIndex)}
                            className='mt-1'
                          >
                            + Add Element
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className='text-center'>
                      <Button type='dashed' onClick={addSubcategory}>
                        + Add Subcategory
                      </Button>
                    </div>
                  </div>

                  <div className='mx-auto col-md-8'>
                    <Button
                      type='primary'
                      size='large'
                      shape='round'
                      className='rounded-0'
                      htmlType='submit'
                    >
                      ➕ Create Nested Category
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit}>
                <div className='form-group mb-4 col-md-8 mx-auto'>
                  <label className='form-label'><strong>What do you want to create?</strong></label>
                  <select
                    className='form-control shadow-none rounded-0'
                    value={type}
                    onChange={handleTypeChange}
                  >
                    <option value='category'>📁 Category (Top Level - e.g., Electronics, Clothing)</option>
                    <option value='subcategory'>📂 Subcategory (Middle Level - e.g., Phones, Shirts)</option>
                    <option value='element'>🏷️ Element (Bottom Level - e.g., iPhone, T-Shirt)</option>
                  </select>
                </div>

                {type === 'category' && (
                  <div className='alert alert-primary mb-4 col-md-8 mx-auto'>
                    <strong>Creating a Category:</strong> This will be a top-level category that users will see first when creating products.
                  </div>
                )}

                {type === 'subcategory' && (
                  <div className='alert alert-warning mb-4 col-md-8 mx-auto'>
                    <strong>Creating a Subcategory:</strong> This will belong to a Category. Select which Category it should be under.
                  </div>
                )}

                {type === 'element' && (
                  <div className='alert alert-success mb-4 col-md-8 mx-auto'>
                    <strong>Creating an Element:</strong> This will belong to a Subcategory. Select which Subcategory it should be under.
                  </div>
                )}

                {type !== 'category' && (
                  <div className='form-group mb-4 col-md-8 mx-auto'>
                    <label className='form-label'>
                      <strong>Select Parent {type === 'subcategory' ? 'Category' : 'Subcategory'}:</strong>
                    </label>
                    <select
                      className='form-control shadow-none rounded-0'
                      value={parent}
                      onChange={handleParentChange}
                      required
                    >
                      <option value=''>Choose parent...</option>
                      {type === 'subcategory' && hierarchy.filter(cat => cat.type === 'category').map(cat => (
                        <option key={cat._id} value={cat._id}>📁 {cat.name}</option>
                      ))}
                      {type === 'element' && hierarchy.filter(cat => cat.type === 'subcategory').map(sub => (
                        <option key={sub._id} value={sub._id}>📂 {sub.name}</option>
                      ))}
                    </select>
                    {type === 'subcategory' && hierarchy.filter(cat => cat.type === 'category').length === 0 && (
                      <small className='text-danger'>No categories available. Create a category first.</small>
                    )}
                    {type === 'element' && hierarchy.filter(cat => cat.type === 'subcategory').length === 0 && (
                      <small className='text-danger'>No subcategories available. Create a subcategory first.</small>
                    )}
                  </div>
                )}

                <div className='form-group mb-4 col-md-8 mx-auto'>
                  <label className='form-label'><strong>{type.charAt(0).toUpperCase() + type.slice(1)} Name:</strong></label>
                  <input
                    type='text'
                    className='form-control shadow-none rounded-0'
                    placeholder={`Enter ${type} name (e.g., ${type === 'category' ? 'Electronics' : type === 'subcategory' ? 'Phones' : 'iPhone'})`}
                    value={name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className='mx-auto col-md-8'>
                  <Button
                    type='primary'
                    size='large'
                    shape='round'
                    className='rounded-0'
                    htmlType='submit'
                    disabled={type !== 'category' && !parent}
                  >
                    ➕ Add {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                  {type !== 'category' && !parent && (
                    <small className='text-danger d-block mt-2'>Please select a parent first</small>
                  )}
                </div>
                </form>
              )}
            </div>
          </div>
          <div className='card rounded-0 profile-card card-shadow'>
            <div className='card-header profile-card p-3'>
              <div className='row'>
                <div className='col-md-8'>
                  <h4>Manage Categories, Subcategories & Elements</h4>
                </div>
                <div className='col-md-4'>
                  <div className='input-group'>
                    <input
                      type='text'
                      className='form-control rounded-0 shadow-none'
                      placeholder='Search categories'
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className='card-body'>
              <div className='mb-4'>
                <h5>Category Hierarchy</h5>
                {hierarchy.map((cat, i) => (
                  <div key={i} className='mb-3'>
                    <div className='d-flex align-items-center mb-2'>
                      <span className='badge badge-primary me-2'>Category</span>
                      <strong>{cat.name}</strong>
                    </div>
                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <div className='ms-4'>
                        {cat.subcategories.map((sub, j) => (
                          <div key={j} className='mb-2'>
                            <div className='d-flex align-items-center mb-1'>
                              <span className='badge badge-info me-2'>Subcategory</span>
                              <span>{sub.name}</span>
                            </div>
                            {sub.elements && sub.elements.length > 0 && (
                              <div className='ms-4'>
                                {sub.elements.map((elem, k) => (
                                  <div key={k} className='d-flex align-items-center mb-1'>
                                    <span className='badge badge-secondary me-2'>Element</span>
                                    <span>{elem.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <hr />
              <table className='table'>
                <thead>
                  <tr>
                    <th scope='col'>Name</th>
                    <th scope='col'>Type</th>
                    <th scope='col'>Date Added</th>
                    <th scope='col'></th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.map((c, i) => (
                    <tr key={i}>
                      <td>
                        <Link
                          to={`/category/${c._id}`}
                          className='text-decoration-none text-dark1'
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className='text-dark1'>
                        <span className={`badge ${c.type === 'category' ? 'badge-primary' : c.type === 'subcategory' ? 'badge-info' : 'badge-secondary'}`}>
                          {c.type.charAt(0).toUpperCase() + c.type.slice(1)}
                        </span>
                      </td>
                      <td className='text-dark1'>
                        {moment(c.createdAt).format('MMMM Do YYYY, h:mm:ss a')}
                      </td>
                      <td className='d-flex justify-content-evenly manage-user-btn'>
                        <Link
                          to={`/admin/category/edit/${c._id}`}
                          className='btn btn-warning btn-sm text-white pt-0 pb-0'
                        >
                          Edit
                        </Link>
                        <span className='btn btn-danger btn-sm text-white pt-0 pb-0'>
                          <Popconfirm
                            placement='top'
                            title={`Are you sure to delete this ${c.type}?`}
                            onConfirm={() => handleDelete(c._id)}
                            okText='Yes'
                            cancelText='No'
                          >
                            Delete
                          </Popconfirm>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                pageSize={countPerPage}
                onChange={loadCategories}
                defaultCurrent={current}
                total={category.length}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddCategory;

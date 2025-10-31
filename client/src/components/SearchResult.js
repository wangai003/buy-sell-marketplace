import { useEffect, useState } from 'react';
import queryString from 'query-string';
import { Input, Pagination, Empty } from 'antd';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { useHistory } from 'react-router';
import { allLocations, getCategoryHierarchy } from '../actions/admin';
import { searchResults } from '../actions/product';
import HierarchicalFilter from './HierarchicalFilter';
import CurrencySelector from './CurrencySelector';
const { Search } = Input;

const SearchResult = () => {
  const countPerPage = 10;
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [element, setElement] = useState('');
  const [name, setName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [elementName, setElementName] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [current, setCurrent] = useState();
  const [pagination, setPagination] = useState();
  const history = useHistory();

  const loadSearchResults = async (page) => {
    const { location, category, subcategory, element, name } = queryString.parse(
      window.location.search
    );
    setCategory(category);
    setSubcategory(subcategory);
    setElement(element);
    setLocation(location);
    setName(name);
    const res = await searchResults({
      location,
      category,
      subcategory,
      element,
      name,
    });
    setCurrent(page);
    const to = page * countPerPage;
    const from = to - countPerPage;
    setPagination(res.data.slice(from, to));
    setSearchResult(res.data);
  };

  const loadCategories = async () => {
    const { category, subcategory, element } = queryString.parse(window.location.search);
    const res = await getCategoryHierarchy();

    // Find and set category name
    res.data.forEach((cat) => {
      if (cat._id === category) {
        setCategoryName(cat.name);
      }
      // Find subcategory name
      if (cat.subcategories) {
        cat.subcategories.forEach((sub) => {
          if (sub._id === subcategory) {
            setSubcategoryName(sub.name);
          }
          // Find element name
          if (sub.elements) {
            sub.elements.forEach((elem) => {
              if (elem._id === element) {
                setElementName(elem.name);
              }
            });
          }
        });
      }
    });
  };
  const loadLocations = async () => {
    const { location } = queryString.parse(window.location.search);
    const res = await allLocations();
    res.data.filter((loc) => {
      if (loc._id === location) {
        setLocationName(loc.name);
      }
    });
  };

  const handleSearch = (e) => {
    setName(e.target.value);
  };

  const handleSubmit = (name) => {
    history.push(
      `search-result?&location=${location}&category=${category}&subcategory=${subcategory}&element=${element}&name=${name}`
    );
  };

  const formatNumber = (num, n = 0, x = 3) => {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return num.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
  };

  useEffect(() => {
    loadSearchResults(1);
    loadCategories();
    loadLocations();
  }, [window.location.search]);

  return (
    <>
      <div className='search-header mb-3 container-fluid'>
        <div className='row search'>
          <p className='header-text text-center me-2 d-flex justify-content-center'>
            Searching for&nbsp;
            {categoryName ? categoryName : <span>Products</span>}
            {subcategoryName && <span>&nbsp; {subcategoryName}</span>}
            {elementName && <span>&nbsp;{elementName}</span>}
            &nbsp;in&nbsp;
            {locationName ? locationName : <span>Nigeria</span>}
          </p>
          <div className='col-md-8 mx-auto d-flex justify-content-center'>
            <Search
              value={name}
              className='shadow-none'
              placeholder='Enter your search here'
              allowClear
              style={{ width: '80%' }}
              enterButton='Search'
              size='large'
              onChange={handleSearch}
              onSearch={handleSubmit}
            />
          </div>
        </div>
        <div className='row'>
          <div className='col-md-8 mx-auto d-flex justify-content-center'>
            <CurrencySelector />
          </div>
        </div>
      </div>

      <div className='row container-fluid mx-auto mt-3 mb-5 profile-container'>
        <Breadcrumb>
          <Breadcrumb.Item>
            <Link to='/' className='text-decoration-none'>
              Home
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            {categoryName ? categoryName : <span>Products</span>}
            {subcategoryName && <span> {subcategoryName}</span>}
            {elementName && <span> {elementName}</span>}
          </Breadcrumb.Item>
        </Breadcrumb>

        <div className='col-md-3 mb-2'>
          <div className='card rounded-0 profile-card card-shadow'>
            <div className='card-header p-3'>
              <strong>
                <p className='text-dark1'>Filter Products</p>
              </strong>
              <HierarchicalFilter />
            </div>
          </div>
        </div>
        <div className='col-md-9'>
          <div className='card rounded-0 profile-card card-shadow'>
            <div className='card-header'>
              <div className='pt-2'>
                {searchResult.length > 0 && (
                  <h2 className='' style={{ fontSize: '1.7rem' }}>
                    Found {searchResult.length} result(s) for your search
                  </h2>
                )}
                {searchResult.length < 1 && (
                  <h2 className='' style={{ fontSize: '1.7rem' }}>
                    No products found
                  </h2>
                )}
              </div>
            </div>
            {searchResult.length <= 0 && (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
            {searchResult.length > 0 && (
              <div className='card-body desktop-product-view'>
                {pagination.map((p, i) => {
                  if (p.status === 'active') {
                    return (
                      <div class='card rounded-0 mb-3 product-card' key={i}>
                        <div class='row g-0'>
                          <div class='col-md-3 product-img embed-responsive embed-responsive-16by9'>
                            <Link
                              to={`/product/${p._id}`}
                              className='text-decoration-none'
                            >
                              <img
                                src={p.images[0]}
                                className='img-fluid rounded-start img-horizontal'
                                alt={p.name}
                                style={{ height: '100%' }}
                              />
                              <span className='product-img-count'>
                                <span className='badge badge-pill opacity'>
                                  {p.images.length}
                                  <i class='fas fa-images ps-1'></i>
                                </span>
                              </span>
                            </Link>
                          </div>
                          <div class='col-md-9'>
                            <div class='card-body pt-3 pb-2'>
                              <div className='d-flex justify-content-between'>
                                <Link
                                  to={`/product/${p._id}`}
                                  className='text-decoration-none'
                                >
                                  <h6 class='card-title text-dark1'>
                                    {p.name}
                                  </h6>
                                </Link>
                                <span>
                                  <h6 className='text-success'>
                                    USDC{formatNumber(p.price)}
                                  </h6>
                                </span>
                              </div>
                              <small>
                                <p class='card-text text-muted'>
                                  {p.description.substring(0, 85)}..
                                </p>
                              </small>
                              <div className='d-flex justify-content-between mt-4 product-cat-text'>
                                <div>
                                  <span>
                                    <Link
                                      to={`/category/${p.category._id}`}
                                      className='badge badge-pill text-muted me-2 text-decoration-none'
                                      style={{
                                        backgroundColor: '#eef2f4',
                                        color: '#303a4b',
                                        // fontSize: '14px',
                                      }}
                                    >
                                      {p.category.name} {p.subcategory.name} {p.element.name}
                                    </Link>
                                  </span>
                                  <span>
                                    <div
                                      className='badge badge-pill text-muted'
                                      style={{
                                        backgroundColor: '#eef2f4',
                                        color: '#303a4b',
                                      }}
                                    >
                                      {p.condition}
                                    </div>
                                  </span>
                                </div>

                                <span>
                                  <small class='text-muted'>
                                    Seller:{' '}
                                    <Link
                                      to={`/user/${p.author._id}`}
                                      className='text-decoration-none text-dark1'
                                    >
                                      {p.author.name}
                                    </Link>
                                  </small>
                                </span>
                              </div>
                              <div class='card-text d-flex justify-content-between'>
                                <Link
                                  to={`/search-result?&location=${p.location._id}&category=&name=&price=&condition=`}
                                  className='text-decoration-none'
                                >
                                  <p
                                    className='text-muted'
                                    style={{ fontSize: '14px' }}
                                  >
                                    <i class='fas fa-map-marker-alt me-2'></i>
                                    {p.location.name}
                                  </p>
                                </Link>
                                <small class='text-muted'>
                                  Posted {moment(p.createdAt).fromNow()}
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
                <Pagination
                  pageSize={countPerPage}
                  onChange={loadSearchResults}
                  defaultCurrent={current}
                  total={searchResult.length}
                />
              </div>
            )}

            {searchResult.length > 0 && (
              <div className='card-body mobile-product'>
                {pagination.map((p, i) => {
                  if (p.status === 'active') {
                    return (
                      <div
                        className='card card-shadow rounded-0 mb-3 mobile-product-view d-flex flex-row'
                        style={{ height: '12.43rem' }}
                      >
                        <div className='product-img-mobile'>
                          <div className='product-img-mobile'>
                            <Link
                              to={`/product/${p._id}`}
                              className='text-decoration-none'
                            >
                              <img
                                src={p.images[0]}
                                className='card-img-top img-top-category'
                                alt={p.name}
                                style={{
                                  borderBottom: '1px solid rgba(0,0,0,.125)',
                                }}
                              />
                              <span className='product-img-count'>
                                <span className='badge badge-pill opacity'>
                                  {p.images.length}
                                  <i class='fas fa-images ps-1'></i>
                                </span>
                              </span>
                            </Link>
                          </div>
                        </div>
                        <div class='card-body pt-3 pb-2'>
                          <div>
                            <Link
                              to={`/product/${p._id}`}
                              className='text-decoration-none'
                            >
                              <h6 class='card-title card-title-cat text-dark1'>
                                {p.name.length > 40
                                  ? p.name.substring(0, 40) + '..'
                                  : p.name}
                              </h6>
                            </Link>
                            <span>
                              <h6 className='text-success'>
                                USDC{formatNumber(p.price)}
                              </h6>
                            </span>
                          </div>
                          {/* <small>
                            <p class='card-text mobile-card-desc text-muted'>
                              {p.description.substring(0, 30)}..
                            </p>
                          </small> */}
                          <div className='mt-2 mb-2'>
                            <div>
                              <span>
                                <Link
                                  to={`/category/${p.category._id}`}
                                  className='badge badge-pill text-muted me-2 text-decoration-none'
                                  style={{
                                    backgroundColor: '#eef2f4',
                                    color: '#303a4b',
                                  }}
                                >
                                  {p.category.name}
                                </Link>
                              </span>
                              <span>
                                <div
                                  className='badge badge-pill text-muted'
                                  style={{
                                    backgroundColor: '#eef2f4',
                                    color: '#303a4b',
                                  }}
                                >
                                  {p.condition}
                                </div>
                              </span>
                            </div>
                          </div>
                          <div className='mb-3'>
                            <small class='text-muted'>
                              Seller:{' '}
                              <Link
                                to={`/user/${p.author._id}`}
                                className='text-decoration-none text-dark1'
                              >
                                {p.author.username}
                              </Link>
                            </small>
                          </div>
                          <div class='card-text d-flex justify-content-between align-items-center mt-1'>
                            <div>
                              <Link
                                to={`/search-result?&location=${p.location._id}&category=&name=&price=&condition=`}
                                className='text-decoration-none mt-auto'
                              >
                                <p
                                  className='text-muted'
                                  style={{ fontSize: '0.85rem' }}
                                >
                                  <i class='fas fa-map-marker-alt me-2'></i>
                                  {p.location.name}
                                </p>
                              </Link>
                            </div>
                            <small
                              class='text-muted'
                              style={{ fontSize: '0.85rem' }}
                            >
                              {moment(p.createdAt).fromNow()}
                            </small>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
                <Pagination
                  pageSize={countPerPage}
                  onChange={loadSearchResults}
                  defaultCurrent={current}
                  total={searchResult.length}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchResult;

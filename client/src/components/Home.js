import React, { useState, useEffect } from 'react';
import { Input, Select } from 'antd';
import { useHistory, Link } from 'react-router-dom';
import { allLocations } from '../actions/admin';
import { allCategories } from '../actions/product';
import HomeContent from './HomeContent';
import CurrencySelector from './CurrencySelector';
import AdvertisementCarousel from './AdvertisementCarousel';
const { Search } = Input;
const { Option } = Select;

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState({
    location: '',
    category: '',
    name: '',
    condition: '',
    price: [],
  });

  const { location, category, name, condition, price } = search;
  const history = useHistory();

  useEffect(() => {
    loadCategories();
    loadLocations();
  }, []);

  const loadCategories = async () => {
    const res = await allCategories();
    setCategories(res.data);
  };
  const loadLocations = async () => {
    const res = await allLocations();
    setLocations(res.data);
  };

  // search functions start
  function handleLocation(value) {
    setSearch({ ...search, location: value });
  }
  function handleCategory(value) {
    setSearch({ ...search, category: value });
  }

  const handleSearch = (e) => {
    setSearch({ ...search, name: e.target.value });
  };
  const handleSubmit = (e) => {
    history.push(
      `search-result?&location=${location}&category=${category}&name=${name}&price=${price}&condition=${condition}`
    );
  };
  // search functions end
  function handleClick(e) {
    console.log('click', e);
  }
  return (
    <>
      {/* Advertisement Carousel */}
      <AdvertisementCarousel />

      {/* home side menu */}

      <HomeContent
        categories={categories}
        locations={locations}
        handleClick={handleClick}
      />
      <div className='text-center mt-4 mb-4'>
        <Link to='/all-products' className='btn btn-primary'>
          View All Products
        </Link>
      </div>
    </>
  );
};

export default Home;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import Swal from 'sweetalert2';

const ManageProductsContainer = styled.div``;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h2`
  font-size: 28px;
  color: #333;
`;

const AddButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background: #218838;
  }

  i {
    margin-right: 8px;
  }
`;

const ProductsTable = styled.table`
  width: 100%;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  border-collapse: collapse;

  th {
    background: #f8f9fa;
    padding: 15px;
    text-align: left;
    font-weight: 600;
    color: #333;
    border-bottom: 2px solid #dee2e6;
  }

  td {
    padding: 15px;
    border-bottom: 1px solid #dee2e6;
  }

  tr:hover {
    background: #f8f9fa;
  }
`;

const ProductImage = styled.img`
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 5px;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  margin-right: 8px;
  transition: background-color 0.3s;

  &.edit {
    background: #007bff;
    color: white;

    &:hover {
      background: #0056b3;
    }
  }

  &.delete {
    background: #dc3545;
    color: white;

    &:hover {
      background: #c82333;
    }
  }
`;

const Loading = styled.div`
  text-align: center;
  padding: 50px;
  font-size: 18px;
  color: #666;
`;

const NoProducts = styled.div`
  text-align: center;
  padding: 50px;
  font-size: 18px;
  color: #666;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
`;

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load products'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (productId) => {
    navigate(`/admin/edit-product/${productId}`);
  };

  const handleDelete = async (productId) => {
    const result = await Swal.fire({
      title: 'Confirm Deletion',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('adminToken');
        await axios.delete(`/api/admin/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Product has been deleted.',
          timer: 1500,
          showConfirmButton: false
        });

        fetchProducts(); // Refresh the list
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete product'
        });
      }
    }
  };

  if (loading) {
    return <Loading>Loading products...</Loading>;
  }

  return (
    <ManageProductsContainer>
      <Header>
        <Title>Manage Products</Title>
        <AddButton onClick={() => navigate('/admin/add-product')}>
          <i className="expDel_plus"></i> Add New Product
        </AddButton>
      </Header>

      {products.length === 0 ? (
        <NoProducts>
          <i className="expDel_box_open" style={{ fontSize: '48px', color: '#ccc', marginBottom: '20px' }}></i>
          <p>No products found. Add the first product.</p>
        </NoProducts>
      ) : (
        <ProductsTable>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id}>
                <td>
                  <ProductImage
                    src={product.image && (product.image.startsWith('http') ? product.image : `${product.image.startsWith('/') ? '' : '/'}${product.image}`)}
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = '/placeholder-image.png';
                    }}
                  />
                </td>
                <td>{product.name}</td>
                <td>{product.category?.name || 'N/A'}</td>
                <td>₹{product.price}</td>
                <td>{product.stock} {product.unit}</td>
                <td>
                  <ActionButton
                    className="edit"
                    onClick={() => handleEdit(product._id)}
                  >
                    <i className="expDel_edit"></i> Edit
                  </ActionButton>
                  <ActionButton
                    className="delete"
                    onClick={() => handleDelete(product._id)}
                  >
                    <i className="expDel_trash"></i> Delete
                  </ActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </ProductsTable>
      )}
    </ManageProductsContainer>
  );
};

export default ManageProducts;
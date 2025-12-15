import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from '../../utils/axios';
import Swal from 'sweetalert2';

const ManageOrdersContainer = styled.div``;

const Section = styled.section`
  background: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 30px;
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
`;

const OrdersTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    padding: 12px 15px;
    background-color: #f8f9fa;
    color: #333;
    font-weight: 600;
    border-bottom: 2px solid #dee2e6;
  }

  td {
    padding: 12px 15px;
    border-bottom: 1px solid #dee2e6;
  }

  tr:hover {
    background-color: #f8f9fa;
  }
`;

const ActionButton = styled.button`
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  margin-right: 5px;

  &.view {
    background-color: #17a2b8;
    color: white;

    &:hover {
      background-color: #138496;
    }
  }

  &.edit {
    background-color: #ffc107;
    color: #212529;

    &:hover {
      background-color: #e0a800;
    }
  }

  &.delete {
    background-color: #dc3545;
    color: white;

    &:hover {
      background-color: #c82333;
    }
  }
`;

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;

  &.pending {
    background-color: #fff3cd;
    color: #856404;
  }

  &.confirmed {
    background-color: #d1ecf1;
    color: #0c5460;
  }

  &.processing {
    background-color: #d4edda;
    color: #155724;
  }

  &.shipped {
    background-color: #cce5ff;
    color: #004085;
  }

  &.delivered {
    background-color: #d4edda;
    color: #155724;
  }

  &.cancelled {
    background-color: #f8d7da;
    color: #721c24;
  }
`;

const StatusSelect = styled.select`
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
`;

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch orders'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`/api/admin/orders/${orderId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Order status updated successfully'
      });

      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update order status'
      });
    }
  };

  const handleDelete = async (orderId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Delete'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('adminToken');
        await axios.delete(`/api/admin/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'Order deleted successfully'
        });

        fetchOrders();
      } catch (error) {
        console.error('Error deleting order:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete order'
        });
      }
    }
  };

  const getStatusOptions = (currentStatus) => {
    const allStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    return allStatuses.filter(status => {
      // Don't allow going back to previous statuses
      if (currentStatus === 'delivered') return status === 'delivered';
      if (currentStatus === 'cancelled') return status === 'cancelled';
      if (currentStatus === 'shipped') return ['shipped', 'delivered', 'cancelled'].includes(status);
      if (currentStatus === 'processing') return ['processing', 'shipped', 'delivered', 'cancelled'].includes(status);
      if (currentStatus === 'confirmed') return ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status);
      return true; // pending can go to any status
    });
  };

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <ManageOrdersContainer>
      <Section>
        <SectionTitle>All Orders</SectionTitle>
        <OrdersTable>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td>#{order._id.slice(-8)}</td>
                <td>{order.userId?.name || 'Unknown'}</td>
                <td>{order.items?.length || 0} items</td>
                <td>₹{order.totalAmount?.toLocaleString() || 0}</td>
                <td>
                  <StatusSelect
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                  >
                    {getStatusOptions(order.status).map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </StatusSelect>
                </td>
                <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                <td>
                  <ActionButton className="delete" onClick={() => handleDelete(order._id)}>
                    Delete
                  </ActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </OrdersTable>
      </Section>
    </ManageOrdersContainer>
  );
};

export default ManageOrders;
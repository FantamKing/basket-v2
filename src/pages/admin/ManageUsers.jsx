import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import Swal from 'sweetalert2';

const ManageUsersContainer = styled.div``;

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

const UserTable = styled.table`
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

const FormContainer = styled.div`
  background: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const FormGroup = styled.div`
  &.full-width {
    grid-column: 1 / -1;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;

  &.required::after {
    content: ' *';
    color: #dc3545;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #28a745;
    box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1);
  }
`;

const SubmitButton = styled.button`
  padding: 15px 30px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 20px;

  &:hover {
    background-color: #218838;
  }

  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  padding: 15px 30px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 20px;
  margin-left: 10px;

  &:hover {
    background-color: #5a6268;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 10px;
  align-items: end;
  margin-bottom: 20px;
`;

const ClearButton = styled.button`
  padding: 12px 20px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: #5a6268;
  }
`;

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch users'
      });
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    
    // Format address for form input
    const formatAddressForForm = (address) => {
      if (!address) return '';
      if (typeof address === 'string') return address;
      if (typeof address === 'object') {
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.pincode) parts.push(address.pincode);
        return parts.join(', ');
      }
      return '';
    };
    
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: formatAddressForForm(user.address)
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(`/api/admin/users/${editingUser._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'User updated successfully'
      });

      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: ''
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update user'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
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
        await axios.delete(`/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'User deleted successfully'
        });

        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete user'
        });
      }
    }
  };

  return (
    <ManageUsersContainer>
      <Section>
        <SectionTitle>All Users</SectionTitle>
        
        {/* Search Section */}
        <SearchContainer>
          <FormGroup style={{ flex: 1 }}>
            <Label>Search Users</Label>
            <Input
              type="text"
              placeholder="Search by name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FormGroup>
          {searchTerm && (
            <ClearButton onClick={() => setSearchTerm('')}>
              Clear Search
            </ClearButton>
          )}
        </SearchContainer>
        
        <div style={{ marginBottom: '10px', color: '#666', fontSize: '14px' }}>
          Showing {filteredUsers.length} of {users.length} users
          {searchTerm && ` (filtered by "${searchTerm}")`}
        </div>
        
        <UserTable>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => {
                // Format address for display
                const formatAddress = (address) => {
                  if (!address) return 'N/A';
                  if (typeof address === 'string') return address;
                  if (typeof address === 'object') {
                    const parts = [];
                    if (address.street) parts.push(address.street);
                    if (address.city) parts.push(address.city);
                    if (address.state) parts.push(address.state);
                    if (address.pincode) parts.push(address.pincode);
                    return parts.join(', ') || 'N/A';
                  }
                  return 'N/A';
                };

                return (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || 'N/A'}</td>
                    <td>{formatAddress(user.address)}</td>
                    <td>
                      <ActionButton className="edit" onClick={() => handleEdit(user)}>
                        Edit
                      </ActionButton>
                      <ActionButton className="delete" onClick={() => handleDelete(user._id)}>
                        Delete
                      </ActionButton>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  {searchTerm ? `No users found matching "${searchTerm}"` : 'No users found'}
                </td>
              </tr>
            )}
          </tbody>
        </UserTable>
      </Section>

      {editingUser && (
        <FormContainer>
          <SectionTitle>Edit User</SectionTitle>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label className="required">Name</Label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label className="required">Email</Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Phone</Label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </FormGroup>

            <FormGroup className="full-width">
              <Label>Address</Label>
              <Input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </FormGroup>

            <FormGroup className="full-width">
              <SubmitButton type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update User'}
              </SubmitButton>
              <CancelButton type="button" onClick={handleCancelEdit}>
                Cancel
              </CancelButton>
            </FormGroup>
          </Form>
        </FormContainer>
      )}
    </ManageUsersContainer>
  );
};

export default ManageUsers;
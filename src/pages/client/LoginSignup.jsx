import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from '../../utils/axios';
import Swal from 'sweetalert2';

const AuthContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-primary);
  padding: 20px;
`;

const AuthBox = styled.div`
  background: var(--card-bg);
  border-radius: 20px;
  box-shadow: 0 15px 35px var(--shadow-dark);
  width: 100%;
  max-width: 400px;
  padding: 40px;
`;

const AuthTabs = styled.div`
  display: flex;
  margin-bottom: 30px;
  border-bottom: 2px solid var(--border-light);
`;

const AuthTab = styled.button`
  flex: 1;
  padding: 15px;
  background: none;
  border: none;
  font-size: 18px;
  font-weight: 500;
  color: ${props => props.active ? 'var(--btn-primary)' : 'var(--text-secondary)'};
  border-bottom: 2px solid ${props => props.active ? 'var(--btn-primary)' : 'transparent'};
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    color: var(--btn-primary);
  }
`;

const AuthTitle = styled.h2`
  text-align: center;
  margin-bottom: 30px;
  color: var(--text-color);
`;

const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  position: relative;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  color: var(--text-secondary);
  font-weight: 500;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 12px 15px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s;
  
  &:focus {
    outline: none;
    border-color: var(--input-focus-border);
    box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.08);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 15px;
  background-color: var(--btn-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
  
  &:hover {
    background-color: var(--btn-primary-hover);
  }
  
  &:disabled {
    background-color: var(--btn-secondary);
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: var(--btn-danger);
  font-size: 14px;
  margin-top: 5px;
`;

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!isLogin) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
      
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\d{10}$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (isLogin) {
        // Login
        const response = await axios.post('/login', {
          email: formData.email,
          password: formData.password
        });
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        Swal.fire({
          icon: 'success',
          title: 'Login Successful!',
          text: 'Welcome back to Basket',
          timer: 1500,
          showConfirmButton: false
        });
        
        navigate('/');
      } else {
        // Signup
        await axios.post('/signup', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone
        });
        
        Swal.fire({
          icon: 'success',
          title: 'Account Created!',
          text: 'Account created successfully',
          timer: 1500,
          showConfirmButton: false
        });
        
        setIsLogin(true);
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: ''
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  return (
    <AuthContainer>
      <AuthBox>
        <AuthTabs>
          <AuthTab 
            active={isLogin}
            onClick={() => setIsLogin(true)}
          >
            Login
          </AuthTab>
          <AuthTab 
            active={!isLogin}
            onClick={() => setIsLogin(false)}
          >
            Signup
          </AuthTab>
        </AuthTabs>
        
        <AuthTitle>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </AuthTitle>
        
        <AuthForm onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <FormGroup>
                <FormLabel>Full Name</FormLabel>
                <FormInput
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
                {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
              </FormGroup>
              
              <FormGroup>
                <FormLabel>Phone Number</FormLabel>
                <FormInput
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter 10-digit phone number"
                />
                {errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}
              </FormGroup>
            </>
          )}
          
          <FormGroup>
            <FormLabel>Email Address</FormLabel>
            <FormInput
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
            />
            {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <FormLabel>Password</FormLabel>
            <FormInput
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
            />
            {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
          </FormGroup>
          
          {!isLogin && (
            <FormGroup>
              <FormLabel>Confirm Password</FormLabel>
              <FormInput
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
              />
              {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword}</ErrorMessage>}
            </FormGroup>
          )}
          
          <SubmitButton type="submit" disabled={loading}>
            {loading ? (
              <i className="expDel_spinner fa-spin"></i>
            ) : isLogin ? (
              'Login'
            ) : (
              'Create Account'
            )}
          </SubmitButton>
        </AuthForm>
      </AuthBox>
    </AuthContainer>
  );
};

export default LoginSignup;
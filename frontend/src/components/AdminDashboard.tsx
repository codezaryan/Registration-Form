import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Registration {
  id: number;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  mobileNumber: string;
  email: string;
  aadhaarNumber: string;
  panNumber: string;
  permanentAddress: string;
  state: string;
  city: string;
  pincode: string;
  photoUrl: string;
  videoUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface FilterState {
  search: string;
  state: string;
  city: string;
  gender: string;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  limit: number;
  total: number;
}

interface PreviewFileState {
  type: string;
  url: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    state: '',
    city: '',
    gender: ''
  });
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    total: 0
  });
  const [previewFile, setPreviewFile] = useState<PreviewFileState>({ type: '', url: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    mobileNumber: '',
    email: '',
    aadhaarNumber: '',
    panNumber: '',
    permanentAddress: '',
    state: '',
    city: '',
    pincode: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check authentication on component mount
    const token = localStorage.getItem('token');
    const isAuthenticated = localStorage.getItem('isAuthenticated');

    if (!token || !isAuthenticated) {
      navigate('/admin/login');
      return;
    }

    fetchRegistrations();
  }, [filters, pagination.currentPage, navigate]);

  const fetchRegistrations = async (retryCount = 0) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/registrations?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 10000 // 10 second timeout
      });
      setRegistrations(response.data.registrations);
      setPagination(prev => ({
        ...prev,
        totalPages: response.data.pagination.totalPages,
        total: response.data.pagination.total
      }));
    } catch (error) {
      console.error('Error fetching registrations:', error);

      // Retry logic for network errors
      if (retryCount < 2 && (axios.isAxiosError(error) && !error.response)) {
        console.log(`Retrying request (attempt ${retryCount + 1})...`);
        setTimeout(() => fetchRegistrations(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Token expired or invalid, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        window.location.href = '/admin/login';
      } else if (axios.isAxiosError(error)) {
        alert(`Error fetching registrations: ${error.response?.data?.error || error.message}`);
      } else {
        alert('An unexpected error occurred while fetching registrations.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleDelete = async (id: string) => {
    console.log('Delete called with ID:', id);
    if (window.confirm('Are you sure you want to delete this registration?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/registrations/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: 10000
        });

        // Optimistically update UI
        setRegistrations(prev => prev.filter(reg => reg.id.toString() !== id));
        const currentTotal = pagination.total - 1;
        setPagination(prev => ({
          ...prev,
          total: currentTotal,
          totalPages: Math.ceil(currentTotal / prev.limit)
        }));

        alert('Registration deleted successfully');
      } catch (error) {
        console.error('Error deleting registration:', error);

        // Revert optimistic update on error
        await fetchRegistrations();

        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            alert('Authentication failed. Please log in again.');
            localStorage.removeItem('token');
            localStorage.removeItem('isAuthenticated');
            window.location.href = '/admin/login';
          } else {
            alert(`Error deleting registration: ${error.response?.data?.error || error.message}`);
          }
        } else {
          alert('An unexpected error occurred while deleting the registration.');
        }
      }
    }
  };

  const openPreview = (url: string, type: string) => {
    setPreviewFile({ url, type });
  };

  const closePreview = () => {
    setPreviewFile({ type: '', url: '' });
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };



  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) errors.gender = 'Gender is required';
    if (!formData.mobileNumber.trim()) errors.mobileNumber = 'Mobile number is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.aadhaarNumber.trim()) errors.aadhaarNumber = 'Aadhaar number is required';
    if (!formData.panNumber.trim()) errors.panNumber = 'PAN number is required';
    if (!formData.permanentAddress.trim()) errors.permanentAddress = 'Permanent address is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.pincode.trim()) errors.pincode = 'Pincode is required';

    // Basic email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    // Basic mobile number validation
    if (formData.mobileNumber && !/^\d{10}$/.test(formData.mobileNumber.replace(/\D/g, ''))) {
      errors.mobileNumber = 'Mobile number must be 10 digits';
    }

    // Basic Aadhaar validation
    if (formData.aadhaarNumber && !/^\d{12}$/.test(formData.aadhaarNumber.replace(/\D/g, ''))) {
      errors.aadhaarNumber = 'Aadhaar number must be 12 digits';
    }

    // Basic PAN validation
    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) {
      errors.panNumber = 'PAN number format is invalid';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      dateOfBirth: '',
      gender: '',
      mobileNumber: '',
      email: '',
      aadhaarNumber: '',
      panNumber: '',
      permanentAddress: '',
      state: '',
      city: '',
      pincode: ''
    });
    setFormErrors({});
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (registration: Registration) => {
    setEditingRegistration(registration);
    setFormData({
      fullName: registration.fullName,
      dateOfBirth: registration.dateOfBirth,
      gender: registration.gender,
      mobileNumber: registration.mobileNumber,
      email: registration.email,
      aadhaarNumber: registration.aadhaarNumber,
      panNumber: registration.panNumber,
      permanentAddress: registration.permanentAddress,
      state: registration.state,
      city: registration.city,
      pincode: registration.pincode
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingRegistration(null);
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/registrations/admin`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 15000 // 15 second timeout for file uploads
      });

      // Optimistically add new registration to the list
      const newRegistration = response.data.registration;
      setRegistrations(prev => [newRegistration, ...prev]);
      setPagination(prev => ({
        ...prev,
        total: prev.total + 1,
        totalPages: Math.ceil((prev.total + 1) / prev.limit)
      }));

      closeModals();
      alert('Registration created successfully');
    } catch (error: any) {
      console.error('Error creating registration:', error);
      if (error.response?.data?.error) {
        setFormErrors({ general: error.response.data.error });
      } else if (error.code === 'ECONNABORTED') {
        setFormErrors({ general: 'Request timeout. Please try again.' });
      } else {
        setFormErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !editingRegistration) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/registrations/${editingRegistration.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 10000
      });

      // Optimistically update the registration in the list
      const updatedRegistration = response.data.registration;
      setRegistrations(prev => prev.map(reg =>
        reg.id === editingRegistration.id ? updatedRegistration : reg
      ));

      closeModals();
      alert('Registration updated successfully');
    } catch (error: any) {
      console.error('Error updating registration:', error);

      // Revert optimistic update on error
      await fetchRegistrations();

      if (error.response?.data?.error) {
        setFormErrors({ general: error.response.data.error });
      } else if (error.code === 'ECONNABORTED') {
        setFormErrors({ general: 'Request timeout. Please try again.' });
      } else {
        setFormErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Add New Registration
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Name, Mobile, Aadhaar"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <input
              type="text"
              value={filters.state}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {previewFile.url && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {previewFile.type === 'image' ? 'Photo Preview' : 'Video Preview'}
              </h3>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="max-h-96 overflow-auto">
              {previewFile.type === 'image' ? (
                <img 
                  src={previewFile.url} 
                  alt="Preview" 
                  className="max-w-full h-auto"
                />
              ) : (
                <video 
                  src={previewFile.url} 
                  controls 
                  className="max-w-full"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registrations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {registrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{reg.fullName}</div>
                      <div className="text-sm text-gray-500">{reg.gender}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(reg.dateOfBirth).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{reg.mobileNumber}</div>
                    <div className="text-sm text-gray-500">{reg.email}</div>
                    <div className="text-sm text-gray-500">Aadhaar: {reg.aadhaarNumber}</div>
                    <div className="text-sm text-gray-500">PAN: {reg.panNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{reg.permanentAddress}</div>
                    <div className="text-sm text-gray-500">
                      {reg.city}, {reg.state} - {reg.pincode}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openPreview(reg.photoUrl, 'image')}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        View Photo
                      </button>
                      <button
                        onClick={() => openPreview(reg.videoUrl, 'video')}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        View Video
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openEditModal(reg)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(reg.id.toString())}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.currentPage - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {registrations.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No registrations found</p>
        </div>
      )}

      {/* Create Registration Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Registration</h2>
              <button
                onClick={closeModals}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {formErrors.general && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                  {formErrors.general}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.fullName && <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{formErrors.dateOfBirth}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.gender ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {formErrors.gender && <p className="text-red-500 text-xs mt-1">{formErrors.gender}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.mobileNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.mobileNumber && <p className="text-red-500 text-xs mt-1">{formErrors.mobileNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhaar Number *
                  </label>
                  <input
                    type="text"
                    name="aadhaarNumber"
                    value={formData.aadhaarNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.aadhaarNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.aadhaarNumber && <p className="text-red-500 text-xs mt-1">{formErrors.aadhaarNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN Number *
                  </label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.panNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.panNumber && <p className="text-red-500 text-xs mt-1">{formErrors.panNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.state && <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.city && <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.pincode ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.pincode && <p className="text-red-500 text-xs mt-1">{formErrors.pincode}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permanent Address *
                </label>
                <textarea
                  name="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.permanentAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.permanentAddress && <p className="text-red-500 text-xs mt-1">{formErrors.permanentAddress}</p>}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Registration Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Registration</h2>
              <button
                onClick={closeModals}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              {formErrors.general && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                  {formErrors.general}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.fullName && <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{formErrors.dateOfBirth}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.gender ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {formErrors.gender && <p className="text-red-500 text-xs mt-1">{formErrors.gender}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.mobileNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.mobileNumber && <p className="text-red-500 text-xs mt-1">{formErrors.mobileNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhaar Number *
                  </label>
                  <input
                    type="text"
                    name="aadhaarNumber"
                    value={formData.aadhaarNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.aadhaarNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.aadhaarNumber && <p className="text-red-500 text-xs mt-1">{formErrors.aadhaarNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN Number *
                  </label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.panNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.panNumber && <p className="text-red-500 text-xs mt-1">{formErrors.panNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.state && <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.city && <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors.pincode ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.pincode && <p className="text-red-500 text-xs mt-1">{formErrors.pincode}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permanent Address *
                </label>
                <textarea
                  name="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.permanentAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.permanentAddress && <p className="text-red-500 text-xs mt-1">{formErrors.permanentAddress}</p>}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
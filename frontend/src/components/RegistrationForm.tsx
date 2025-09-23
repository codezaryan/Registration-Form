import { useState } from 'react';
import axios from 'axios';

interface FormData {
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
}

interface FormErrors {
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  mobileNumber?: string;
  email?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  permanentAddress?: string;
  state?: string;
  city?: string;
  pincode?: string;
  photo?: string;
  video?: string;
}

const RegistrationForm = () => {
  const [formData, setFormData] = useState<FormData>({
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

  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    const file = files?.[0];

    if (name === 'photo') {
      if (file && !['image/jpeg', 'image/png'].includes(file.type)) {
        setErrors(prev => ({ ...prev, photo: 'Please upload JPG or PNG file' }));
        return;
      }
      if (file && file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'File size must be less than 5MB' }));
        return;
      }
      setPhoto(file || null);
      setErrors(prev => ({ ...prev, photo: '' }));
    }

    if (name === 'video') {
      if (file && !['video/mp4', 'video/quicktime'].includes(file.type)) {
        setErrors(prev => ({ ...prev, video: 'Please upload MP4 or MOV file' }));
        return;
      }
      if (file && file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, video: 'File size must be less than 10MB' }));
        return;
      }
      setVideo(file || null);
      setErrors(prev => ({ ...prev, video: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of Birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.mobileNumber.match(/^[0-9]{10}$/)) newErrors.mobileNumber = 'Valid 10-digit mobile number required';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Valid email required';
    if (!formData.aadhaarNumber.match(/^[0-9]{12}$/)) newErrors.aadhaarNumber = 'Valid 12-digit Aadhaar number required';
    if (!formData.panNumber.match(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)) newErrors.panNumber = 'Valid PAN number required';
    if (!formData.permanentAddress.trim()) newErrors.permanentAddress = 'Permanent Address is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.pincode.match(/^[0-9]{6}$/)) newErrors.pincode = 'Valid 6-digit pincode required';
    if (!photo) newErrors.photo = 'Photo is required';
    if (!video) newErrors.video = 'Verification video is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      const submitData = new FormData();

      // Append form data
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key as keyof FormData]);
      });

      // Append files
      if (photo) submitData.append('photo', photo);
      if (video) submitData.append('video', video);

      await axios.post('http://localhost:5000/api/registrations', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage('Registration submitted successfully!');
      // Reset form
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
      setPhoto(null);
      setVideo(null);
      const photoInput = document.getElementById('photo') as HTMLInputElement;
      const videoInput = document.getElementById('video') as HTMLInputElement;
      if (photoInput) photoInput.value = '';
      if (videoInput) videoInput.value = '';

    } catch (error) {
      setMessage('Error submitting registration. Please try again.');
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Registration Form
        </h1>
        
        {message && (
          <div className={`p-4 rounded mb-6 ${
            message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number *
              </label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.mobileNumber && <p className="text-red-500 text-sm mt-1">{errors.mobileNumber}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email ID *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aadhaar Number *
              </label>
              <input
                type="text"
                name="aadhaarNumber"
                value={formData.aadhaarNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.aadhaarNumber && <p className="text-red-500 text-sm mt-1">{errors.aadhaarNumber}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PAN Number *
              </label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.panNumber && <p className="text-red-500 text-sm mt-1">{errors.panNumber}</p>}
            </div>
          </div>
          
          {/* Address Details Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Address Details</h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permanent Address *
                </label>
                <textarea
                  name="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.permanentAddress && <p className="text-red-500 text-sm mt-1">{errors.permanentAddress}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
                </div>
              </div>
            </div>
          </div>
          
          {/* File Upload Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Document Upload</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo (JPG/PNG, max 5MB) *
                </label>
                <input
                  type="file"
                  id="photo"
                  name="photo"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.photo && <p className="text-red-500 text-sm mt-1">{errors.photo}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Video (MP4/MOV, max 10MB) *
                </label>
                <input
                  type="file"
                  id="video"
                  name="video"
                  accept=".mp4,.mov"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.video && <p className="text-red-500 text-sm mt-1">{errors.video}</p>}
              </div>
            </div>
          </div>
          
          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;
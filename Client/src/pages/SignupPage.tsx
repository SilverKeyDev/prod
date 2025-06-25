import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Phone, Building } from 'lucide-react';
import { User } from "../types/index.ts";

interface SignupPageProps {
  onLogin: (user: User) => void;
}

export default function SignupPage({ onLogin }: SignupPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    agencyName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate signup
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user: User = {
      id: '1',
      name: formData.name,
      email: formData.email,
      agencyName: formData.agencyName || undefined,
      phone: formData.phone || undefined,
    };

    onLogin(user);
    setLoading(false);
    navigate('/dashboard');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif text-navy mb-2">Create your account</h2>
          <p className="text-navy/60 font-light">Join the future of real estate analysis</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="card space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">Full name</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-navy/40" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-navy/40" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-navy/40" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="Create a password"
                required
              />
            </div>
          </div>

          {/* Agency Name */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">Agency name (optional)</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-navy/40" />
              <input
                type="text"
                name="agencyName"
                value={formData.agencyName}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="Your real estate agency"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">Phone number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-navy/40" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="Your phone number"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="shimmer w-20 h-5 rounded mx-auto"></div>
            ) : (
              'Create account'
            )}
          </button>

          <div className="text-center text-sm">
            <span className="text-navy/60">Already have an account? </span>
            <Link to="/login" className="text-gold hover:text-gold-light transition-colors">
              Sign in
            </Link>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 space-x-6 text-sm text-navy/60">
          <Link to="#" className="hover:text-navy transition-colors">Privacy</Link>
          <Link to="#" className="hover:text-navy transition-colors">Terms</Link>
        </div>
      </div>
    </div>
  );
}
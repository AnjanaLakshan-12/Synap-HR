import React, { useState, useEffect } from 'react';
import { Building2, Save, X, RefreshCw } from 'lucide-react';

interface OrganizationManagementModalProps {
  token: string;
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const OrganizationManagementModal: React.FC<OrganizationManagementModalProps> = ({
  token,
  onClose,
  showToast
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    location: '',
    description: '',
    websiteUrl: '',
    contactEmail: '',
    contactPhone: '',
    companySize: ''
  });

  useEffect(() => {
    fetchMyOrganization();
  }, []);

  const fetchMyOrganization = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5163/api/organizations/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name || '',
          industry: data.industry || '',
          location: data.location || '',
          description: data.description || '',
          websiteUrl: data.websiteUrl || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          companySize: data.companySize || ''
        });
      } else {
        const err = await response.json();
        showToast(err.message || 'Error loading organization profile', 'error');
      }
    } catch (err) {
      console.error("Error fetching organization profile", err);
      showToast('Failed to connect to backend server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('http://localhost:5163/api/organizations/my', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast('Organization Profile saved successfully!', 'success');
        onClose();
      } else {
        const errData = await response.json();
        showToast(errData.message || 'Failed to save organization profile', 'error');
      }
    } catch (err) {
      console.error("Error saving organization profile", err);
      showToast('Server error while saving profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3100
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '740px',
        maxHeight: '90vh',
        overflowY: 'auto',
        textAlign: 'left',
        padding: 0,
        borderRadius: '16px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
        background: '#ffffff'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '3.2rem',
              height: '3.2rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #a7f3d0 0%, #059669 100%)',
              color: '#022c22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}>
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                Maintain Corporate Organization Profile
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#a7f3d0', opacity: 0.9 }}>
                Update company overview, contact details, headquarters, and branding
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b' }}>
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" style={{ margin: '0 auto 0.5rem', color: '#059669' }} />
            Loading organization data...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#064e3b' }}>Organization Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Global Tech Solutions"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#064e3b' }}>Industry / Sector</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g. Information Technology & Services"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#064e3b' }}>Headquarters Location</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Colombo, Sri Lanka"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#064e3b' }}>Company Size</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.companySize}
                  onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                  placeholder="e.g. 50-200 Employees"
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700, color: '#064e3b' }}>Corporate Overview & Description</label>
              <textarea
                className="form-control"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your company's mission, values, work environment, and core products/services..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#064e3b' }}>Official Website URL</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="https://company.com"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#064e3b' }}>Contact Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="careers@company.com"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#064e3b' }}>Contact Phone</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+94 11 234 5678"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ borderTop: '1px solid #d1fae5', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff', fontWeight: 700 }}>
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Profile...' : 'Save Organization Profile'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

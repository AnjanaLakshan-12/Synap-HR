import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart4, Building2, UserPlus, FileText, Plus,
  RefreshCw, Layers, Edit, Trash2, Power, Users as UsersIcon, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';


interface AdminDashboardProps {
  token: string;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

interface Stats {
  users: number;
  jobs: number;
  applications: number;
  interviews: number;
  organizations: number;
  departments: number;
}

interface Organization {
  id: number;
  name: string;
  industry: string;
  location: string;
  isActive?: boolean;
}

interface Department {
  id: number;
  name: string;
  organizationId: number;
  organization?: Organization;
  isActive?: boolean;
}

interface UserAccount {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  organizationId?: number;
  departmentId?: number;
}

interface AuditLog {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string;
  action: string;
  entityName: string;
  createdAt: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, showToast }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orgs' | 'depts' | 'users' | 'userList' | 'audit'>('dashboard');
  const [loading, setLoading] = useState(false);

  // Data States
  const [stats, setStats] = useState<Stats | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);


  // Create Form States
  const [orgName, setOrgName] = useState('');
  const [orgIndustry, setOrgIndustry] = useState('');
  const [orgLocation, setOrgLocation] = useState('');

  const [deptName, setDeptName] = useState('');
  const [deptOrgId, setDeptOrgId] = useState('');

  const [userFullName, setUserFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState('Recruiter');
  const [userOrgId, setUserOrgId] = useState('');
  const [userDeptId, setUserDeptId] = useState('');

  // Edit Modals State
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [token]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);


  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch Stats
      const statsRes = await fetch('http://localhost:5163/api/admin/dashboard', { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          users: statsData.users,
          jobs: statsData.jobs,
          applications: statsData.applications,
          interviews: statsData.interviews,
          organizations: statsData.organizations || 0,
          departments: statsData.departments || 0
        });
      }

      // Fetch Orgs
      const orgsRes = await fetch('http://localhost:5163/api/admin/organizations', { headers });
      if (orgsRes.ok) {
        const orgsData = await orgsRes.json();
        setOrganizations(orgsData);
      }

      // Fetch Depts
      const deptsRes = await fetch('http://localhost:5163/api/admin/departments', { headers });
      if (deptsRes.ok) {
        const deptsData = await deptsRes.json();
        setDepartments(deptsData);
      }

      // Fetch Users List
      const usersRes = await fetch('http://localhost:5163/api/admin/users', { headers });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData);
      }

      // Fetch Audit Logs
      const auditRes = await fetch('http://localhost:5163/api/admin/auditlogs', { headers });
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData);
      }

    } catch (err) {
      showToast('Error loading admin dashboard details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName) return;

    try {
      const response = await fetch('http://localhost:5163/api/admin/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: orgName, industry: orgIndustry, location: orgLocation }),
      });

      if (!response.ok) throw new Error('Failed to create organization');
      showToast('Organization created successfully', 'success');
      setOrgName('');
      setOrgIndustry('');
      setOrgLocation('');
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;

    try {
      const response = await fetch(`http://localhost:5163/api/admin/organizations/${editingOrg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editingOrg.name, industry: editingOrg.industry, location: editingOrg.location }),
      });

      if (!response.ok) throw new Error('Failed to update organization');
      showToast('Organization details updated successfully', 'success');
      setEditingOrg(null);
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleOrgStatus = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5163/api/admin/organizations/${id}/toggle-status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to update status');
      const data = await response.json();
      showToast(data.message || 'Status updated', 'success');
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteOrg = async (id: number) => {
    if (!window.confirm("Are you sure? If linked data exists, it will be safely soft-deactivated instead.")) return;
    try {
      const response = await fetch(`http://localhost:5163/api/admin/organizations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete organization');
      const data = await response.json();
      showToast(data.message, 'success');
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptOrgId) return;

    try {
      const response = await fetch('http://localhost:5163/api/admin/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: deptName, organizationId: parseInt(deptOrgId) }),
      });

      if (!response.ok) throw new Error('Failed to create department');
      showToast('Department created successfully', 'success');
      setDeptName('');
      setDeptOrgId('');
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;

    try {
      const response = await fetch(`http://localhost:5163/api/admin/departments/${editingDept.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editingDept.name, organizationId: editingDept.organizationId }),
      });

      if (!response.ok) throw new Error('Failed to update department');
      showToast('Department updated successfully', 'success');
      setEditingDept(null);
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleDeptStatus = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5163/api/admin/departments/${id}/toggle-status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to update status');
      const data = await response.json();
      showToast(data.message || 'Status updated', 'success');
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteDept = async (id: number) => {
    if (!window.confirm("Are you sure? If linked data exists, it will be soft-deactivated.")) return;
    try {
      const response = await fetch(`http://localhost:5163/api/admin/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete department');
      const data = await response.json();
      showToast(data.message, 'success');
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFullName || !userEmail || !userPassword || !userRole) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    const payload = {
      fullName: userFullName,
      email: userEmail,
      password: userPassword,
      role: userRole,
      organizationId: userOrgId ? parseInt(userOrgId) : null,
      departmentId: userDeptId ? parseInt(userDeptId) : null
    };

    try {
      const response = await fetch('http://localhost:5163/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Failed to create user');
      }

      showToast(`User account for ${userFullName} created successfully!`, 'success');
      setUserFullName('');
      setUserEmail('');
      setUserPassword('');
      setUserOrgId('');
      setUserDeptId('');
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await fetch(`http://localhost:5163/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: editingUser.fullName,
          email: editingUser.email,
          role: editingUser.role,
          organizationId: editingUser.organizationId || null,
          departmentId: editingUser.departmentId || null
        }),
      });

      if (!response.ok) throw new Error('Failed to update user profile');
      showToast('User account updated successfully', 'success');
      setEditingUser(null);
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleUserStatus = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5163/api/admin/users/${id}/toggle-status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to toggle status');
      const data = await response.json();
      showToast(data.message, 'success');
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Pagination Calculations
  const totalPages = Math.ceil(auditLogs.length / pageSize);
  const activePage = Math.min(currentPage, totalPages || 1);
  const indexOfLastLog = activePage * pageSize;
  const indexOfFirstLog = indexOfLastLog - pageSize;
  const currentLogs = auditLogs.slice(indexOfFirstLog, indexOfLastLog);

  return (

    <div className="container" style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Administration Hub</h1>
          <p>Full CRUD control over organizations, departments, user accounts, and system audit logs</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchDashboardData} disabled={loading} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BarChart4 className="w-4 h-4" /> System Metrics
          </div>
        </button>
        <button className={`tab-btn ${activeTab === 'orgs' ? 'active' : ''}`} onClick={() => setActiveTab('orgs')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Building2 className="w-4 h-4" /> Organizations ({organizations.length})
          </div>
        </button>
        <button className={`tab-btn ${activeTab === 'depts' ? 'active' : ''}`} onClick={() => setActiveTab('depts')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers className="w-4 h-4" /> Departments ({departments.length})
          </div>
        </button>
        <button className={`tab-btn ${activeTab === 'userList' ? 'active' : ''}`} onClick={() => setActiveTab('userList')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <UsersIcon className="w-4 h-4" /> User Directory ({usersList.length})
          </div>
        </button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <UserPlus className="w-4 h-4" /> Add User
          </div>
        </button>
        <button className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText className="w-4 h-4" /> System Audit Logs
          </div>
        </button>
      </div>

      {/* Loading overlay */}
      {loading && !stats && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <RefreshCw className="w-8 h-8 animate-spin text-primary" style={{ animation: 'spin 1.5s linear infinite' }} />
        </div>
      )}

      {/* Dashboard Metrics Tab */}
      {activeTab === 'dashboard' && stats && (
        <div>
          <div className="grid-cols-3" style={{ marginBottom: '2.5rem' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', textAlign: 'left' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                <UsersIcon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 400 }}>Total Accounts</h4>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-white)' }}>{stats.users}</p>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', textAlign: 'left' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                <Building2 className="w-8 h-8 text-accent-cyan" />
              </div>
              <div>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 400 }}>Organizations</h4>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-white)' }}>{stats.organizations}</p>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', textAlign: 'left' }}>
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                <Layers className="w-8 h-8 text-accent-purple" />
              </div>
              <div>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 400 }}>Departments</h4>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-white)' }}>{stats.departments}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Directory & Full CRUD Tab */}
      {activeTab === 'userList' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>User Account Directory ({usersList.length})</span>
            <button className="btn btn-primary" onClick={() => setActiveTab('users')}>
              <Plus className="w-4 h-4" /> Add User Account
            </button>
          </h3>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((user) => (
                  <tr key={user.id}>
                    <td>#{user.id}</td>
                    <td style={{ fontWeight: 600 }}>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#4338ca' }}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {user.isActive !== false ? (
                        <span className="badge badge-selected"><CheckCircle className="w-3 h-3 mr-1" /> Active</span>
                      ) : (
                        <span className="badge badge-rejected"><XCircle className="w-3 h-3 mr-1" /> Deactivated</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                          onClick={() => setEditingUser(user)}
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          className={`btn ${user.isActive !== false ? 'btn-danger' : 'btn-secondary'}`}
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                          onClick={() => handleToggleUserStatus(user.id)}
                        >
                          <Power className="w-3.5 h-3.5" /> {user.isActive !== false ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Organizations Tab */}
      {activeTab === 'orgs' && (
        <div className="grid-cols-2">
          {/* Create Org Form */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus className="w-5 h-5 text-primary" /> Create Organization
            </h3>
            <form onSubmit={handleCreateOrg}>
              <div className="form-group">
                <label className="form-label">Organization Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Acme Tech Solutions"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Industry</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Information Technology"
                  value={orgIndustry}
                  onChange={(e) => setOrgIndustry(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Headquarters Location</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. New York, NY"
                  value={orgLocation}
                  onChange={(e) => setOrgLocation(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Save Organization
              </button>
            </form>
          </div>

          {/* List Orgs */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Organizations Directory ({organizations.length})</h3>
            {organizations.length === 0 ? (
              <p>No organizations created yet.</p>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Industry</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizations.map((org) => (
                      <tr key={org.id}>
                        <td style={{ fontWeight: 600 }}>{org.name}</td>
                        <td>{org.industry || '—'}</td>
                        <td>
                          {org.isActive !== false ? (
                            <span className="badge badge-selected">Active</span>
                          ) : (
                            <span className="badge badge-hold">Deactivated</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setEditingOrg(org)}>
                              <Edit className="w-3 h-3" /> Edit
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleToggleOrgStatus(org.id)}>
                              <Power className="w-3 h-3" /> {org.isActive !== false ? 'Deactivate' : 'Activate'}
                            </button>
                            <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDeleteOrg(org.id)}>
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === 'depts' && (
        <div className="grid-cols-2">
          {/* Create Dept Form */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus className="w-5 h-5 text-primary" /> Create Department
            </h3>
            <form onSubmit={handleCreateDept}>
              <div className="form-group">
                <label className="form-label">Associated Organization *</label>
                <select
                  className="form-control"
                  value={deptOrgId}
                  onChange={(e) => setDeptOrgId(e.target.value)}
                  required
                >
                  <option value="">Select Organization...</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Department Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Engineering, Sales, Human Resources"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Save Department
              </button>
            </form>
          </div>

          {/* List Depts */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Departments Directory ({departments.length})</h3>
            {departments.length === 0 ? (
              <p>No departments created yet.</p>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Department Name</th>
                      <th>Organization</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((dept) => (
                      <tr key={dept.id}>
                        <td style={{ fontWeight: 600 }}>{dept.name}</td>
                        <td>{dept.organization?.name || '—'}</td>
                        <td>
                          {dept.isActive !== false ? (
                            <span className="badge badge-selected">Active</span>
                          ) : (
                            <span className="badge badge-hold">Deactivated</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setEditingDept(dept)}>
                              <Edit className="w-3 h-3" /> Edit
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleToggleDeptStatus(dept.id)}>
                              <Power className="w-3 h-3" /> {dept.isActive !== false ? 'Deactivate' : 'Activate'}
                            </button>
                            <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDeleteDept(dept.id)}>
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Staff Account Registration Tab */}
      {activeTab === 'users' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }} className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus className="w-5 h-5 text-primary" /> Create Staff Account
          </h3>

          <form onSubmit={handleCreateStaff}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Alice Smith"
                value={userFullName}
                onChange={(e) => setUserFullName(e.target.value)}
                required
              />
            </div>

            <div className="grid-cols-2" style={{ gap: '1rem', marginBottom: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="alice@acme.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Access Role *</label>
              <select
                className="form-control"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                required
              >
                <option value="Recruiter">Recruiter</option>
                <option value="HiringManager">Hiring Manager</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>

            {userRole !== 'Admin' && (
              <div className="grid-cols-2" style={{ gap: '1rem', marginBottom: '2rem' }}>
                <div className="form-group">
                  <label className="form-label">Belongs to Organization</label>
                  <select
                    className="form-control"
                    value={userOrgId}
                    onChange={(e) => setUserOrgId(e.target.value)}
                    required={userRole !== 'Admin'}
                  >
                    <option value="">Select Organization...</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Belongs to Department</label>
                  <select
                    className="form-control"
                    value={userDeptId}
                    onChange={(e) => setUserDeptId(e.target.value)}
                    required={userRole !== 'Admin'}
                  >
                    <option value="">Select Department...</option>
                    {departments
                      .filter(d => !userOrgId || d.organizationId === parseInt(userOrgId))
                      .map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))
                    }
                  </select>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Create Staff Account
            </button>
          </form>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Immutable Platform Audit Trail ({auditLogs.length} logs)</h3>
          {auditLogs.length === 0 ? (
            <p>No audit logs recorded yet.</p>
          ) : (
            <>
              <div className="table-container">
                <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>User</th>
                      <th>Email</th>
                      <th>Action Performed</th>
                      <th>Entity Affected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLogs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 500 }}>{log.userFullName}</td>
                        <td>{log.userEmail}</td>
                        <td style={{ fontFamily: 'monospace', color: '#4338ca' }}>{log.action}</td>
                        <td>
                          <span className="badge badge-applied">
                            {log.entityName}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="pagination-bar">
                <div className="pagination-info">
                  Showing <strong>{auditLogs.length === 0 ? 0 : indexOfFirstLog + 1}</strong> to <strong>{Math.min(indexOfLastLog, auditLogs.length)}</strong> of <strong>{auditLogs.length}</strong> entries
                </div>
                <div className="pagination-controls">
                  <button
                    className="btn-pagination"
                    onClick={() => setCurrentPage(1)}
                    disabled={activePage === 1}
                    title="First Page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    className="btn-pagination"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={activePage === 1}
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === totalPages || Math.abs(page - activePage) <= 1)
                    .map((page, index, array) => {
                      const showEllipsis = index > 0 && page - array[index - 1] > 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && <span className="pagination-ellipsis">...</span>}
                          <button
                            className={`btn-pagination ${activePage === page ? 'active' : ''}`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })
                  }

                  <button
                    className="btn-pagination"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={activePage === totalPages || totalPages === 0}
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    className="btn-pagination"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={activePage === totalPages || totalPages === 0}
                    title="Last Page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="pagination-size">
                  Show
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="pagination-select"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  entries
                </div>
              </div>
            </>
          )}
        </div>
      )}


      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>Edit User Account #{editingUser.id}</h3>
            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-control"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="Recruiter">Recruiter</option>
                  <option value="HiringManager">Hiring Manager</option>
                  <option value="Admin">Admin</option>
                  <option value="Candidate">Candidate</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingUser(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Org Modal */}
      {editingOrg && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>Edit Organization #{editingOrg.id}</h3>
            <form onSubmit={handleUpdateOrg}>
              <div className="form-group">
                <label className="form-label">Organization Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingOrg.name}
                  onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Industry</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingOrg.industry}
                  onChange={(e) => setEditingOrg({ ...editingOrg, industry: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingOrg.location}
                  onChange={(e) => setEditingOrg({ ...editingOrg, location: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingOrg(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dept Modal */}
      {editingDept && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>Edit Department #{editingDept.id}</h3>
            <form onSubmit={handleUpdateDept}>
              <div className="form-group">
                <label className="form-label">Department Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingDept.name}
                  onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingDept(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
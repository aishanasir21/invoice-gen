import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { 
  Users, 
  Plus, 
  Search,
  Edit2,
  Trash2,
  User,
  Calendar,
  Mail,
  Phone,
  MapPin,
  FileDigit,
  X,
  Save,
  AlertCircle,
  Loader,
  ChevronRight,
  Building2,
  Briefcase
} from 'lucide-react'

const Clients = () => {
    const navigate = useNavigate()
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingClient, setEditingClient] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        attendant: '',
        email: '',
        phone: '',
        address: '',
        trn: '',
        crNo: ''
    })
    const [errors, setErrors] = useState({})

    useEffect(() => {
        fetchClients()
    }, [])

    const fetchClients = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.get('http://localhost:3000/api/client/getClients', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setClients(res.data.data || [])
        } catch (error) {
            console.error('Error fetching clients:', error)
            if (error.response?.status === 401) navigate('/login')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    }

    const validateForm = () => {
        const newErrors = {}
        if (!formData.name.trim()) newErrors.name = 'Client name is required'
        if (!formData.attendant.trim()) newErrors.attendant = 'Attendant name is required'
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return
        
        setSubmitting(true)
        try {
            const token = localStorage.getItem('token')
            const url = editingClient 
                ? `http://localhost:3000/api/client/updateClient/${editingClient._id}`
                : 'http://localhost:3000/api/client/createClient'

            const res = await axios[editingClient ? 'put' : 'post'](url, formData, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.data.success) {
                await fetchClients()
                setShowModal(false)
                resetForm()
            }
        } catch (error) {
            console.error('Error saving client:', error)
            alert('Failed to save client. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const resetForm = () => {
        setEditingClient(null)
        setFormData({
            name: '',
            attendant: '',
            email: '',
            phone: '',
            address: '',
            trn: '',
            crNo: ''
        })
        setErrors({})
    }

    const handleEdit = (client) => {
        setEditingClient(client)
        setFormData({
            name: client.name || '',
            attendant: client.attendant || '',
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
            trn: client.trn || '',
            crNo: client.crNo || ''
        })
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this client?')) return

        try {
            const token = localStorage.getItem('token')
            await axios.delete(`http://localhost:3000/api/client/deleteClient/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            await fetchClients()
        } catch (error) {
            console.error('Error deleting client:', error)
            alert('Failed to delete client. Please try again.')
        }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-GB', { 
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const filteredClients = clients.filter(client => {
        const searchLower = searchTerm.toLowerCase()
        return client.name?.toLowerCase().includes(searchLower) ||
               client.attendant?.toLowerCase().includes(searchLower) ||
               client.email?.toLowerCase().includes(searchLower) ||
               client.phone?.includes(searchTerm)
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <Link to="/dashboard" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition">
                                <Users size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-800 to-emerald-600 bg-clip-text text-transparent">
                                    Clients
                                </h1>
                                <p className="text-xs text-gray-500">Manage your clients</p>
                            </div>
                        </Link>
                        
                        <div className="flex items-center gap-3">
                            <Link to="/dashboard" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition">Dashboard</Link>
                            <Link to="/quotes" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition">Quotes</Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Clients</h2>
                            <p className="text-gray-500 mt-1">Manage your client information</p>
                        </div>
                        
                        <button
                            onClick={() => {
                                resetForm()
                                setShowModal(true)
                            }}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                        >
                            <Plus size={20} />
                            New Client
                        </button>
                    </div>


                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-500">Total Clients</p>
                                <Users size={18} className="text-emerald-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{clients.length}</p>
                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-500">This Month</p>
                                <Calendar size={18} className="text-emerald-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-800">
                                {clients.filter(c => {
                                    const date = new Date(c.createdAt)
                                    const now = new Date()
                                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                                }).length}
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-500">With Email</p>
                                <Mail size={18} className="text-emerald-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-800">
                                {clients.filter(c => c.email).length}
                            </p>
                        </div>
                    </div>
                </div>


                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, attendant, email or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                    </div>
                </div>


                {loading ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                        <Loader size={40} className="mx-auto text-emerald-600 animate-spin mb-4" />
                        <p className="text-gray-500">Loading clients...</p>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="bg-white rounded-2xl p-16 text-center border border-gray-200">
                        <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users size={32} className="text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No clients found</h3>
                        <p className="text-gray-500 mb-6">
                            {searchTerm ? 'Try adjusting your search' : 'Create your first client'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => {
                                    resetForm()
                                    setShowModal(true)
                                }}
                                className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                            >
                                Create Client
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">

                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Client</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Attendant</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Contact</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">TRN/CR No</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Created</th>
                                        <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClients.map((client) => (
                                        <tr key={client._id} className="border-t border-gray-100 hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                                                        <span className="text-emerald-700 font-semibold text-sm">
                                                            {client.name?.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{client.name}</p>
                                                        {client.address && (
                                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                                <MapPin size={10} />
                                                                {client.address.substring(0, 30)}...
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium">{client.attendant}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {client.email && (
                                                    <p className="text-sm flex items-center gap-1">
                                                        <Mail size={12} className="text-gray-400" />
                                                        {client.email}
                                                    </p>
                                                )}
                                                {client.phone && (
                                                    <p className="text-sm flex items-center gap-1 mt-1">
                                                        <Phone size={12} className="text-gray-400" />
                                                        {client.phone}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {client.trn && (
                                                    <p className="text-sm">TRN: {client.trn}</p>
                                                )}
                                                {client.crNo && (
                                                    <p className="text-sm">CR: {client.crNo}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {formatDate(client.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(client)}
                                                        className="p-2 text-gray-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(client._id)}
                                                        className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden divide-y divide-gray-100">
                            {filteredClients.map((client) => (
                                <div key={client._id} className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                                                <span className="text-emerald-700 font-semibold">
                                                    {client.name?.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{client.name}</h3>
                                                <p className="text-sm text-gray-600">{client.attendant}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(client)}
                                                className="p-2 text-gray-500 hover:text-emerald-600"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(client._id)}
                                                className="p-2 text-gray-500 hover:text-red-600"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm">
                                        {client.email && (
                                            <p className="flex items-center gap-2 text-gray-600">
                                                <Mail size={14} className="text-gray-400" />
                                                {client.email}
                                            </p>
                                        )}
                                        {client.phone && (
                                            <p className="flex items-center gap-2 text-gray-600">
                                                <Phone size={14} className="text-gray-400" />
                                                {client.phone}
                                            </p>
                                        )}
                                        {client.address && (
                                            <p className="flex items-center gap-2 text-gray-600">
                                                <MapPin size={14} className="text-gray-400" />
                                                {client.address}
                                            </p>
                                        )}
                                        <p className="flex items-center gap-2 text-gray-600">
                                            <Calendar size={14} className="text-gray-400" />
                                            {formatDate(client.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 overflow-y-auto z-50">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        
                        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        {editingClient ? 'Edit Client' : 'Create New Client'}
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {editingClient ? 'Update client information' : 'Add a new client to your database'}
                                    </p>
                                </div>
                                <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-xl">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Client Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={`w-full pl-9 border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2`}
                                            placeholder="e.g., Oasis Hill"
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Attendant Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            name="attendant"
                                            value={formData.attendant}
                                            onChange={handleChange}
                                            className={`w-full pl-9 border ${errors.attendant ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2`}
                                            placeholder="e.g., Mr. GV"
                                        />
                                    </div>
                                    {errors.attendant && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            {errors.attendant}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full pl-9 border border-gray-200 rounded-lg px-3 py-2"
                                            placeholder="client@example.com"
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                                    )}
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full pl-9 border border-gray-200 rounded-lg px-3 py-2"
                                            placeholder="+971 4 123 4567"
                                        />
                                    </div>
                                </div>


                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            rows="2"
                                            className="w-full pl-9 border border-gray-200 rounded-lg px-3 py-2"
                                            placeholder="Office address"
                                        />
                                    </div>
                                </div>

 
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        TRN (Tax Number)
                                    </label>
                                    <div className="relative">
                                        <FileDigit size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            name="trn"
                                            value={formData.trn}
                                            onChange={handleChange}
                                            className="w-full pl-9 border border-gray-200 rounded-lg px-3 py-2"
                                            placeholder="123456789000"
                                        />
                                    </div>
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        CR Number
                                    </label>
                                    <div className="relative">
                                        <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            name="crNo"
                                            value={formData.crNo}
                                            onChange={handleChange}
                                            className="w-full pl-9 border border-gray-200 rounded-lg px-3 py-2"
                                            placeholder="CR-12345"
                                        />
                                    </div>
                                </div>
                            </div>


                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                                    {submitting ? 'Saving...' : (editingClient ? 'Update Client' : 'Create Client')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="flex-1 border border-gray-200 py-3 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
    </div>
            )}
        </div>
    )
}

export default Clients
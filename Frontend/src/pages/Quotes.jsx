import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import {
    FileText,
    Plus,
    Search,
    Download,
    Edit2,
    Trash2,
    Calendar,
    User,
    Hash,
    DollarSign,
    Percent,
    X,
    Save,
    AlertCircle,
    Loader,
    Building2,
    Phone,
    MapPin,
    Mail
} from 'lucide-react'

const Quotes = () => {
    const navigate = useNavigate()
    const [quotes, setQuotes] = useState([])
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingQuote, setEditingQuote] = useState(null)
    const [selectedClient, setSelectedClient] = useState('')
    const [selectedClientData, setSelectedClientData] = useState(null)
    const [items, setItems] = useState([{
        description: '',
        quantity: 1,
        unitPrice: 0,
        note: ''
    }])
    const [vatPercentage, setVatPercentage] = useState(5)
    const [amountInWords, setAmountInWords] = useState('')
    const [errors, setErrors] = useState({})
    const [searchTerm, setSearchTerm] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // Quotation Fields for PDF
    const [projectName, setProjectName] = useState('')
    const [attendant, setAttendant] = useState('')
    const [tel, setTel] = useState('04-4428383')
    const [fax, setFax] = useState('04-4428384')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token')
            const headers = { Authorization: `Bearer ${token}` }

            const [quotesRes, clientsRes] = await Promise.all([
                axios.get('/api/quote/getQuotes', { headers }),
                axios.get('/api/client/getClients', { headers })
            ])

            setQuotes(quotesRes.data.data || [])
            setClients(clientsRes.data.data || [])
        } catch (error) {
            console.error('Error fetching data:', error)
            if (error.response?.status === 401) navigate('/login')
        } finally {
            setLoading(false)
        }
    }

    const handleClientChange = (clientId) => {
        setSelectedClient(clientId)
        const client = clients.find(c => c._id === clientId)
        setSelectedClientData(client)

        if (client) {
            setAttendant(client.attendant || '')
        }
    }

    const handleItemChange = (index, field, value) => {
        const newItems = [...items]
        newItems[index][field] = value
        setItems(newItems)
    }

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0, note: '' }])
    }

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index))
        }
    }

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    }

    const calculateVAT = () => {
        const subtotal = calculateSubtotal()
        return subtotal * (vatPercentage / 100)
    }

    const calculateTotal = () => {
        return calculateSubtotal() + calculateVAT()
    }

    const validateForm = () => {
        const newErrors = {}
        if (!selectedClient) newErrors.client = 'Please select a client'
        if (!projectName.trim()) newErrors.projectName = 'Project name is required'

        items.forEach((item, index) => {
            if (!item.description.trim()) {
                newErrors[`item_${index}`] = 'Description required'
            }
            if (item.quantity <= 0) {
                newErrors[`qty_${index}`] = 'Quantity must be > 0'
            }
            if (item.unitPrice < 0) {
                newErrors[`price_${index}`] = 'Price cannot be negative'
            }
        })

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) return
        setSubmitting(true)

        try {
            const token = localStorage.getItem('token')

            const subtotal = calculateSubtotal()
            const vatAmount = calculateVAT()
            const total = calculateTotal()

            const quoteData = {
                clientId: selectedClient,
                projectName: projectName,
                items: items.map(item => ({
                    description: item.description,
                    quantity: Number(item.quantity) || 0,
                    unitPrice: Number(item.unitPrice) || 0,
                    note: item.note || ''
                })),
                vatPercentage: Number(vatPercentage) || 5,
                amountInWords: amountInWords,
                tel: tel,
                fax: fax
            }

            const url = editingQuote
                ? `/api/quote/updateQuote/${editingQuote._id}`
                : '/api/quote/createQuote'

            const res = await axios[editingQuote ? 'put' : 'post'](url, quoteData, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.data.success) {
                await fetchData()
                setShowModal(false)
                resetForm()
                alert(editingQuote ? 'Quotation updated successfully!' : 'Quotation created successfully!')
            }
        } catch (error) {
            console.error('Error saving quotation:', error)
            if (error.response) {
                alert(`Error: ${error.response.data.message || 'Failed to save quotation'}`)
            } else {
                alert('Failed to save quotation. Please try again.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const resetForm = () => {
        setSelectedClient('')
        setSelectedClientData(null)
        setProjectName('')
        setItems([{ description: '', quantity: 1, unitPrice: 0, note: '' }])
        setVatPercentage(5)
        setAmountInWords('')
        setAttendant('')
        setTel('04-4428383')
        setFax('04-4428384')
        setEditingQuote(null)
        setErrors({})
    }

    const handleEdit = (quote) => {
        setEditingQuote(quote)
        setSelectedClient(quote.clientId?._id || quote.clientId)
        setSelectedClientData({ name: quote.clientName, attendant: quote.clientAttendant })
        setProjectName(quote.projectName || '')
        setItems(quote.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            note: item.note || ''
        })))
        setVatPercentage(quote.vatPercentage)
        setAmountInWords(quote.amountInWords || '')
        setAttendant(quote.clientAttendant || '')
        setTel(quote.tel || '04-4428383')
        setFax(quote.fax || '04-4428384')
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this quotation?')) return

        try {
            const token = localStorage.getItem('token')
            await axios.delete(`/api/quote/deleteQuote/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            await fetchData()
            alert('Quotation deleted successfully!')
        } catch (error) {
            console.error('Error deleting quotation:', error)
            alert('Failed to delete quotation. Please try again.')
        }
    }

    const downloadPDF = async (id, quoteNo) => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(`/api/quote/downloadQuotePDF/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url

            let fileName = 'Quotation.pdf'

            if (quoteNo) {

                const cleanQuoteNo = String(quoteNo).replace('GTS-PO-', '')
                fileName = `Quotation-${cleanQuoteNo}.pdf`
            } else {

                const contentDisposition = response.headers['content-disposition']
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
                    if (filenameMatch && filenameMatch[1]) {
                        fileName = filenameMatch[1].replace(/['"]/g, '')
                    }
                } else {

                    const timestamp = new Date().getTime()
                    fileName = `Quotation-${timestamp}.pdf`
                }
            }

            link.setAttribute('download', fileName)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Error downloading PDF:', error)
            alert('Failed to download PDF. Please try again.')
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-AE', {
            style: 'currency',
            currency: 'AED',
            minimumFractionDigits: 2
        }).format(amount)
    }

    const filteredQuotes = quotes.filter(quote => {
        return (quote.quoteNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quote.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (quote.projectName && quote.projectName.toLowerCase().includes(searchTerm.toLowerCase())))
    })

    const subtotal = calculateSubtotal()
    const vatAmount = calculateVAT()
    const total = calculateTotal()

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <Link to="/dashboard" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition">
                                <FileText size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-800 to-emerald-600 bg-clip-text text-transparent">
                                    Quotations
                                </h1>
                                <p className="text-xs text-gray-500">Manage your quotations</p>
                            </div>
                        </Link>

                        <div className="flex items-center gap-3">
                            <Link to="/dashboard" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition">Dashboard</Link>
                            <Link to="/clients" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition">Clients</Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Quotations</h2>

                    <button
                        onClick={() => {
                            resetForm()
                            setShowModal(true)
                        }}
                        className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                        <Plus size={20} />
                        New Quotation
                    </button>
                </div>


                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by quotation number, project or client name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                    </div>
                </div>


                {loading ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                        <Loader size={40} className="mx-auto text-emerald-600 animate-spin mb-4" />
                        <p className="text-gray-500">Loading quotations...</p>
                    </div>
                ) : filteredQuotes.length === 0 ? (
                    <div className="bg-white rounded-2xl p-16 text-center border border-gray-200">
                        <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} className="text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No quotations found</h3>
                        <p className="text-gray-500 mb-6">
                            {searchTerm ? 'Try adjusting your search' : 'Create your first quotation'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => {
                                    resetForm()
                                    setShowModal(true)
                                }}
                                className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                            >
                                Create Quotation
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">

                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Quote #</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Project</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Client</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Date</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Items</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Total</th>
                                        <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredQuotes.map((quote) => (
                                        <tr key={quote._id} className="border-t border-gray-100 hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Hash size={14} className="text-gray-400" />
                                                    <span className="font-medium">{quote.quoteNo}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{quote.projectName || 'N/A'}</td>
                                            <td className="px-6 py-4">{quote.clientName}</td>
                                            <td className="px-6 py-4 text-gray-600">{formatDate(quote.createdAt)}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                                                    {quote.items?.length || 0} items
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-emerald-600">
                                                {formatCurrency(quote.total)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => downloadPDF(quote._id, quote.quoteNo)} 
                                                        className="p-2 text-gray-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                                                        title="Download PDF"
                                                    >
                                                        <Download size={18} />
                                                    </button>

                                                    <button
                                                        onClick={() => handleEdit(quote)}
                                                        className="p-2 text-gray-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(quote._id)}
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
                            {filteredQuotes.map((quote) => (
                                <div key={quote._id} className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Hash size={14} className="text-gray-400" />
                                                <span className="font-semibold">{quote.quoteNo}</span>
                                            </div>
                                            <div className="text-xs text-gray-500">{quote.projectName}</div>
                                        </div>
                                        <span className="font-bold text-emerald-600">
                                            {formatCurrency(quote.total)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                        <User size={14} className="text-gray-400" />
                                        {quote.clientName}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                        <Calendar size={14} className="text-gray-400" />
                                        {formatDate(quote.createdAt)}
                                        <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs">
                                            {quote.items?.length || 0} items
                                        </span>
                                    </div>

                                    <div className="flex justify-end gap-3">

                                        <button
                                            onClick={() => downloadPDF(quote._id, quote.quoteNo)}
                                            className="p-2 text-gray-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                                            title="Download PDF"
                                        >
                                            <Download size={18} />
                                        </button>

                                        <button
                                            onClick={() => handleEdit(quote)}
                                            className="p-2 text-gray-500 hover:text-emerald-600"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(quote._id)}
                                            className="p-2 text-gray-500 hover:text-red-600"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>


            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 overflow-y-auto z-50">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

                        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        {editingQuote ? 'Edit Quotation' : 'Create New Quotation'}
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Fill in the details to generate a professional quotation
                                    </p>
                                </div>
                                <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-xl">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>


                        <form onSubmit={handleSubmit} className="p-6 space-y-4">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Project Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        className={`w-full border ${errors.projectName ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
                                        placeholder="e.g., BURJ AL ARAB"
                                    />
                                    {errors.projectName && (
                                        <p className="text-red-500 text-xs mt-1">{errors.projectName}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quotation No
                                    </label>
                                    <input
                                        type="text"
                                        value={editingQuote ? editingQuote.quoteNo || '' : `Will be: ${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}...GTS`}
                                        readOnly
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-400 mt-1 italic">Format: YYMMDD + Sequence + GTS</p>
                                </div>
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Client <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedClient}
                                    onChange={(e) => handleClientChange(e.target.value)}
                                    className={`w-full border ${errors.client ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2`}
                                >
                                    <option value="">Choose a client...</option>
                                    {clients.map(client => (
                                        <option key={client._id} value={client._id}>
                                            {client.name} — {client.attendant}
                                        </option>
                                    ))}
                                </select>
                                {errors.client && (
                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        {errors.client}
                                    </p>
                                )}
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Attendant
                                    </label>
                                    <input
                                        type="text"
                                        value={attendant}
                                        onChange={(e) => setAttendant(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                        placeholder="e.g., Mr. GV"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tel
                                    </label>
                                    <input
                                        type="text"
                                        value={tel}
                                        onChange={(e) => setTel(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                        placeholder="04-4428383"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fax
                                    </label>
                                    <input
                                        type="text"
                                        value={fax}
                                        onChange={(e) => setFax(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                        placeholder="04-4428384"
                                    />
                                </div>
                            </div>

                           <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Line Items <span className="text-red-500">*</span>
                                </label>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs">Description</th>
                                                <th className="px-3 py-2 text-left text-xs">Note</th>
                                                <th className="px-3 py-2 text-left text-xs">Qty (m)</th>
                                                <th className="px-3 py-2 text-left text-xs">Unit Price</th>
                                                <th className="px-3 py-2 text-left text-xs">Total</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, index) => (
                                                <tr key={index} className="border-t">
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={item.description}
                                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                            className={`w-full border ${errors[`item_${index}`] ? 'border-red-500' : 'border-gray-200'} rounded px-2 py-1 text-sm`}
                                                            placeholder="Item description"
                                                        />
                                                        {errors[`item_${index}`] && (
                                                            <p className="text-red-500 text-xs mt-1">{errors[`item_${index}`]}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={item.note || ''}
                                                             onChange={(e) => handleItemChange(index, 'note', e.target.value)}
                                                            className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                                                            placeholder="Note (optional)"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                            min="1"
                                                            step="0.01"
                                                            className={`w-20 border ${errors[`qty_${index}`] ? 'border-red-500' : 'border-gray-200'} rounded px-2 py-1 text-sm`}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            value={item.unitPrice}
                                                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                            min="0"
                                                            step="0.01"
                                                            className="w-24 border border-gray-200 rounded px-2 py-1 text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-sm font-medium">
                                                        {(item.quantity * item.unitPrice).toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {items.length > 1 && (
                                                            <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button type="button" onClick={addItem} className="w-full py-2 text-sm text-emerald-600 border-t hover:bg-emerald-50 transition">
                                        + Add Item
                                    </button>
                                </div>
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        VAT %
                                    </label>
                                    <input
                                        type="number"
                                        value={vatPercentage}
                                        onChange={(e) => setVatPercentage(parseFloat(e.target.value) || 0)}
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Subtotal:</span>
                                            <span className="font-medium">{subtotal.toFixed(2)} AED</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">VAT ({vatPercentage}%):</span>
                                            <span className="font-medium">{vatAmount.toFixed(2)} AED</span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-2 mt-2">
                                            <div className="flex justify-between font-bold">
                                                <span className="text-gray-800">Total:</span>
                                                <span className="text-emerald-600">{total.toFixed(2)} AED</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount in Words
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Three Thousand One Hundred And Fifty Dirhams Only"
                                    value={amountInWords}
                                    onChange={(e) => setAmountInWords(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                />
                            </div>


                            <div className="flex gap-3 pt-4">
                                <button type="submit" disabled={submitting} className="flex-1 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2">
                                    {submitting ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                                    {submitting ? 'Saving...' : (editingQuote ? 'Update Quotation' : 'Create Quotation')}
                                </button>
                                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 border border-gray-200 py-3 rounded-lg hover:bg-gray-50 transition">
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

export default Quotes
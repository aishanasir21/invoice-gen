import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"

import {
  Plus,
  UserPlus,
  FileText,
  Users,
  ArrowUpRight,
  Search,
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  ChevronRight,
  AlertCircle
} from "lucide-react"

const Dashboard = () => {
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    totalClients: 0,
    totalQuotes: 0,
    totalAmount: 0,
    monthlyGrowth: 0,
    avgQuoteValue: 0
  })

  const [recentQuotes, setRecentQuotes] = useState([])
  const [recentClients, setRecentClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState({ quotes: [], clients: [] })
  const [showSearch, setShowSearch] = useState(false)
  const [user, setUser] = useState({ name: "", email: "" })
  const [apiError, setApiError] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    setApiError(false)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }

      await Promise.all([
        fetchUserData(),
        fetchDashboardData()
      ])
    } catch (error) {
      console.error("Error fetching data:", error)
      setApiError(true)
      if (error.response?.status === 401) {
        localStorage.removeItem("token")
        navigate("/login")
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }

      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        setUser({
          name: response.data.data.name,
          email: response.data.data.email
        })
      }
    } catch (error) {
      console.error("Error fetching user data:", error)

      setUser({
        name: "User",
        email: "user@example.com"
      })
      
      if (error.response?.status === 401) {
        localStorage.removeItem("token")
        navigate("/login")
      }
    }
  }

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }

      const headers = { Authorization: `Bearer ${token}` }

      const [clientsRes, quotesRes] = await Promise.all([
        axios.get('/api/client/getClients', { headers }),
        axios.get('/api/quote/getQuotes', { headers })
      ])

      const quotes = quotesRes.data.data || []
      const clients = clientsRes.data.data || []
      
      const totalAmount = quotes.reduce((sum, q) => sum + (q.total || 0), 0)
      const avgQuoteValue = quotes.length > 0 ? totalAmount / quotes.length : 0

      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      
      const recentRevenue = quotes
        .filter(q => new Date(q.createdAt) >= thirtyDaysAgo)
        .reduce((sum, q) => sum + (q.total || 0), 0)

      const previousRevenue = quotes
        .filter(q => {
          const date = new Date(q.createdAt)
          return date >= sixtyDaysAgo && date < thirtyDaysAgo
        })
        .reduce((sum, q) => sum + (q.total || 0), 0)

      const growth = previousRevenue > 0 
        ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 
        : recentRevenue > 0 ? 100 : 0

      setStats({
        totalClients: clients.length,
        totalQuotes: quotes.length,
        totalAmount,
        monthlyGrowth: growth,
        avgQuoteValue
      })

      const sortedQuotes = [...quotes]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
      setRecentQuotes(sortedQuotes)
      
      const sortedClients = [...clients]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4)
      setRecentClients(sortedClients)
      
    } catch (error) {
      console.error("Dashboard error:", error)
      if (error.response?.status === 401) {
        navigate("/login")
      }
    }
  }

  const handleSearch = async (query) => {
    setSearchQuery(query)
    if (query.trim().length < 2) {
      setSearchResults({ quotes: [], clients: [] })
      setShowSearch(false)
      return
    }

    try {
      const token = localStorage.getItem("token")
      const headers = { Authorization: `Bearer ${token}` }
      
      const [quotesRes, clientsRes] = await Promise.all([
        axios.get('/api/quote/getQuotes', { headers }),
        axios.get('/api/client/getClients', { headers })
      ])

      const allQuotes = quotesRes.data.data || []
      const allClients = clientsRes.data.data || []
      
      const filteredQuotes = allQuotes.filter(quote => 
        quote.clientName?.toLowerCase().includes(query.toLowerCase()) ||
        quote.quoteNo?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3)

      const filteredClients = allClients.filter(client => 
        client.name?.toLowerCase().includes(query.toLowerCase()) ||
        client.attendant?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3)

      setSearchResults({
        quotes: filteredQuotes,
        clients: filteredClients
      })
      setShowSearch(true)
    } catch (error) {
      console.error("Search error:", error)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.ceil(diffTime / (1000 * 60))
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const getCurrentDate = () => {
    const date = new Date()
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount).replace('AED', 'AED ')
  }

  // Navigation functions
  const goToQuotes = () => navigate('/quotes')
  const goToClients = () => navigate('/clients')
  const goToNewQuote = () => navigate('/quotes/create')
  const goToNewClient = () => navigate('/clients/create')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 pb-24 md:pb-6">
      {apiError && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>Connection issue. Using offline mode.</span>
          <button 
            onClick={fetchAllData}
            className="ml-auto px-3 py-1 bg-yellow-100 rounded-lg hover:bg-yellow-200"
          >
            Retry
          </button>
        </div>
      )}


      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-800 to-emerald-600 bg-clip-text text-transparent">
            {getGreeting()}, {user.name || 'User'}!
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <Calendar size={14} />
            <span>{getCurrentDate()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-emerald-700 font-semibold">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{user.name || 'Loading...'}</p>
            <p className="text-xs text-gray-500">{user.email || 'Loading...'}</p>
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search quotes or clients..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onBlur={() => setTimeout(() => setShowSearch(false), 200)}
          onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
          className="w-full bg-white border border-gray-200 rounded-2xl py-4 px-5 pl-12 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        
        {showSearch && (searchResults.quotes?.length > 0 || searchResults.clients?.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 p-4 max-h-96 overflow-y-auto">
            {searchResults.quotes?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 mb-2 px-2">QUOTES</p>
                {searchResults.quotes.map(quote => (
                  <div
                    key={quote._id}
                    onClick={() => navigate(`/quotes/${quote._id}`)}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-sm">{quote.quoteNo}</p>
                      <p className="text-xs text-gray-500">{quote.clientName}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-600">
                      {formatCurrency(quote.total)}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {searchResults.clients?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2 px-2">CLIENTS</p>
                {searchResults.clients.map(client => (
                  <div
                    key={client._id}
                    onClick={() => navigate(`/clients/${client._id}`)}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-sm">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.attendant || "No attendant"}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {showSearch && searchResults.quotes?.length === 0 && searchResults.clients?.length === 0 && searchQuery.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 p-4">
            <p className="text-center text-gray-500 py-4 text-sm">No results found</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Revenue</p>
              <DollarSign size={18} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(stats.totalAmount)}
            </p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp size={12} />
              {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}% vs last month
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Quotes</p>
              <FileText size={18} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalQuotes}</p>
            <p className="text-xs text-emerald-600 mt-1">Total quotes</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Clients</p>
              <Users size={18} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalClients}</p>
            <p className="text-xs text-gray-500 mt-1">Active accounts</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Avg. Value</p>
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.avgQuoteValue)}</p>
            <p className="text-xs text-gray-500 mt-1">Per quote</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <button
          onClick={goToQuotes}
          className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col items-center gap-2 border border-gray-100 group cursor-pointer w-full"
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition">
            <Plus size={24} className="text-emerald-600" />
          </div>
          <span className="text-xs font-medium text-gray-700">New Quote</span>
        </button>

        <button
          onClick={goToClients}
          className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col items-center gap-2 border border-gray-100 group cursor-pointer w-full"
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition">
            <UserPlus size={24} className="text-emerald-600" />
          </div>
          <span className="text-xs font-medium text-gray-700">New Client</span>
        </button>

        <button
          onClick={goToQuotes}
          className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col items-center gap-2 border border-gray-100 group w-full"
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition">
            <FileText size={24} className="text-emerald-600" />
          </div>
          <span className="text-xs font-medium text-gray-700">All Quotes</span>
        </button>

        <button
          onClick={goToClients}
          className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col items-center gap-2 border border-gray-100 group w-full"
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition">
            <Users size={24} className="text-emerald-600" />
          </div>
          <span className="text-xs font-medium text-gray-700">All Clients</span>
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        <div className="md:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-lg">Recent Quotes</h2>
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">
                {stats.totalQuotes} total
              </span>
            </div>
            <button
              onClick={goToQuotes}
              className="text-sm text-emerald-700 font-medium flex items-center gap-1 hover:underline"
            >
              View all <ChevronRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="animate-pulse flex justify-between items-center border-b pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentQuotes.length > 0 ? (
            <div className="space-y-4">
              {recentQuotes.map((quote) => (
                <div
                  key={quote._id}
                  onClick={() => navigate(`/quotes/${quote._id}`)}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 last:border-0 last:pb-0 hover:bg-gray-50 p-2 rounded-xl transition gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                    <div className="bg-emerald-50 p-3 rounded-xl shrink-0">
                      <ArrowUpRight size={20} className="text-emerald-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium flex flex-wrap items-center gap-2">
                        <span className="truncate max-w-[150px]">{quote.clientName}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">
                          {quote.quoteNo}
                        </span>
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(quote.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {quote.items?.length || 0} items
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-gray-800">
                      {formatCurrency(quote.total)}
                    </p>
                    <p className="text-xs text-gray-400">VAT: {quote.vatPercentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">No quotes yet</p>
              <button
                onClick={goToNewQuote}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition cursor-pointer"
              >
                <Plus size={18} />
                Create your first quote
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Recent Clients</h3>
              <button
                onClick={goToClients}
                className="text-xs text-emerald-700 hover:underline"
              >
                View all
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentClients.length > 0 ? (
              <div className="space-y-3">
                {recentClients.map(client => (
                  <div
                    key={client._id}
                    onClick={() => navigate(`/clients/${client._id}`)}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-emerald-700 font-semibold">
                        {client.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{client.name}</p>
                      <p className="text-xs text-gray-500 truncate">{client.attendant || "No attendant"}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No clients yet</p>
            )}

            <button
              onClick={goToClients}
              className="mt-4 w-full bg-gray-50 text-gray-700 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-100 transition cursor-pointer"
            >
              <UserPlus size={16} />
              Add New Client
            </button>
          </div>


          <div className="bg-gradient-to-br from-emerald-700 to-emerald-500 rounded-3xl p-6 text-white">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
               onClick={goToQuotes}
                className="w-full flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition cursor-pointer"
              >
                <span className="text-sm">Create Quote</span>
                <Plus size={16} />
              </button>
              <button
                onClick={goToClients}
                className="w-full flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition cursor-pointer"
              >
                <span className="text-sm">Add Client</span>
                <UserPlus size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
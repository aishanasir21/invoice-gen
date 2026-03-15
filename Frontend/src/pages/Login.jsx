import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const Login = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })


    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [apiError, setApiError] = useState('')

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const validateForm = () => {
        const newErrors = {}
        
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!formData.email) {
            newErrors.email = "Email required"
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Invalid email"
        }
        
        if (!formData.password) {
            newErrors.password = "Password required"
        }
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setApiError('')
        if (!validateForm()) return
        setLoading(true)

        axios.post("http://localhost:3000/api/auth/login", {
            email: formData.email,
            password: formData.password
        })
        .then((res) => {
            localStorage.setItem('token', res.data.token)
            navigate("/dashboard")
        })
        .catch((error) => {
            if (error.response?.status === 401) {
                setApiError("Invalid email or password")
            } else {
                setApiError("Login failed. Please try again.")
            }
        })
        .finally(() => setLoading(false))
    }

   
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword)
    }

    return (
        <div className="min-h-screen flex bg-white lg:bg-[#f8f9fa] text-[#1d1d1f] font-sans antialiased">
            

            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 bg-white border-r border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                         <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                    <span className="text-xl font-bold tracking-tight">grapstech</span>
                </div>
                <div>
                    <h2 className="text-6xl font-bold leading-tight mb-6 tracking-tighter">
                        Welcome back to<br />Grapstech
                    </h2>
                    <p className="text-gray-500 text-xl max-w-sm">Continue automating your billing.</p>
                </div>
                <div className="text-sm text-gray-400">© 2026 Grapstech Inc.</div>
            </div>


            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 min-h-screen lg:min-h-0">
                <div className="w-full max-w-100">
                    

                    <div className="text-center mb-10">
                        <h1 className="text-[32px] sm:text-[40px] font-semibold leading-tight tracking-tight text-gray-900">
                            Welcome back
                        </h1>
                        <p className="text-gray-500 text-sm mt-3">Sign in to your account</p>
                    </div>

                    {apiError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm text-center p-3 rounded-xl mb-6">
                            {apiError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        

                        <div>
                            <input
                                name="email"
                                type="email"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full bg-white border ${
                                    errors.email ? 'border-red-500' : 'border-gray-200'
                                } rounded-xl px-4 py-4 focus:border-black outline-none transition-colors placeholder:text-gray-400`}
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>
                            )}
                        </div>


                        <div>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full bg-white border ${
                                        errors.password ? 'border-red-500' : 'border-gray-200'
                                    } rounded-xl px-4 py-4 focus:border-black outline-none transition-colors placeholder:text-gray-400`}
                                />
                                <button 
                                    type="button" 
                                    onClick={togglePasswordVisibility}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>
                            )}
                        </div>

 
                        <div className="text-right">
                            <Link to="/forgot-password" className="text-sm text-gray-500 hover:text-black transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1c1c1e] hover:bg-black py-4 rounded-full font-medium text-white transition-all mt-4 shadow-sm active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>


                        <div className="text-center pt-6">
                            <p className="text-gray-900 font-medium">
                                Don't have an account? <br />
                                <Link to="/signup" className="underline decoration-1 underline-offset-4">
                                    Create account
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login
const express = require('express')
const authRoutes = require('./routes/auth.routes')
const quoteRoutes = require('./routes/quote.routes')
const clientRoutes = require('./routes/client.routes')
const cookieParser = require("cookie-parser")
const cors = require('cors')

const app = express()

app.use(express.json())
app.use(cookieParser())

app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://your-frontend-domain.vercel.app"
    ],
    credentials: true
}))

app.use("/api/auth", authRoutes)
app.use("/api/quote", quoteRoutes)
app.use("/api/client", clientRoutes)

module.exports = app
import jwt from 'jsonwebtoken'

const getJwtSecret = () => process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'your-secret-key')

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Access token required' })
  }

  jwt.verify(token, getJwtSecret(), (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

export const authenticateOptional = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token) {
    jwt.verify(token, getJwtSecret(), (err, user) => {
      if (!err) {
        req.user = user
      }
    })
  }
  next()
}

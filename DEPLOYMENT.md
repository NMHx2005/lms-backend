# 🚀 LMS Backend Deployment Guide

## 📋 **Deployment trên Render**

### **1. Cấu hình Render**

#### **Service Configuration:**
```yaml
# render.yaml
services:
  - type: web
    name: lms-backend
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /health
    autoDeploy: true
```

#### **Environment Variables (Set trong Render Dashboard):**
```bash
# Required
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional (based on features you use)
SENDGRID_API_KEY=your-sendgrid-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
OPENAI_API_KEY=your-openai-api-key
REDIS_URL=redis://localhost:6379
```

### **2. Health Check Endpoints**

#### **Home Page (`/`):**
```json
{
  "success": true,
  "message": "Learning Management System (LMS) Backend API",
  "version": "1.0.0",
  "environment": "production",
  "features": ["User Authentication", "Course Management", "File Upload", ...],
  "technologies": ["Node.js", "TypeScript", "MongoDB", ...]
}
```

#### **Health Check (`/health`):**
```json
{
  "success": true,
  "message": "LMS Backend is healthy and running",
  "timestamp": "2025-08-17T20:00:38.986Z",
  "uptime": 169.2362049,
  "environment": "production",
  "database": "connected",
  "memory": {...},
  "platform": "linux",
  "nodeVersion": "v18.15.0"
}
```

#### **API Status (`/api`):**
```json
{
  "success": true,
  "message": "LMS Backend API Status",
  "status": "active",
  "endpoints": {
    "auth": "/api/auth",
    "admin": "/api/admin",
    "client": "/api/client",
    "upload": "/api/upload"
  }
}
```

### **3. Build & Deploy Process**

#### **Local Build:**
```bash
npm run build:prod
npm run start:prod
```

#### **Render Auto-Deploy:**
1. Push code to GitHub
2. Render automatically detects changes
3. Runs `npm install && npm run build`
4. Starts with `npm start`
5. Health check at `/health`

### **4. Troubleshooting**

#### **Common Issues:**

1. **Build Failures:**
   - Check TypeScript compilation
   - Verify all dependencies in package.json
   - Ensure proper import paths

2. **Runtime Errors:**
   - Check environment variables
   - Verify MongoDB connection
   - Check logs in Render dashboard

3. **Health Check Failures:**
   - Ensure `/health` endpoint returns 200
   - Check server startup process
   - Verify port configuration

#### **Debug Commands:**
```bash
# Check build output
npm run build

# Test locally
npm run dev

# Check TypeScript
npm run type-check

# Lint code
npm run lint
```

### **5. Monitoring & Logs**

#### **Render Dashboard:**
- **Logs:** Real-time application logs
- **Metrics:** CPU, Memory, Response time
- **Deployments:** Build and deployment history

#### **Health Monitoring:**
- **Endpoint:** `/health`
- **Frequency:** Every 30 seconds (Render default)
- **Timeout:** 30 seconds
- **Expected Response:** 200 OK with health data

### **6. Security Considerations**

#### **Production Settings:**
- `NODE_ENV=production`
- `TRUST_PROXY=true`
- Strict CORS origins
- Rate limiting enabled
- Helmet security headers
- JWT secrets properly configured

#### **Environment Variables:**
- Never commit secrets to Git
- Use Render's secure environment variable storage
- Rotate JWT secrets regularly
- Use strong, unique passwords

### **7. Performance Optimization**

#### **Build Optimization:**
- TypeScript compilation
- Tree shaking
- Minification (if needed)

#### **Runtime Optimization:**
- Database connection pooling
- Rate limiting
- Caching strategies
- Memory management

### **8. Backup & Recovery**

#### **Database:**
- MongoDB Atlas backups
- Regular data exports
- Connection string management

#### **Code:**
- GitHub repository
- Branch protection
- Automated testing
- Rollback procedures

---

## 🎯 **Deployment Checklist**

- [ ] Environment variables configured
- [ ] MongoDB connection string set
- [ ] JWT secrets configured
- [ ] Cloudinary credentials set
- [ ] Health check endpoint working
- [ ] Build process successful
- [ ] All API endpoints responding
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Error handling working
- [ ] Logs accessible
- [ ] Monitoring configured

---

**Deployment Status:** ✅ **Ready for Production**

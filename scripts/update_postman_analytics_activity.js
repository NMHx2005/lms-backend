const fs = require('fs');
const path = require('path');

const COLLECTION = path.resolve(__dirname, '../LMS_API_Collection.postman_collection.json');

function ensureFolder(item, name) {
  let f = item.item.find((x) => x.name === name);
  if (!f) {
    f = { name, item: [] };
    item.item.push(f);
  }
  return f;
}

function makeRequest(name, method, url, bodyJson) {
  const req = {
    name,
    request: {
      method,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      url: { raw: `{{baseUrl}}${url}`, host: ['{{baseUrl}}'], path: url.replace(/^\//,'').split('/') },
    },
  };
  if (bodyJson) req.request.body = { mode: 'raw', raw: JSON.stringify(bodyJson, null, 2) };
  return req;
}

function run() {
  const raw = fs.readFileSync(COLLECTION, 'utf8');
  const col = JSON.parse(raw);
  if (!col.item) col.item = [];

  // Ensure folders
  const adminFolder = ensureFolder({ item: col.item }, 'Admin');
  const sharedFolder = ensureFolder({ item: col.item }, 'Shared');
  const clientFolder = ensureFolder({ item: col.item }, 'Client');

  // Metrics under Shared
  const sharedMetrics = ensureFolder(sharedFolder, 'Metrics');
  sharedMetrics.item = [
    makeRequest('System Metrics', 'GET', '/api/metrics/system'),
    makeRequest('API Metrics', 'GET', '/api/metrics/api'),
  ];

  // Admin Analytics
  const adminAnalytics = ensureFolder(adminFolder, 'Analytics');
  adminAnalytics.item = [
    makeRequest('Dashboard', 'GET', '/api/admin/analytics/dashboard'),
    makeRequest('Users Analytics', 'GET', '/api/admin/analytics/users?period=30'),
    makeRequest('Courses Analytics', 'GET', '/api/admin/analytics/courses?period=30'),
    makeRequest('Revenue Analytics', 'GET', '/api/admin/analytics/revenue?period=90'),
    makeRequest('Enrollments Analytics', 'GET', '/api/admin/analytics/enrollments?period=30'),
  ];

  // Admin Activity
  const adminActivity = ensureFolder(adminFolder, 'Activity');
  adminActivity.item = [
    makeRequest('List Activity', 'GET', '/api/admin/activity?page=1&limit=20'),
    makeRequest('Summary', 'GET', '/api/admin/activity/summary'),
    makeRequest('Export CSV', 'GET', '/api/admin/activity/export.csv'),
    makeRequest('Export PDF', 'GET', '/api/admin/activity/export.pdf'),
    makeRequest('Preset - Learning', 'GET', '/api/admin/activity/presets/learning?page=1&limit=20'),
    makeRequest('Preset - Payment', 'GET', '/api/admin/activity/presets/payment?page=1&limit=20'),
    makeRequest('Preset - System', 'GET', '/api/admin/activity/presets/system?page=1&limit=20'),
  ];

  fs.writeFileSync(COLLECTION, JSON.stringify(col, null, 2));
  console.log('Postman collection updated: analytics, metrics, activity');
}

run();



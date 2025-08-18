/* eslint-disable */
const fs = require('fs');
const path = require('path');

const COLLECTION_PATH = path.join(__dirname, '..', 'LMS_API_Collection.postman_collection.json');

function readJson(filePath) {
	const raw = fs.readFileSync(filePath, 'utf8');
	return JSON.parse(raw);
}

function writeJson(filePath, json) {
	fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
}

function ensureArray(obj, key) {
	if (!Array.isArray(obj[key])) obj[key] = [];
	return obj[key];
}

function makeUrl(raw, pathSegments) {
	return { raw, path: pathSegments };
}

function makeReq(name, method, urlRaw, urlPath, bodyRaw, headers = []) {
	const req = { name, request: { method, header: headers, url: makeUrl(urlRaw, urlPath) } };
	if (bodyRaw) req.request.body = { mode: 'raw', raw: bodyRaw };
	return req;
}

function existsByPath(folder, urlPath) {
	const target = Array.isArray(urlPath) ? urlPath.join('/') : urlPath;
	const items = folder.item || [];
	for (const it of items) {
		if (!it.request || !it.request.url || !Array.isArray(it.request.url.path)) continue;
		const p = it.request.url.path.join('/');
		if (p === target) return true;
	}
	return false;
}

function upsertFolder(root, name) {
	const rootItems = ensureArray(root, 'item');
	let folder = rootItems.find(i => i && i.name === name && Array.isArray(i.item));
	if (!folder) {
		folder = { name, item: [] };
		rootItems.push(folder);
	}
	return folder;
}

function addPaymentsFolder(root) {
	const folder = upsertFolder(root, 'Payments - VNPay (Sandbox)');
	const base = '{{base_url}}/api/payments';
	const headersAuth = [{ key: 'Content-Type', value: 'application/json' }];

	const items = [
		makeReq(
			'Create Payment (VNPay)',
			'POST',
			`${base}/vnpay/create`,
			['api', 'payments', 'vnpay', 'create'],
			'{\n  "orderId": "ORD-{{timestamp}}",\n  "amount": 100000,\n  "orderInfo": "Test VNPay",\n  "ipAddr": "127.0.0.1"\n}',
			headersAuth
		),
		makeReq(
			'VNPay Return (Debug)',
			'GET',
			`${base}/vnpay/return`,
			['api', 'payments', 'vnpay', 'return']
		),
		makeReq(
			'VNPay IPN (GET debug)',
			'GET',
			`${base}/vnpay/ipn`,
			['api', 'payments', 'vnpay', 'ipn']
		),
		makeReq(
			'VNPay IPN (POST debug)',
			'POST',
			`${base}/vnpay/ipn`,
			['api', 'payments', 'vnpay', 'ipn'],
			'{\n  "vnp_TxnRef": "ORD-{{timestamp}}",\n  "vnp_ResponseCode": "00",\n  "vnp_TransactionStatus": "00",\n  "vnp_Amount": "10000000"\n}',
			headersAuth
		),
		makeReq(
			'Payment History (auth)',
			'GET',
			`${base}/history`,
			['api', 'payments', 'history']
		),
		makeReq(
			'Get Invoice by Id (auth)',
			'GET',
			`${base}/invoices/{{invoice_id}}`,
			['api', 'payments', 'invoices', '{{invoice_id}}']
		),
		makeReq(
			'VNPay QueryDR (auth)',
			'GET',
			`${base}/vnpay/querydr?txnRef=ORD-{{timestamp}}`,
			['api', 'payments', 'vnpay', 'querydr']
		)
	];

	for (const it of items) {
		if (!existsByPath(folder, it.request.url.path)) folder.item.push(it);
	}
}

function addCartFolder(root) {
	const folder = upsertFolder(root, 'Cart (Shared)');
	const base = '{{base_url}}/api/cart';
	const headersJson = [{ key: 'Content-Type', value: 'application/json' }];

	const items = [
		makeReq('Get Cart (auth)', 'GET', `${base}`, ['api', 'cart']),
		makeReq(
			'Add Item (auth)',
			'POST',
			`${base}/items`,
			['api', 'cart', 'items'],
			'{\n  "title": "Course A",\n  "price": 100000,\n  "quantity": 1\n}',
			headersJson
		),
		makeReq('Update Item (auth)', 'PUT', `${base}/items/0`, ['api', 'cart', 'items', '0'], '{"quantity":2}', headersJson),
		makeReq('Remove Item (auth)', 'DELETE', `${base}/items/0`, ['api', 'cart', 'items', '0']),
		makeReq('Clear Cart (auth)', 'DELETE', `${base}`, ['api', 'cart'])
	];
	for (const it of items) {
		if (!existsByPath(folder, it.request.url.path)) folder.item.push(it);
	}
}

function main() {
	const json = readJson(COLLECTION_PATH);
	addPaymentsFolder(json);
	addCartFolder(json);
	writeJson(COLLECTION_PATH, json);
	console.log('Postman collection updated with Payment & Billing APIs (VNPay + Cart).');
}

main();

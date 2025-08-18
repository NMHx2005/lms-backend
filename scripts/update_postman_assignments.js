/* eslint-disable */
const fs = require('fs');
const path = require('path');

const COLLECTION_PATH = path.join(__dirname, '..', 'LMS_API_Collection.postman_collection.json');

function readJson(filePath) {
	const raw = fs.readFileSync(filePath, 'utf8');
	return JSON.parse(raw);
}

function writeJson(filePath, json) {
	const out = JSON.stringify(json, null, 2);
	fs.writeFileSync(filePath, out, 'utf8');
}

function ensureArray(obj, key) {
	if (!Array.isArray(obj[key])) obj[key] = [];
	return obj[key];
}

function makeUrl(raw, pathSegments) {
	return { raw, path: pathSegments };
}

function makeReq(name, method, urlRaw, urlPath, bodyRaw) {
	const req = {
		name,
		request: {
			method,
			header: [],
			url: makeUrl(urlRaw, urlPath),
		},
	};
	if (bodyRaw) {
		req.request.body = { mode: 'raw', raw: bodyRaw };
	}
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

function findFolderByPredicate(rootItems, predicate) {
	const stack = [...rootItems];
	while (stack.length) {
		const node = stack.shift();
		if (node && typeof node === 'object' && Array.isArray(node.item)) {
			if (predicate(node)) return node;
			for (const child of node.item) stack.push(child);
		}
	}
	return null;
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

function addAdminAssignments(root) {
	const folder = upsertFolder(root, 'Admin - Assignments');
	const base = '{{base_url}}/api/admin/assignments';
	const items = [
		makeReq('Create Assignment', 'POST', `${base}`, ['api','admin','assignments'], '{\n  "lessonId": "{{lesson_id}}",\n  "courseId": "{{course_id}}",\n  "title": "Homework 1",\n  "type": "file",\n  "dueDate": "2025-12-31T23:59:59.000Z",\n  "maxScore": 100,\n  "isRequired": true\n}'),
		makeReq('Get Assignment By Id', 'GET', `${base}/{{assignment_id}}`, ['api','admin','assignments','{{assignment_id}}']),
		makeReq('Update Assignment', 'PUT', `${base}/{{assignment_id}}`, ['api','admin','assignments','{{assignment_id}}'], '{\n  "title": "Homework 1 - updated"\n}'),
		makeReq('Delete Assignment', 'DELETE', `${base}/{{assignment_id}}`, ['api','admin','assignments','{{assignment_id}}']),
		makeReq('List by Lesson', 'GET', `${base}/lesson/{{lesson_id}}?page=1&limit=20`, ['api','admin','assignments','lesson','{{lesson_id}}']),
		makeReq('List by Course', 'GET', `${base}/course/{{course_id}}?page=1&limit=20`, ['api','admin','assignments','course','{{course_id}}']),
		makeReq('Toggle Required', 'PATCH', `${base}/{{assignment_id}}/required`, ['api','admin','assignments','{{assignment_id}}','required'], '{ "isRequired": true }'),
		makeReq('Assignment Stats', 'GET', `${base}/{{assignment_id}}/stats`, ['api','admin','assignments','{{assignment_id}}','stats']),
		makeReq('Overdue Assignments', 'GET', `${base}/overdue?page=1&limit=20`, ['api','admin','assignments','overdue']),
		makeReq('Bulk Update by Course', 'PATCH', `${base}/course/{{course_id}}/bulk-update`, ['api','admin','assignments','course','{{course_id}}','bulk-update'], '{\n  "updates": [\n    { "assignmentId": "{{assignment_id}}", "updates": { "maxScore": 80 } }\n  ]\n}'),
		makeReq('Add Attachment', 'POST', `${base}/{{assignment_id}}/attachments`, ['api','admin','assignments','{{assignment_id}}','attachments'], '{\n  "fileName": "file.pdf",\n  "fileUrl": "https://example.com/file.pdf",\n  "fileSize": 12345,\n  "fileType": "application/pdf"\n}'),
		makeReq('Remove Attachment', 'DELETE', `${base}/{{assignment_id}}/attachments/0`, ['api','admin','assignments','{{assignment_id}}','attachments','0']),
		makeReq('Search Assignments', 'GET', `${base}/search?query=homework&page=1&limit=10`, ['api','admin','assignments','search']),
	];
	for (const it of items) {
		if (!existsByPath(folder, it.request.url.path)) folder.item.push(it);
	}
}

function addAdminSubmissions(root) {
	const folder = upsertFolder(root, 'Admin - Submissions');
	const base = '{{base_url}}/api/admin/submissions';
	const items = [
		makeReq('Get Submission By Id', 'GET', `${base}/{{submission_id}}`, ['api','admin','submissions','{{submission_id}}']),
		makeReq('Update Submission', 'PUT', `${base}/{{submission_id}}`, ['api','admin','submissions','{{submission_id}}'], '{ "score": 90, "feedback": "Good job" }'),
		makeReq('Delete Submission', 'DELETE', `${base}/{{submission_id}}`, ['api','admin','submissions','{{submission_id}}']),
		makeReq('List by Assignment', 'GET', `${base}/assignment/{{assignment_id}}?page=1&limit=20`, ['api','admin','submissions','assignment','{{assignment_id}}']),
		makeReq('List by Course', 'GET', `${base}/course/{{course_id}}?page=1&limit=20`, ['api','admin','submissions','course','{{course_id}}']),
		makeReq('Pending Submissions', 'GET', `${base}/pending?page=1&limit=20`, ['api','admin','submissions','pending']),
		makeReq('Late Submissions', 'GET', `${base}/late?page=1&limit=20`, ['api','admin','submissions','late']),
		makeReq('Grade Submission', 'POST', `${base}/{{submission_id}}/grade`, ['api','admin','submissions','{{submission_id}}','grade'], '{ "score": 88, "feedback": "Well done", "gradedBy": "{{admin_user_id}}" }'),
		makeReq('Bulk Grade Submissions', 'POST', `${base}/bulk-grade`, ['api','admin','submissions','bulk-grade'], '{\n  "gradingData": [\n    { "submissionId": "{{submission_id}}", "score": 75, "feedback": "OK" }\n  ]\n}'),
		makeReq('Submission Stats', 'GET', `${base}/stats?assignmentId={{assignment_id}}`, ['api','admin','submissions','stats']),
		makeReq('Submission Analytics', 'GET', `${base}/analytics?courseId={{course_id}}`, ['api','admin','submissions','analytics']),
		makeReq('Search Submissions', 'GET', `${base}/search?query=john&page=1&limit=10`, ['api','admin','submissions','search']),
	];
	for (const it of items) {
		if (!existsByPath(folder, it.request.url.path)) folder.item.push(it);
	}
}

function addClientAssignmentRequests(root) {
	// Find client assignments folder by existing item path starts with api/client/assignments
	const folder = findFolderByPredicate(ensureArray(root, 'item'), node =>
		node && node.name && typeof node.name === 'string' && Array.isArray(node.item) &&
		node.item.some(it => it.request && it.request.url && Array.isArray(it.request.url.path) && it.request.url.path.slice(0,3).join('/') === 'api/client/assignments')
	);
	if (!folder) return; // skip if not found
	const base = '{{base_url}}/api/client/assignments';
	const items = [
		makeReq('Get Assignments by Lesson', 'GET', `${base}/lesson/{{lesson_id}}?page=1&limit=20`, ['api','client','assignments','lesson','{{lesson_id}}']),
		makeReq('Get Assignments by Course', 'GET', `${base}/course/{{course_id}}?page=1&limit=20`, ['api','client','assignments','course','{{course_id}}']),
		makeReq('Get Assignment Progress', 'GET', `${base}/{{assignment_id}}/progress`, ['api','client','assignments','{{assignment_id}}','progress']),
		makeReq('Submit Assignment', 'POST', `${base}/submit`, ['api','client','assignments','submit'], '{\n  "assignmentId": "{{assignment_id}}",\n  "courseId": "{{course_id}}",\n  "fileUrl": "https://example.com/ans.pdf"\n}'),
		makeReq('My Submissions', 'GET', `${base}/submissions?page=1&limit=20`, ['api','client','assignments','submissions']),
		makeReq('Get Submission By Id (Me)', 'GET', `${base}/submissions/{{submission_id}}`, ['api','client','assignments','submissions','{{submission_id}}']),
		makeReq('Upcoming Assignments', 'GET', `${base}/upcoming?page=1&limit=20`, ['api','client','assignments','upcoming']),
		makeReq('Search Assignments', 'GET', `${base}/search?query=home&page=1&limit=10`, ['api','client','assignments','search']),
		makeReq('My Assignment Stats', 'GET', `${base}/stats?courseId={{course_id}}`, ['api','client','assignments','stats']),
	];
	for (const it of items) {
		if (!existsByPath(folder, it.request.url.path)) folder.item.push(it);
	}
}

function main() {
	const json = readJson(COLLECTION_PATH);
	addAdminAssignments(json);
	addAdminSubmissions(json);
	addClientAssignmentRequests(json);
	writeJson(COLLECTION_PATH, json);
	console.log('Postman collection updated with Assignments/Submissions endpoints.');
}

main();



# **SOLVIO**

**FRONTEND GUIDE FOR AI CODING AGENTS - PART 13 - WritingLab Service**

This document is a part of a REST API guide for the solvio project.
It is designed for AI agents that will generate frontend code to consume the project’s backend.

This document provides extensive instruction for the usage of writingLab

## Service Access

WritingLab service management is handled through service specific base urls.

WritingLab  service may be deployed to the preview server, staging server, or production server. Therefore,it has 3 access URLs.
The frontend application must support all deployment environments during development, and the user should be able to select the target API server on the login page (already handled in first part.).

For the writingLab service, the base URLs are:

* **Preview:** `https://solvio.prw.mindbricks.com/writinglab-api`
* **Staging:** `https://solvio-stage.mindbricks.co/writinglab-api`
* **Production:** `https://solvio.mindbricks.co/writinglab-api`

### Tenant URL Prefix and Header Forwarding

Tenant context is resolved by frontend routing strategy:
- preview/test: URL prefix `/{tenantCodename}` (example: `/babil/products`)
- production: tenant subdomain (example: `babil.appname...`)

Then backend API calls must always claim target tenant with header:

```js
headers["mbx-school-codename"] = tenantCodenameFromUrl;
```

URL prefix/subdomain is frontend-only tenant selection. Use header forwarding for all tenant-scoped calls to `writingLab` service.

## Scope

**WritingLab Service Description**

Handles student writing submissions, AI evaluations/feedback, and teacher feedback for written assignments, with support for image/OCR, multilingual feedback, and analytics. Accepts both digital text and handwriting (via image+OCR), stores detailed feedback and scoring, and enables teacher review and comments, with full tenant and user data isolation.

WritingLab service provides apis and business logic for following data objects in solvio application. 
Each data object may be either a central domain of the application data structure or a related helper data object for a central concept.
Note that data object concept is equal to table concept in the database, in the service database each data object is represented as a db table scheme and the object instances as table rows.  


**`writingEvaluation` Data Object**: Stores AI-generated evaluation for a writing submission: overall/criteria scores, feedback text (multilingual), suggestions, and whether teacher reviewed

**`writingSubmission` Data Object**: A student-submitted writing task, either digital or via OCR image, associated with an assignment (class/independent), supporting data needed for evaluation.

**`writingTeacherFeedback` Data Object**: Manual, per-submission teacher comment linked to a writingSubmission. May supplement or override AI feedback.


## WritingLab Service Frontend Description By The Backend Architect

# Writing Lab Backend Service
- Use createWritingSubmission for handling both typed and OCR (handwritten image) submissions, supporting text and optional imageUrl fields. After creation, backend generates AI evaluation automatically; UI may show "pending grading" status until feedback arrives (poll or listen for status change).
- writingEvaluation objects are treated as AI system feedback artifacts; users see evaluation and suggestions, and may tap words for dictionary lookup via frontend logic.
- Teachers may retrieve writingSubmission + evaluation, and append a writingTeacherFeedback record; once submitted, student is notified, and feedback is visibly updated.
- UI should clearly indicate the current status of a submission (submitted, graded, returned), and link together related evaluations and teacher comments for analytics/reporting.

## API Structure

### Object Structure of a Successful Response

When the service processes requests successfully, it wraps the requested resource(s) within a JSON envelope. This envelope includes the data and essential metadata such as configuration details and pagination information, providing context to the client.

**HTTP Status Codes:**

* **200 OK**: Returned for successful GET, LIST, UPDATE, or DELETE operations, indicating that the request was processed successfully.
* **201 Created**: Returned for CREATE operations, indicating that the resource was created successfully.

**Success Response Format:**

For successful operations, the response includes a `"status": "OK"` property, signaling that the request executed successfully. The structure of a successful response is outlined below:

```json
{
  "status":"OK",
  "statusCode": 200,   
  "elapsedMs":126,
  "ssoTime":120,
  "source": "db",
  "cacheKey": "hexCode",
  "userId": "ID",
  "sessionId": "ID",
  "requestId": "ID",
  "dataName":"products",
  "method":"GET",
  "action":"list",
  "appVersion":"Version",
  "rowCount":3,
  "products":[{},{},{}],
  "paging": {
    "pageNumber":1, 
    "pageRowCount":25, 
    "totalRowCount":3,
    "pageCount":1
  },
  "filters": [],
  "uiPermissions": []
}
```
* **`products`**: In this example, this key contains the actual response content, which may be a single object or an array of objects depending on the operation.

### Additional Data

Each API may include additional data besides the main data object, depending on the business logic of the API. These will be provided in each API’s response signature.

### Error Response

If a request encounters an issue—whether due to a logical fault or a technical problem—the service responds with a standardized JSON error structure. The HTTP status code indicates the nature of the error, using commonly recognized codes for clarity:

* **400 Bad Request**: The request was improperly formatted or contained invalid parameters.
* **401 Unauthorized**: The request lacked a valid authentication token; login is required.
* **403 Forbidden**: The current token does not grant access to the requested resource.
* **404 Not Found**: The requested resource was not found on the server.
* **500 Internal Server Error**: The server encountered an unexpected condition.

Each error response is structured to provide meaningful insight into the problem, assisting in efficient diagnosis and resolution.

```js
{
  "result": "ERR",
  "status": 400,
  "message": "errMsg_organizationIdisNotAValidID",
  "errCode": 400,
  "date": "2024-03-19T12:13:54.124Z",
  "detail": "String"
}
```

## Bucket Management

(This information is also given in PART 1 prompt.)

This application has a bucket service used to store user files and other object-related files. The bucket service is login-agnostic, so for write operations or private reads, include a bucket token (provided by services) in the request’s Authorization header as a Bearer token.

Please note that all other business services require the access token in the Bearer header, while the bucket service expects a bucket token because it is login-agnostic. Ensure you manage the required token injection properly; any auth interceptor should not replace the bucket token with the access token.

**User Bucket**
This bucket stores public user files for each user.

When a user logs in—or in the `/currentuser` response—there is a `userBucketToken` to use when sending user-related public files to the bucket service.

```json
{
  //...
  "userBucketToken": "e56d...."
}
```

To upload a file

`POST {baseUrl}/bucket/upload`

The request body is form-data which includes the `bucketId` and the file binary in the `files` field.

```js
{
    bucketId: "{userId}-public-user-bucket",
    files: {binary}
}
```

Response status is 200 on success, e.g., body:

```json
{
    "success": true,
    "data": [
        {
            "fileId": "9da03f6d-0409-41ad-bb06-225a244ae408",
            "originalName": "test (10).png",
            "mimeType": "image/png",
            "size": 604063,
            "status": "uploaded",
            "bucketName": "f7103b85-fcda-4dec-92c6-c336f71fd3a2-public-user-bucket",
            "isPublic": true,
            "downloadUrl": "https://babilcom.mindbricks.co/bucket/download/9da03f6d-0409-41ad-bb06-225a244ae408"
        }
    ]
}
```

To download a file from the bucket, you need its `fileId`. If you upload an avatar or other asset, ensure the download URL or the `fileId` is stored in the backend.

Buckets are mostly used in object creations that require an additional file, such as a product image or user avatar. After uploading your image to the bucket, insert the returned download URL into the related property of the target object record.

**Application Bucket**

This Solvio application also includes a common public bucket that anyone can read, but only users with the `superAdmin`, `admin`, or `saasAdmin` roles can write (upload) to it.

When a user with one of these admin roles is logged in, the `/login` response or the `/currentuser` response also returns an `applicationBucketToken` field, which is used when uploading any file to the application bucket.

```json
{
  //...
  "applicationBucketToken": "e23fd...."
}
```

The common public application bucket ID is

`"solvio-public-common-bucket"`

In certain admin areas—such as product management pages—since the user already has the application bucket token, they will be able to upload related object images.

Please configure your UI to upload files to the application bucket using this bucket token whenever needed.



**School Bucket (Tenant Bucket)**

This Solvio application also includes a public bucket for each school that anyone can read, but only users with the `tenantOwner` or `tenantAdmin` roles can write (upload) to it.

When a user with one of these admin roles is logged in, the `/login` response or the `/currentuser` response also returns an `tenantBucketToken` field, which is used when uploading any file to the tenant bucket.

```json
{
  //...
  "tenantBucketToken": "e23fd...."
}
```

The common public tenant bucket ID is

`"solvio-{tenantCodename}-public-tenant-bucket"`

In certain admin areas—such as product management pages—since the user already has the tenant bucket token, they will be able to upload related object images.

Please configure your UI to upload files to the tenant bucket using this bucket token whenever needed.



**Object Buckets**
Some objects may also return a bucket token for uploading or accessing files related to that object. For example, in a project management application, when you fetch a project’s data, a public or private bucket token may be provided to upload or download project-related files.

These buckets will be used as described in the relevant object definitions.


## WritingEvaluation Data Object

Stores AI-generated evaluation for a writing submission: overall/criteria scores, feedback text (multilingual), suggestions, and whether teacher reviewed

### WritingEvaluation  Data Object Frontend Description By The Backend Architect

- This object holds the AI's analysis (scoring, feedback text, suggested corrections, language of feedback) for each writingSubmission (1:1). Only created after (or as part of) submission processing.
- When teacherReviewed=true, UI should visually indicate teacher has looked at/endorsed this feedback.


### WritingEvaluation Data Object Properties

WritingEvaluation data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `aiScore` | Integer | false | Yes | No | Overall AI-determined writing score (0-100) |
| `criteriaScores` | Object | false | Yes | No | Scoring (0-100) for grammar, vocabulary, organization, spelling, punctuation (object map) |
| `feedbackLanguage` | String | false | Yes | No | Language code for feedback ("en","tr","ar"). |
| `feedbackText` | Text | false | Yes | No | AI-generated feedback (in feedbackLanguage) |
| `suggestions` | String | true | No | No | Array of suggested corrections or improvements |
| `teacherReviewed` | Boolean | false | Yes | No | If true, teacher has reviewed/endorsed this feedback. |
| `writingSubmissionId` | ID | false | Yes | No | Submission being evaluated |
| `schoolId` | ID | false | Yes | No | An ID value to represent the tenant id of the school |
* Required properties are mandatory for creating objects and must be provided in the request body if no default value, formula or session bind is set.


### Array Properties 

`suggestions`

Array properties can hold multiple values. 
Array properties should be respected according to their multiple structure in the frontend in any user input for them.
Please use multiple input components for the array proeprties when needed.



### Relation Properties

`writingSubmissionId`

Mindbricks supports relations between data objects, allowing you to define how objects are linked together.
The relations may reference to a data object either in this service or in another service. Id the reference is remote, backend handles the relations through service communication or elastic search.
These relations should be respected in the frontend so that instaead of showing the related objects id, the frontend should list human readable values from other data objects.
If the relation points to another service, frontend should use the referenced service api in case it needs related data.
The relation logic is montly handled in backend so the api responses feeds the frontend about the relational data. 
In mmost cases the api response will provide the relational data as well as the main one.

In frontend, please ensure that, 

1- instaead of these relational ids you show the main human readable field of the related target data (like name),
2- if this data object needs a user input of these relational ids, you should provide a combobox with the list of possible records or (a searchbox) to select with the realted target data object main human readable field.


- **writingSubmissionId**: ID
Relation to `writingSubmission`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: Yes


### Filter Properties

`aiScore` `feedbackLanguage` `schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **aiScore**: Integer  has a filter named `aiScore`

- **feedbackLanguage**: String  has a filter named `feedbackLanguage`

- **schoolId**: ID  has a filter named `schoolId`


## WritingSubmission Data Object

A student-submitted writing task, either digital or via OCR image, associated with an assignment (class/independent), supporting data needed for evaluation.

### WritingSubmission  Data Object Frontend Description By The Backend Architect

- When submitting, the UI sends text, with optional imageUrl if using OCR. The status field governs display: "submitted" (awaiting grading), "graded" (AI feedback available), "returned" (teacher comment added).
- Submissions track both assignmentId (if from classAssignment) and classroomId for context. Independent learners omit classroomId/assignmentId (set to null). 


### WritingSubmission Data Object Properties

WritingSubmission data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `assignmentId` | ID | false | No | No | Related assignment (from classAssignment service), nullable for unassigned practice submissions. |
| `classroomId` | ID | false | No | No | Related class (if in class-based assignment), nullable for independent. |
| `language` | String | false | Yes | No | Language of submission (e.g., en, tr, ar); for routing feedback. |
| `originalImageUrl` | String | false | No | No | Optional: image of handwritten submission for OCR |
| `status` | Enum | false | Yes | No | Workflow state: submitted, graded (AI feedback done), returned (teacher feedback added). |
| `studentId` | ID | false | Yes | No | Student author (auth:user) |
| `submittedAt` | Date | false | Yes | No | When the submission was made. |
| `text` | Text | false | Yes | No | Submitted text (post-OCR if image submission) |
| `schoolId` | ID | false | Yes | No | An ID value to represent the tenant id of the school |
* Required properties are mandatory for creating objects and must be provided in the request body if no default value, formula or session bind is set.



### Enum Properties
Enum properties are defined with a set of allowed values, ensuring that only valid options can be assigned to them. 
The enum options value will be stored as strings in the database, 
but when a data object is created an additional property with the same name plus an idx suffix will be created, which will hold the index of the selected enum option.
You can use the {fieldName_idx} property to sort by the enum value or when your enum options represent a hiyerarchy of values.
In the frontend input components, enum type properties should only accept values from an option component that lists the enum options.

- **status**: [submitted, graded, returned]


### Relation Properties

`assignmentId` `classroomId` `studentId`

Mindbricks supports relations between data objects, allowing you to define how objects are linked together.
The relations may reference to a data object either in this service or in another service. Id the reference is remote, backend handles the relations through service communication or elastic search.
These relations should be respected in the frontend so that instaead of showing the related objects id, the frontend should list human readable values from other data objects.
If the relation points to another service, frontend should use the referenced service api in case it needs related data.
The relation logic is montly handled in backend so the api responses feeds the frontend about the relational data. 
In mmost cases the api response will provide the relational data as well as the main one.

In frontend, please ensure that, 

1- instaead of these relational ids you show the main human readable field of the related target data (like name),
2- if this data object needs a user input of these relational ids, you should provide a combobox with the list of possible records or (a searchbox) to select with the realted target data object main human readable field.


- **assignmentId**: ID
Relation to `classAssignmentAssignment`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: No

- **classroomId**: ID
Relation to `classroom`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: No

- **studentId**: ID
Relation to `user`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: Yes


### Filter Properties

`assignmentId` `classroomId` `status` `studentId` `schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **assignmentId**: ID  has a filter named `assignmentId`

- **classroomId**: ID  has a filter named `classroomId`

- **status**: Enum  has a filter named `status`

- **studentId**: ID  has a filter named `studentId`

- **schoolId**: ID  has a filter named `schoolId`


## WritingTeacherFeedback Data Object

Manual, per-submission teacher comment linked to a writingSubmission. May supplement or override AI feedback.

### WritingTeacherFeedback  Data Object Frontend Description By The Backend Architect

- Used only by teachers, shown to students when present (possibly with AI feedback for contrast).
- Created separately to ensure audit trail; consider multiple feedbacks (with timestamps) if UI allows corrections/iterations.


### WritingTeacherFeedback Data Object Properties

WritingTeacherFeedback data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `comments` | Text | false | Yes | No | Teacher's feedback/comment text |
| `teacherId` | ID | false | Yes | No | The teacher leaving feedback (auth:user, role enforced at API layer). |
| `writingSubmissionId` | ID | false | Yes | No | The submission being commented on |
| `schoolId` | ID | false | Yes | No | An ID value to represent the tenant id of the school |
* Required properties are mandatory for creating objects and must be provided in the request body if no default value, formula or session bind is set.




### Relation Properties

`teacherId` `writingSubmissionId`

Mindbricks supports relations between data objects, allowing you to define how objects are linked together.
The relations may reference to a data object either in this service or in another service. Id the reference is remote, backend handles the relations through service communication or elastic search.
These relations should be respected in the frontend so that instaead of showing the related objects id, the frontend should list human readable values from other data objects.
If the relation points to another service, frontend should use the referenced service api in case it needs related data.
The relation logic is montly handled in backend so the api responses feeds the frontend about the relational data. 
In mmost cases the api response will provide the relational data as well as the main one.

In frontend, please ensure that, 

1- instaead of these relational ids you show the main human readable field of the related target data (like name),
2- if this data object needs a user input of these relational ids, you should provide a combobox with the list of possible records or (a searchbox) to select with the realted target data object main human readable field.


- **teacherId**: ID
Relation to `user`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: Yes

- **writingSubmissionId**: ID
Relation to `writingSubmission`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: Yes


### Filter Properties

`schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **schoolId**: ID  has a filter named `schoolId`



## Default CRUD APIs

For each data object, the backend architect may designate **default APIs** for standard operations (create, update, delete, get, list). These are the APIs that frontend CRUD forms and AI agents should use for basic record management. If no default is explicitly set (`isDefaultApi`), the frontend generator auto-discovers the most general API for each operation.

### WritingEvaluation Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | _none_ | - | Auto |
| Update | _none_ | - | Auto |
| Delete | _none_ | - | Auto |
| Get | `getWritingEvaluation` | `/v1/writingevaluations/:writingEvaluationId` | Auto |
| List | `_fetchListWritingEvaluation` | `/v1/_fetchlistwritingevaluation` | System |
### WritingSubmission Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `createWritingSubmission` | `/v1/writingsubmissions` | Auto |
| Update | `updateWritingSubmission` | `/v1/writingsubmissions/:writingSubmissionId` | Auto |
| Delete | `deleteWritingSubmission` | `/v1/writingsubmissions/:writingSubmissionId` | Auto |
| Get | `getWritingSubmission` | `/v1/writingsubmissions/:writingSubmissionId` | Auto |
| List | `listWritingSubmissions` | `/v1/writingsubmissions` | System |
### WritingTeacherFeedback Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `createWritingTeacherFeedback` | `/v1/writingteacherfeedbacks` | Auto |
| Update | _none_ | - | Auto |
| Delete | _none_ | - | Auto |
| Get | _none_ | - | Auto |
| List | `listWritingTeacherFeedback` | `/v1/writingteacherfeedbacks` | System |

When building CRUD forms for a data object, use the default create/update APIs listed above. The form fields should correspond to the API's body parameters. For relation fields, render a dropdown loaded from the related object's list API using the display label property.


## API Reference

### `Create Writingsubmission` API
Student submits digital or image/OCR-based writing. After storing, triggers AI evaluation; sets status to "graded" once feedback complete. Returns submission and evaluation if ready.

**API Frontend Description By The Backend Architect**

Used for both digital and OCR-based writing submission. After create, backend generates AI evaluation and feedback. Status will move from "submitted" to "graded" once evaluation is ready; UI may poll for evaluation or listen for update.

**Rest Route**

The `createWritingSubmission` API REST controller can be triggered via the following route:

`/v1/writingsubmissions`


**Rest Request Parameters**


The `createWritingSubmission` api has got 5 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| assignmentId  | ID  | false | request.body?.["assignmentId"] |
| classroomId  | ID  | false | request.body?.["classroomId"] |
| language  | String  | true | request.body?.["language"] |
| originalImageUrl  | String  | false | request.body?.["originalImageUrl"] |
| text  | Text  | true | request.body?.["text"] |
**assignmentId** : Related assignment (from classAssignment service), nullable for unassigned practice submissions.
**classroomId** : Related class (if in class-based assignment), nullable for independent.
**language** : Language of submission (e.g., en, tr, ar); for routing feedback.
**originalImageUrl** : Optional: image of handwritten submission for OCR
**text** : Submitted text (post-OCR if image submission)


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/writingsubmissions**
```js
  axios({
    method: 'POST',
    url: '/v1/writingsubmissions',
    data: {
            assignmentId:"ID",  
            classroomId:"ID",  
            language:"String",  
            originalImageUrl:"String",  
            text:"Text",  
    
    },
    params: {
    
        }
  });
```   
**REST Response**


```json
{
	"status": "OK",
	"statusCode": "201",
	"elapsedMs": 126,
	"ssoTime": 120,
	"source": "db",
	"cacheKey": "hexCode",
	"userId": "ID",
	"sessionId": "ID",
	"requestId": "ID",
	"dataName": "writingSubmission",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"writingSubmission": {
		"id": "ID",
		"assignmentId": "ID",
		"classroomId": "ID",
		"language": "String",
		"originalImageUrl": "String",
		"status": "Enum",
		"status_idx": "Integer",
		"studentId": "ID",
		"submittedAt": "Date",
		"text": "Text",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Create Writingteacherfeedback` API
Teacher submits manual feedback/comment on a submission (supplements or clarifies AI output).

**API Frontend Description By The Backend Architect**

Teacher accesses a submission and submits a feedback comment to supplement/clarify (or correct) AI evaluation. Triggers notification to student.

**Rest Route**

The `createWritingTeacherFeedback` API REST controller can be triggered via the following route:

`/v1/writingteacherfeedbacks`


**Rest Request Parameters**


The `createWritingTeacherFeedback` api has got 2 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| comments  | Text  | true | request.body?.["comments"] |
| writingSubmissionId  | ID  | true | request.body?.["writingSubmissionId"] |
**comments** : Teacher's feedback/comment text
**writingSubmissionId** : The submission being commented on


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/writingteacherfeedbacks**
```js
  axios({
    method: 'POST',
    url: '/v1/writingteacherfeedbacks',
    data: {
            comments:"Text",  
            writingSubmissionId:"ID",  
    
    },
    params: {
    
        }
  });
```   
**REST Response**


```json
{
	"status": "OK",
	"statusCode": "201",
	"elapsedMs": 126,
	"ssoTime": 120,
	"source": "db",
	"cacheKey": "hexCode",
	"userId": "ID",
	"sessionId": "ID",
	"requestId": "ID",
	"dataName": "writingTeacherFeedback",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"writingTeacherFeedback": {
		"id": "ID",
		"comments": "Text",
		"teacherId": "ID",
		"writingSubmissionId": "ID",
		"schoolId": "ID",
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID",
		"isActive": true
	}
}
```
### `Delete Writingsubmission` API
Soft-delete a submission (by student/owner or admin/teacher in class context).

**API Frontend Description By The Backend Architect**

Allows owner student or admin to remove from list (not physical delete).

**Rest Route**

The `deleteWritingSubmission` API REST controller can be triggered via the following route:

`/v1/writingsubmissions/:writingSubmissionId`


**Rest Request Parameters**


The `deleteWritingSubmission` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| writingSubmissionId  | ID  | true | request.params?.["writingSubmissionId"] |
**writingSubmissionId** : This id paremeter is used to select the required data object that will be deleted


**REST Request**
To access the api you can use the **REST** controller with the path **DELETE  /v1/writingsubmissions/:writingSubmissionId**
```js
  axios({
    method: 'DELETE',
    url: `/v1/writingsubmissions/${writingSubmissionId}`,
    data: {
    
    },
    params: {
    
        }
  });
```   
**REST Response**


```json
{
	"status": "OK",
	"statusCode": "200",
	"elapsedMs": 126,
	"ssoTime": 120,
	"source": "db",
	"cacheKey": "hexCode",
	"userId": "ID",
	"sessionId": "ID",
	"requestId": "ID",
	"dataName": "writingSubmission",
	"method": "DELETE",
	"action": "delete",
	"appVersion": "Version",
	"rowCount": 1,
	"writingSubmission": {
		"id": "ID",
		"assignmentId": "ID",
		"classroomId": "ID",
		"language": "String",
		"originalImageUrl": "String",
		"status": "Enum",
		"status_idx": "Integer",
		"studentId": "ID",
		"submittedAt": "Date",
		"text": "Text",
		"schoolId": "ID",
		"isActive": false,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Get Writingevaluation` API
Retrieve a single evaluation (AI feedback, criteria, suggestions) for one submission. Used in review/detail screens.

**API Frontend Description By The Backend Architect**

Fetches the AI feedback for a submission (criteria, score, suggestions, feedback language).

**Rest Route**

The `getWritingEvaluation` API REST controller can be triggered via the following route:

`/v1/writingevaluations/:writingEvaluationId`


**Rest Request Parameters**


The `getWritingEvaluation` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| writingEvaluationId  | ID  | true | request.params?.["writingEvaluationId"] |
**writingEvaluationId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/writingevaluations/:writingEvaluationId**
```js
  axios({
    method: 'GET',
    url: `/v1/writingevaluations/${writingEvaluationId}`,
    data: {
    
    },
    params: {
    
        }
  });
```   
**REST Response**


```json
{
	"status": "OK",
	"statusCode": "200",
	"elapsedMs": 126,
	"ssoTime": 120,
	"source": "db",
	"cacheKey": "hexCode",
	"userId": "ID",
	"sessionId": "ID",
	"requestId": "ID",
	"dataName": "writingEvaluation",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"writingEvaluation": {
		"id": "ID",
		"aiScore": "Integer",
		"criteriaScores": "Object",
		"feedbackLanguage": "String",
		"feedbackText": "Text",
		"suggestions": "String",
		"teacherReviewed": "Boolean",
		"writingSubmissionId": "ID",
		"schoolId": "ID",
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID",
		"isActive": true
	}
}
```
### `Get Writingsubmission` API
Retrieve a single writingSubmission (with evaluation and feedback via joins) for viewing or analytics.

**API Frontend Description By The Backend Architect**

Returns submission; optionally includes evaluation and all associated teacher feedback via selectJoins; UI to display status and detailed feedback.

**Rest Route**

The `getWritingSubmission` API REST controller can be triggered via the following route:

`/v1/writingsubmissions/:writingSubmissionId`


**Rest Request Parameters**


The `getWritingSubmission` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| writingSubmissionId  | ID  | true | request.params?.["writingSubmissionId"] |
**writingSubmissionId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/writingsubmissions/:writingSubmissionId**
```js
  axios({
    method: 'GET',
    url: `/v1/writingsubmissions/${writingSubmissionId}`,
    data: {
    
    },
    params: {
    
        }
  });
```   
**REST Response**


```json
{
	"status": "OK",
	"statusCode": "200",
	"elapsedMs": 126,
	"ssoTime": 120,
	"source": "db",
	"cacheKey": "hexCode",
	"userId": "ID",
	"sessionId": "ID",
	"requestId": "ID",
	"dataName": "writingSubmission",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"writingSubmission": {
		"id": "ID",
		"assignmentId": "ID",
		"classroomId": "ID",
		"language": "String",
		"originalImageUrl": "String",
		"status": "Enum",
		"status_idx": "Integer",
		"studentId": "ID",
		"submittedAt": "Date",
		"text": "Text",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID",
		"writingEvaluation": [
			{
				"aiScore": "Integer",
				"criteriaScores": "Object",
				"feedbackLanguage": "String",
				"feedbackText": "Text",
				"suggestions": "String",
				"teacherReviewed": "Boolean"
			},
			{},
			{}
		],
		"teacherFeedbackList": [
			{
				"comments": "Text",
				"teacherId": "ID",
				"createdAt": "Date"
			},
			{},
			{}
		]
	}
}
```
### `List Writingsubmissions` API
List writingSubmission objects, filtered by assignment, student, class, or status for analytics or dashboard.

**API Frontend Description By The Backend Architect**

Used in student dashboard (list my work) and teacher/class views. May filter by assignment, class, and status; response can include evaluation/feedback per record via selectJoins.

**Rest Route**

The `listWritingSubmissions` API REST controller can be triggered via the following route:

`/v1/writingsubmissions`


**Rest Request Parameters**


**Filter Parameters**

The `listWritingSubmissions` api supports 4 optional filter parameters for filtering list results:

**assignmentId** (`ID`): Related assignment (from classAssignment service), nullable for unassigned practice submissions.

- Single: `?assignmentId=<value>`
- Multiple: `?assignmentId=<value1>&assignmentId=<value2>`
- Null: `?assignmentId=null`


**classroomId** (`ID`): Related class (if in class-based assignment), nullable for independent.

- Single: `?classroomId=<value>`
- Multiple: `?classroomId=<value1>&classroomId=<value2>`
- Null: `?classroomId=null`


**status** (`Enum`): Workflow state: submitted, graded (AI feedback done), returned (teacher feedback added).

- Single: `?status=<value>` (case-insensitive)
- Multiple: `?status=<value1>&status=<value2>`
- Null: `?status=null`


**studentId** (`ID`): Student author (auth:user)

- Single: `?studentId=<value>`
- Multiple: `?studentId=<value1>&studentId=<value2>`
- Null: `?studentId=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/writingsubmissions**
```js
  axios({
    method: 'GET',
    url: '/v1/writingsubmissions',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // assignmentId: '<value>' // Filter by assignmentId
        // classroomId: '<value>' // Filter by classroomId
        // status: '<value>' // Filter by status
        // studentId: '<value>' // Filter by studentId
            }
  });
```   
**REST Response**


```json
{
	"status": "OK",
	"statusCode": "200",
	"elapsedMs": 126,
	"ssoTime": 120,
	"source": "db",
	"cacheKey": "hexCode",
	"userId": "ID",
	"sessionId": "ID",
	"requestId": "ID",
	"dataName": "writingSubmissions",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"writingSubmissions": [
		{
			"id": "ID",
			"assignmentId": "ID",
			"classroomId": "ID",
			"language": "String",
			"originalImageUrl": "String",
			"status": "Enum",
			"status_idx": "Integer",
			"studentId": "ID",
			"submittedAt": "Date",
			"text": "Text",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"writingEvaluation": [
				{
					"aiScore": "Integer",
					"criteriaScores": "Object",
					"feedbackText": "Text",
					"suggestions": "String",
					"teacherReviewed": "Boolean"
				},
				{},
				{}
			]
		},
		{},
		{}
	],
	"paging": {
		"pageNumber": "Number",
		"pageRowCount": "NUmber",
		"totalRowCount": "Number",
		"pageCount": "Number"
	},
	"filters": [],
	"uiPermissions": []
}
```
### `List Writingteacherfeedback` API
List all teacher feedback comments on a submission (sorted recent first for UI display).

**API Frontend Description By The Backend Architect**

Used in submission detail/review UI; feedback history (for iterative feedback if supported).

**Rest Route**

The `listWritingTeacherFeedback` API REST controller can be triggered via the following route:

`/v1/writingteacherfeedbacks`


**Rest Request Parameters**
The `listWritingTeacherFeedback` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/writingteacherfeedbacks**
```js
  axios({
    method: 'GET',
    url: '/v1/writingteacherfeedbacks',
    data: {
    
    },
    params: {
    
        }
  });
```   
**REST Response**

This route's response is constrained to a select list of properties, and therefore does not encompass all attributes of the resource.

```json
{
	"status": "OK",
	"statusCode": "200",
	"elapsedMs": 126,
	"ssoTime": 120,
	"source": "db",
	"cacheKey": "hexCode",
	"userId": "ID",
	"sessionId": "ID",
	"requestId": "ID",
	"dataName": "writingTeacherFeedbacks",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"writingTeacherFeedbacks": [
		{
			"isActive": true
		},
		{},
		{}
	],
	"paging": {
		"pageNumber": "Number",
		"pageRowCount": "NUmber",
		"totalRowCount": "Number",
		"pageCount": "Number"
	},
	"filters": [],
	"uiPermissions": []
}
```
### `Update Writingsubmission` API
Student may update a draft writing submission before grading, or system updates status.

**API Frontend Description By The Backend Architect**

Usually used to change status in system operations; may be restricted for direct student use unless in draft state.

**Rest Route**

The `updateWritingSubmission` API REST controller can be triggered via the following route:

`/v1/writingsubmissions/:writingSubmissionId`


**Rest Request Parameters**


The `updateWritingSubmission` api has got 2 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| writingSubmissionId  | ID  | true | request.params?.["writingSubmissionId"] |
| status  | Enum  | true | request.body?.["status"] |
**writingSubmissionId** : This id paremeter is used to select the required data object that will be updated
**status** : Workflow state: submitted, graded (AI feedback done), returned (teacher feedback added).


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/writingsubmissions/:writingSubmissionId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/writingsubmissions/${writingSubmissionId}`,
    data: {
            status:"Enum",  
    
    },
    params: {
    
        }
  });
```   
**REST Response**


```json
{
	"status": "OK",
	"statusCode": "200",
	"elapsedMs": 126,
	"ssoTime": 120,
	"source": "db",
	"cacheKey": "hexCode",
	"userId": "ID",
	"sessionId": "ID",
	"requestId": "ID",
	"dataName": "writingSubmission",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"writingSubmission": {
		"id": "ID",
		"assignmentId": "ID",
		"classroomId": "ID",
		"language": "String",
		"originalImageUrl": "String",
		"status": "Enum",
		"status_idx": "Integer",
		"studentId": "ID",
		"submittedAt": "Date",
		"text": "Text",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `_fetch Listwritingevaluation` API
System API to fetch list of writingEvaluation records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListWritingEvaluation` API REST controller can be triggered via the following route:

`/v1/_fetchlistwritingevaluation`


**Rest Request Parameters**


**Filter Parameters**

The `_fetchListWritingEvaluation` api supports 2 optional filter parameters for filtering list results:

**aiScore** (`Integer`): Overall AI-determined writing score (0-100)

- Single: `?aiScore=<value>`
- Multiple: `?aiScore=<value1>&aiScore=<value2>`
- Range: `?aiScore=$lt-<value>`, `$lte-`, `$gt-`, `$gte-`, `$btw-<min>-<max>`
- Null: `?aiScore=null`


**feedbackLanguage** (`String`): Language code for feedback ("en","tr","ar").

- Single (partial match, case-insensitive): `?feedbackLanguage=<value>`
- Multiple: `?feedbackLanguage=<value1>&feedbackLanguage=<value2>`
- Null: `?feedbackLanguage=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistwritingevaluation**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistwritingevaluation',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // aiScore: '<value>' // Filter by aiScore
        // feedbackLanguage: '<value>' // Filter by feedbackLanguage
            }
  });
```   
**REST Response**


```json
{
	"status": "OK",
	"statusCode": "200",
	"elapsedMs": 126,
	"ssoTime": 120,
	"source": "db",
	"cacheKey": "hexCode",
	"userId": "ID",
	"sessionId": "ID",
	"requestId": "ID",
	"dataName": "writingEvaluations",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"writingEvaluations": [
		{
			"id": "ID",
			"aiScore": "Integer",
			"criteriaScores": "Object",
			"feedbackLanguage": "String",
			"feedbackText": "Text",
			"suggestions": "String",
			"teacherReviewed": "Boolean",
			"writingSubmissionId": "ID",
			"schoolId": "ID",
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"submission": [
				{
					"assignmentId": "ID",
					"classroomId": "ID",
					"language": "String",
					"originalImageUrl": "String",
					"status": "Enum",
					"status_idx": "Integer",
					"studentId": "ID",
					"submittedAt": "Date",
					"text": "Text"
				},
				{},
				{}
			],
			"isActive": true
		},
		{},
		{}
	],
	"paging": {
		"pageNumber": "Number",
		"pageRowCount": "NUmber",
		"totalRowCount": "Number",
		"pageCount": "Number"
	},
	"filters": [],
	"uiPermissions": []
}
```
### `_fetch Listwritingsubmission` API
System API to fetch list of writingSubmission records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListWritingSubmission` API REST controller can be triggered via the following route:

`/v1/_fetchlistwritingsubmission`


**Rest Request Parameters**


**Filter Parameters**

The `_fetchListWritingSubmission` api supports 4 optional filter parameters for filtering list results:

**assignmentId** (`ID`): Related assignment (from classAssignment service), nullable for unassigned practice submissions.

- Single: `?assignmentId=<value>`
- Multiple: `?assignmentId=<value1>&assignmentId=<value2>`
- Null: `?assignmentId=null`


**classroomId** (`ID`): Related class (if in class-based assignment), nullable for independent.

- Single: `?classroomId=<value>`
- Multiple: `?classroomId=<value1>&classroomId=<value2>`
- Null: `?classroomId=null`


**status** (`Enum`): Workflow state: submitted, graded (AI feedback done), returned (teacher feedback added).

- Single: `?status=<value>` (case-insensitive)
- Multiple: `?status=<value1>&status=<value2>`
- Null: `?status=null`


**studentId** (`ID`): Student author (auth:user)

- Single: `?studentId=<value>`
- Multiple: `?studentId=<value1>&studentId=<value2>`
- Null: `?studentId=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistwritingsubmission**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistwritingsubmission',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // assignmentId: '<value>' // Filter by assignmentId
        // classroomId: '<value>' // Filter by classroomId
        // status: '<value>' // Filter by status
        // studentId: '<value>' // Filter by studentId
            }
  });
```   
**REST Response**


```json
{
	"status": "OK",
	"statusCode": "200",
	"elapsedMs": 126,
	"ssoTime": 120,
	"source": "db",
	"cacheKey": "hexCode",
	"userId": "ID",
	"sessionId": "ID",
	"requestId": "ID",
	"dataName": "writingSubmissions",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"writingSubmissions": [
		{
			"id": "ID",
			"assignmentId": "ID",
			"classroomId": "ID",
			"language": "String",
			"originalImageUrl": "String",
			"status": "Enum",
			"status_idx": "Integer",
			"studentId": "ID",
			"submittedAt": "Date",
			"text": "Text",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"assignment": [
				{
					"assignedById": "ID",
					"classroomId": "ID",
					"contentId": "ID",
					"dueDate": "Date",
					"proficiencyLevel": "String",
					"skillType": "Enum",
					"skillType_idx": "Integer",
					"status": "Enum",
					"status_idx": "Integer",
					"targetStudentId": "ID",
					"schoolId": "ID"
				},
				{},
				{}
			],
			"classroom": [
				{
					"description": "Text",
					"invitationCode": "String",
					"levelGroup": "String",
					"name": "String",
					"teacherId": "ID",
					"schoolId": "ID"
				},
				{},
				{}
			],
			"student": [
				{
					"fullname": "String"
				},
				{},
				{}
			]
		},
		{},
		{}
	],
	"paging": {
		"pageNumber": "Number",
		"pageRowCount": "NUmber",
		"totalRowCount": "Number",
		"pageCount": "Number"
	},
	"filters": [],
	"uiPermissions": []
}
```
### `_fetch Listwritingteacherfeedback` API
System API to fetch list of writingTeacherFeedback records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListWritingTeacherFeedback` API REST controller can be triggered via the following route:

`/v1/_fetchlistwritingteacherfeedback`


**Rest Request Parameters**
The `_fetchListWritingTeacherFeedback` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistwritingteacherfeedback**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistwritingteacherfeedback',
    data: {
    
    },
    params: {
    
        }
  });
```   
**REST Response**


```json
{
	"status": "OK",
	"statusCode": "200",
	"elapsedMs": 126,
	"ssoTime": 120,
	"source": "db",
	"cacheKey": "hexCode",
	"userId": "ID",
	"sessionId": "ID",
	"requestId": "ID",
	"dataName": "writingTeacherFeedbacks",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"writingTeacherFeedbacks": [
		{
			"id": "ID",
			"comments": "Text",
			"teacherId": "ID",
			"writingSubmissionId": "ID",
			"schoolId": "ID",
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"teacher": [
				{
					"fullname": "String"
				},
				{},
				{}
			],
			"submission": [
				{
					"assignmentId": "ID",
					"classroomId": "ID",
					"language": "String",
					"originalImageUrl": "String",
					"status": "Enum",
					"status_idx": "Integer",
					"studentId": "ID",
					"submittedAt": "Date",
					"text": "Text"
				},
				{},
				{}
			],
			"isActive": true
		},
		{},
		{}
	],
	"paging": {
		"pageNumber": "Number",
		"pageRowCount": "NUmber",
		"totalRowCount": "Number",
		"pageCount": "Number"
	},
	"filters": [],
	"uiPermissions": []
}
```

**After this prompt, the user may give you new instructions to update the output of this prompt or provide subsequent prompts about the project.**



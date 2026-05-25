

# **SOLVIO**

**FRONTEND GUIDE FOR AI CODING AGENTS - PART 9 - ListeningLab Service**

This document is a part of a REST API guide for the solvio project.
It is designed for AI agents that will generate frontend code to consume the project’s backend.

This document provides extensive instruction for the usage of listeningLab

## Service Access

ListeningLab service management is handled through service specific base urls.

ListeningLab  service may be deployed to the preview server, staging server, or production server. Therefore,it has 3 access URLs.
The frontend application must support all deployment environments during development, and the user should be able to select the target API server on the login page (already handled in first part.).

For the listeningLab service, the base URLs are:

* **Preview:** `https://solvio.prw.mindbricks.com/listeninglab-api`
* **Staging:** `https://solvio-stage.mindbricks.co/listeninglab-api`
* **Production:** `https://solvio.mindbricks.co/listeninglab-api`

### Tenant URL Prefix and Header Forwarding

Tenant context is resolved by frontend routing strategy:
- preview/test: URL prefix `/{tenantCodename}` (example: `/babil/products`)
- production: tenant subdomain (example: `babil.appname...`)

Then backend API calls must always claim target tenant with header:

```js
headers["mbx-school-codename"] = tenantCodenameFromUrl;
```

URL prefix/subdomain is frontend-only tenant selection. Use header forwarding for all tenant-scoped calls to `listeningLab` service.

## Scope

**ListeningLab Service Description**

Handles dynamic creation, assignment, and evaluation of listening exercises (including comprehension quizzes) for Solvio. Supports AI-based generation of multi-speaker audio, quiz management, auto-scoring, and feedback for class/assignment and independent practice use cases.

ListeningLab service provides apis and business logic for following data objects in solvio application. 
Each data object may be either a central domain of the application data structure or a related helper data object for a central concept.
Note that data object concept is equal to table concept in the database, in the service database each data object is represented as a db table scheme and the object instances as table rows.  


**`listeningExercise` Data Object**: A generated or assigned listening activity for a student (practice or assignment-based), containing topic, audio, transcript, and metadata.

**`listeningQuiz` Data Object**: MCQ quiz for a listeningExercise; each question has questionText, choices (array), and correct answer index.

**`listeningResponse` Data Object**: A student&#39;s submission of answers for a listeningQuiz; holds auto-scored result and feedback for the student.


## ListeningLab Service Frontend Description By The Backend Architect

# listeningLab service – UX/Frontend Brief
- All audio listening exercises (assigned or practice) are fetched and rendered for the student with topic, transcript (optionally), and playback/audio controls.
- Upon exercise completion, user is prompted with a multi-choice question quiz; answers are submitted for instant scoring and detailed feedback.
- Distinguish assignment-based vs. independent exercises in UI (show assignment/class info if linked).
- Teacher dashboard displays exercises and aggregate analytics per assignment/class; teachers may view student responses (score/feedback) for all assigned learners.
- For each exercise, frontend may query associated quiz and user’s latest response.
- Analytics/visuals rely on score fields from response objects and timing metadata (generatedAt, submittedAt).

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


## ListeningExercise Data Object

A generated or assigned listening activity for a student (practice or assignment-based), containing topic, audio, transcript, and metadata.

### ListeningExercise  Data Object Frontend Description By The Backend Architect

- Rendered as a practice or assignment-based listening task. Audio player and transcript are primary user interaction entry points. Status (e.g., completed, pending quiz) is derived from related quiz and response records.


### ListeningExercise Data Object Properties

ListeningExercise data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `assignmentId` | ID | false | No | No | Related assignment if this is a class/assignment instance (nullable for independent practice) |
| `audioUrl` | String | false | Yes | No | URL to generated/provided audio |
| `classroomId` | ID | false | No | No | If tied to class context, reference classroom; optional |
| `generatedAt` | Date | false | Yes | No | When audio was generated (required) |
| `language` | String | false | Yes | No | Audio/dialog language (e.g., en) |
| `speakerCount` | Integer | false | Yes | No | How many distinct speakers (AI models) in the audio |
| `studentId` | ID | false | Yes | No | Student owner of this exercise (required) |
| `topic` | String | false | Yes | No | Requested/given topic of listening exercise |
| `transcript` | Text | false | Yes | No | Transcript (AI-generated, same as audio) |
| `schoolId` | ID | false | Yes | No | An ID value to represent the tenant id of the school |
* Required properties are mandatory for creating objects and must be provided in the request body if no default value, formula or session bind is set.




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

`topic` `schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **topic**: String  has a filter named `topic`

- **schoolId**: ID  has a filter named `schoolId`


## ListeningQuiz Data Object

MCQ quiz for a listeningExercise; each question has questionText, choices (array), and correct answer index.

### ListeningQuiz  Data Object Frontend Description By The Backend Architect

- Is rendered automatically after audio listened; UI should fetch and present related quiz for the exercise. Each quiz is tied to one exercise (1:1). Not visible until exercise is delivered to user, and not editable by students.


### ListeningQuiz Data Object Properties

ListeningQuiz data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `listeningExerciseId` | ID | false | Yes | No | Foreign key to listeningExercise (1:1) |
| `questions` | Object | true | Yes | No | Array of question objects: {questionText:String,choices:[String],correctAnswerIndex:Integer} |
| `schoolId` | ID | false | Yes | No | An ID value to represent the tenant id of the school |
* Required properties are mandatory for creating objects and must be provided in the request body if no default value, formula or session bind is set.


### Array Properties 

`questions`

Array properties can hold multiple values. 
Array properties should be respected according to their multiple structure in the frontend in any user input for them.
Please use multiple input components for the array proeprties when needed.



### Relation Properties

`listeningExerciseId`

Mindbricks supports relations between data objects, allowing you to define how objects are linked together.
The relations may reference to a data object either in this service or in another service. Id the reference is remote, backend handles the relations through service communication or elastic search.
These relations should be respected in the frontend so that instaead of showing the related objects id, the frontend should list human readable values from other data objects.
If the relation points to another service, frontend should use the referenced service api in case it needs related data.
The relation logic is montly handled in backend so the api responses feeds the frontend about the relational data. 
In mmost cases the api response will provide the relational data as well as the main one.

In frontend, please ensure that, 

1- instaead of these relational ids you show the main human readable field of the related target data (like name),
2- if this data object needs a user input of these relational ids, you should provide a combobox with the list of possible records or (a searchbox) to select with the realted target data object main human readable field.


- **listeningExerciseId**: ID
Relation to `listeningExercise`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: Yes


### Filter Properties

`schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **schoolId**: ID  has a filter named `schoolId`


## ListeningResponse Data Object

A student&#39;s submission of answers for a listeningQuiz; holds auto-scored result and feedback for the student.

### ListeningResponse  Data Object Frontend Description By The Backend Architect

- Shown post-submission with correct/incorrect marking, score, and text feedback. Used for analytics and progress tracking. Only one response per listeningQuiz per student.


### ListeningResponse Data Object Properties

ListeningResponse data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `feedbackText` | Text | false | Yes | No | Auto-generated feedback for this quiz attempt (AI or generated from score) |
| `listeningQuizId` | ID | false | Yes | No | Foreign key to listeningQuiz (required) |
| `score` | Integer | false | Yes | No | Calculated score for this quiz attempt (auto-graded on create) |
| `studentAnswers` | Integer | true | Yes | No | Student's selected answer index per question (in order) |
| `submittedAt` | Date | false | Yes | No | Submission timestamp |
| `schoolId` | ID | false | Yes | No | An ID value to represent the tenant id of the school |
* Required properties are mandatory for creating objects and must be provided in the request body if no default value, formula or session bind is set.


### Array Properties 

`studentAnswers`

Array properties can hold multiple values. 
Array properties should be respected according to their multiple structure in the frontend in any user input for them.
Please use multiple input components for the array proeprties when needed.



### Relation Properties

`listeningQuizId`

Mindbricks supports relations between data objects, allowing you to define how objects are linked together.
The relations may reference to a data object either in this service or in another service. Id the reference is remote, backend handles the relations through service communication or elastic search.
These relations should be respected in the frontend so that instaead of showing the related objects id, the frontend should list human readable values from other data objects.
If the relation points to another service, frontend should use the referenced service api in case it needs related data.
The relation logic is montly handled in backend so the api responses feeds the frontend about the relational data. 
In mmost cases the api response will provide the relational data as well as the main one.

In frontend, please ensure that, 

1- instaead of these relational ids you show the main human readable field of the related target data (like name),
2- if this data object needs a user input of these relational ids, you should provide a combobox with the list of possible records or (a searchbox) to select with the realted target data object main human readable field.


- **listeningQuizId**: ID
Relation to `listeningQuiz`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: Yes


### Filter Properties

`schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **schoolId**: ID  has a filter named `schoolId`



## Default CRUD APIs

For each data object, the backend architect may designate **default APIs** for standard operations (create, update, delete, get, list). These are the APIs that frontend CRUD forms and AI agents should use for basic record management. If no default is explicitly set (`isDefaultApi`), the frontend generator auto-discovers the most general API for each operation.

### ListeningExercise Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `createListeningExercise` | `/v1/listeningexercises` | Auto |
| Update | `updateListeningExercise` | `/v1/listeningexercises/:listeningExerciseId` | Auto |
| Delete | `deleteListeningExercise` | `/v1/listeningexercises/:listeningExerciseId` | Auto |
| Get | `getListeningExercise` | `/v1/listeningexercises/:listeningExerciseId` | Auto |
| List | `listListeningExercises` | `/v1/listeningexercises` | System |
### ListeningQuiz Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `createListeningQuiz` | `/v1/listeningquizs` | Auto |
| Update | `updateListeningQuiz` | `/v1/listeningquizs/:listeningQuizId` | Auto |
| Delete | `deleteListeningQuiz` | `/v1/listeningquizs/:listeningQuizId` | Auto |
| Get | `getListeningQuiz` | `/v1/listeningquizs/:listeningQuizId` | Auto |
| List | `listListeningQuizzes` | `/v1/listeningquizzes` | System |
### ListeningResponse Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `createListeningResponse` | `/v1/listeningresponses` | Auto |
| Update | `updateListeningResponse` | `/v1/listeningresponses/:listeningResponseId` | Auto |
| Delete | `deleteListeningResponse` | `/v1/listeningresponses/:listeningResponseId` | Auto |
| Get | `getListeningResponse` | `/v1/listeningresponses/:listeningResponseId` | Auto |
| List | `listListeningResponses` | `/v1/listeningresponses` | System |

When building CRUD forms for a data object, use the default create/update APIs listed above. The form fields should correspond to the API's body parameters. For relation fields, render a dropdown loaded from the related object's list API using the display label property.


## API Reference

### `Create Listeningexercise` API
Create a listening exercise instance (AI-generated audio & transcript) for an assignment, classroom, or practice. Handles auto-generation (AI/Function), stores all metadata.


**Rest Route**

The `createListeningExercise` API REST controller can be triggered via the following route:

`/v1/listeningexercises`


**Rest Request Parameters**


The `createListeningExercise` api has got 8 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| assignmentId  | ID  | false | request.body?.["assignmentId"] |
| audioUrl  | String  | true | request.body?.["audioUrl"] |
| classroomId  | ID  | false | request.body?.["classroomId"] |
| generatedAt  | Date  | true | request.body?.["generatedAt"] |
| language  | String  | true | request.body?.["language"] |
| speakerCount  | Integer  | true | request.body?.["speakerCount"] |
| topic  | String  | true | request.body?.["topic"] |
| transcript  | Text  | true | request.body?.["transcript"] |
**assignmentId** : Related assignment if this is a class/assignment instance (nullable for independent practice)
**audioUrl** : URL to generated/provided audio
**classroomId** : If tied to class context, reference classroom; optional
**generatedAt** : When audio was generated (required)
**language** : Audio/dialog language (e.g., en)
**speakerCount** : How many distinct speakers (AI models) in the audio
**topic** : Requested/given topic of listening exercise
**transcript** : Transcript (AI-generated, same as audio)


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/listeningexercises**
```js
  axios({
    method: 'POST',
    url: '/v1/listeningexercises',
    data: {
            assignmentId:"ID",  
            audioUrl:"String",  
            classroomId:"ID",  
            generatedAt:"Date",  
            language:"String",  
            speakerCount:"Integer",  
            topic:"String",  
            transcript:"Text",  
    
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
	"dataName": "listeningExercise",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"listeningExercise": {
		"id": "ID",
		"assignmentId": "ID",
		"audioUrl": "String",
		"classroomId": "ID",
		"generatedAt": "Date",
		"language": "String",
		"speakerCount": "Integer",
		"studentId": "ID",
		"topic": "String",
		"transcript": "Text",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Create Listeningquiz` API
Creates a quiz for a given listeningExercise with multiple MCQs. Questions may be generated by AI or provided via assignment. 1:1 with each exercise.


**Rest Route**

The `createListeningQuiz` API REST controller can be triggered via the following route:

`/v1/listeningquizs`


**Rest Request Parameters**


The `createListeningQuiz` api has got 2 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| listeningExerciseId  | ID  | true | request.body?.["listeningExerciseId"] |
| questions  | Object  | true | request.body?.["questions"] |
**listeningExerciseId** : Foreign key to listeningExercise (1:1)
**questions** : Array of question objects: {questionText:String,choices:[String],correctAnswerIndex:Integer}


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/listeningquizs**
```js
  axios({
    method: 'POST',
    url: '/v1/listeningquizs',
    data: {
            listeningExerciseId:"ID",  
            questions:"Object",  
    
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
	"dataName": "listeningQuiz",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"listeningQuiz": {
		"id": "ID",
		"listeningExerciseId": "ID",
		"questions": "Object",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Create Listeningresponse` API
Submit answers to a listening quiz; auto-grade (calls gradeListeningQuiz) and stores feedback/score. One response per user per quiz allowed.


**Rest Route**

The `createListeningResponse` API REST controller can be triggered via the following route:

`/v1/listeningresponses`


**Rest Request Parameters**


The `createListeningResponse` api has got 5 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| feedbackText  | Text  | true | request.body?.["feedbackText"] |
| listeningQuizId  | ID  | true | request.body?.["listeningQuizId"] |
| score  | Integer  | true | request.body?.["score"] |
| studentAnswers  | Integer  | true | request.body?.["studentAnswers"] |
| submittedAt  | Date  | true | request.body?.["submittedAt"] |
**feedbackText** : Auto-generated feedback for this quiz attempt (AI or generated from score)
**listeningQuizId** : Foreign key to listeningQuiz (required)
**score** : Calculated score for this quiz attempt (auto-graded on create)
**studentAnswers** : Student's selected answer index per question (in order)
**submittedAt** : Submission timestamp


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/listeningresponses**
```js
  axios({
    method: 'POST',
    url: '/v1/listeningresponses',
    data: {
            feedbackText:"Text",  
            listeningQuizId:"ID",  
            score:"Integer",  
            studentAnswers:"Integer",  
            submittedAt:"Date",  
    
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
	"dataName": "listeningResponse",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"listeningResponse": {
		"id": "ID",
		"feedbackText": "Text",
		"listeningQuizId": "ID",
		"score": "Integer",
		"studentAnswers": "Integer",
		"submittedAt": "Date",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Delete Listeningexercise` API
Delete a listening exercise instance (soft delete); owners/admins/teachers or superadmin only. Cascades to quiz/responses.


**Rest Route**

The `deleteListeningExercise` API REST controller can be triggered via the following route:

`/v1/listeningexercises/:listeningExerciseId`


**Rest Request Parameters**


The `deleteListeningExercise` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| listeningExerciseId  | ID  | true | request.params?.["listeningExerciseId"] |
**listeningExerciseId** : This id paremeter is used to select the required data object that will be deleted


**REST Request**
To access the api you can use the **REST** controller with the path **DELETE  /v1/listeningexercises/:listeningExerciseId**
```js
  axios({
    method: 'DELETE',
    url: `/v1/listeningexercises/${listeningExerciseId}`,
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
	"dataName": "listeningExercise",
	"method": "DELETE",
	"action": "delete",
	"appVersion": "Version",
	"rowCount": 1,
	"listeningExercise": {
		"id": "ID",
		"assignmentId": "ID",
		"audioUrl": "String",
		"classroomId": "ID",
		"generatedAt": "Date",
		"language": "String",
		"speakerCount": "Integer",
		"studentId": "ID",
		"topic": "String",
		"transcript": "Text",
		"schoolId": "ID",
		"isActive": false,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Delete Listeningquiz` API
Delete a quiz (cascades to responses); owner/admin/teacher or superadmin only.


**Rest Route**

The `deleteListeningQuiz` API REST controller can be triggered via the following route:

`/v1/listeningquizs/:listeningQuizId`


**Rest Request Parameters**


The `deleteListeningQuiz` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| listeningQuizId  | ID  | true | request.params?.["listeningQuizId"] |
**listeningQuizId** : This id paremeter is used to select the required data object that will be deleted


**REST Request**
To access the api you can use the **REST** controller with the path **DELETE  /v1/listeningquizs/:listeningQuizId**
```js
  axios({
    method: 'DELETE',
    url: `/v1/listeningquizs/${listeningQuizId}`,
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
	"dataName": "listeningQuiz",
	"method": "DELETE",
	"action": "delete",
	"appVersion": "Version",
	"rowCount": 1,
	"listeningQuiz": {
		"id": "ID",
		"listeningExerciseId": "ID",
		"questions": "Object",
		"schoolId": "ID",
		"isActive": false,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Delete Listeningresponse` API
Delete a quiz response (student/owner or admin/teacher only). Soft delete for audit.


**Rest Route**

The `deleteListeningResponse` API REST controller can be triggered via the following route:

`/v1/listeningresponses/:listeningResponseId`


**Rest Request Parameters**


The `deleteListeningResponse` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| listeningResponseId  | ID  | true | request.params?.["listeningResponseId"] |
**listeningResponseId** : This id paremeter is used to select the required data object that will be deleted


**REST Request**
To access the api you can use the **REST** controller with the path **DELETE  /v1/listeningresponses/:listeningResponseId**
```js
  axios({
    method: 'DELETE',
    url: `/v1/listeningresponses/${listeningResponseId}`,
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
	"dataName": "listeningResponse",
	"method": "DELETE",
	"action": "delete",
	"appVersion": "Version",
	"rowCount": 1,
	"listeningResponse": {
		"id": "ID",
		"feedbackText": "Text",
		"listeningQuizId": "ID",
		"score": "Integer",
		"studentAnswers": "Integer",
		"submittedAt": "Date",
		"schoolId": "ID",
		"isActive": false,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Get Listeningexercise` API
Retrieve a single listening exercise, with optional join of quiz and (if authenticated as student) latest response.


**Rest Route**

The `getListeningExercise` API REST controller can be triggered via the following route:

`/v1/listeningexercises/:listeningExerciseId`


**Rest Request Parameters**


The `getListeningExercise` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| listeningExerciseId  | ID  | true | request.params?.["listeningExerciseId"] |
**listeningExerciseId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/listeningexercises/:listeningExerciseId**
```js
  axios({
    method: 'GET',
    url: `/v1/listeningexercises/${listeningExerciseId}`,
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
	"dataName": "listeningExercise",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"listeningExercise": {
		"id": "ID",
		"assignmentId": "ID",
		"audioUrl": "String",
		"classroomId": "ID",
		"generatedAt": "Date",
		"language": "String",
		"speakerCount": "Integer",
		"studentId": "ID",
		"topic": "String",
		"transcript": "Text",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID",
		"quiz": [
			{
				"questions": "Object"
			},
			{},
			{}
		],
		"latestResponse": {
			"feedbackText": "Text",
			"score": "Integer",
			"studentAnswers": "Integer",
			"submittedAt": "Date"
		}
	}
}
```
### `Get Listeningquiz` API
Retrieve a single quiz by ID (or by listeningExerciseId if required via filter).


**Rest Route**

The `getListeningQuiz` API REST controller can be triggered via the following route:

`/v1/listeningquizs/:listeningQuizId`


**Rest Request Parameters**


The `getListeningQuiz` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| listeningQuizId  | ID  | true | request.params?.["listeningQuizId"] |
**listeningQuizId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/listeningquizs/:listeningQuizId**
```js
  axios({
    method: 'GET',
    url: `/v1/listeningquizs/${listeningQuizId}`,
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
	"dataName": "listeningQuiz",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"listeningQuiz": {
		"id": "ID",
		"listeningExerciseId": "ID",
		"questions": "Object",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Get Listeningresponse` API
Retrieve a single listening quiz response (by id); ownership enforced.


**Rest Route**

The `getListeningResponse` API REST controller can be triggered via the following route:

`/v1/listeningresponses/:listeningResponseId`


**Rest Request Parameters**


The `getListeningResponse` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| listeningResponseId  | ID  | true | request.params?.["listeningResponseId"] |
**listeningResponseId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/listeningresponses/:listeningResponseId**
```js
  axios({
    method: 'GET',
    url: `/v1/listeningresponses/${listeningResponseId}`,
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
	"dataName": "listeningResponse",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"listeningResponse": {
		"id": "ID",
		"feedbackText": "Text",
		"listeningQuizId": "ID",
		"score": "Integer",
		"studentAnswers": "Integer",
		"submittedAt": "Date",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `List Listeningexercises` API
List exercises for a user (student) or class, with filters (topic, assignmentId, generatedAt, language, classroomId). Teacher/admin views across multiple students for a class or assignment.


**Rest Route**

The `listListeningExercises` API REST controller can be triggered via the following route:

`/v1/listeningexercises`


**Rest Request Parameters**


**Filter Parameters**

The `listListeningExercises` api supports 1 optional filter parameter for filtering list results:

**topic** (`String`): Requested/given topic of listening exercise

- Single (partial match, case-insensitive): `?topic=<value>`
- Multiple: `?topic=<value1>&topic=<value2>`
- Null: `?topic=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/listeningexercises**
```js
  axios({
    method: 'GET',
    url: '/v1/listeningexercises',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // topic: '<value>' // Filter by topic
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
	"dataName": "listeningExercises",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"listeningExercises": [
		{
			"id": "ID",
			"assignmentId": "ID",
			"audioUrl": "String",
			"classroomId": "ID",
			"generatedAt": "Date",
			"language": "String",
			"speakerCount": "Integer",
			"studentId": "ID",
			"topic": "String",
			"transcript": "Text",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"quiz": [
				{
					"questions": "Object"
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
### `List Listeningquizzes` API
List quizzes (by assignment/class/student/exercise, if needed); filter by listeningExerciseId possible. Used by teacher/admin dashboards.


**Rest Route**

The `listListeningQuizzes` API REST controller can be triggered via the following route:

`/v1/listeningquizzes`


**Rest Request Parameters**
The `listListeningQuizzes` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/listeningquizzes**
```js
  axios({
    method: 'GET',
    url: '/v1/listeningquizzes',
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
	"dataName": "listeningQuizzes",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"listeningQuizzes": [
		{
			"id": "ID",
			"listeningExerciseId": "ID",
			"questions": "Object",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID"
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
### `List Listeningresponses` API
List quiz responses (filter by quizId, studentId, assignment, or class as needed, with admin/teacher per-class view enabled). Used for analytics and dashboards.


**Rest Route**

The `listListeningResponses` API REST controller can be triggered via the following route:

`/v1/listeningresponses`


**Rest Request Parameters**
The `listListeningResponses` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/listeningresponses**
```js
  axios({
    method: 'GET',
    url: '/v1/listeningresponses',
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
	"dataName": "listeningResponses",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"listeningResponses": [
		{
			"id": "ID",
			"feedbackText": "Text",
			"listeningQuizId": "ID",
			"score": "Integer",
			"studentAnswers": "Integer",
			"submittedAt": "Date",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID"
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
### `Update Listeningexercise` API
Update properties of a listening exercise (allowed for owner/admin/teacher prior to assignment to student, otherwise restricted).


**Rest Route**

The `updateListeningExercise` API REST controller can be triggered via the following route:

`/v1/listeningexercises/:listeningExerciseId`


**Rest Request Parameters**


The `updateListeningExercise` api has got 3 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| listeningExerciseId  | ID  | true | request.params?.["listeningExerciseId"] |
| assignmentId  | ID  | false | request.body?.["assignmentId"] |
| classroomId  | ID  | false | request.body?.["classroomId"] |
**listeningExerciseId** : This id paremeter is used to select the required data object that will be updated
**assignmentId** : Related assignment if this is a class/assignment instance (nullable for independent practice)
**classroomId** : If tied to class context, reference classroom; optional


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/listeningexercises/:listeningExerciseId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/listeningexercises/${listeningExerciseId}`,
    data: {
            assignmentId:"ID",  
            classroomId:"ID",  
    
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
	"dataName": "listeningExercise",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"listeningExercise": {
		"id": "ID",
		"assignmentId": "ID",
		"audioUrl": "String",
		"classroomId": "ID",
		"generatedAt": "Date",
		"language": "String",
		"speakerCount": "Integer",
		"studentId": "ID",
		"topic": "String",
		"transcript": "Text",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Update Listeningquiz` API
Update questions of a listening quiz (before any student attempts). Only admin/owner/teacher allowed.


**Rest Route**

The `updateListeningQuiz` API REST controller can be triggered via the following route:

`/v1/listeningquizs/:listeningQuizId`


**Rest Request Parameters**


The `updateListeningQuiz` api has got 2 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| listeningQuizId  | ID  | true | request.params?.["listeningQuizId"] |
| questions  | Object  | false | request.body?.["questions"] |
**listeningQuizId** : This id paremeter is used to select the required data object that will be updated
**questions** : Array of question objects: {questionText:String,choices:[String],correctAnswerIndex:Integer}


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/listeningquizs/:listeningQuizId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/listeningquizs/${listeningQuizId}`,
    data: {
            questions:"Object",  
    
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
	"dataName": "listeningQuiz",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"listeningQuiz": {
		"id": "ID",
		"listeningExerciseId": "ID",
		"questions": "Object",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Update Listeningresponse` API
Update response (ONLY before results published or for admin correction); typically admin/teacher only.


**Rest Route**

The `updateListeningResponse` API REST controller can be triggered via the following route:

`/v1/listeningresponses/:listeningResponseId`


**Rest Request Parameters**


The `updateListeningResponse` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| listeningResponseId  | ID  | true | request.params?.["listeningResponseId"] |
**listeningResponseId** : This id paremeter is used to select the required data object that will be updated


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/listeningresponses/:listeningResponseId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/listeningresponses/${listeningResponseId}`,
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
	"dataName": "listeningResponse",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"listeningResponse": {
		"id": "ID",
		"feedbackText": "Text",
		"listeningQuizId": "ID",
		"score": "Integer",
		"studentAnswers": "Integer",
		"submittedAt": "Date",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `_fetch Listlisteningexercise` API
System API to fetch list of listeningExercise records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListListeningExercise` API REST controller can be triggered via the following route:

`/v1/_fetchlistlisteningexercise`


**Rest Request Parameters**


**Filter Parameters**

The `_fetchListListeningExercise` api supports 1 optional filter parameter for filtering list results:

**topic** (`String`): Requested/given topic of listening exercise

- Single (partial match, case-insensitive): `?topic=<value>`
- Multiple: `?topic=<value1>&topic=<value2>`
- Null: `?topic=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistlisteningexercise**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistlisteningexercise',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // topic: '<value>' // Filter by topic
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
	"dataName": "listeningExercises",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"listeningExercises": [
		{
			"id": "ID",
			"assignmentId": "ID",
			"audioUrl": "String",
			"classroomId": "ID",
			"generatedAt": "Date",
			"language": "String",
			"speakerCount": "Integer",
			"studentId": "ID",
			"topic": "String",
			"transcript": "Text",
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
### `_fetch Listlisteningquiz` API
System API to fetch list of listeningQuiz records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListListeningQuiz` API REST controller can be triggered via the following route:

`/v1/_fetchlistlisteningquiz`


**Rest Request Parameters**
The `_fetchListListeningQuiz` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistlisteningquiz**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistlisteningquiz',
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
	"dataName": "listeningQuizzes",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"listeningQuizzes": [
		{
			"id": "ID",
			"listeningExerciseId": "ID",
			"questions": "Object",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"exercise": [
				{
					"assignmentId": "ID",
					"audioUrl": "String",
					"classroomId": "ID",
					"generatedAt": "Date",
					"language": "String",
					"speakerCount": "Integer",
					"studentId": "ID",
					"topic": "String",
					"transcript": "Text"
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
### `_fetch Listlisteningresponse` API
System API to fetch list of listeningResponse records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListListeningResponse` API REST controller can be triggered via the following route:

`/v1/_fetchlistlisteningresponse`


**Rest Request Parameters**
The `_fetchListListeningResponse` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistlisteningresponse**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistlisteningresponse',
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
	"dataName": "listeningResponses",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"listeningResponses": [
		{
			"id": "ID",
			"feedbackText": "Text",
			"listeningQuizId": "ID",
			"score": "Integer",
			"studentAnswers": "Integer",
			"submittedAt": "Date",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"quiz": [
				{
					"listeningExerciseId": "ID",
					"questions": "Object"
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

**After this prompt, the user may give you new instructions to update the output of this prompt or provide subsequent prompts about the project.**





# **SOLVIO**

**FRONTEND GUIDE FOR AI CODING AGENTS - PART 12 - SpeakingLab Service**

This document is a part of a REST API guide for the solvio project.
It is designed for AI agents that will generate frontend code to consume the project’s backend.

This document provides extensive instruction for the usage of speakingLab

## Service Access

SpeakingLab service management is handled through service specific base urls.

SpeakingLab  service may be deployed to the preview server, staging server, or production server. Therefore,it has 3 access URLs.
The frontend application must support all deployment environments during development, and the user should be able to select the target API server on the login page (already handled in first part.).

For the speakingLab service, the base URLs are:

* **Preview:** `https://solvio.prw.mindbricks.com/speakinglab-api`
* **Staging:** `https://solvio-stage.mindbricks.co/speakinglab-api`
* **Production:** `https://solvio.mindbricks.co/speakinglab-api`

### Tenant URL Prefix and Header Forwarding

Tenant context is resolved by frontend routing strategy:
- preview/test: URL prefix `/{tenantCodename}` (example: `/babil/products`)
- production: tenant subdomain (example: `babil.appname...`)

Then backend API calls must always claim target tenant with header:

```js
headers["mbx-school-codename"] = tenantCodenameFromUrl;
```

URL prefix/subdomain is frontend-only tenant selection. Use header forwarding for all tenant-scoped calls to `speakingLab` service.

## Scope

**SpeakingLab Service Description**

Handles initiation and management of real-time speaking practice sessions, AI analysis/feedback on spoken English, and stores detailed analytics for review. Supports scenario-based practice, AI-driven scoring and feedback (including model audio), with integration to assignment and classroom modules.

SpeakingLab service provides apis and business logic for following data objects in solvio application. 
Each data object may be either a central domain of the application data structure or a related helper data object for a central concept.
Note that data object concept is equal to table concept in the database, in the service database each data object is represented as a db table scheme and the object instances as table rows.  


**`speakingEvaluation` Data Object**: Stores AI-generated evaluation (and optionally teacher-reviewed) for a speaking session: overall and per-criteria scores, text/audio feedback, suggestions.
Each evaluation is tied 1:1 to a speakingSession.

**`speakingSession` Data Object**: A real-time speaking practice or assessment instance for a user. Links to assignment/classroom if structured, or open practice. Stores scenario details, audio, times, and context for evaluation.


## SpeakingLab Service Frontend Description By The Backend Architect

## Speaking Lab Backend Service UX Guidance
- All session and evaluation flows are structured for seamless frontend orchestration: students initiate sessions, upload audio (or stream if supported), and instantly receive AI-generated feedback.
- For assignment-linked scenarios, display relevant assignment and classroom context via selectJoins on session objects. 
- Evaluations always attached 1:1 to a session; responses include per-criteria scoring and both written and audio feedback. 
- Teachers can access class/student speaking records for monitoring and advanced feedback (API supports join on both assignment and classroom).
- UX should emphasize immediacy: after upload, polling or WebSocket can check when evaluation (AI) is ready for display.
- Progress analytics for both users and teachers should aggregate speakingSession and speakingEvaluation data (suggested: radar charts for criteria breakouts, timeline of sessions, etc.).

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


## SpeakingEvaluation Data Object

Stores AI-generated evaluation (and optionally teacher-reviewed) for a speaking session: overall and per-criteria scores, text/audio feedback, suggestions.
Each evaluation is tied 1:1 to a speakingSession.

### SpeakingEvaluation  Data Object Frontend Description By The Backend Architect

- speakingEvaluation stores all feedback for a single session (AI, and, if allowed later, teacher review).
- AI or teacher can write per-criteria feedback and suggestions; criteriaScores is an object (pronunciation, fluency, grammar, vocabulary, coherence).
- feedbackText may be localized frontend-side as needed.
- feedbackAudioUrl contains speech form of feedback (optional: model audio in modelSentenceAudioUrl).
- This is ONLY created after a session (audio) is completed; session can be viewed on get/list with selectJoins on evaluation.


### SpeakingEvaluation Data Object Properties

SpeakingEvaluation data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `aiScore` | Integer | false | Yes | No | Overall AI-generated speaking score (0-100) for session. |
| `criteriaScores` | Object | false | Yes | No | AI scores per criteria: pronunciation, fluency, grammar, vocabulary, coherence. Object format: {pronunciation: int, fluency: int, ...} |
| `feedbackAudioUrl` | String | false | No | No | Audio file URL for spoken feedback (generated by TTS/AI voice, optional). |
| `feedbackText` | Text | false | Yes | No | AI-generated feedback text (localized as needed frontend-side). |
| `modelSentenceAudioUrl` | String | false | No | No | Audio URL for model sentence (native-like pronunciation/example; optional). |
| `speakingSessionId` | ID | false | Yes | No | Which session is being evaluated (1:1). |
| `suggestions` | String | true | No | No | Array of improvement suggestions or model sentences (AI-generated). |
| `schoolId` | ID | false | Yes | No | An ID value to represent the tenant id of the school |
* Required properties are mandatory for creating objects and must be provided in the request body if no default value, formula or session bind is set.


### Array Properties 

`suggestions`

Array properties can hold multiple values. 
Array properties should be respected according to their multiple structure in the frontend in any user input for them.
Please use multiple input components for the array proeprties when needed.



### Relation Properties

`speakingSessionId`

Mindbricks supports relations between data objects, allowing you to define how objects are linked together.
The relations may reference to a data object either in this service or in another service. Id the reference is remote, backend handles the relations through service communication or elastic search.
These relations should be respected in the frontend so that instaead of showing the related objects id, the frontend should list human readable values from other data objects.
If the relation points to another service, frontend should use the referenced service api in case it needs related data.
The relation logic is montly handled in backend so the api responses feeds the frontend about the relational data. 
In mmost cases the api response will provide the relational data as well as the main one.

In frontend, please ensure that, 

1- instaead of these relational ids you show the main human readable field of the related target data (like name),
2- if this data object needs a user input of these relational ids, you should provide a combobox with the list of possible records or (a searchbox) to select with the realted target data object main human readable field.


- **speakingSessionId**: ID
Relation to `speakingSession`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: Yes


### Filter Properties

`schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **schoolId**: ID  has a filter named `schoolId`


## SpeakingSession Data Object

A real-time speaking practice or assessment instance for a user. Links to assignment/classroom if structured, or open practice. Stores scenario details, audio, times, and context for evaluation.

### SpeakingSession  Data Object Frontend Description By The Backend Architect

- A speakingSession is created when a student (or teacher for demo) initiates a speaking practice. 
- If tied to an assignment or classroom, this is reflected (assignmentId/classroomId); for open practice, these are null.
- Frontend uploads audio for sessionAudioUrl (upon completion), then triggers evaluation.
- ScenarioType sets the context for AI and UI (e.g., conversation, interview, presentation, etc.
- startedAt, endedAt used to track session duration, analytics.
- Allows for time-based progress, session search/filter by scenario, time, classroom, etc.


### SpeakingSession Data Object Properties

SpeakingSession data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `assignmentId` | ID | false | No | No | Related assignment (from classAssignment:classAssignmentAssignment). Nullable for open practice. |
| `classroomId` | ID | false | No | No | Classroom context (optional, for structured practice) |
| `endedAt` | Date | false | No | No | Datetime when session ended (set on completion). |
| `language` | String | false | Yes | No | Language code for this session (e.g., en, tr, ar). |
| `scenarioType` | Enum | false | Yes | No | Context of speaking session (conversation/interview/presentation/etc.) |
| `sessionAudioUrl` | String | false | Yes | No | URL to recorded audio for full session (uploaded or generated). |
| `startedAt` | Date | false | Yes | No | Datetime when session started. |
| `studentId` | ID | false | Yes | No | Student performing this session (auth:user). |
| `schoolId` | ID | false | Yes | No | An ID value to represent the tenant id of the school |
* Required properties are mandatory for creating objects and must be provided in the request body if no default value, formula or session bind is set.



### Enum Properties
Enum properties are defined with a set of allowed values, ensuring that only valid options can be assigned to them. 
The enum options value will be stored as strings in the database, 
but when a data object is created an additional property with the same name plus an idx suffix will be created, which will hold the index of the selected enum option.
You can use the {fieldName_idx} property to sort by the enum value or when your enum options represent a hiyerarchy of values.
In the frontend input components, enum type properties should only accept values from an option component that lists the enum options.

- **scenarioType**: [conversation, interview, presentation, rolePlay, practice]


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

`assignmentId` `classroomId` `language` `scenarioType` `studentId` `schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **assignmentId**: ID  has a filter named `assignmentId`

- **classroomId**: ID  has a filter named `classroomId`

- **language**: String  has a filter named `language`

- **scenarioType**: Enum  has a filter named `scenarioType`

- **studentId**: ID  has a filter named `studentId`

- **schoolId**: ID  has a filter named `schoolId`



## Default CRUD APIs

For each data object, the backend architect may designate **default APIs** for standard operations (create, update, delete, get, list). These are the APIs that frontend CRUD forms and AI agents should use for basic record management. If no default is explicitly set (`isDefaultApi`), the frontend generator auto-discovers the most general API for each operation.

### SpeakingEvaluation Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `createSpeakingEvaluation` | `/v1/speakingevaluations` | Auto |
| Update | `updateSpeakingEvaluation` | `/v1/speakingevaluations/:speakingEvaluationId` | Auto |
| Delete | _none_ | - | Auto |
| Get | `getSpeakingEvaluation` | `/v1/speakingevaluations/:speakingEvaluationId` | Auto |
| List | `listSpeakingEvaluations` | `/v1/speakingevaluations` | System |
### SpeakingSession Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `createSpeakingSession` | `/v1/speakingsessions` | Auto |
| Update | `updateSpeakingSession` | `/v1/speakingsessions/:speakingSessionId` | Auto |
| Delete | `deleteSpeakingSession` | `/v1/speakingsessions/:speakingSessionId` | Auto |
| Get | `getSpeakingSession` | `/v1/speakingsessions/:speakingSessionId` | Auto |
| List | `listSpeakingSessions` | `/v1/speakingsessions` | System |

When building CRUD forms for a data object, use the default create/update APIs listed above. The form fields should correspond to the API's body parameters. For relation fields, render a dropdown loaded from the related object's list API using the display label property.


## API Reference

### `Create Speakingevaluation` API
Creates AI-driven evaluation/feedback for a completed speakingSession. Requires session ID, emits event. Only one evaluation per session (enforced by unique constraint).

**API Frontend Description By The Backend Architect**

After session/audio save, frontend (or orchestrator) calls to create evaluation and stores all AI feedback and scores. Once done, shows to user. Also triggers event for analytics and notification.

**Rest Route**

The `createSpeakingEvaluation` API REST controller can be triggered via the following route:

`/v1/speakingevaluations`


**Rest Request Parameters**


The `createSpeakingEvaluation` api has got 7 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| aiScore  | Integer  | true | request.body?.["aiScore"] |
| criteriaScores  | Object  | true | request.body?.["criteriaScores"] |
| feedbackAudioUrl  | String  | false | request.body?.["feedbackAudioUrl"] |
| feedbackText  | Text  | true | request.body?.["feedbackText"] |
| modelSentenceAudioUrl  | String  | false | request.body?.["modelSentenceAudioUrl"] |
| speakingSessionId  | ID  | true | request.body?.["speakingSessionId"] |
| suggestions  | String  | false | request.body?.["suggestions"] |
**aiScore** : Overall AI-generated speaking score (0-100) for session.
**criteriaScores** : AI scores per criteria: pronunciation, fluency, grammar, vocabulary, coherence. Object format: {pronunciation: int, fluency: int, ...}
**feedbackAudioUrl** : Audio file URL for spoken feedback (generated by TTS/AI voice, optional).
**feedbackText** : AI-generated feedback text (localized as needed frontend-side).
**modelSentenceAudioUrl** : Audio URL for model sentence (native-like pronunciation/example; optional).
**speakingSessionId** : Which session is being evaluated (1:1).
**suggestions** : Array of improvement suggestions or model sentences (AI-generated).


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/speakingevaluations**
```js
  axios({
    method: 'POST',
    url: '/v1/speakingevaluations',
    data: {
            aiScore:"Integer",  
            criteriaScores:"Object",  
            feedbackAudioUrl:"String",  
            feedbackText:"Text",  
            modelSentenceAudioUrl:"String",  
            speakingSessionId:"ID",  
            suggestions:"String",  
    
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
	"dataName": "speakingEvaluation",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"speakingEvaluation": {
		"id": "ID",
		"aiScore": "Integer",
		"criteriaScores": "Object",
		"feedbackAudioUrl": "String",
		"feedbackText": "Text",
		"modelSentenceAudioUrl": "String",
		"speakingSessionId": "ID",
		"suggestions": "String",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Create Speakingsession` API
Student initiates a real-time speaking session. May be linked to an assignment (for teacher/class), classroom, or open practice. Records scenario, session context, audio URL, time, and language. Returns created session.

**API Frontend Description By The Backend Architect**

Create a new speaking session. Frontend must upload audio (URL) after recording; language/scenario must be provided. For assignments, include assignmentId/classroomId. Returns session for evaluation submission.

**Rest Route**

The `createSpeakingSession` API REST controller can be triggered via the following route:

`/v1/speakingsessions`


**Rest Request Parameters**


The `createSpeakingSession` api has got 7 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| assignmentId  | ID  | false | request.body?.["assignmentId"] |
| classroomId  | ID  | false | request.body?.["classroomId"] |
| endedAt  | Date  | false | request.body?.["endedAt"] |
| language  | String  | true | request.body?.["language"] |
| scenarioType  | Enum  | true | request.body?.["scenarioType"] |
| sessionAudioUrl  | String  | true | request.body?.["sessionAudioUrl"] |
| startedAt  | Date  | true | request.body?.["startedAt"] |
**assignmentId** : Related assignment (from classAssignment:classAssignmentAssignment). Nullable for open practice.
**classroomId** : Classroom context (optional, for structured practice)
**endedAt** : Datetime when session ended (set on completion).
**language** : Language code for this session (e.g., en, tr, ar).
**scenarioType** : Context of speaking session (conversation/interview/presentation/etc.)
**sessionAudioUrl** : URL to recorded audio for full session (uploaded or generated).
**startedAt** : Datetime when session started.


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/speakingsessions**
```js
  axios({
    method: 'POST',
    url: '/v1/speakingsessions',
    data: {
            assignmentId:"ID",  
            classroomId:"ID",  
            endedAt:"Date",  
            language:"String",  
            scenarioType:"Enum",  
            sessionAudioUrl:"String",  
            startedAt:"Date",  
    
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
	"dataName": "speakingSession",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"speakingSession": {
		"id": "ID",
		"assignmentId": "ID",
		"classroomId": "ID",
		"endedAt": "Date",
		"language": "String",
		"scenarioType": "Enum",
		"scenarioType_idx": "Integer",
		"sessionAudioUrl": "String",
		"startedAt": "Date",
		"studentId": "ID",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Delete Speakingsession` API
Delete a speakingSession (soft-delete only). Only student/owner or admin can delete. Also cascades to delete evaluation.

**API Frontend Description By The Backend Architect**

Student or admin may remove their own speaking session; this also deletes any related evaluation entry. Used for privacy or error correction.

**Rest Route**

The `deleteSpeakingSession` API REST controller can be triggered via the following route:

`/v1/speakingsessions/:speakingSessionId`


**Rest Request Parameters**


The `deleteSpeakingSession` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| speakingSessionId  | ID  | true | request.params?.["speakingSessionId"] |
**speakingSessionId** : This id paremeter is used to select the required data object that will be deleted


**REST Request**
To access the api you can use the **REST** controller with the path **DELETE  /v1/speakingsessions/:speakingSessionId**
```js
  axios({
    method: 'DELETE',
    url: `/v1/speakingsessions/${speakingSessionId}`,
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
	"dataName": "speakingSession",
	"method": "DELETE",
	"action": "delete",
	"appVersion": "Version",
	"rowCount": 1,
	"speakingSession": {
		"id": "ID",
		"assignmentId": "ID",
		"classroomId": "ID",
		"endedAt": "Date",
		"language": "String",
		"scenarioType": "Enum",
		"scenarioType_idx": "Integer",
		"sessionAudioUrl": "String",
		"startedAt": "Date",
		"studentId": "ID",
		"schoolId": "ID",
		"isActive": false,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Get Speakingevaluation` API
Retrieve speaking evaluation for a session (by evaluation ID). Used for detail/report screens. Owner/student or teacher only.

**API Frontend Description By The Backend Architect**

Returns all AI/teacher feedback for a session (criteria, text, suggestions, audio). Used in detail/evaluation screens.

**Rest Route**

The `getSpeakingEvaluation` API REST controller can be triggered via the following route:

`/v1/speakingevaluations/:speakingEvaluationId`


**Rest Request Parameters**


The `getSpeakingEvaluation` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| speakingEvaluationId  | ID  | true | request.params?.["speakingEvaluationId"] |
**speakingEvaluationId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/speakingevaluations/:speakingEvaluationId**
```js
  axios({
    method: 'GET',
    url: `/v1/speakingevaluations/${speakingEvaluationId}`,
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
	"dataName": "speakingEvaluation",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"speakingEvaluation": {
		"id": "ID",
		"aiScore": "Integer",
		"criteriaScores": "Object",
		"feedbackAudioUrl": "String",
		"feedbackText": "Text",
		"modelSentenceAudioUrl": "String",
		"speakingSessionId": "ID",
		"suggestions": "String",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Get Speakingsession` API
Get a single speakingSession by ID, including evaluation if exists, plus assignment/classroom via selectJoins. Owner/student or teacher/admin only.

**API Frontend Description By The Backend Architect**

Used to view the details and results of a specific speaking session. If evaluation present, include in response (use selectJoin). Teachers see student/class context for dashboard/review.

**Rest Route**

The `getSpeakingSession` API REST controller can be triggered via the following route:

`/v1/speakingsessions/:speakingSessionId`


**Rest Request Parameters**


The `getSpeakingSession` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| speakingSessionId  | ID  | true | request.params?.["speakingSessionId"] |
**speakingSessionId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/speakingsessions/:speakingSessionId**
```js
  axios({
    method: 'GET',
    url: `/v1/speakingsessions/${speakingSessionId}`,
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
	"dataName": "speakingSession",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"speakingSession": {
		"id": "ID",
		"assignmentId": "ID",
		"classroomId": "ID",
		"endedAt": "Date",
		"language": "String",
		"scenarioType": "Enum",
		"scenarioType_idx": "Integer",
		"sessionAudioUrl": "String",
		"startedAt": "Date",
		"studentId": "ID",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID",
		"evaluation": [
			{
				"id": "ID",
				"aiScore": "Integer",
				"criteriaScores": "Object",
				"feedbackAudioUrl": "String",
				"feedbackText": "Text",
				"modelSentenceAudioUrl": "String",
				"speakingSessionId": "ID",
				"suggestions": "String",
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
		"assignment": {
			"dueDate": "Date",
			"skillType": "Enum",
			"skillType_idx": "Integer",
			"status": "Enum",
			"status_idx": "Integer"
		},
		"classroom": {
			"levelGroup": "String",
			"name": "String",
			"teacherId": "ID"
		}
	}
}
```
### `List Speakingevaluations` API
List all evaluations with flexible filters (by session, student via join, time, etc.). Used for analytics, dashboards, and teacher review.

**API Frontend Description By The Backend Architect**

Shows evaluation results for dashboard/analytics use. Includes key properties and filters. Teachers use to analyze class performance; students to review their feedback history.

**Rest Route**

The `listSpeakingEvaluations` API REST controller can be triggered via the following route:

`/v1/speakingevaluations`


**Rest Request Parameters**
The `listSpeakingEvaluations` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/speakingevaluations**
```js
  axios({
    method: 'GET',
    url: '/v1/speakingevaluations',
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
	"dataName": "speakingEvaluations",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"speakingEvaluations": [
		{
			"id": "ID",
			"aiScore": "Integer",
			"criteriaScores": "Object",
			"feedbackAudioUrl": "String",
			"feedbackText": "Text",
			"modelSentenceAudioUrl": "String",
			"speakingSessionId": "ID",
			"suggestions": "String",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"session_": [
				{
					"assignmentId": "ID",
					"classroomId": "ID",
					"scenarioType": "Enum",
					"scenarioType_idx": "Integer",
					"startedAt": "Date",
					"studentId": "ID"
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
### `List Speakingsessions` API
List speaking sessions with flexible filtering (by student, class, assignment, scenario, language, etc.). Results can join evaluation and assignment/classroom context for dashboards/analytics.

**API Frontend Description By The Backend Architect**

Lists sessions for dashboards and analytics (student, teacher, admin). Filtering and sorting by key fields; includes selectJoins for evaluation. Used in progress charts, teacher analytics, admin exports.

**Rest Route**

The `listSpeakingSessions` API REST controller can be triggered via the following route:

`/v1/speakingsessions`


**Rest Request Parameters**


**Filter Parameters**

The `listSpeakingSessions` api supports 5 optional filter parameters for filtering list results:

**assignmentId** (`ID`): Related assignment (from classAssignment:classAssignmentAssignment). Nullable for open practice.

- Single: `?assignmentId=<value>`
- Multiple: `?assignmentId=<value1>&assignmentId=<value2>`
- Null: `?assignmentId=null`


**classroomId** (`ID`): Classroom context (optional, for structured practice)

- Single: `?classroomId=<value>`
- Multiple: `?classroomId=<value1>&classroomId=<value2>`
- Null: `?classroomId=null`


**language** (`String`): Language code for this session (e.g., en, tr, ar).

- Single (partial match, case-insensitive): `?language=<value>`
- Multiple: `?language=<value1>&language=<value2>`
- Null: `?language=null`


**scenarioType** (`Enum`): Context of speaking session (conversation/interview/presentation/etc.)

- Single: `?scenarioType=<value>` (case-insensitive)
- Multiple: `?scenarioType=<value1>&scenarioType=<value2>`
- Null: `?scenarioType=null`


**studentId** (`ID`): Student performing this session (auth:user).

- Single: `?studentId=<value>`
- Multiple: `?studentId=<value1>&studentId=<value2>`
- Null: `?studentId=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/speakingsessions**
```js
  axios({
    method: 'GET',
    url: '/v1/speakingsessions',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // assignmentId: '<value>' // Filter by assignmentId
        // classroomId: '<value>' // Filter by classroomId
        // language: '<value>' // Filter by language
        // scenarioType: '<value>' // Filter by scenarioType
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
	"dataName": "speakingSessions",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"speakingSessions": [
		{
			"id": "ID",
			"assignmentId": "ID",
			"classroomId": "ID",
			"endedAt": "Date",
			"language": "String",
			"scenarioType": "Enum",
			"scenarioType_idx": "Integer",
			"sessionAudioUrl": "String",
			"startedAt": "Date",
			"studentId": "ID",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"evaluation": [
				{
					"id": "ID",
					"aiScore": "Integer",
					"criteriaScores": "Object",
					"feedbackAudioUrl": "String",
					"feedbackText": "Text",
					"modelSentenceAudioUrl": "String",
					"speakingSessionId": "ID",
					"suggestions": "String",
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
			"assignment": [
				{
					"dueDate": "Date",
					"skillType": "Enum",
					"skillType_idx": "Integer",
					"status": "Enum",
					"status_idx": "Integer"
				},
				{},
				{}
			],
			"classroom": [
				{
					"levelGroup": "String",
					"name": "String",
					"teacherId": "ID"
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
### `Update Speakingevaluation` API
(Admin/teacher only): Edit or supplement AI-provided speaking evaluation (feedback, suggestion corrections, etc.)

**API Frontend Description By The Backend Architect**

Allows teacher/admin to override or supplement the AI feedback after initial evaluation (for demo or advanced flows). Normally not used unless teacher review required.

**Rest Route**

The `updateSpeakingEvaluation` API REST controller can be triggered via the following route:

`/v1/speakingevaluations/:speakingEvaluationId`


**Rest Request Parameters**


The `updateSpeakingEvaluation` api has got 4 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| speakingEvaluationId  | ID  | true | request.params?.["speakingEvaluationId"] |
| feedbackAudioUrl  | String  | false | request.body?.["feedbackAudioUrl"] |
| modelSentenceAudioUrl  | String  | false | request.body?.["modelSentenceAudioUrl"] |
| suggestions  | String  | false | request.body?.["suggestions"] |
**speakingEvaluationId** : This id paremeter is used to select the required data object that will be updated
**feedbackAudioUrl** : Audio file URL for spoken feedback (generated by TTS/AI voice, optional).
**modelSentenceAudioUrl** : Audio URL for model sentence (native-like pronunciation/example; optional).
**suggestions** : Array of improvement suggestions or model sentences (AI-generated).


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/speakingevaluations/:speakingEvaluationId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/speakingevaluations/${speakingEvaluationId}`,
    data: {
            feedbackAudioUrl:"String",  
            modelSentenceAudioUrl:"String",  
            suggestions:"String",  
    
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
	"dataName": "speakingEvaluation",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"speakingEvaluation": {
		"id": "ID",
		"aiScore": "Integer",
		"criteriaScores": "Object",
		"feedbackAudioUrl": "String",
		"feedbackText": "Text",
		"modelSentenceAudioUrl": "String",
		"speakingSessionId": "ID",
		"suggestions": "String",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Update Speakingsession` API
Update (typically close) a speakingSession (set endedAt, change sessionAudioUrl if allowed, update scenario if needed). Only creator/owner, or admin/teacher of same classroom may update.

**API Frontend Description By The Backend Architect**

Used to mark a session as completed and update final details (endedAt, audio if re-uploaded). Used from student interface or, if allowed, by admin/teacher for administrative actions.

**Rest Route**

The `updateSpeakingSession` API REST controller can be triggered via the following route:

`/v1/speakingsessions/:speakingSessionId`


**Rest Request Parameters**


The `updateSpeakingSession` api has got 6 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| speakingSessionId  | ID  | true | request.params?.["speakingSessionId"] |
| assignmentId  | ID  | false | request.body?.["assignmentId"] |
| classroomId  | ID  | false | request.body?.["classroomId"] |
| endedAt  | Date  | false | request.body?.["endedAt"] |
| scenarioType  | Enum  | false | request.body?.["scenarioType"] |
| sessionAudioUrl  | String  | false | request.body?.["sessionAudioUrl"] |
**speakingSessionId** : This id paremeter is used to select the required data object that will be updated
**assignmentId** : Related assignment (from classAssignment:classAssignmentAssignment). Nullable for open practice.
**classroomId** : Classroom context (optional, for structured practice)
**endedAt** : Datetime when session ended (set on completion).
**scenarioType** : Context of speaking session (conversation/interview/presentation/etc.)
**sessionAudioUrl** : URL to recorded audio for full session (uploaded or generated).


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/speakingsessions/:speakingSessionId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/speakingsessions/${speakingSessionId}`,
    data: {
            assignmentId:"ID",  
            classroomId:"ID",  
            endedAt:"Date",  
            scenarioType:"Enum",  
            sessionAudioUrl:"String",  
    
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
	"dataName": "speakingSession",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"speakingSession": {
		"id": "ID",
		"assignmentId": "ID",
		"classroomId": "ID",
		"endedAt": "Date",
		"language": "String",
		"scenarioType": "Enum",
		"scenarioType_idx": "Integer",
		"sessionAudioUrl": "String",
		"startedAt": "Date",
		"studentId": "ID",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `_fetch Listspeakingevaluation` API
System API to fetch list of speakingEvaluation records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListSpeakingEvaluation` API REST controller can be triggered via the following route:

`/v1/_fetchlistspeakingevaluation`


**Rest Request Parameters**
The `_fetchListSpeakingEvaluation` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistspeakingevaluation**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistspeakingevaluation',
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
	"dataName": "speakingEvaluations",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"speakingEvaluations": [
		{
			"id": "ID",
			"aiScore": "Integer",
			"criteriaScores": "Object",
			"feedbackAudioUrl": "String",
			"feedbackText": "Text",
			"modelSentenceAudioUrl": "String",
			"speakingSessionId": "ID",
			"suggestions": "String",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"speakingSession": [
				{
					"assignmentId": "ID",
					"classroomId": "ID",
					"endedAt": "Date",
					"language": "String",
					"scenarioType": "Enum",
					"scenarioType_idx": "Integer",
					"sessionAudioUrl": "String",
					"startedAt": "Date",
					"studentId": "ID"
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
### `_fetch Listspeakingsession` API
System API to fetch list of speakingSession records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListSpeakingSession` API REST controller can be triggered via the following route:

`/v1/_fetchlistspeakingsession`


**Rest Request Parameters**


**Filter Parameters**

The `_fetchListSpeakingSession` api supports 5 optional filter parameters for filtering list results:

**assignmentId** (`ID`): Related assignment (from classAssignment:classAssignmentAssignment). Nullable for open practice.

- Single: `?assignmentId=<value>`
- Multiple: `?assignmentId=<value1>&assignmentId=<value2>`
- Null: `?assignmentId=null`


**classroomId** (`ID`): Classroom context (optional, for structured practice)

- Single: `?classroomId=<value>`
- Multiple: `?classroomId=<value1>&classroomId=<value2>`
- Null: `?classroomId=null`


**language** (`String`): Language code for this session (e.g., en, tr, ar).

- Single (partial match, case-insensitive): `?language=<value>`
- Multiple: `?language=<value1>&language=<value2>`
- Null: `?language=null`


**scenarioType** (`Enum`): Context of speaking session (conversation/interview/presentation/etc.)

- Single: `?scenarioType=<value>` (case-insensitive)
- Multiple: `?scenarioType=<value1>&scenarioType=<value2>`
- Null: `?scenarioType=null`


**studentId** (`ID`): Student performing this session (auth:user).

- Single: `?studentId=<value>`
- Multiple: `?studentId=<value1>&studentId=<value2>`
- Null: `?studentId=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistspeakingsession**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistspeakingsession',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // assignmentId: '<value>' // Filter by assignmentId
        // classroomId: '<value>' // Filter by classroomId
        // language: '<value>' // Filter by language
        // scenarioType: '<value>' // Filter by scenarioType
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
	"dataName": "speakingSessions",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"speakingSessions": [
		{
			"id": "ID",
			"assignmentId": "ID",
			"classroomId": "ID",
			"endedAt": "Date",
			"language": "String",
			"scenarioType": "Enum",
			"scenarioType_idx": "Integer",
			"sessionAudioUrl": "String",
			"startedAt": "Date",
			"studentId": "ID",
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

**After this prompt, the user may give you new instructions to update the output of this prompt or provide subsequent prompts about the project.**



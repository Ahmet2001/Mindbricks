

# **SOLVIO**

**FRONTEND GUIDE FOR AI CODING AGENTS - PART 11 - ReadingLab Service**

This document is a part of a REST API guide for the solvio project.
It is designed for AI agents that will generate frontend code to consume the project’s backend.

This document provides extensive instruction for the usage of readingLab

## Service Access

ReadingLab service management is handled through service specific base urls.

ReadingLab  service may be deployed to the preview server, staging server, or production server. Therefore,it has 3 access URLs.
The frontend application must support all deployment environments during development, and the user should be able to select the target API server on the login page (already handled in first part.).

For the readingLab service, the base URLs are:

* **Preview:** `https://solvio.prw.mindbricks.com/readinglab-api`
* **Staging:** `https://solvio-stage.mindbricks.co/readinglab-api`
* **Production:** `https://solvio.mindbricks.co/readinglab-api`

### Tenant URL Prefix and Header Forwarding

Tenant context is resolved by frontend routing strategy:
- preview/test: URL prefix `/{tenantCodename}` (example: `/babil/products`)
- production: tenant subdomain (example: `babil.appname...`)

Then backend API calls must always claim target tenant with header:

```js
headers["mbx-school-codename"] = tenantCodenameFromUrl;
```

URL prefix/subdomain is frontend-only tenant selection. Use header forwarding for all tenant-scoped calls to `readingLab` service.

## Scope

**ReadingLab Service Description**

Provides access to a CEFR-leveled reading passage library, enables AI-based custom reading text generation, manages reading assignments and open-ended answers, and stores scoring/feedback for each user. Integrates with classroom, assignment, and multi-tenant structures.

ReadingLab service provides apis and business logic for following data objects in solvio application. 
Each data object may be either a central domain of the application data structure or a related helper data object for a central concept.
Note that data object concept is equal to table concept in the database, in the service database each data object is represented as a db table scheme and the object instances as table rows.  


**`readingAnswer` Data Object**: A student&#39;s open-ended answer to a readingAssignment; includes manually or AI-generated scoring and feedback for meaning/coherence.

**`readingAssignment` Data Object**: Assigned or practice reading for a student. Links passage, context, and student details for assignment/progress tracking.

**`readingPassage` Data Object**: A reading passage (either curated library or AI-generated), categorized by CEFR level, topic, and language. May be assigned to students/classes for reading tasks.


## ReadingLab Service Frontend Description By The Backend Architect

- Reading tab displays: Library (browsable/filtered by CEFR level), My Assignments (pending, completed), and AI Custom Reading.
- When student opens a passage (assignment or library), UI shows content, topic, CEFR level, and instructions.
- If open-ended question is enabled, UX presents input box for student answer; upon submit, shows AI-generated score and detailed feedback.
- Teacher dashboard: assigns passages (library or AI-generated) to students/classes, then tracks submissions, scores, and feedback in analytics.
- Progress dashboards aggregate scores/feedback for teacher/student self-monitoring. All operations are tenant (school) scoped.
- Admin tools support passage import and review.


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


## ReadingAnswer Data Object

A student&#39;s open-ended answer to a readingAssignment; includes manually or AI-generated scoring and feedback for meaning/coherence.

### ReadingAnswer  Data Object Frontend Description By The Backend Architect

- Student submits open-ended answer for a reading assignment or practice; receives AI-generated score (0-10), detailed feedback.
- Teacher dashboard accesses all class/student answers/feedback for analytics/review.
- Used for tracking progress, analytics, and personalizing recommendations.



### ReadingAnswer Data Object Properties

ReadingAnswer data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `aiScore` | Integer | false | Yes | No | AI-determined score for answer (0–10). |
| `answerText` | Text | false | Yes | No | Student's open-ended response to the reading question/task. |
| `evaluatedAt` | Date | false | Yes | No | When scoring/feedback was completed (AI or admin). |
| `feedbackText` | Text | false | No | No | Detailed feedback and suggestions (AI-generated, multi-lingual). |
| `readingAssignmentId` | ID | false | Yes | No | Assignment for which this answer is submitted. One answer per assignment. |
| `schoolId` | ID | false | Yes | No | An ID value to represent the tenant id of the school |
* Required properties are mandatory for creating objects and must be provided in the request body if no default value, formula or session bind is set.




### Relation Properties

`readingAssignmentId`

Mindbricks supports relations between data objects, allowing you to define how objects are linked together.
The relations may reference to a data object either in this service or in another service. Id the reference is remote, backend handles the relations through service communication or elastic search.
These relations should be respected in the frontend so that instaead of showing the related objects id, the frontend should list human readable values from other data objects.
If the relation points to another service, frontend should use the referenced service api in case it needs related data.
The relation logic is montly handled in backend so the api responses feeds the frontend about the relational data. 
In mmost cases the api response will provide the relational data as well as the main one.

In frontend, please ensure that, 

1- instaead of these relational ids you show the main human readable field of the related target data (like name),
2- if this data object needs a user input of these relational ids, you should provide a combobox with the list of possible records or (a searchbox) to select with the realted target data object main human readable field.


- **readingAssignmentId**: ID
Relation to `readingAssignment`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: Yes


### Filter Properties

`readingAssignmentId` `schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **readingAssignmentId**: ID  has a filter named `assignment`

- **schoolId**: ID  has a filter named `schoolId`


## ReadingAssignment Data Object

Assigned or practice reading for a student. Links passage, context, and student details for assignment/progress tracking.

### ReadingAssignment  Data Object Frontend Description By The Backend Architect

- Used to present a reading (from library or aiGenerated) as an explicit task for a student—either as a class/group/teacher assignment or for self-study.
- Used to drive assignment notifications, deadline management, and analytics.



### ReadingAssignment Data Object Properties

ReadingAssignment data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `assignmentId` | ID | false | No | No | Assignment in classAssignment (optional for independent/practice). |
| `classroomId` | ID | false | No | No | Reference to class (if relevant); null for individual/self-study. |
| `readingPassageId` | ID | false | Yes | No | Linked passage for assigned/practice reading. |
| `startAt` | Date | false | Yes | No | When this reading assignment/task started or became visible to student. |
| `studentId` | ID | false | Yes | No | Student assigned this reading. |
| `schoolId` | ID | false | Yes | No | An ID value to represent the tenant id of the school |
* Required properties are mandatory for creating objects and must be provided in the request body if no default value, formula or session bind is set.




### Relation Properties

`assignmentId` `classroomId` `readingPassageId` `studentId`

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

- **readingPassageId**: ID
Relation to `readingPassage`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: Yes

- **studentId**: ID
Relation to `user`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: Yes


### Filter Properties

`readingPassageId` `studentId` `schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **readingPassageId**: ID  has a filter named `passage`

- **studentId**: ID  has a filter named `student`

- **schoolId**: ID  has a filter named `schoolId`


## ReadingPassage Data Object

A reading passage (either curated library or AI-generated), categorized by CEFR level, topic, and language. May be assigned to students/classes for reading tasks.

### ReadingPassage  Data Object Frontend Description By The Backend Architect

- Used for both the core passage library and custom AI-generated readings.
- Teachers and students can fetch by filters (topic, level, source, language).
- Passages may be assigned to classes or be available for practice.
- Content field delivers plain text for display; can support markdown or embedded highlights for frontend dictionary features.



### ReadingPassage Data Object Properties

ReadingPassage data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `cefrLevel` | String | false | Yes | No | CEFR proficiency level (A1–C2, e.g. A2, B1+) for which this passage is intended. |
| `content` | Text | false | Yes | No | Full reading text for display and analysis. |
| `createdById` | ID | false | No | No | User ID of creator (teacher or auto/AI) if applicable. Nullable for fixed library passages. |
| `language` | String | false | Yes | No | Language code for passage content (e.g. en, tr, ar). |
| `sourceType` | Enum | false | Yes | No | Passage source: fixed library or AI-generated on demand. |
| `topic` | String | false | Yes | No | Topic or theme of passage (e.g. Travel, Technology, etc). |
| `schoolId` | ID | false | Yes | No | An ID value to represent the tenant id of the school |
* Required properties are mandatory for creating objects and must be provided in the request body if no default value, formula or session bind is set.



### Enum Properties
Enum properties are defined with a set of allowed values, ensuring that only valid options can be assigned to them. 
The enum options value will be stored as strings in the database, 
but when a data object is created an additional property with the same name plus an idx suffix will be created, which will hold the index of the selected enum option.
You can use the {fieldName_idx} property to sort by the enum value or when your enum options represent a hiyerarchy of values.
In the frontend input components, enum type properties should only accept values from an option component that lists the enum options.

- **sourceType**: [library, aiGenerated]


### Relation Properties

`createdById`

Mindbricks supports relations between data objects, allowing you to define how objects are linked together.
The relations may reference to a data object either in this service or in another service. Id the reference is remote, backend handles the relations through service communication or elastic search.
These relations should be respected in the frontend so that instaead of showing the related objects id, the frontend should list human readable values from other data objects.
If the relation points to another service, frontend should use the referenced service api in case it needs related data.
The relation logic is montly handled in backend so the api responses feeds the frontend about the relational data. 
In mmost cases the api response will provide the relational data as well as the main one.

In frontend, please ensure that, 

1- instaead of these relational ids you show the main human readable field of the related target data (like name),
2- if this data object needs a user input of these relational ids, you should provide a combobox with the list of possible records or (a searchbox) to select with the realted target data object main human readable field.


- **createdById**: ID
Relation to `user`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: No


### Filter Properties

`cefrLevel` `language` `sourceType` `topic` `schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **cefrLevel**: String  has a filter named `cefr`

- **language**: String  has a filter named `lang`

- **sourceType**: Enum  has a filter named `source`

- **topic**: String  has a filter named `topic`

- **schoolId**: ID  has a filter named `schoolId`



## Default CRUD APIs

For each data object, the backend architect may designate **default APIs** for standard operations (create, update, delete, get, list). These are the APIs that frontend CRUD forms and AI agents should use for basic record management. If no default is explicitly set (`isDefaultApi`), the frontend generator auto-discovers the most general API for each operation.

### ReadingAnswer Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `createReadingAnswer` | `/v1/readinganswers` | Auto |
| Update | `updateReadingAnswer` | `/v1/readinganswers/:readingAnswerId` | Auto |
| Delete | `deleteReadingAnswer` | `/v1/readinganswers/:readingAnswerId` | Auto |
| Get | `getReadingAnswer` | `/v1/readinganswers/:readingAnswerId` | Auto |
| List | `listReadingAnswers` | `/v1/readinganswers` | System |
### ReadingAssignment Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `createReadingAssignment` | `/v1/readingassignments` | Auto |
| Update | `updateReadingAssignment` | `/v1/readingassignments/:readingAssignmentId` | Auto |
| Delete | `deleteReadingAssignment` | `/v1/readingassignments/:readingAssignmentId` | Auto |
| Get | `getReadingAssignment` | `/v1/readingassignments/:readingAssignmentId` | Auto |
| List | `listReadingAssignments` | `/v1/readingassignments` | System |
### ReadingPassage Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `createReadingPassage` | `/v1/readingpassages` | Auto |
| Update | `updateReadingPassage` | `/v1/readingpassages/:readingPassageId` | Auto |
| Delete | `deleteReadingPassage` | `/v1/readingpassages/:readingPassageId` | Auto |
| Get | `getReadingPassage` | `/v1/readingpassages/:readingPassageId` | Auto |
| List | `listReadingPassages` | `/v1/readingpassages` | System |

When building CRUD forms for a data object, use the default create/update APIs listed above. The form fields should correspond to the API's body parameters. For relation fields, render a dropdown loaded from the related object's list API using the display label property.


## API Reference

### `Create Readinganswer` API
Student submits answer for reading assignment. AI scoring and feedback should be written to aiScore/feedbackText fields as available.

**API Frontend Description By The Backend Architect**

- Student enters open-ended answer for assigned passage; immediate feedback and score (via aiScore, feedbackText) shown upon submit. Used to drive dashboard analytics for both student and class progress. Only one answer per assignment allowed.


**Rest Route**

The `createReadingAnswer` API REST controller can be triggered via the following route:

`/v1/readinganswers`


**Rest Request Parameters**


The `createReadingAnswer` api has got 5 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| aiScore  | Integer  | true | request.body?.["aiScore"] |
| answerText  | Text  | true | request.body?.["answerText"] |
| evaluatedAt  | Date  | true | request.body?.["evaluatedAt"] |
| feedbackText  | Text  | false | request.body?.["feedbackText"] |
| readingAssignmentId  | ID  | true | request.body?.["readingAssignmentId"] |
**aiScore** : AI-determined score for answer (0–10).
**answerText** : Student's open-ended response to the reading question/task.
**evaluatedAt** : When scoring/feedback was completed (AI or admin).
**feedbackText** : Detailed feedback and suggestions (AI-generated, multi-lingual).
**readingAssignmentId** : Assignment for which this answer is submitted. One answer per assignment.


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/readinganswers**
```js
  axios({
    method: 'POST',
    url: '/v1/readinganswers',
    data: {
            aiScore:"Integer",  
            answerText:"Text",  
            evaluatedAt:"Date",  
            feedbackText:"Text",  
            readingAssignmentId:"ID",  
    
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
	"dataName": "readingAnswer",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"readingAnswer": {
		"id": "ID",
		"aiScore": "Integer",
		"answerText": "Text",
		"evaluatedAt": "Date",
		"feedbackText": "Text",
		"readingAssignmentId": "ID",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Create Readingassignment` API
Create a reading assignment for student/class; can be teacher-assigned, class, or individual/self-study.

**API Frontend Description By The Backend Architect**

- Teacher assigns passage to class/student (with assignmentId from classAssignment if done via dashboard).
- Used to drive notification and dashboard triggers.

**Rest Route**

The `createReadingAssignment` API REST controller can be triggered via the following route:

`/v1/readingassignments`


**Rest Request Parameters**


The `createReadingAssignment` api has got 5 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| assignmentId  | ID  | false | request.body?.["assignmentId"] |
| classroomId  | ID  | false | request.body?.["classroomId"] |
| readingPassageId  | ID  | true | request.body?.["readingPassageId"] |
| startAt  | Date  | true | request.body?.["startAt"] |
| studentId  | ID  | true | request.body?.["studentId"] |
**assignmentId** : Assignment in classAssignment (optional for independent/practice).
**classroomId** : Reference to class (if relevant); null for individual/self-study.
**readingPassageId** : Linked passage for assigned/practice reading.
**startAt** : When this reading assignment/task started or became visible to student.
**studentId** : Student assigned this reading.


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/readingassignments**
```js
  axios({
    method: 'POST',
    url: '/v1/readingassignments',
    data: {
            assignmentId:"ID",  
            classroomId:"ID",  
            readingPassageId:"ID",  
            startAt:"Date",  
            studentId:"ID",  
    
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
	"dataName": "readingAssignment",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"readingAssignment": {
		"id": "ID",
		"assignmentId": "ID",
		"classroomId": "ID",
		"readingPassageId": "ID",
		"startAt": "Date",
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
### `Create Readingpassage` API
Create a new reading passage (library or AI-generated). Used by teachers/admins for library expansion or by students/AI for practice.

**API Frontend Description By The Backend Architect**

- Create screen lets teacher/admin add to library or allows user to request custom AI-generated passage for their level/topic/interests.
- On submit, passage saved and returned for assignment or immediate reading.

**Rest Route**

The `createReadingPassage` API REST controller can be triggered via the following route:

`/v1/readingpassages`


**Rest Request Parameters**


The `createReadingPassage` api has got 6 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| cefrLevel  | String  | true | request.body?.["cefrLevel"] |
| content  | Text  | true | request.body?.["content"] |
| createdById  | ID  | false | request.body?.["createdById"] |
| language  | String  | true | request.body?.["language"] |
| sourceType  | Enum  | true | request.body?.["sourceType"] |
| topic  | String  | true | request.body?.["topic"] |
**cefrLevel** : CEFR proficiency level (A1–C2, e.g. A2, B1+) for which this passage is intended.
**content** : Full reading text for display and analysis.
**createdById** : User ID of creator (teacher or auto/AI) if applicable. Nullable for fixed library passages.
**language** : Language code for passage content (e.g. en, tr, ar).
**sourceType** : Passage source: fixed library or AI-generated on demand.
**topic** : Topic or theme of passage (e.g. Travel, Technology, etc).


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/readingpassages**
```js
  axios({
    method: 'POST',
    url: '/v1/readingpassages',
    data: {
            cefrLevel:"String",  
            content:"Text",  
            createdById:"ID",  
            language:"String",  
            sourceType:"Enum",  
            topic:"String",  
    
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
	"dataName": "readingPassage",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"readingPassage": {
		"id": "ID",
		"cefrLevel": "String",
		"content": "Text",
		"createdById": "ID",
		"language": "String",
		"sourceType": "Enum",
		"sourceType_idx": "Integer",
		"topic": "String",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Delete Readinganswer` API
Delete an answer and its associated scoring/feedback; for admin/teacher error correction only.

**API Frontend Description By The Backend Architect**

- Used to support rare admin interventions or student request to clear/correct a mistakenly stored answer/feedback.

**Rest Route**

The `deleteReadingAnswer` API REST controller can be triggered via the following route:

`/v1/readinganswers/:readingAnswerId`


**Rest Request Parameters**


The `deleteReadingAnswer` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| readingAnswerId  | ID  | true | request.params?.["readingAnswerId"] |
**readingAnswerId** : This id paremeter is used to select the required data object that will be deleted


**REST Request**
To access the api you can use the **REST** controller with the path **DELETE  /v1/readinganswers/:readingAnswerId**
```js
  axios({
    method: 'DELETE',
    url: `/v1/readinganswers/${readingAnswerId}`,
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
	"dataName": "readingAnswer",
	"method": "DELETE",
	"action": "delete",
	"appVersion": "Version",
	"rowCount": 1,
	"readingAnswer": {
		"id": "ID",
		"aiScore": "Integer",
		"answerText": "Text",
		"evaluatedAt": "Date",
		"feedbackText": "Text",
		"readingAssignmentId": "ID",
		"schoolId": "ID",
		"isActive": false,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Delete Readingassignment` API
Deletes a reading assignment (eg. admin/teacher error correction, class change).

**API Frontend Description By The Backend Architect**

- Removes record for assignment administration. Student self-study cannot delete admin-assigned records.

**Rest Route**

The `deleteReadingAssignment` API REST controller can be triggered via the following route:

`/v1/readingassignments/:readingAssignmentId`


**Rest Request Parameters**


The `deleteReadingAssignment` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| readingAssignmentId  | ID  | true | request.params?.["readingAssignmentId"] |
**readingAssignmentId** : This id paremeter is used to select the required data object that will be deleted


**REST Request**
To access the api you can use the **REST** controller with the path **DELETE  /v1/readingassignments/:readingAssignmentId**
```js
  axios({
    method: 'DELETE',
    url: `/v1/readingassignments/${readingAssignmentId}`,
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
	"dataName": "readingAssignment",
	"method": "DELETE",
	"action": "delete",
	"appVersion": "Version",
	"rowCount": 1,
	"readingAssignment": {
		"id": "ID",
		"assignmentId": "ID",
		"classroomId": "ID",
		"readingPassageId": "ID",
		"startAt": "Date",
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
### `Delete Readingpassage` API
Deletes a reading passage. Only allowed for admins. Cascades to remove assignments/answers for this passage.

**API Frontend Description By The Backend Architect**

- Admin/teacher can remove passages by request.
- Deleted passages not listed/shown to students.

**Rest Route**

The `deleteReadingPassage` API REST controller can be triggered via the following route:

`/v1/readingpassages/:readingPassageId`


**Rest Request Parameters**


The `deleteReadingPassage` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| readingPassageId  | ID  | true | request.params?.["readingPassageId"] |
**readingPassageId** : This id paremeter is used to select the required data object that will be deleted


**REST Request**
To access the api you can use the **REST** controller with the path **DELETE  /v1/readingpassages/:readingPassageId**
```js
  axios({
    method: 'DELETE',
    url: `/v1/readingpassages/${readingPassageId}`,
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
	"dataName": "readingPassage",
	"method": "DELETE",
	"action": "delete",
	"appVersion": "Version",
	"rowCount": 1,
	"readingPassage": {
		"id": "ID",
		"cefrLevel": "String",
		"content": "Text",
		"createdById": "ID",
		"language": "String",
		"sourceType": "Enum",
		"sourceType_idx": "Integer",
		"topic": "String",
		"schoolId": "ID",
		"isActive": false,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Get Readinganswer` API
Get answer details for reading assignment, with join to assignment/passage/student context as needed.

**API Frontend Description By The Backend Architect**

- Used to present student with their score/feedback; teacher views for analytic/audit screens. Includes assignment and passage details if requested.


**Rest Route**

The `getReadingAnswer` API REST controller can be triggered via the following route:

`/v1/readinganswers/:readingAnswerId`


**Rest Request Parameters**


The `getReadingAnswer` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| readingAnswerId  | ID  | true | request.params?.["readingAnswerId"] |
**readingAnswerId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/readinganswers/:readingAnswerId**
```js
  axios({
    method: 'GET',
    url: `/v1/readinganswers/${readingAnswerId}`,
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
	"dataName": "readingAnswer",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"readingAnswer": {
		"id": "ID",
		"aiScore": "Integer",
		"answerText": "Text",
		"evaluatedAt": "Date",
		"feedbackText": "Text",
		"readingAssignmentId": "ID",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID",
		"readingAssignment": {
			"classroomId": "ID",
			"readingPassageId": "ID",
			"startAt": "Date",
			"studentId": "ID"
		}
	}
}
```
### `Get Readingassignment` API
Get a reading assignment detail for a student/class with passage context (via join).

**API Frontend Description By The Backend Architect**

- Used to render the student view; passage (text, level) and assignment/class info shown.
- Teacher view presents roster / dashboard context.


**Rest Route**

The `getReadingAssignment` API REST controller can be triggered via the following route:

`/v1/readingassignments/:readingAssignmentId`


**Rest Request Parameters**


The `getReadingAssignment` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| readingAssignmentId  | ID  | true | request.params?.["readingAssignmentId"] |
**readingAssignmentId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/readingassignments/:readingAssignmentId**
```js
  axios({
    method: 'GET',
    url: `/v1/readingassignments/${readingAssignmentId}`,
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
	"dataName": "readingAssignment",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"readingAssignment": {
		"id": "ID",
		"assignmentId": "ID",
		"classroomId": "ID",
		"readingPassageId": "ID",
		"startAt": "Date",
		"studentId": "ID",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID",
		"readingPassage": {
			"cefrLevel": "String",
			"content": "Text",
			"language": "String",
			"sourceType": "Enum",
			"sourceType_idx": "Integer",
			"topic": "String"
		},
		"student": {
			"email": "String",
			"fullname": "String",
			"avatar": "String"
		},
		"classroom": {
			"levelGroup": "String",
			"name": "String"
		}
	}
}
```
### `Get Readingpassage` API
Get a passage with all fields and creator info (if any). Joins to enrich with creator name/class/etc.

**API Frontend Description By The Backend Architect**

- Used to display passage in detail (reading screen, assignment, teacher review).
- Frontend can request with or without creator context (for library credits).


**Rest Route**

The `getReadingPassage` API REST controller can be triggered via the following route:

`/v1/readingpassages/:readingPassageId`


**Rest Request Parameters**


The `getReadingPassage` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| readingPassageId  | ID  | true | request.params?.["readingPassageId"] |
**readingPassageId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/readingpassages/:readingPassageId**
```js
  axios({
    method: 'GET',
    url: `/v1/readingpassages/${readingPassageId}`,
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
	"dataName": "readingPassage",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"readingPassage": {
		"id": "ID",
		"cefrLevel": "String",
		"content": "Text",
		"createdById": "ID",
		"language": "String",
		"sourceType": "Enum",
		"sourceType_idx": "Integer",
		"topic": "String",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID",
		"createdBy": {
			"email": "String",
			"fullname": "String",
			"avatar": "String"
		}
	}
}
```
### `List Readinganswers` API
List all answers for a passage/student/class/assignment (for analytics, dashboard).

**API Frontend Description By The Backend Architect**

- Teacher: See all submissions by class/student; supports filter by passage/assignment/class.
- Student: View own answer/feedback history; filter/search available.
- Results join assignment context for display.


**Rest Route**

The `listReadingAnswers` API REST controller can be triggered via the following route:

`/v1/readinganswers`


**Rest Request Parameters**


**Filter Parameters**

The `listReadingAnswers` api supports 1 optional filter parameter for filtering list results:

**assignment** (`ID`): Assignment for which this answer is submitted. One answer per assignment.

- Single: `?assignment=<value>`
- Multiple: `?assignment=<value1>&assignment=<value2>`
- Null: `?assignment=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/readinganswers**
```js
  axios({
    method: 'GET',
    url: '/v1/readinganswers',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // assignment: '<value>' // Filter by assignment
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
	"dataName": "readingAnswers",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"readingAnswers": [
		{
			"id": "ID",
			"aiScore": "Integer",
			"answerText": "Text",
			"evaluatedAt": "Date",
			"feedbackText": "Text",
			"readingAssignmentId": "ID",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"readingAssignment": [
				{
					"classroomId": "ID",
					"readingPassageId": "ID",
					"startAt": "Date",
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
### `List Readingassignments` API
List reading assignments for a student/class, or all in tenant; joins to passage context.

**API Frontend Description By The Backend Architect**

- Student: see pending/complete readings. Teacher: view class roster progress/analytics; supports filter by class, passage, etc.
- Dashboard presents passage/class/roster info together for progress tracking.


**Rest Route**

The `listReadingAssignments` API REST controller can be triggered via the following route:

`/v1/readingassignments`


**Rest Request Parameters**


**Filter Parameters**

The `listReadingAssignments` api supports 2 optional filter parameters for filtering list results:

**passage** (`ID`): Linked passage for assigned/practice reading.

- Single: `?passage=<value>`
- Multiple: `?passage=<value1>&passage=<value2>`
- Null: `?passage=null`


**student** (`ID`): Student assigned this reading.

- Single: `?student=<value>`
- Multiple: `?student=<value1>&student=<value2>`
- Null: `?student=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/readingassignments**
```js
  axios({
    method: 'GET',
    url: '/v1/readingassignments',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // passage: '<value>' // Filter by passage
        // student: '<value>' // Filter by student
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
	"dataName": "readingAssignments",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"readingAssignments": [
		{
			"id": "ID",
			"assignmentId": "ID",
			"classroomId": "ID",
			"readingPassageId": "ID",
			"startAt": "Date",
			"studentId": "ID",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"readingPassage": [
				{
					"cefrLevel": "String",
					"language": "String",
					"sourceType": "Enum",
					"sourceType_idx": "Integer",
					"topic": "String"
				},
				{},
				{}
			],
			"student": [
				{
					"email": "String",
					"fullname": "String",
					"avatar": "String"
				},
				{},
				{}
			],
			"classroom": [
				{
					"levelGroup": "String",
					"name": "String"
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
### `List Readingpassages` API
List passages, filterable by CEFR level, topic, language, or sourceType. For dashboard/library selection.

**API Frontend Description By The Backend Architect**

- Browsing/assignment/AI custom choose screens all use this list, with filters for level, topic, source, etc.

**Rest Route**

The `listReadingPassages` API REST controller can be triggered via the following route:

`/v1/readingpassages`


**Rest Request Parameters**


**Filter Parameters**

The `listReadingPassages` api supports 4 optional filter parameters for filtering list results:

**cefr** (`String`): CEFR proficiency level (A1–C2, e.g. A2, B1+) for which this passage is intended.

- Single (partial match, case-insensitive): `?cefr=<value>`
- Multiple: `?cefr=<value1>&cefr=<value2>`
- Null: `?cefr=null`


**lang** (`String`): Language code for passage content (e.g. en, tr, ar).

- Single (partial match, case-insensitive): `?lang=<value>`
- Multiple: `?lang=<value1>&lang=<value2>`
- Null: `?lang=null`


**source** (`Enum`): Passage source: fixed library or AI-generated on demand.

- Single: `?source=<value>` (case-insensitive)
- Multiple: `?source=<value1>&source=<value2>`
- Null: `?source=null`


**topic** (`String`): Topic or theme of passage (e.g. Travel, Technology, etc).

- Single (partial match, case-insensitive): `?topic=<value>`
- Multiple: `?topic=<value1>&topic=<value2>`
- Null: `?topic=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/readingpassages**
```js
  axios({
    method: 'GET',
    url: '/v1/readingpassages',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // cefr: '<value>' // Filter by cefr
        // lang: '<value>' // Filter by lang
        // source: '<value>' // Filter by source
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
	"dataName": "readingPassages",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"readingPassages": [
		{
			"id": "ID",
			"cefrLevel": "String",
			"content": "Text",
			"createdById": "ID",
			"language": "String",
			"sourceType": "Enum",
			"sourceType_idx": "Integer",
			"topic": "String",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"createdBy": [
				{
					"email": "String",
					"fullname": "String",
					"avatar": "String"
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
### `Update Readinganswer` API
Update (edit/correct) answer, or admin/AI to update feedback/aiScore after submission if needed.

**API Frontend Description By The Backend Architect**

- Rare in practice: Student/admin correct a submitted answer or feedback. AI rescoring/re-feedback if appropriate. Used for audits/corrections only.

**Rest Route**

The `updateReadingAnswer` API REST controller can be triggered via the following route:

`/v1/readinganswers/:readingAnswerId`


**Rest Request Parameters**


The `updateReadingAnswer` api has got 2 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| readingAnswerId  | ID  | true | request.params?.["readingAnswerId"] |
| feedbackText  | Text  | false | request.body?.["feedbackText"] |
**readingAnswerId** : This id paremeter is used to select the required data object that will be updated
**feedbackText** : Detailed feedback and suggestions (AI-generated, multi-lingual).


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/readinganswers/:readingAnswerId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/readinganswers/${readingAnswerId}`,
    data: {
            feedbackText:"Text",  
    
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
	"dataName": "readingAnswer",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"readingAnswer": {
		"id": "ID",
		"aiScore": "Integer",
		"answerText": "Text",
		"evaluatedAt": "Date",
		"feedbackText": "Text",
		"readingAssignmentId": "ID",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Update Readingassignment` API
Update startAt/classroomId/etc. for assignment (eg. reschedule/adjust context).

**API Frontend Description By The Backend Architect**

- Used primarily for teacher rescheduling, class transfers, or error correction.
- No direct impact on readingPassage.

**Rest Route**

The `updateReadingAssignment` API REST controller can be triggered via the following route:

`/v1/readingassignments/:readingAssignmentId`


**Rest Request Parameters**


The `updateReadingAssignment` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| readingAssignmentId  | ID  | true | request.params?.["readingAssignmentId"] |
**readingAssignmentId** : This id paremeter is used to select the required data object that will be updated


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/readingassignments/:readingAssignmentId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/readingassignments/${readingAssignmentId}`,
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
	"dataName": "readingAssignment",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"readingAssignment": {
		"id": "ID",
		"assignmentId": "ID",
		"classroomId": "ID",
		"readingPassageId": "ID",
		"startAt": "Date",
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
### `Update Readingpassage` API
Update fields (level, topic, content, etc.) of existing passage. Library use: teacher/admin editing. AI-generated: for error correction.

**API Frontend Description By The Backend Architect**

- Edit screen for library passages (teacher/admin) and allow AI-generated passages to be updated if needed.
- All changes visible in assignment/reading views.

**Rest Route**

The `updateReadingPassage` API REST controller can be triggered via the following route:

`/v1/readingpassages/:readingPassageId`


**Rest Request Parameters**


The `updateReadingPassage` api has got 6 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| readingPassageId  | ID  | true | request.params?.["readingPassageId"] |
| cefrLevel  | String  | false | request.body?.["cefrLevel"] |
| content  | Text  | false | request.body?.["content"] |
| language  | String  | false | request.body?.["language"] |
| sourceType  | Enum  | false | request.body?.["sourceType"] |
| topic  | String  | false | request.body?.["topic"] |
**readingPassageId** : This id paremeter is used to select the required data object that will be updated
**cefrLevel** : CEFR proficiency level (A1–C2, e.g. A2, B1+) for which this passage is intended.
**content** : Full reading text for display and analysis.
**language** : Language code for passage content (e.g. en, tr, ar).
**sourceType** : Passage source: fixed library or AI-generated on demand.
**topic** : Topic or theme of passage (e.g. Travel, Technology, etc).


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/readingpassages/:readingPassageId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/readingpassages/${readingPassageId}`,
    data: {
            cefrLevel:"String",  
            content:"Text",  
            language:"String",  
            sourceType:"Enum",  
            topic:"String",  
    
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
	"dataName": "readingPassage",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"readingPassage": {
		"id": "ID",
		"cefrLevel": "String",
		"content": "Text",
		"createdById": "ID",
		"language": "String",
		"sourceType": "Enum",
		"sourceType_idx": "Integer",
		"topic": "String",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `_fetch Listreadinganswer` API
System API to fetch list of readingAnswer records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListReadingAnswer` API REST controller can be triggered via the following route:

`/v1/_fetchlistreadinganswer`


**Rest Request Parameters**


**Filter Parameters**

The `_fetchListReadingAnswer` api supports 1 optional filter parameter for filtering list results:

**assignment** (`ID`): Assignment for which this answer is submitted. One answer per assignment.

- Single: `?assignment=<value>`
- Multiple: `?assignment=<value1>&assignment=<value2>`
- Null: `?assignment=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistreadinganswer**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistreadinganswer',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // assignment: '<value>' // Filter by assignment
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
	"dataName": "readingAnswers",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"readingAnswers": [
		{
			"id": "ID",
			"aiScore": "Integer",
			"answerText": "Text",
			"evaluatedAt": "Date",
			"feedbackText": "Text",
			"readingAssignmentId": "ID",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"readingAssignment": [
				{
					"assignmentId": "ID",
					"classroomId": "ID",
					"readingPassageId": "ID",
					"startAt": "Date",
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
### `_fetch Listreadingassignment` API
System API to fetch list of readingAssignment records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListReadingAssignment` API REST controller can be triggered via the following route:

`/v1/_fetchlistreadingassignment`


**Rest Request Parameters**


**Filter Parameters**

The `_fetchListReadingAssignment` api supports 2 optional filter parameters for filtering list results:

**passage** (`ID`): Linked passage for assigned/practice reading.

- Single: `?passage=<value>`
- Multiple: `?passage=<value1>&passage=<value2>`
- Null: `?passage=null`


**student** (`ID`): Student assigned this reading.

- Single: `?student=<value>`
- Multiple: `?student=<value1>&student=<value2>`
- Null: `?student=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistreadingassignment**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistreadingassignment',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // passage: '<value>' // Filter by passage
        // student: '<value>' // Filter by student
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
	"dataName": "readingAssignments",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"readingAssignments": [
		{
			"id": "ID",
			"assignmentId": "ID",
			"classroomId": "ID",
			"readingPassageId": "ID",
			"startAt": "Date",
			"studentId": "ID",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"mainAssignment": [
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
			"readingPassage": [
				{
					"cefrLevel": "String",
					"content": "Text",
					"createdById": "ID",
					"language": "String",
					"sourceType": "Enum",
					"sourceType_idx": "Integer",
					"topic": "String"
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
### `_fetch Listreadingpassage` API
System API to fetch list of readingPassage records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListReadingPassage` API REST controller can be triggered via the following route:

`/v1/_fetchlistreadingpassage`


**Rest Request Parameters**


**Filter Parameters**

The `_fetchListReadingPassage` api supports 4 optional filter parameters for filtering list results:

**cefr** (`String`): CEFR proficiency level (A1–C2, e.g. A2, B1+) for which this passage is intended.

- Single (partial match, case-insensitive): `?cefr=<value>`
- Multiple: `?cefr=<value1>&cefr=<value2>`
- Null: `?cefr=null`


**lang** (`String`): Language code for passage content (e.g. en, tr, ar).

- Single (partial match, case-insensitive): `?lang=<value>`
- Multiple: `?lang=<value1>&lang=<value2>`
- Null: `?lang=null`


**source** (`Enum`): Passage source: fixed library or AI-generated on demand.

- Single: `?source=<value>` (case-insensitive)
- Multiple: `?source=<value1>&source=<value2>`
- Null: `?source=null`


**topic** (`String`): Topic or theme of passage (e.g. Travel, Technology, etc).

- Single (partial match, case-insensitive): `?topic=<value>`
- Multiple: `?topic=<value1>&topic=<value2>`
- Null: `?topic=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistreadingpassage**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistreadingpassage',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // cefr: '<value>' // Filter by cefr
        // lang: '<value>' // Filter by lang
        // source: '<value>' // Filter by source
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
	"dataName": "readingPassages",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"readingPassages": [
		{
			"id": "ID",
			"cefrLevel": "String",
			"content": "Text",
			"createdById": "ID",
			"language": "String",
			"sourceType": "Enum",
			"sourceType_idx": "Integer",
			"topic": "String",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"createdBy": [
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





# **SOLVIO**

**FRONTEND GUIDE FOR AI CODING AGENTS - PART 10 - PersonalVocabulary Service**

This document is a part of a REST API guide for the solvio project.
It is designed for AI agents that will generate frontend code to consume the project’s backend.

This document provides extensive instruction for the usage of personalVocabulary

## Service Access

PersonalVocabulary service management is handled through service specific base urls.

PersonalVocabulary  service may be deployed to the preview server, staging server, or production server. Therefore,it has 3 access URLs.
The frontend application must support all deployment environments during development, and the user should be able to select the target API server on the login page (already handled in first part.).

For the personalVocabulary service, the base URLs are:

* **Preview:** `https://solvio.prw.mindbricks.com/personalvocabulary-api`
* **Staging:** `https://solvio-stage.mindbricks.co/personalvocabulary-api`
* **Production:** `https://solvio.mindbricks.co/personalvocabulary-api`

### Tenant URL Prefix and Header Forwarding

Tenant context is resolved by frontend routing strategy:
- preview/test: URL prefix `/{tenantCodename}` (example: `/babil/products`)
- production: tenant subdomain (example: `babil.appname...`)

Then backend API calls must always claim target tenant with header:

```js
headers["mbx-school-codename"] = tenantCodenameFromUrl;
```

URL prefix/subdomain is frontend-only tenant selection. Use header forwarding for all tenant-scoped calls to `personalVocabulary` service.

## Scope

**PersonalVocabulary Service Description**

Handles per-user vocabulary lists, contextual word lookups (definitions/examples), tracks vocabulary review stats, and supports teacher/agent word recommendations. Multi-tenant, fully isolated; integrates with language labs and agent modules.

PersonalVocabulary service provides apis and business logic for following data objects in solvio application. 
Each data object may be either a central domain of the application data structure or a related helper data object for a central concept.
Note that data object concept is equal to table concept in the database, in the service database each data object is represented as a db table scheme and the object instances as table rows.  


**`dictionaryLookup` Data Object**: Logs and/or caches the definition and example usage for a word+language, for fast contextual lookup. Optionally used for teaching/feedback dictionary popups.

**`vocabularyEntry` Data Object**: A word saved in a user&#39;s personal vocabulary list, with metadata for learning context, usage, and CEFR proficiency if known.


## PersonalVocabulary Service Frontend Description By The Backend Architect

# Personal Vocabulary UX Guidance
- Vocabulary lists are unique per student.
- Entries show word, notes, source context, review stats, CEFR (if set), and allow filtering/search.
- Student can add/remove/review entries, edit notes, fetch definitions, and add words from AI, feedback, or dictionary popups.
- Teacher/Agent can recommend new words (flagged in context/source); those entries appear in the student's list as "recommended", and student can accept or reject.
- Tapping on a word in feedback triggers a definition/example dialog (dictionaryLookup), which is cached if not already present.
- Review actions update review date, facilitating spaced repetition and progress analytics.


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


## DictionaryLookup Data Object

Logs and/or caches the definition and example usage for a word+language, for fast contextual lookup. Optionally used for teaching/feedback dictionary popups.

### DictionaryLookup  Data Object Frontend Description By The Backend Architect

- Used to store definitions/examples for contextual or AI-generated lookup.
- Not directly editable; created when requested, may be updated only via integration if needed.
- Used for in-app dictionary, agent word lookup, and feedback popups.


### DictionaryLookup Data Object Properties

DictionaryLookup data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `definition` | String | false | Yes | No | Definition of the word in the given language (from AI/external API/custom dictionary) |
| `exampleUsage` | String | false | Yes | No | Example sentence showing word usage (from AI/external API/custom dictionary) |
| `language` | String | false | Yes | No | Language code for the lookup (en, tr, ar, etc) |
| `lookupTime` | Date | false | Yes | No | When lookup occurred (or was refreshed; used for recency and cache expiry) |
| `word` | String | false | Yes | No | Word being looked up (base/lemma form) |
| `schoolId` | ID | false | Yes | No | An ID value to represent the tenant id of the school |
* Required properties are mandatory for creating objects and must be provided in the request body if no default value, formula or session bind is set.





### Filter Properties

`schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **schoolId**: ID  has a filter named `schoolId`


## VocabularyEntry Data Object

A word saved in a user&#39;s personal vocabulary list, with metadata for learning context, usage, and CEFR proficiency if known.

### VocabularyEntry  Data Object Frontend Description By The Backend Architect

- Appears in student's personal vocabulary list, showing word, notes, when added, source, and last reviewed.
- Can be added from anywhere in the app (feedback, reading, writing, agent, teacher suggestion).
- Only owner can update/delete/mark reviewed; teacher/agent can recommend (see context/source).


### VocabularyEntry Data Object Properties

VocabularyEntry data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `addedAt` | Date | false | Yes | No | Date/time when the word was added to vocabulary |
| `lastReviewedAt` | Date | false | No | No | Most recent date/time this vocabulary entry was reviewed (for spaced repetition and stats) |
| `notes` | String | false | No | No | Personal notes or memory aid for word usage/context, entered by user |
| `proficiencyLevel` | String | false | No | No | CEFR or custom proficiency level for this vocabulary word (optional, set by user/AI/teacher) |
| `sourceContext` | String | false | Yes | No | Origin/context for why/where the word was added (e.g., 'readingFeedback', 'agent', 'teacherRecommendation', etc) |
| `userId` | ID | false | Yes | No | Owner (student) of this vocabulary entry |
| `word` | String | false | Yes | No | Word (lemma/base form) saved in vocabulary |
| `schoolId` | ID | false | Yes | No | An ID value to represent the tenant id of the school |
* Required properties are mandatory for creating objects and must be provided in the request body if no default value, formula or session bind is set.




### Relation Properties

`userId`

Mindbricks supports relations between data objects, allowing you to define how objects are linked together.
The relations may reference to a data object either in this service or in another service. Id the reference is remote, backend handles the relations through service communication or elastic search.
These relations should be respected in the frontend so that instaead of showing the related objects id, the frontend should list human readable values from other data objects.
If the relation points to another service, frontend should use the referenced service api in case it needs related data.
The relation logic is montly handled in backend so the api responses feeds the frontend about the relational data. 
In mmost cases the api response will provide the relational data as well as the main one.

In frontend, please ensure that, 

1- instaead of these relational ids you show the main human readable field of the related target data (like name),
2- if this data object needs a user input of these relational ids, you should provide a combobox with the list of possible records or (a searchbox) to select with the realted target data object main human readable field.


- **userId**: ID
Relation to `user`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: Yes


### Filter Properties

`addedAt` `lastReviewedAt` `proficiencyLevel` `sourceContext` `userId` `word` `schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **addedAt**: Date  has a filter named `addedAt`

- **lastReviewedAt**: Date  has a filter named `lastReviewedAt`

- **proficiencyLevel**: String  has a filter named `proficiencyLevel`

- **sourceContext**: String  has a filter named `sourceContext`

- **userId**: ID  has a filter named `userId`

- **word**: String  has a filter named `word`

- **schoolId**: ID  has a filter named `schoolId`



## Default CRUD APIs

For each data object, the backend architect may designate **default APIs** for standard operations (create, update, delete, get, list). These are the APIs that frontend CRUD forms and AI agents should use for basic record management. If no default is explicitly set (`isDefaultApi`), the frontend generator auto-discovers the most general API for each operation.

### DictionaryLookup Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `createDictionaryLookup` | `/v1/dictionarylookups` | Auto |
| Update | _none_ | - | Auto |
| Delete | _none_ | - | Auto |
| Get | `getDictionaryLookup` | `/v1/dictionarylookups/:dictionaryLookupId` | Auto |
| List | `listDictionaryLookups` | `/v1/dictionarylookups` | System |
### VocabularyEntry Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `createVocabularyEntry` | `/v1/vocabularyentries` | Auto |
| Update | `updateVocabularyEntry` | `/v1/vocabularyentries/:vocabularyEntryId` | Auto |
| Delete | `deleteVocabularyEntry` | `/v1/vocabularyentries/:vocabularyEntryId` | Auto |
| Get | `getVocabularyEntry` | `/v1/vocabularyentries/:vocabularyEntryId` | Auto |
| List | `listVocabularyEntries` | `/v1/vocabularyentries` | System |

When building CRUD forms for a data object, use the default create/update APIs listed above. The form fields should correspond to the API's body parameters. For relation fields, render a dropdown loaded from the related object's list API using the display label property.


## API Reference

### `Create Dictionarylookup` API
Create a dictionary lookup entry (logs definition/example for a word in a language). Used to cache fetched definitions, or store results from AI/external API. If lookup exists, updates definition/example and lookupTime.

**API Frontend Description By The Backend Architect**

- Triggers on first dictionary lookup or when AI/agent generates new definition.
- If word+language combo already exists, updates (see composite index).
- Used for dictionary popup/responses throughout app.

**Rest Route**

The `createDictionaryLookup` API REST controller can be triggered via the following route:

`/v1/dictionarylookups`


**Rest Request Parameters**


The `createDictionaryLookup` api has got 4 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| definition  | String  | true | request.body?.["definition"] |
| exampleUsage  | String  | true | request.body?.["exampleUsage"] |
| language  | String  | true | request.body?.["language"] |
| word  | String  | true | request.body?.["word"] |
**definition** : Definition of the word in the given language (from AI/external API/custom dictionary)
**exampleUsage** : Example sentence showing word usage (from AI/external API/custom dictionary)
**language** : Language code for the lookup (en, tr, ar, etc)
**word** : Word being looked up (base/lemma form)


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/dictionarylookups**
```js
  axios({
    method: 'POST',
    url: '/v1/dictionarylookups',
    data: {
            definition:"String",  
            exampleUsage:"String",  
            language:"String",  
            word:"String",  
    
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
	"dataName": "dictionaryLookup",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"dictionaryLookup": {
		"id": "ID",
		"definition": "String",
		"exampleUsage": "String",
		"language": "String",
		"lookupTime": "Date",
		"word": "String",
		"schoolId": "ID",
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID",
		"isActive": true
	}
}
```
### `Create Vocabularyentry` API
Add a new word to the user's personal vocabulary list. Rejects duplicates for same user in same tenant. Sets addedAt to now, sourceContext according to trigger (default manual), and can be triggered by student or by teacher/agent (as recommendation).

**API Frontend Description By The Backend Architect**

- Used by students to add words from any part of the app.
- Teachers/agent may create as recommendation; in such case, entry is flagged with sourceContext "teacherRecommendation" or "agent" and appears in student list as such.
- Error shown if word already exists in user's vocabulary.

**Rest Route**

The `createVocabularyEntry` API REST controller can be triggered via the following route:

`/v1/vocabularyentries`


**Rest Request Parameters**


The `createVocabularyEntry` api has got 5 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| lastReviewedAt  | Date  | false | request.body?.["lastReviewedAt"] |
| notes  | String  | false | request.body?.["notes"] |
| proficiencyLevel  | String  | false | request.body?.["proficiencyLevel"] |
| sourceContext  | String  | true | request.body?.["sourceContext"] |
| word  | String  | true | request.body?.["word"] |
**lastReviewedAt** : Most recent date/time this vocabulary entry was reviewed (for spaced repetition and stats)
**notes** : Personal notes or memory aid for word usage/context, entered by user
**proficiencyLevel** : CEFR or custom proficiency level for this vocabulary word (optional, set by user/AI/teacher)
**sourceContext** : Origin/context for why/where the word was added (e.g., 'readingFeedback', 'agent', 'teacherRecommendation', etc)
**word** : Word (lemma/base form) saved in vocabulary


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/vocabularyentries**
```js
  axios({
    method: 'POST',
    url: '/v1/vocabularyentries',
    data: {
            lastReviewedAt:"Date",  
            notes:"String",  
            proficiencyLevel:"String",  
            sourceContext:"String",  
            word:"String",  
    
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
	"dataName": "vocabularyEntry",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"vocabularyEntry": {
		"id": "ID",
		"addedAt": "Date",
		"lastReviewedAt": "Date",
		"notes": "String",
		"proficiencyLevel": "String",
		"sourceContext": "String",
		"userId": "ID",
		"word": "String",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Delete Vocabularyentry` API
Delete (soft-delete) a vocabulary entry. Only owner (student) or school/tenant admin can delete.

**API Frontend Description By The Backend Architect**

- Used by student to remove saved word from personal list. Admins can perform clean-up or GDPR/data correction.
- Deletion is soft (recoverable if needed).

**Rest Route**

The `deleteVocabularyEntry` API REST controller can be triggered via the following route:

`/v1/vocabularyentries/:vocabularyEntryId`


**Rest Request Parameters**


The `deleteVocabularyEntry` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| vocabularyEntryId  | ID  | true | request.params?.["vocabularyEntryId"] |
**vocabularyEntryId** : This id paremeter is used to select the required data object that will be deleted


**REST Request**
To access the api you can use the **REST** controller with the path **DELETE  /v1/vocabularyentries/:vocabularyEntryId**
```js
  axios({
    method: 'DELETE',
    url: `/v1/vocabularyentries/${vocabularyEntryId}`,
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
	"dataName": "vocabularyEntry",
	"method": "DELETE",
	"action": "delete",
	"appVersion": "Version",
	"rowCount": 1,
	"vocabularyEntry": {
		"id": "ID",
		"addedAt": "Date",
		"lastReviewedAt": "Date",
		"notes": "String",
		"proficiencyLevel": "String",
		"sourceContext": "String",
		"userId": "ID",
		"word": "String",
		"schoolId": "ID",
		"isActive": false,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Get Dictionarylookup` API
Get dictionary lookup details for a word+language. Used for dictionary popups, feedback lookup, and agent word queries.

**API Frontend Description By The Backend Architect**

- Used to get definition/example for word in the specified language.
- If not found, triggers lookup creation request (call createDictionaryLookup or call agent for AI/external API).
- Used throughout app dictionary/agent/feedback tools.

**Rest Route**

The `getDictionaryLookup` API REST controller can be triggered via the following route:

`/v1/dictionarylookups/:dictionaryLookupId`


**Rest Request Parameters**


The `getDictionaryLookup` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| dictionaryLookupId  | ID  | true | request.params?.["dictionaryLookupId"] |
**dictionaryLookupId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/dictionarylookups/:dictionaryLookupId**
```js
  axios({
    method: 'GET',
    url: `/v1/dictionarylookups/${dictionaryLookupId}`,
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
	"dataName": "dictionaryLookup",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"dictionaryLookup": {
		"isActive": true
	}
}
```
### `Get Vocabularyentry` API
Get single vocabulary entry by ID (student's own or for review; ownership and tenant isolation enforced).

**API Frontend Description By The Backend Architect**

- Retrieves details for a single vocab entry (student personal view, or for review/analytics in admin/teacher interface).

**Rest Route**

The `getVocabularyEntry` API REST controller can be triggered via the following route:

`/v1/vocabularyentries/:vocabularyEntryId`


**Rest Request Parameters**


The `getVocabularyEntry` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| vocabularyEntryId  | ID  | true | request.params?.["vocabularyEntryId"] |
**vocabularyEntryId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/vocabularyentries/:vocabularyEntryId**
```js
  axios({
    method: 'GET',
    url: `/v1/vocabularyentries/${vocabularyEntryId}`,
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
	"dataName": "vocabularyEntry",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"vocabularyEntry": {
		"isActive": true
	}
}
```
### `List Dictionarylookups` API
List dictionary lookup records for a word, language, or by recency (for cache or analytics/statistics). Admins can audit, users/frontends use for cache.

**API Frontend Description By The Backend Architect**

- Used for caching, auditing, showing examples, or bulk review/analytics.
- May be filtered by word, language, or most recent lookups.

**Rest Route**

The `listDictionaryLookups` API REST controller can be triggered via the following route:

`/v1/dictionarylookups`


**Rest Request Parameters**
The `listDictionaryLookups` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/dictionarylookups**
```js
  axios({
    method: 'GET',
    url: '/v1/dictionarylookups',
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
	"dataName": "dictionaryLookups",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"dictionaryLookups": [
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
### `List Vocabularyentries` API
List vocabulary entries for a user (student), filterable by word, sourceContext, proficiencyLevel, lastReviewedAt, and supports pagination/sorting. Admin sees tenant/member list as needed.

**API Frontend Description By The Backend Architect**

- Student's own vocab list (the main personal vocab page).
- Teacher/admins can see vocab usage across class or user for analytics if allowed.
- List may be filtered/sorted by word, context, CEFR, last review date.

**Rest Route**

The `listVocabularyEntries` API REST controller can be triggered via the following route:

`/v1/vocabularyentries`


**Rest Request Parameters**
The `listVocabularyEntries` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/vocabularyentries**
```js
  axios({
    method: 'GET',
    url: '/v1/vocabularyentries',
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
	"dataName": "vocabularyEntries",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"vocabularyEntries": [
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
### `Recommend Vocabularyentry` API
Teacher or agent recommends a new word to a student. Only allowed for tenant-admin, teacher, or agent. Entry is created with sourceContext='teacherRecommendation' or 'agent'. Triggers event for notification system.

**API Frontend Description By The Backend Architect**

- Teacher/agent recommends word: appears flagged in student's vocab list.
- Student can accept/ignore/delete recommendation separately.
- Triggers analytic/event log for teacher suggestion.

**Rest Route**

The `recommendVocabularyEntry` API REST controller can be triggered via the following route:

`/v1/recommend`


**Rest Request Parameters**


The `recommendVocabularyEntry` api has got 3 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| targetUserId  | ID  | true | request.body?.["targetUserId"] |
| word  | String  | true | request.body?.["word"] |
| sourceContext  | String  | false | request.body?.["sourceContext"] |
**targetUserId** : Student (auth:user.id) for whom the vocab entry is recommended (owner of entry)
**word** : Vocabulary word (lemma) recommended
**sourceContext** : Recommendation type/context (teacherRecommendation, agent, etc)


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/recommend**
```js
  axios({
    method: 'POST',
    url: '/v1/recommend',
    data: {
            targetUserId:"ID",  
            word:"String",  
            sourceContext:"String",  
    
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
	"dataName": "vocabularyEntry",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"vocabularyEntry": {
		"id": "ID",
		"addedAt": "Date",
		"lastReviewedAt": "Date",
		"notes": "String",
		"proficiencyLevel": "String",
		"sourceContext": "String",
		"userId": "ID",
		"word": "String",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Review Vocabularyentry` API
Update vocabularyEntry's lastReviewedAt to now (for spaced repetition/analytics). Only allowed for owner or admin/teacher. Does not change any other field.

**API Frontend Description By The Backend Architect**

- Triggers when student reviews/revises a word.
- Only lastReviewedAt is updated for spaced review tracking.
- Can drive review statistics, spaced repetition analytics.

**Rest Route**

The `reviewVocabularyEntry` API REST controller can be triggered via the following route:

`/v1/review`


**Rest Request Parameters**


The `reviewVocabularyEntry` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| vocabularyEntryId  | ID  | true | request.body?.["vocabularyEntryId"] |
**vocabularyEntryId** : Vocabulary entry id to mark as reviewed


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/review**
```js
  axios({
    method: 'PATCH',
    url: '/v1/review',
    data: {
            vocabularyEntryId:"ID",  
    
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
	"dataName": "vocabularyEntry",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"vocabularyEntry": {
		"id": "ID",
		"addedAt": "Date",
		"lastReviewedAt": "Date",
		"notes": "String",
		"proficiencyLevel": "String",
		"sourceContext": "String",
		"userId": "ID",
		"word": "String",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Update Vocabularyentry` API
Update vocabulary entry fields: notes, proficiencyLevel, lastReviewedAt (e.g. when reviewing word). Word cannot be updated. Ownership enforced.

**API Frontend Description By The Backend Architect**

- Student edits notes/level, or marks as reviewed.
- Cannot change the base "word" once created.
- Only owner can update their vocab entry; admin may update for system curation.

**Rest Route**

The `updateVocabularyEntry` API REST controller can be triggered via the following route:

`/v1/vocabularyentries/:vocabularyEntryId`


**Rest Request Parameters**


The `updateVocabularyEntry` api has got 6 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| vocabularyEntryId  | ID  | true | request.params?.["vocabularyEntryId"] |
| lastReviewedAt  | Date  | false | request.body?.["lastReviewedAt"] |
| notes  | String  | false | request.body?.["notes"] |
| proficiencyLevel  | String  | false | request.body?.["proficiencyLevel"] |
| sourceContext  | String  | false | request.body?.["sourceContext"] |
| word  | String  | false | request.body?.["word"] |
**vocabularyEntryId** : This id paremeter is used to select the required data object that will be updated
**lastReviewedAt** : Most recent date/time this vocabulary entry was reviewed (for spaced repetition and stats)
**notes** : Personal notes or memory aid for word usage/context, entered by user
**proficiencyLevel** : CEFR or custom proficiency level for this vocabulary word (optional, set by user/AI/teacher)
**sourceContext** : Origin/context for why/where the word was added (e.g., 'readingFeedback', 'agent', 'teacherRecommendation', etc)
**word** : Word (lemma/base form) saved in vocabulary


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/vocabularyentries/:vocabularyEntryId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/vocabularyentries/${vocabularyEntryId}`,
    data: {
            lastReviewedAt:"Date",  
            notes:"String",  
            proficiencyLevel:"String",  
            sourceContext:"String",  
            word:"String",  
    
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
	"dataName": "vocabularyEntry",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"vocabularyEntry": {
		"id": "ID",
		"addedAt": "Date",
		"lastReviewedAt": "Date",
		"notes": "String",
		"proficiencyLevel": "String",
		"sourceContext": "String",
		"userId": "ID",
		"word": "String",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `_fetch Listdictionarylookup` API
System API to fetch list of dictionaryLookup records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListDictionaryLookup` API REST controller can be triggered via the following route:

`/v1/_fetchlistdictionarylookup`


**Rest Request Parameters**
The `_fetchListDictionaryLookup` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistdictionarylookup**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistdictionarylookup',
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
	"dataName": "dictionaryLookups",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"dictionaryLookups": [
		{
			"id": "ID",
			"definition": "String",
			"exampleUsage": "String",
			"language": "String",
			"lookupTime": "Date",
			"word": "String",
			"schoolId": "ID",
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
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
### `_fetch Listvocabularyentry` API
System API to fetch list of vocabularyEntry records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListVocabularyEntry` API REST controller can be triggered via the following route:

`/v1/_fetchlistvocabularyentry`


**Rest Request Parameters**


**Filter Parameters**

The `_fetchListVocabularyEntry` api supports 6 optional filter parameters for filtering list results:

**addedAt** (`Date`): Date/time when the word was added to vocabulary

- Single date: `?addedAt=2024-01-15`
- Multiple dates: `?addedAt=2024-01-15&addedAt=2024-01-20`
- Special: `$today`, `$ltoday`, `$week`, `$lweek`, `$month`, `$leq-<date>`, `$lin-<date>`
- Null: `?addedAt=null`


**lastReviewedAt** (`Date`): Most recent date/time this vocabulary entry was reviewed (for spaced repetition and stats)

- Single date: `?lastReviewedAt=2024-01-15`
- Multiple dates: `?lastReviewedAt=2024-01-15&lastReviewedAt=2024-01-20`
- Special: `$today`, `$ltoday`, `$week`, `$lweek`, `$month`, `$leq-<date>`, `$lin-<date>`
- Null: `?lastReviewedAt=null`


**proficiencyLevel** (`String`): CEFR or custom proficiency level for this vocabulary word (optional, set by user/AI/teacher)

- Single (partial match, case-insensitive): `?proficiencyLevel=<value>`
- Multiple: `?proficiencyLevel=<value1>&proficiencyLevel=<value2>`
- Null: `?proficiencyLevel=null`


**sourceContext** (`String`): Origin/context for why/where the word was added (e.g., 'readingFeedback', 'agent', 'teacherRecommendation', etc)

- Single (partial match, case-insensitive): `?sourceContext=<value>`
- Multiple: `?sourceContext=<value1>&sourceContext=<value2>`
- Null: `?sourceContext=null`


**userId** (`ID`): Owner (student) of this vocabulary entry

- Single: `?userId=<value>`
- Multiple: `?userId=<value1>&userId=<value2>`
- Null: `?userId=null`


**word** (`String`): Word (lemma/base form) saved in vocabulary

- Single (partial match, case-insensitive): `?word=<value>`
- Multiple: `?word=<value1>&word=<value2>`
- Null: `?word=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistvocabularyentry**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistvocabularyentry',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // addedAt: '<value>' // Filter by addedAt
        // lastReviewedAt: '<value>' // Filter by lastReviewedAt
        // proficiencyLevel: '<value>' // Filter by proficiencyLevel
        // sourceContext: '<value>' // Filter by sourceContext
        // userId: '<value>' // Filter by userId
        // word: '<value>' // Filter by word
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
	"dataName": "vocabularyEntries",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"vocabularyEntries": [
		{
			"id": "ID",
			"addedAt": "Date",
			"lastReviewedAt": "Date",
			"notes": "String",
			"proficiencyLevel": "String",
			"sourceContext": "String",
			"userId": "ID",
			"word": "String",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"owner": [
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





# **SOLVIO**

**FRONTEND GUIDE FOR AI CODING AGENTS - PART 8 - LanguageProfile Service**

This document is a part of a REST API guide for the solvio project.
It is designed for AI agents that will generate frontend code to consume the project’s backend.

This document provides extensive instruction for the usage of languageProfile

## Service Access

LanguageProfile service management is handled through service specific base urls.

LanguageProfile  service may be deployed to the preview server, staging server, or production server. Therefore,it has 3 access URLs.
The frontend application must support all deployment environments during development, and the user should be able to select the target API server on the login page (already handled in first part.).

For the languageProfile service, the base URLs are:

* **Preview:** `https://solvio.prw.mindbricks.com/languageprofile-api`
* **Staging:** `https://solvio-stage.mindbricks.co/languageprofile-api`
* **Production:** `https://solvio.mindbricks.co/languageprofile-api`

### Tenant URL Prefix and Header Forwarding

Tenant context is resolved by frontend routing strategy:
- preview/test: URL prefix `/{tenantCodename}` (example: `/babil/products`)
- production: tenant subdomain (example: `babil.appname...`)

Then backend API calls must always claim target tenant with header:

```js
headers["mbx-school-codename"] = tenantCodenameFromUrl;
```

URL prefix/subdomain is frontend-only tenant selection. Use header forwarding for all tenant-scoped calls to `languageProfile` service.

## Scope

**LanguageProfile Service Description**

Handles user CEFR proficiency detection, historical tracking, and analytics-ready storage of language level progression for Solvio. Syncs level updates from all skill labs and provides a secure, audit-compliant language profile and history per user. Enables dashboards, recommendations, and class/tenant-level analytics.

LanguageProfile service provides apis and business logic for following data objects in solvio application. 
Each data object may be either a central domain of the application data structure or a related helper data object for a central concept.
Note that data object concept is equal to table concept in the database, in the service database each data object is represented as a db table scheme and the object instances as table rows.  


**`languageLevelProfile` Data Object**: Stores the current CEFR proficiency level and confidence for a user, updated by AI or teacher actions. Used for personalized learning, dashboards, and recommendation logic. One active profile per user per tenant.

**`levelProgressHistory` Data Object**: Append-only log of each time a user&#39;s language level changes. Captures previous and new levels, cause, reasoning, and timestamp. Enables visual progress analytics and transparency for interventions.


## LanguageProfile Service Frontend Description By The Backend Architect

This service makes the current proficiency level and progression history accessible to the frontend for user/teacher dashboards. 'languageLevelProfile' should be included in user profile panels and class roster analytics, supporting user-facing charts and level badges. 'levelProgressHistory' is displayed as a vertical or timeline-style log (e.g., in profile analytics) and can be filtered/searched by period, source, or change reason. UX should show confidence and always show localized CEFR level descriptors. All updates are immediately reflected in UI charts and recommendation widgets.

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


## LanguageLevelProfile Data Object

Stores the current CEFR proficiency level and confidence for a user, updated by AI or teacher actions. Used for personalized learning, dashboards, and recommendation logic. One active profile per user per tenant.

### LanguageLevelProfile  Data Object Frontend Description By The Backend Architect

Show user’s official CEFR level badge and last updated source/reason in the profile panel and dashboards. Display confidence as a percentage/progress bar. Updates should reflect instantly when user completes a key learning event or after manual teacher adjustment. This is the primary record for analytics and recommendations.


### LanguageLevelProfile Data Object Properties

LanguageLevelProfile data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `changeSource` | String | false | Yes | No | Primary cause/source for the level update. E.g. 'writing', 'speaking', 'reading', 'listening', 'combined', 'manual'. |
| `confidence` | Double | false | Yes | No | Confidence score (0.0-1.0) in level determination. Useful for AI-based updates. |
| `currentLevel` | String | false | Yes | No | Current CEFR level of the user (e.g. A2, B1+, C1). |
| `determinedBy` | String | false | Yes | No | How the current level was determined: 'auto' = AI/model, 'manual' = teacher/admin set. |
| `notes` | Text | false | No | No | (Optional) Internal or teacher/admin notes about this user's current profile. Not shown to students. |
| `updatedAtSource` | Date | false | Yes | No | Time of last proficiency update/source event. Usually matches updatedAt, but allows for source-tracking. |
| `userId` | ID | false | Yes | No | References the user whose proficiency level this is. |
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

`changeSource` `currentLevel` `userId` `schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **changeSource**: String  has a filter named `changeSource`

- **currentLevel**: String  has a filter named `currentLevel`

- **userId**: ID  has a filter named `userId`

- **schoolId**: ID  has a filter named `schoolId`


## LevelProgressHistory Data Object

Append-only log of each time a user&#39;s language level changes. Captures previous and new levels, cause, reasoning, and timestamp. Enables visual progress analytics and transparency for interventions.

### LevelProgressHistory  Data Object Frontend Description By The Backend Architect

Display as a chronological timeline or changelog in the language progress UI/dashboard. Allow filtering by period, source (AI/manual/teacher), and action type (e.g., reassessment, teacher adjustment, model threshold change).


### LevelProgressHistory Data Object Properties

LevelProgressHistory data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `changedAt` | Date | false | Yes | No | Timestamp of the level change event. |
| `changeSource` | String | false | Yes | No | What triggered the change (e.g. 'writing', 'reading', 'speaking', 'manual', etc). |
| `confidence` | Double | false | No | No | Confidence metric at time of change. Typically from AI, may be set low for teacher/manual. |
| `determinedBy` | String | false | Yes | No | Who/what set the new level: 'auto', 'manual', 'teacher', etc. |
| `fromLevel` | String | false | No | No | Previous CEFR level before change. Empty/null if initial onboarding into system. |
| `notes` | Text | false | No | No | Optional notes for the change (e.g., triggering assignment/criteria, admin explanation). |
| `reason` | String | false | No | No | Business/process reason for change (e.g. 'threshold', 'teacherAdjustment', 'forcedUpdate'). |
| `toLevel` | String | false | Yes | No | The new CEFR level assigned/detected. |
| `userId` | ID | false | Yes | No | References the user whose level changed. |
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

`changeSource` `determinedBy` `toLevel` `userId` `schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **changeSource**: String  has a filter named `changeSource`

- **determinedBy**: String  has a filter named `determinedBy`

- **toLevel**: String  has a filter named `toLevel`

- **userId**: ID  has a filter named `userId`

- **schoolId**: ID  has a filter named `schoolId`



## Default CRUD APIs

For each data object, the backend architect may designate **default APIs** for standard operations (create, update, delete, get, list). These are the APIs that frontend CRUD forms and AI agents should use for basic record management. If no default is explicitly set (`isDefaultApi`), the frontend generator auto-discovers the most general API for each operation.

### LanguageLevelProfile Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `createLanguageLevelProfile` | `/v1/languagelevelprofiles` | Auto |
| Update | `updateLanguageLevelProfile` | `/v1/languagelevelprofiles/:languageLevelProfileId` | Auto |
| Delete | _none_ | - | Auto |
| Get | `getLanguageLevelProfile` | `/v1/languagelevelprofiles/:languageLevelProfileId` | Auto |
| List | `listLanguageLevelProfiles` | `/v1/languagelevelprofiles` | System |
### LevelProgressHistory Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `createLevelProgressHistory` | `/v1/levelprogresshistories` | Auto |
| Update | _none_ | - | Auto |
| Delete | _none_ | - | Auto |
| Get | `getLevelProgressHistory` | `/v1/levelprogresshistories/:levelProgressHistoryId` | Auto |
| List | `listLevelProgressHistory` | `/v1/levelprogresshistories` | System |

When building CRUD forms for a data object, use the default create/update APIs listed above. The form fields should correspond to the API's body parameters. For relation fields, render a dropdown loaded from the related object's list API using the display label property.


## API Reference

### `Create Languagelevelprofile` API
Create or overwrite a user's language level profile (current proficiency). Updates if profile exists, otherwise inserts new. Triggers historical log append.

**API Frontend Description By The Backend Architect**

On successful learning event or admin action, call this to update the user's CEFR level. Should refresh profile panel and progress analytics upon success.

**Rest Route**

The `createLanguageLevelProfile` API REST controller can be triggered via the following route:

`/v1/languagelevelprofiles`


**Rest Request Parameters**


The `createLanguageLevelProfile` api has got 7 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| changeSource  | String  | true | request.body?.["changeSource"] |
| confidence  | Double  | true | request.body?.["confidence"] |
| currentLevel  | String  | true | request.body?.["currentLevel"] |
| determinedBy  | String  | true | request.body?.["determinedBy"] |
| notes  | Text  | false | request.body?.["notes"] |
| updatedAtSource  | Date  | true | request.body?.["updatedAtSource"] |
| userId  | ID  | true | request.body?.["userId"] |
**changeSource** : Primary cause/source for the level update. E.g. 'writing', 'speaking', 'reading', 'listening', 'combined', 'manual'.
**confidence** : Confidence score (0.0-1.0) in level determination. Useful for AI-based updates.
**currentLevel** : Current CEFR level of the user (e.g. A2, B1+, C1).
**determinedBy** : How the current level was determined: 'auto' = AI/model, 'manual' = teacher/admin set.
**notes** : (Optional) Internal or teacher/admin notes about this user's current profile. Not shown to students.
**updatedAtSource** : Time of last proficiency update/source event. Usually matches updatedAt, but allows for source-tracking.
**userId** : References the user whose proficiency level this is.


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/languagelevelprofiles**
```js
  axios({
    method: 'POST',
    url: '/v1/languagelevelprofiles',
    data: {
            changeSource:"String",  
            confidence:"Double",  
            currentLevel:"String",  
            determinedBy:"String",  
            notes:"Text",  
            updatedAtSource:"Date",  
            userId:"ID",  
    
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
	"dataName": "languageLevelProfile",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"languageLevelProfile": {
		"id": "ID",
		"changeSource": "String",
		"confidence": "Double",
		"currentLevel": "String",
		"determinedBy": "String",
		"notes": "Text",
		"updatedAtSource": "Date",
		"userId": "ID",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Create Levelprogresshistory` API
Directly log a new entry to a user's level change history (for migration/admin/manual cases). Not typically used when updating profile (automatic append).

**API Frontend Description By The Backend Architect**

Use ONLY for migration, admin action, or emergency log repairs. Typically, append-only via automated flows in createLanguageLevelProfile/updateLanguageLevelProfile. Owner or admin only.

**Rest Route**

The `createLevelProgressHistory` API REST controller can be triggered via the following route:

`/v1/levelprogresshistories`


**Rest Request Parameters**


The `createLevelProgressHistory` api has got 9 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| changedAt  | Date  | true | request.body?.["changedAt"] |
| changeSource  | String  | true | request.body?.["changeSource"] |
| confidence  | Double  | false | request.body?.["confidence"] |
| determinedBy  | String  | true | request.body?.["determinedBy"] |
| fromLevel  | String  | false | request.body?.["fromLevel"] |
| notes  | Text  | false | request.body?.["notes"] |
| reason  | String  | false | request.body?.["reason"] |
| toLevel  | String  | true | request.body?.["toLevel"] |
| userId  | ID  | true | request.body?.["userId"] |
**changedAt** : Timestamp of the level change event.
**changeSource** : What triggered the change (e.g. 'writing', 'reading', 'speaking', 'manual', etc).
**confidence** : Confidence metric at time of change. Typically from AI, may be set low for teacher/manual.
**determinedBy** : Who/what set the new level: 'auto', 'manual', 'teacher', etc.
**fromLevel** : Previous CEFR level before change. Empty/null if initial onboarding into system.
**notes** : Optional notes for the change (e.g., triggering assignment/criteria, admin explanation).
**reason** : Business/process reason for change (e.g. 'threshold', 'teacherAdjustment', 'forcedUpdate').
**toLevel** : The new CEFR level assigned/detected.
**userId** : References the user whose level changed.


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/levelprogresshistories**
```js
  axios({
    method: 'POST',
    url: '/v1/levelprogresshistories',
    data: {
            changedAt:"Date",  
            changeSource:"String",  
            confidence:"Double",  
            determinedBy:"String",  
            fromLevel:"String",  
            notes:"Text",  
            reason:"String",  
            toLevel:"String",  
            userId:"ID",  
    
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
	"dataName": "levelProgressHistory",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"levelProgressHistory": {
		"id": "ID",
		"changedAt": "Date",
		"changeSource": "String",
		"confidence": "Double",
		"determinedBy": "String",
		"fromLevel": "String",
		"notes": "Text",
		"reason": "String",
		"toLevel": "String",
		"userId": "ID",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Get Languagelevelprofile` API
Fetch a single user’s current proficiency profile, for displaying in dashboards/user profile. Includes selectJoin to include user fullname/email for UI enrichment.

**API Frontend Description By The Backend Architect**

Returns all level profile fields plus joined user info for profile display or analytics. Use for profile sidebars, dashboards, or class roster views.

**Rest Route**

The `getLanguageLevelProfile` API REST controller can be triggered via the following route:

`/v1/languagelevelprofiles/:languageLevelProfileId`


**Rest Request Parameters**


The `getLanguageLevelProfile` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| languageLevelProfileId  | ID  | true | request.params?.["languageLevelProfileId"] |
**languageLevelProfileId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/languagelevelprofiles/:languageLevelProfileId**
```js
  axios({
    method: 'GET',
    url: `/v1/languagelevelprofiles/${languageLevelProfileId}`,
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
	"dataName": "languageLevelProfile",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"languageLevelProfile": {
		"user": {
			"email": "String",
			"fullname": "String",
			"avatar": "String"
		},
		"isActive": true
	}
}
```
### `Get Levelprogresshistory` API
Fetch a single history record for a user’s proficiency level change event. Used for detailed changelog display or admin review.

**API Frontend Description By The Backend Architect**

Returns all fields for a single level history entry, plus can fetch user info if required (via join, left to frontend to call as needed).

**Rest Route**

The `getLevelProgressHistory` API REST controller can be triggered via the following route:

`/v1/levelprogresshistories/:levelProgressHistoryId`


**Rest Request Parameters**


The `getLevelProgressHistory` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| levelProgressHistoryId  | ID  | true | request.params?.["levelProgressHistoryId"] |
**levelProgressHistoryId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/levelprogresshistories/:levelProgressHistoryId**
```js
  axios({
    method: 'GET',
    url: `/v1/levelprogresshistories/${levelProgressHistoryId}`,
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
	"dataName": "levelProgressHistory",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"levelProgressHistory": {
		"isActive": true
	}
}
```
### `List Languagelevelprofiles` API
List current proficiency for users (e.g., for class dashboards, analytics, reporting). Filterable by level, changeSource, etc. Joins basic user info for UI display.

**API Frontend Description By The Backend Architect**

Returns array of all languageLevelProfiles in current tenant. Use for dashboards, class overviews, and admin analytics. Inline user info (name, avatar, email) for each entry for roster-style UI. Teacher/admin can filter students by proficiency, CEFR, or recency.

**Rest Route**

The `listLanguageLevelProfiles` API REST controller can be triggered via the following route:

`/v1/languagelevelprofiles`


**Rest Request Parameters**
The `listLanguageLevelProfiles` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/languagelevelprofiles**
```js
  axios({
    method: 'GET',
    url: '/v1/languagelevelprofiles',
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
	"dataName": "languageLevelProfiles",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"languageLevelProfiles": [
		{
			"user": [
				{
					"email": "String",
					"fullname": "String",
					"avatar": "String"
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
### `List Levelprogresshistory` API
List all history records for a user or set of users, ordered by changedAt desc. Used for timelines, analytics, admin reconciliation, and student progress display.

**API Frontend Description By The Backend Architect**

Enables time-ordered progress or changelog views in the frontend/LMS analytics UIs; supports per-student, class, or tenant scope. Typical use in timelines, sparklines, or vertical history panels. Filter by userId, toLevel, or determinedBy as needed.

**Rest Route**

The `listLevelProgressHistory` API REST controller can be triggered via the following route:

`/v1/levelprogresshistories`


**Rest Request Parameters**
The `listLevelProgressHistory` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/levelprogresshistories**
```js
  axios({
    method: 'GET',
    url: '/v1/levelprogresshistories',
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
	"dataName": "levelProgressHistories",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"levelProgressHistories": [
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
### `Update Languagelevelprofile` API
Update an existing user's language level profile (e.g., after new assessment or manual correction). Triggers appending a progress/history entry.

**API Frontend Description By The Backend Architect**

Used when proficiency level is recalculated after skill event or teacher adjustment. Should update UI and progress history. Only owner, teacher, or admin allowed. All logic ensures current record is present and belongs to correct tenant/user.

**Rest Route**

The `updateLanguageLevelProfile` API REST controller can be triggered via the following route:

`/v1/languagelevelprofiles/:languageLevelProfileId`


**Rest Request Parameters**


The `updateLanguageLevelProfile` api has got 7 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| languageLevelProfileId  | ID  | true | request.params?.["languageLevelProfileId"] |
| changeSource  | String  | true | request.body?.["changeSource"] |
| confidence  | Double  | true | request.body?.["confidence"] |
| currentLevel  | String  | true | request.body?.["currentLevel"] |
| determinedBy  | String  | true | request.body?.["determinedBy"] |
| notes  | Text  | false | request.body?.["notes"] |
| updatedAtSource  | Date  | true | request.body?.["updatedAtSource"] |
**languageLevelProfileId** : This id paremeter is used to select the required data object that will be updated
**changeSource** : Primary cause/source for the level update. E.g. 'writing', 'speaking', 'reading', 'listening', 'combined', 'manual'.
**confidence** : Confidence score (0.0-1.0) in level determination. Useful for AI-based updates.
**currentLevel** : Current CEFR level of the user (e.g. A2, B1+, C1).
**determinedBy** : How the current level was determined: 'auto' = AI/model, 'manual' = teacher/admin set.
**notes** : (Optional) Internal or teacher/admin notes about this user's current profile. Not shown to students.
**updatedAtSource** : Time of last proficiency update/source event. Usually matches updatedAt, but allows for source-tracking.


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/languagelevelprofiles/:languageLevelProfileId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/languagelevelprofiles/${languageLevelProfileId}`,
    data: {
            changeSource:"String",  
            confidence:"Double",  
            currentLevel:"String",  
            determinedBy:"String",  
            notes:"Text",  
            updatedAtSource:"Date",  
    
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
	"dataName": "languageLevelProfile",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"languageLevelProfile": {
		"id": "ID",
		"changeSource": "String",
		"confidence": "Double",
		"currentLevel": "String",
		"determinedBy": "String",
		"notes": "Text",
		"updatedAtSource": "Date",
		"userId": "ID",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `_fetch Listlanguagelevelprofile` API
System API to fetch list of languageLevelProfile records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListLanguageLevelProfile` API REST controller can be triggered via the following route:

`/v1/_fetchlistlanguagelevelprofile`


**Rest Request Parameters**


**Filter Parameters**

The `_fetchListLanguageLevelProfile` api supports 3 optional filter parameters for filtering list results:

**changeSource** (`String`): Primary cause/source for the level update. E.g. 'writing', 'speaking', 'reading', 'listening', 'combined', 'manual'.

- Single (partial match, case-insensitive): `?changeSource=<value>`
- Multiple: `?changeSource=<value1>&changeSource=<value2>`
- Null: `?changeSource=null`


**currentLevel** (`String`): Current CEFR level of the user (e.g. A2, B1+, C1).

- Single (partial match, case-insensitive): `?currentLevel=<value>`
- Multiple: `?currentLevel=<value1>&currentLevel=<value2>`
- Null: `?currentLevel=null`


**userId** (`ID`): References the user whose proficiency level this is.

- Single: `?userId=<value>`
- Multiple: `?userId=<value1>&userId=<value2>`
- Null: `?userId=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistlanguagelevelprofile**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistlanguagelevelprofile',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // changeSource: '<value>' // Filter by changeSource
        // currentLevel: '<value>' // Filter by currentLevel
        // userId: '<value>' // Filter by userId
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
	"dataName": "languageLevelProfiles",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"languageLevelProfiles": [
		{
			"id": "ID",
			"changeSource": "String",
			"confidence": "Double",
			"currentLevel": "String",
			"determinedBy": "String",
			"notes": "Text",
			"updatedAtSource": "Date",
			"userId": "ID",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"profileUser": [
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
### `_fetch Listlevelprogresshistory` API
System API to fetch list of levelProgressHistory records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListLevelProgressHistory` API REST controller can be triggered via the following route:

`/v1/_fetchlistlevelprogresshistory`


**Rest Request Parameters**


**Filter Parameters**

The `_fetchListLevelProgressHistory` api supports 4 optional filter parameters for filtering list results:

**changeSource** (`String`): What triggered the change (e.g. 'writing', 'reading', 'speaking', 'manual', etc).

- Single (partial match, case-insensitive): `?changeSource=<value>`
- Multiple: `?changeSource=<value1>&changeSource=<value2>`
- Null: `?changeSource=null`


**determinedBy** (`String`): Who/what set the new level: 'auto', 'manual', 'teacher', etc.

- Single (partial match, case-insensitive): `?determinedBy=<value>`
- Multiple: `?determinedBy=<value1>&determinedBy=<value2>`
- Null: `?determinedBy=null`


**toLevel** (`String`): The new CEFR level assigned/detected.

- Single (partial match, case-insensitive): `?toLevel=<value>`
- Multiple: `?toLevel=<value1>&toLevel=<value2>`
- Null: `?toLevel=null`


**userId** (`ID`): References the user whose level changed.

- Single: `?userId=<value>`
- Multiple: `?userId=<value1>&userId=<value2>`
- Null: `?userId=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistlevelprogresshistory**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistlevelprogresshistory',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // changeSource: '<value>' // Filter by changeSource
        // determinedBy: '<value>' // Filter by determinedBy
        // toLevel: '<value>' // Filter by toLevel
        // userId: '<value>' // Filter by userId
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
	"dataName": "levelProgressHistories",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"levelProgressHistories": [
		{
			"id": "ID",
			"changedAt": "Date",
			"changeSource": "String",
			"confidence": "Double",
			"determinedBy": "String",
			"fromLevel": "String",
			"notes": "Text",
			"reason": "String",
			"toLevel": "String",
			"userId": "ID",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"historyUser": [
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





# **SOLVIO**

**FRONTEND GUIDE FOR AI CODING AGENTS - PART 6 - AiAgent Service**

This document is a part of a REST API guide for the solvio project.
It is designed for AI agents that will generate frontend code to consume the project’s backend.

This document provides extensive instruction for the usage of aiAgent

## Service Access

AiAgent service management is handled through service specific base urls.

AiAgent  service may be deployed to the preview server, staging server, or production server. Therefore,it has 3 access URLs.
The frontend application must support all deployment environments during development, and the user should be able to select the target API server on the login page (already handled in first part.).

For the aiAgent service, the base URLs are:

* **Preview:** `https://solvio.prw.mindbricks.com/aiagent-api`
* **Staging:** `https://solvio-stage.mindbricks.co/aiagent-api`
* **Production:** `https://solvio.mindbricks.co/aiagent-api`

### Tenant URL Prefix and Header Forwarding

Tenant context is resolved by frontend routing strategy:
- preview/test: URL prefix `/{tenantCodename}` (example: `/babil/products`)
- production: tenant subdomain (example: `babil.appname...`)

Then backend API calls must always claim target tenant with header:

```js
headers["mbx-school-codename"] = tenantCodenameFromUrl;
```

URL prefix/subdomain is frontend-only tenant selection. Use header forwarding for all tenant-scoped calls to `aiAgent` service.

## Scope

**AiAgent Service Description**

Manages multimodal agent sessions, wake word, command parsing, and action orchestration for Solvio. Logs all agent interactions and command tool usage for analytics and reference.

AiAgent service provides apis and business logic for following data objects in solvio application. 
Each data object may be either a central domain of the application data structure or a related helper data object for a central concept.
Note that data object concept is equal to table concept in the database, in the service database each data object is represented as a db table scheme and the object instances as table rows.  


**`agentCommand` Data Object**: Individual command/request issued to the AI agent during a session. Stores parsed intent/tool, routed action, and response/result.

**`agentSession` Data Object**: AI agent session tracking user wake-up (listen), context, and modality for session-based tool orchestration and analytics.


## AiAgent Service Frontend Description By The Backend Architect

The aiAgent service is used for orchestrating all voice-activated and multimodal AI agent interactions in Solvio. Use it to start, track, and summarize agent sessions triggered by the user (wake word or manual), and to log each agent command issued (summarize, look up, OCR, etc.). You can display the user's personal agent history, session summaries with tool invocations and results, and analytics of action types used. Do NOT use this service for direct tool or AI evaluation calls (these are handled by skill-lab services or external APIs).

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


## AgentCommand Data Object

Individual command/request issued to the AI agent during a session. Stores parsed intent/tool, routed action, and response/result.

### AgentCommand  Data Object Frontend Description By The Backend Architect

An agentCommand represents one user command or AI-agent action — e.g., 'summarize', 'look up word', 'OCR', 'voice coaching start', etc. Used for showing personal command history in a session or across time, or for audit trails and analytics. Show only to command/session owner or admins/teachers in current tenant.


### AgentCommand Data Object Properties

AgentCommand data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `actionResult` | String | false | No | No | Serialized result/output (JSON, text, url, etc.) of executed action/tool. |
| `agentSessionId` | ID | false | Yes | No | Linked session for the command (required). |
| `commandText` | String | false | Yes | No | Raw command text uttered or input by user (pre-parsing). |
| `commandType` | String | false | Yes | No | Type/category of command: e.g., summarize, ocr, research, vocabAdd, etc. |
| `executedAt` | Date | false | Yes | No | When command was handled. |
| `resolvedAction` | String | false | Yes | No | Action routed by the agent after parsing (e.g., tool used, function invoked, etc.). |
| `schoolId` | ID | false | Yes | No | An ID value to represent the tenant id of the school |
* Required properties are mandatory for creating objects and must be provided in the request body if no default value, formula or session bind is set.




### Relation Properties

`agentSessionId`

Mindbricks supports relations between data objects, allowing you to define how objects are linked together.
The relations may reference to a data object either in this service or in another service. Id the reference is remote, backend handles the relations through service communication or elastic search.
These relations should be respected in the frontend so that instaead of showing the related objects id, the frontend should list human readable values from other data objects.
If the relation points to another service, frontend should use the referenced service api in case it needs related data.
The relation logic is montly handled in backend so the api responses feeds the frontend about the relational data. 
In mmost cases the api response will provide the relational data as well as the main one.

In frontend, please ensure that, 

1- instaead of these relational ids you show the main human readable field of the related target data (like name),
2- if this data object needs a user input of these relational ids, you should provide a combobox with the list of possible records or (a searchbox) to select with the realted target data object main human readable field.


- **agentSessionId**: ID
Relation to `agentSession`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: Yes


### Filter Properties

`schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **schoolId**: ID  has a filter named `schoolId`


## AgentSession Data Object

AI agent session tracking user wake-up (listen), context, and modality for session-based tool orchestration and analytics.

### AgentSession  Data Object Frontend Description By The Backend Architect

An agentSession represents a single wake cycle or continuous dialogue between the user and the AI agent. Use to show ongoing/recent agent usage, resume incomplete contextual help/sessions, or display past multimodal interaction history. Sensitive user data — show only to session owner or tenant/admin roles as permitted.


### AgentSession Data Object Properties

AgentSession data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `context` | String | false | No | No | Agent session context blob or current state (may store serialized object, prompt, etc.). |
| `endedAt` | Date | false | No | No | Session end timestamp (null if still live). |
| `sessionType` | Enum | false | Yes | No | Session modality: chat, voice, or command-only. |
| `startedAt` | Date | false | Yes | No | Session start timestamp. |
| `userId` | ID | false | Yes | No | User owning the session (references auth:user). |
| `wakeWord` | String | false | Yes | No | Wake word or phrase detected to start agent session (e.g., 'Hey Assistant'). |
| `schoolId` | ID | false | Yes | No | An ID value to represent the tenant id of the school |
* Required properties are mandatory for creating objects and must be provided in the request body if no default value, formula or session bind is set.



### Enum Properties
Enum properties are defined with a set of allowed values, ensuring that only valid options can be assigned to them. 
The enum options value will be stored as strings in the database, 
but when a data object is created an additional property with the same name plus an idx suffix will be created, which will hold the index of the selected enum option.
You can use the {fieldName_idx} property to sort by the enum value or when your enum options represent a hiyerarchy of values.
In the frontend input components, enum type properties should only accept values from an option component that lists the enum options.

- **sessionType**: [chat, voice, command]


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

`schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **schoolId**: ID  has a filter named `schoolId`



## Default CRUD APIs

For each data object, the backend architect may designate **default APIs** for standard operations (create, update, delete, get, list). These are the APIs that frontend CRUD forms and AI agents should use for basic record management. If no default is explicitly set (`isDefaultApi`), the frontend generator auto-discovers the most general API for each operation.

### AgentCommand Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `createAgentCommand` | `/v1/agentcommands` | Auto |
| Update | `updateAgentCommand` | `/v1/agentcommands/:agentCommandId` | Auto |
| Delete | `deleteAgentCommand` | `/v1/agentcommands/:agentCommandId` | Auto |
| Get | `getAgentCommand` | `/v1/agentcommands/:agentCommandId` | Auto |
| List | `listAgentCommands` | `/v1/agentcommands` | System |
### AgentSession Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `createAgentSession` | `/v1/agentsessions` | Auto |
| Update | `updateAgentSession` | `/v1/agentsessions/:agentSessionId` | Auto |
| Delete | `deleteAgentSession` | `/v1/agentsessions/:agentSessionId` | Auto |
| Get | `getAgentSession` | `/v1/agentsessions/:agentSessionId` | Auto |
| List | `listAgentSessions` | `/v1/agentsessions` | System |

When building CRUD forms for a data object, use the default create/update APIs listed above. The form fields should correspond to the API's body parameters. For relation fields, render a dropdown loaded from the related object's list API using the display label property.


## API Reference

### `Create Agentcommand` API
Log a command issued to the agent during a session. Captures command text, type, routed action, and raw result. Used for each interpreted input during an agentSession.

**API Frontend Description By The Backend Architect**

Each time the agent parses and fulfills a user request (summarize, ocr, query), call this API to log the command, its categorized type, which action/tool was used, and the resulting output or error. Call directly after each agent command executes.

**Rest Route**

The `createAgentCommand` API REST controller can be triggered via the following route:

`/v1/agentcommands`


**Rest Request Parameters**


The `createAgentCommand` api has got 6 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| actionResult  | String  | false | request.body?.["actionResult"] |
| agentSessionId  | ID  | true | request.body?.["agentSessionId"] |
| commandText  | String  | true | request.body?.["commandText"] |
| commandType  | String  | true | request.body?.["commandType"] |
| executedAt  | Date  | true | request.body?.["executedAt"] |
| resolvedAction  | String  | true | request.body?.["resolvedAction"] |
**actionResult** : Serialized result/output (JSON, text, url, etc.) of executed action/tool.
**agentSessionId** : Linked session for the command (required).
**commandText** : Raw command text uttered or input by user (pre-parsing).
**commandType** : Type/category of command: e.g., summarize, ocr, research, vocabAdd, etc.
**executedAt** : When command was handled.
**resolvedAction** : Action routed by the agent after parsing (e.g., tool used, function invoked, etc.).


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/agentcommands**
```js
  axios({
    method: 'POST',
    url: '/v1/agentcommands',
    data: {
            actionResult:"String",  
            agentSessionId:"ID",  
            commandText:"String",  
            commandType:"String",  
            executedAt:"Date",  
            resolvedAction:"String",  
    
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
	"dataName": "agentCommand",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"agentCommand": {
		"id": "ID",
		"actionResult": "String",
		"agentSessionId": "ID",
		"commandText": "String",
		"commandType": "String",
		"executedAt": "Date",
		"resolvedAction": "String",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Create Agentsession` API
Start a new AI agent session for multimodal interaction. Logs user, wake word, session type, and stores initial context. Used when user triggers agent via wake word or manual start.

**API Frontend Description By The Backend Architect**

Use this API to start an AI agent session (contextual interaction history). Called when app listens for the wake word, starts a new help dialog, or prepares a session shell before command processing.

**Rest Route**

The `createAgentSession` API REST controller can be triggered via the following route:

`/v1/agentsessions`


**Rest Request Parameters**


The `createAgentSession` api has got 5 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| context  | String  | false | request.body?.["context"] |
| endedAt  | Date  | false | request.body?.["endedAt"] |
| sessionType  | Enum  | true | request.body?.["sessionType"] |
| startedAt  | Date  | true | request.body?.["startedAt"] |
| wakeWord  | String  | true | request.body?.["wakeWord"] |
**context** : Agent session context blob or current state (may store serialized object, prompt, etc.).
**endedAt** : Session end timestamp (null if still live).
**sessionType** : Session modality: chat, voice, or command-only.
**startedAt** : Session start timestamp.
**wakeWord** : Wake word or phrase detected to start agent session (e.g., 'Hey Assistant').


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/agentsessions**
```js
  axios({
    method: 'POST',
    url: '/v1/agentsessions',
    data: {
            context:"String",  
            endedAt:"Date",  
            sessionType:"Enum",  
            startedAt:"Date",  
            wakeWord:"String",  
    
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
	"dataName": "agentSession",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"agentSession": {
		"id": "ID",
		"context": "String",
		"endedAt": "Date",
		"sessionType": "Enum",
		"sessionType_idx": "Integer",
		"startedAt": "Date",
		"userId": "ID",
		"wakeWord": "String",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Delete Agentcommand` API
Delete (soft-delete) a command log (for user privacy/GDPR or admin correction). Only admin or session owner via session navigation.

**API Frontend Description By The Backend Architect**

Allows user to delete (hide) their agent command logs if desired. Admins can remove problematic entries for compliance/audit/history correction. Soft-delete only.

**Rest Route**

The `deleteAgentCommand` API REST controller can be triggered via the following route:

`/v1/agentcommands/:agentCommandId`


**Rest Request Parameters**


The `deleteAgentCommand` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| agentCommandId  | ID  | true | request.params?.["agentCommandId"] |
**agentCommandId** : This id paremeter is used to select the required data object that will be deleted


**REST Request**
To access the api you can use the **REST** controller with the path **DELETE  /v1/agentcommands/:agentCommandId**
```js
  axios({
    method: 'DELETE',
    url: `/v1/agentcommands/${agentCommandId}`,
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
	"dataName": "agentCommand",
	"method": "DELETE",
	"action": "delete",
	"appVersion": "Version",
	"rowCount": 1,
	"agentCommand": {
		"id": "ID",
		"actionResult": "String",
		"agentSessionId": "ID",
		"commandText": "String",
		"commandType": "String",
		"executedAt": "Date",
		"resolvedAction": "String",
		"schoolId": "ID",
		"isActive": false,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Delete Agentsession` API
Delete (soft-delete) an agent session and cascade to delete associated commands. Only session owner or admin roles may delete.

**API Frontend Description By The Backend Architect**

Deletes an agent session and its command logs (for privacy/GDPR purposes; shows as removed in UI). Not reversible. User can clear their own session history from profile.

**Rest Route**

The `deleteAgentSession` API REST controller can be triggered via the following route:

`/v1/agentsessions/:agentSessionId`


**Rest Request Parameters**


The `deleteAgentSession` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| agentSessionId  | ID  | true | request.params?.["agentSessionId"] |
**agentSessionId** : This id paremeter is used to select the required data object that will be deleted


**REST Request**
To access the api you can use the **REST** controller with the path **DELETE  /v1/agentsessions/:agentSessionId**
```js
  axios({
    method: 'DELETE',
    url: `/v1/agentsessions/${agentSessionId}`,
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
	"dataName": "agentSession",
	"method": "DELETE",
	"action": "delete",
	"appVersion": "Version",
	"rowCount": 1,
	"agentSession": {
		"id": "ID",
		"context": "String",
		"endedAt": "Date",
		"sessionType": "Enum",
		"sessionType_idx": "Integer",
		"startedAt": "Date",
		"userId": "ID",
		"wakeWord": "String",
		"schoolId": "ID",
		"isActive": false,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Get Agentcommand` API
Retrieve a single agent command log (details of command, tool, action, etc.). Owner or admin only.

**API Frontend Description By The Backend Architect**

Returns full metadata and results for a single command issued within an agent session (including command, action routing, and outcome/result). Used for audit screens or agent debugging.

**Rest Route**

The `getAgentCommand` API REST controller can be triggered via the following route:

`/v1/agentcommands/:agentCommandId`


**Rest Request Parameters**


The `getAgentCommand` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| agentCommandId  | ID  | true | request.params?.["agentCommandId"] |
**agentCommandId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/agentcommands/:agentCommandId**
```js
  axios({
    method: 'GET',
    url: `/v1/agentcommands/${agentCommandId}`,
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
	"dataName": "agentCommand",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"agentCommand": {
		"id": "ID",
		"actionResult": "String",
		"agentSessionId": "ID",
		"commandText": "String",
		"commandType": "String",
		"executedAt": "Date",
		"resolvedAction": "String",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID",
		"session_": {
			"sessionType": "Enum",
			"sessionType_idx": "Integer",
			"startedAt": "Date",
			"userId": "ID"
		}
	}
}
```
### `Get Agentsession` API
Retrieve a single agentSession with all context/history. Only accessible by owner or tenant admin.

**API Frontend Description By The Backend Architect**

Get details of a specific agent session including context/state (for session resume or personal history). Only owner or tenant/admins may access.

**Rest Route**

The `getAgentSession` API REST controller can be triggered via the following route:

`/v1/agentsessions/:agentSessionId`


**Rest Request Parameters**


The `getAgentSession` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| agentSessionId  | ID  | true | request.params?.["agentSessionId"] |
**agentSessionId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/agentsessions/:agentSessionId**
```js
  axios({
    method: 'GET',
    url: `/v1/agentsessions/${agentSessionId}`,
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
	"dataName": "agentSession",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"agentSession": {
		"id": "ID",
		"context": "String",
		"endedAt": "Date",
		"sessionType": "Enum",
		"sessionType_idx": "Integer",
		"startedAt": "Date",
		"userId": "ID",
		"wakeWord": "String",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID",
		"commands": [
			{
				"actionResult": "String",
				"commandText": "String",
				"commandType": "String",
				"executedAt": "Date",
				"resolvedAction": "String"
			},
			{},
			{}
		]
	}
}
```
### `List Agentcommands` API
List agent commands with filters (by session, user). Owner or admin only. Use for agent history in a session or analytics.

**API Frontend Description By The Backend Architect**

Returns paginated commands for the current user or session context, filterable by session, user, commandType. Used to build personal agent history, audit trails, or tools analytics for tenant admins/owners.

**Rest Route**

The `listAgentCommands` API REST controller can be triggered via the following route:

`/v1/agentcommands`


**Rest Request Parameters**
The `listAgentCommands` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/agentcommands**
```js
  axios({
    method: 'GET',
    url: '/v1/agentcommands',
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
	"dataName": "agentCommands",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"agentCommands": [
		{
			"id": "ID",
			"actionResult": "String",
			"agentSessionId": "ID",
			"commandText": "String",
			"commandType": "String",
			"executedAt": "Date",
			"resolvedAction": "String",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"session_": [
				{
					"sessionType": "Enum",
					"sessionType_idx": "Integer",
					"userId": "ID"
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
### `List Agentsessions` API
List agent sessions for the current user or for tenant (admin). Filterable by userId, startedAt, sessionType.

**API Frontend Description By The Backend Architect**

Returns a paginated list of agent sessions (history) for display in profile or admin analytics. User sees own sessions, tenant owners/admins can see all for tenant. Filters for startedAt and sessionType are recommended for UI.

**Rest Route**

The `listAgentSessions` API REST controller can be triggered via the following route:

`/v1/agentsessions`


**Rest Request Parameters**
The `listAgentSessions` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/agentsessions**
```js
  axios({
    method: 'GET',
    url: '/v1/agentsessions',
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
	"dataName": "agentSessions",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"agentSessions": [
		{
			"id": "ID",
			"context": "String",
			"endedAt": "Date",
			"sessionType": "Enum",
			"sessionType_idx": "Integer",
			"startedAt": "Date",
			"userId": "ID",
			"wakeWord": "String",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"commands": [
				{
					"commandType": "String",
					"executedAt": "Date"
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
### `Update Agentcommand` API
Update previous agentCommand log (e.g., to edit or correct actionResult due to error, rare/manual).

**API Frontend Description By The Backend Architect**

Error correction by admin only; normally agent logs one command per action. May be used for restoration or manual patch.

**Rest Route**

The `updateAgentCommand` API REST controller can be triggered via the following route:

`/v1/agentcommands/:agentCommandId`


**Rest Request Parameters**


The `updateAgentCommand` api has got 2 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| agentCommandId  | ID  | true | request.params?.["agentCommandId"] |
| actionResult  | String  | false | request.body?.["actionResult"] |
**agentCommandId** : This id paremeter is used to select the required data object that will be updated
**actionResult** : Serialized result/output (JSON, text, url, etc.) of executed action/tool.


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/agentcommands/:agentCommandId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/agentcommands/${agentCommandId}`,
    data: {
            actionResult:"String",  
    
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
	"dataName": "agentCommand",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"agentCommand": {
		"id": "ID",
		"actionResult": "String",
		"agentSessionId": "ID",
		"commandText": "String",
		"commandType": "String",
		"executedAt": "Date",
		"resolvedAction": "String",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Update Agentsession` API
Update context or end time for a live agent session (e.g., on session end or state update).

**API Frontend Description By The Backend Architect**

Update the agent session, e.g., to close/end a session (set endedAt), or update context if needed by agent orchestration. Must match session owner or admin.

**Rest Route**

The `updateAgentSession` API REST controller can be triggered via the following route:

`/v1/agentsessions/:agentSessionId`


**Rest Request Parameters**


The `updateAgentSession` api has got 3 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| agentSessionId  | ID  | true | request.params?.["agentSessionId"] |
| context  | String  | false | request.body?.["context"] |
| endedAt  | Date  | false | request.body?.["endedAt"] |
**agentSessionId** : This id paremeter is used to select the required data object that will be updated
**context** : Agent session context blob or current state (may store serialized object, prompt, etc.).
**endedAt** : Session end timestamp (null if still live).


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/agentsessions/:agentSessionId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/agentsessions/${agentSessionId}`,
    data: {
            context:"String",  
            endedAt:"Date",  
    
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
	"dataName": "agentSession",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"agentSession": {
		"id": "ID",
		"context": "String",
		"endedAt": "Date",
		"sessionType": "Enum",
		"sessionType_idx": "Integer",
		"startedAt": "Date",
		"userId": "ID",
		"wakeWord": "String",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `_fetch Listagentcommand` API
System API to fetch list of agentCommand records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListAgentCommand` API REST controller can be triggered via the following route:

`/v1/_fetchlistagentcommand`


**Rest Request Parameters**
The `_fetchListAgentCommand` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistagentcommand**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistagentcommand',
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
	"dataName": "agentCommands",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"agentCommands": [
		{
			"id": "ID",
			"actionResult": "String",
			"agentSessionId": "ID",
			"commandText": "String",
			"commandType": "String",
			"executedAt": "Date",
			"resolvedAction": "String",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"agentSessionCommand": [
				{
					"context": "String",
					"endedAt": "Date",
					"sessionType": "Enum",
					"sessionType_idx": "Integer",
					"startedAt": "Date",
					"userId": "ID",
					"wakeWord": "String"
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
### `_fetch Listagentsession` API
System API to fetch list of agentSession records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListAgentSession` API REST controller can be triggered via the following route:

`/v1/_fetchlistagentsession`


**Rest Request Parameters**
The `_fetchListAgentSession` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistagentsession**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistagentsession',
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
	"dataName": "agentSessions",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"agentSessions": [
		{
			"id": "ID",
			"context": "String",
			"endedAt": "Date",
			"sessionType": "Enum",
			"sessionType_idx": "Integer",
			"startedAt": "Date",
			"userId": "ID",
			"wakeWord": "String",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"sessionUser": [
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



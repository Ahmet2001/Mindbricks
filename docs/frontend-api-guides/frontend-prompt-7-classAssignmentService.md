

# **SOLVIO**

**FRONTEND GUIDE FOR AI CODING AGENTS - PART 7 - ClassAssignment Service**

This document is a part of a REST API guide for the solvio project.
It is designed for AI agents that will generate frontend code to consume the project’s backend.

This document provides extensive instruction for the usage of classAssignment

## Service Access

ClassAssignment service management is handled through service specific base urls.

ClassAssignment  service may be deployed to the preview server, staging server, or production server. Therefore,it has 3 access URLs.
The frontend application must support all deployment environments during development, and the user should be able to select the target API server on the login page (already handled in first part.).

For the classAssignment service, the base URLs are:

* **Preview:** `https://solvio.prw.mindbricks.com/classassignment-api`
* **Staging:** `https://solvio-stage.mindbricks.co/classassignment-api`
* **Production:** `https://solvio.mindbricks.co/classassignment-api`

### Tenant URL Prefix and Header Forwarding

Tenant context is resolved by frontend routing strategy:
- preview/test: URL prefix `/{tenantCodename}` (example: `/babil/products`)
- production: tenant subdomain (example: `babil.appname...`)

Then backend API calls must always claim target tenant with header:

```js
headers["mbx-school-codename"] = tenantCodenameFromUrl;
```

URL prefix/subdomain is frontend-only tenant selection. Use header forwarding for all tenant-scoped calls to `classAssignment` service.

## Scope

**ClassAssignment Service Description**

Manages digital classrooms, student enrollments, and assignment distribution within tenant schools for Solvio. Supports invitation-based and independent study models. Allows teachers to orchestrate class rosters, groupings, and targeted assignments across all skill areas.

ClassAssignment service provides apis and business logic for following data objects in solvio application. 
Each data object may be either a central domain of the application data structure or a related helper data object for a central concept.
Note that data object concept is equal to table concept in the database, in the service database each data object is represented as a db table scheme and the object instances as table rows.  


**`classAssignmentAssignment` Data Object**: Assignment issued by a teacher, linked optionally to a class and/or an individual student. Used for all skill types. Controls distribution, deadlines, status, and proficiency targeting.
Note: Named uniquely to avoid conflicts with reserved names.

**`classEnrollment` Data Object**: Enrollment record linking a student to a classroom. Captures type (invited/independent) and join date. Used for class rosters, access, and analytics.

**`classroom` Data Object**: A digital classroom attached to a school (tenant) and managed by a teacher. Holds roster, access code, and optional proficiency group label.


## ClassAssignment Service Frontend Description By The Backend Architect

# Backend Service: classAssignment
This service manages classroom creation/administration (teacher UX), student self-enrollment/invitation (student UX), roster/analytics dashboards, and flexible assignment flows. Key behaviors:
- Teachers use digital class objects to administer rosters and control access. 
- Invitation codes are surfaced to teachers for easy sharing; enrollment flows consume these for joining.
- Class roster views update in real time as students join/leave; teachers can remove students.
- All assignments are visible per-class, per-student, and optionally for 'independent study' mode.
- Level groups are leveraged for differentiation.


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


## ClassAssignmentAssignment Data Object

Assignment issued by a teacher, linked optionally to a class and/or an individual student. Used for all skill types. Controls distribution, deadlines, status, and proficiency targeting.
Note: Named uniquely to avoid conflicts with reserved names.

### ClassAssignmentAssignment  Data Object Frontend Description By The Backend Architect

Teachers create assignments for classes, groups, or individuals. Assignment details/links available to enrolled students. Independent study assignments have no associated classroom.


### ClassAssignmentAssignment Data Object Properties

ClassAssignmentAssignment data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `assignedById` | ID | false | Yes | No | Teacher creating the assignment. |
| `classroomId` | ID | false | No | No | Classroom receiving assignment. Nullable for independent student assignments. |
| `contentId` | ID | false | Yes | No | References the content (prompt/template/passages/etc.) for this assignment. Foreign keys elsewhere. |
| `dueDate` | Date | false | Yes | No | Deadline for assignment completion. |
| `proficiencyLevel` | String | false | No | No | Targeted language proficiency (e.g., B1+, C1). Optional, for level grouping. |
| `skillType` | Enum | false | Yes | No | Assignment type: writing, speaking, reading, listening. |
| `status` | Enum | false | Yes | No | Workflow state: draft/active/closed. |
| `targetStudentId` | ID | false | No | No | If set, assignment is targeted at this individual; else applies to all class members. |
| `schoolId` | ID | false | Yes | No | An ID value to represent the tenant id of the school |
* Required properties are mandatory for creating objects and must be provided in the request body if no default value, formula or session bind is set.



### Enum Properties
Enum properties are defined with a set of allowed values, ensuring that only valid options can be assigned to them. 
The enum options value will be stored as strings in the database, 
but when a data object is created an additional property with the same name plus an idx suffix will be created, which will hold the index of the selected enum option.
You can use the {fieldName_idx} property to sort by the enum value or when your enum options represent a hiyerarchy of values.
In the frontend input components, enum type properties should only accept values from an option component that lists the enum options.

- **skillType**: [writing, speaking, reading, listening]

- **status**: [active, closed, draft]


### Relation Properties

`assignedById` `classroomId` `targetStudentId`

Mindbricks supports relations between data objects, allowing you to define how objects are linked together.
The relations may reference to a data object either in this service or in another service. Id the reference is remote, backend handles the relations through service communication or elastic search.
These relations should be respected in the frontend so that instaead of showing the related objects id, the frontend should list human readable values from other data objects.
If the relation points to another service, frontend should use the referenced service api in case it needs related data.
The relation logic is montly handled in backend so the api responses feeds the frontend about the relational data. 
In mmost cases the api response will provide the relational data as well as the main one.

In frontend, please ensure that, 

1- instaead of these relational ids you show the main human readable field of the related target data (like name),
2- if this data object needs a user input of these relational ids, you should provide a combobox with the list of possible records or (a searchbox) to select with the realted target data object main human readable field.


- **assignedById**: ID
Relation to `user`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: Yes

- **classroomId**: ID
Relation to `classroom`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: No

- **targetStudentId**: ID
Relation to `user`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: No


### Filter Properties

`classroomId` `proficiencyLevel` `skillType` `status` `schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **classroomId**: ID  has a filter named `classroomId`

- **proficiencyLevel**: String  has a filter named `proficiencyLevel`

- **skillType**: Enum  has a filter named `skillType`

- **status**: Enum  has a filter named `status`

- **schoolId**: ID  has a filter named `schoolId`


## ClassEnrollment Data Object

Enrollment record linking a student to a classroom. Captures type (invited/independent) and join date. Used for class rosters, access, and analytics.

### ClassEnrollment  Data Object Frontend Description By The Backend Architect

Student and teacher dashboards show members by class. Allows removal/transfer by teacher. Enables independent study without class link.


### ClassEnrollment Data Object Properties

ClassEnrollment data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `classroomId` | ID | false | Yes | No | References classroom being joined. |
| `enrollmentType` | Enum | false | Yes | No | How the student enrolled: invited (via teacher/code) or independent. |
| `joinedAt` | Date | false | Yes | No | Date/time the student joined the classroom. Set at creation. |
| `studentId` | ID | false | Yes | No | References student (auth:user). |
| `schoolId` | ID | false | Yes | No | An ID value to represent the tenant id of the school |
* Required properties are mandatory for creating objects and must be provided in the request body if no default value, formula or session bind is set.



### Enum Properties
Enum properties are defined with a set of allowed values, ensuring that only valid options can be assigned to them. 
The enum options value will be stored as strings in the database, 
but when a data object is created an additional property with the same name plus an idx suffix will be created, which will hold the index of the selected enum option.
You can use the {fieldName_idx} property to sort by the enum value or when your enum options represent a hiyerarchy of values.
In the frontend input components, enum type properties should only accept values from an option component that lists the enum options.

- **enrollmentType**: [invited, independent]


### Relation Properties

`classroomId` `studentId`

Mindbricks supports relations between data objects, allowing you to define how objects are linked together.
The relations may reference to a data object either in this service or in another service. Id the reference is remote, backend handles the relations through service communication or elastic search.
These relations should be respected in the frontend so that instaead of showing the related objects id, the frontend should list human readable values from other data objects.
If the relation points to another service, frontend should use the referenced service api in case it needs related data.
The relation logic is montly handled in backend so the api responses feeds the frontend about the relational data. 
In mmost cases the api response will provide the relational data as well as the main one.

In frontend, please ensure that, 

1- instaead of these relational ids you show the main human readable field of the related target data (like name),
2- if this data object needs a user input of these relational ids, you should provide a combobox with the list of possible records or (a searchbox) to select with the realted target data object main human readable field.


- **classroomId**: ID
Relation to `classroom`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: Yes

- **studentId**: ID
Relation to `user`.id

The target object is a parent object, meaning that the relation is a one-to-many relationship from target to this object.

Required: Yes


### Filter Properties

`classroomId` `studentId` `schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **classroomId**: ID  has a filter named `classroomId`

- **studentId**: ID  has a filter named `studentId`

- **schoolId**: ID  has a filter named `schoolId`


## Classroom Data Object

A digital classroom attached to a school (tenant) and managed by a teacher. Holds roster, access code, and optional proficiency group label.

### Classroom  Data Object Frontend Description By The Backend Architect

In UI: Teacher can create classes and see/share invitation codes. Classes list their students and assignments. Admins see all classes within their school. Student can view the class they're enrolled in.


### Classroom Data Object Properties

Classroom data object has got following properties that are represented as table fields in the database scheme. 
These properties don't stand just for data storage, but each may have different settings to manage the business logic. 

| Property | Type | IsArray | Required | Secret | Description |
|----------|------|---------|----------|--------|-------------|
| `description` | Text | false | No | No | Optional longer description for class details/notes. |
| `invitationCode` | String | false | Yes | No | Unique code for student enrollment (per school). |
| `levelGroup` | String | false | No | No | Proficiency grouping label for differentiation; optional (e.g., A2, B1+). |
| `name` | String | false | Yes | No | Display name for the classroom, unique per school. |
| `teacherId` | ID | false | Yes | No | References teacher/owner (auth:user). |
| `schoolId` | ID | false | Yes | No | An ID value to represent the tenant id of the school |
* Required properties are mandatory for creating objects and must be provided in the request body if no default value, formula or session bind is set.




### Relation Properties

`teacherId`

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


### Filter Properties

`invitationCode` `levelGroup` `name` `schoolId`

Filter properties are used to define parameters that can be used in query filters, allowing for dynamic data retrieval based on user input or predefined criteria.
These properties are automatically mapped as API parameters in the listing API's.

- **invitationCode**: String  has a filter named `invitationCode`

- **levelGroup**: String  has a filter named `levelGroup`

- **name**: String  has a filter named `name`

- **schoolId**: ID  has a filter named `schoolId`



## Default CRUD APIs

For each data object, the backend architect may designate **default APIs** for standard operations (create, update, delete, get, list). These are the APIs that frontend CRUD forms and AI agents should use for basic record management. If no default is explicitly set (`isDefaultApi`), the frontend generator auto-discovers the most general API for each operation.

### ClassAssignmentAssignment Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `createAssignment` | `/v1/assignment` | Auto |
| Update | `updateAssignment` | `/v1/assignment/:classAssignmentAssignmentId` | Auto |
| Delete | _none_ | - | Auto |
| Get | `getAssignment` | `/v1/assignment/:classAssignmentAssignmentId` | Auto |
| List | `listAssignments` | `/v1/assignments` | System |
### ClassEnrollment Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `enrollStudent` | `/v1/enrollstudent` | Auto |
| Update | _none_ | - | Auto |
| Delete | `removeEnrollment` | `/v1/removeenrollment/:classEnrollmentId` | Auto |
| Get | `getEnrollment` | `/v1/enrollment/:classEnrollmentId` | Auto |
| List | `listEnrollmentsByClassroom` | `/v1/enrollmentsbyclassroom` | System |
### Classroom Default APIs

| Operation | API Name | Route | Explicitly Set |
|-----------|----------|-------|----------------|
| Create | `createClassroom` | `/v1/classrooms` | Auto |
| Update | `updateClassroom` | `/v1/classrooms/:classroomId` | Auto |
| Delete | `deleteClassroom` | `/v1/classrooms/:classroomId` | Auto |
| Get | `getClassroom` | `/v1/classrooms/:classroomId` | Auto |
| List | `listClassrooms` | `/v1/classrooms` | System |

When building CRUD forms for a data object, use the default create/update APIs listed above. The form fields should correspond to the API's body parameters. For relation fields, render a dropdown loaded from the related object's list API using the display label property.


## API Reference

### `Create Assignment` API
Teacher creates an assignment for a class, group, or individual. Supports all skill types, content IDs, and proficiency-level targeting. Triggers event for notification delivery.


**Rest Route**

The `createAssignment` API REST controller can be triggered via the following route:

`/v1/assignment`


**Rest Request Parameters**


The `createAssignment` api has got 7 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| classroomId  | ID  | false | request.body?.["classroomId"] |
| contentId  | ID  | true | request.body?.["contentId"] |
| dueDate  | Date  | true | request.body?.["dueDate"] |
| proficiencyLevel  | String  | false | request.body?.["proficiencyLevel"] |
| skillType  | Enum  | true | request.body?.["skillType"] |
| status  | Enum  | true | request.body?.["status"] |
| targetStudentId  | ID  | false | request.body?.["targetStudentId"] |
**classroomId** : Classroom receiving assignment. Nullable for independent student assignments.
**contentId** : References the content (prompt/template/passages/etc.) for this assignment. Foreign keys elsewhere.
**dueDate** : Deadline for assignment completion.
**proficiencyLevel** : Targeted language proficiency (e.g., B1+, C1). Optional, for level grouping.
**skillType** : Assignment type: writing, speaking, reading, listening.
**status** : Workflow state: draft/active/closed.
**targetStudentId** : If set, assignment is targeted at this individual; else applies to all class members.


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/assignment**
```js
  axios({
    method: 'POST',
    url: '/v1/assignment',
    data: {
            classroomId:"ID",  
            contentId:"ID",  
            dueDate:"Date",  
            proficiencyLevel:"String",  
            skillType:"Enum",  
            status:"Enum",  
            targetStudentId:"ID",  
    
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
	"dataName": "classAssignmentAssignment",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"classAssignmentAssignment": {
		"id": "ID",
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
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Create Classroom` API
Teacher creates a new classroom for their tenant (school), with optional description and level group. Invitation code must be unique per school.


**Rest Route**

The `createClassroom` API REST controller can be triggered via the following route:

`/v1/classrooms`


**Rest Request Parameters**


The `createClassroom` api has got 4 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| description  | Text  | false | request.body?.["description"] |
| invitationCode  | String  | true | request.body?.["invitationCode"] |
| levelGroup  | String  | false | request.body?.["levelGroup"] |
| name  | String  | true | request.body?.["name"] |
**description** : Optional longer description for class details/notes.
**invitationCode** : Unique code for student enrollment (per school).
**levelGroup** : Proficiency grouping label for differentiation; optional (e.g., A2, B1+).
**name** : Display name for the classroom, unique per school.


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/classrooms**
```js
  axios({
    method: 'POST',
    url: '/v1/classrooms',
    data: {
            description:"Text",  
            invitationCode:"String",  
            levelGroup:"String",  
            name:"String",  
    
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
	"dataName": "classroom",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"classroom": {
		"id": "ID",
		"description": "Text",
		"invitationCode": "String",
		"levelGroup": "String",
		"name": "String",
		"teacherId": "ID",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Delete Classroom` API
Delete classroom (soft-delete), only by owner (teacher) or school/tenant admin. Cascade removes class enrollments and detaches (nullifies) from assignments.


**Rest Route**

The `deleteClassroom` API REST controller can be triggered via the following route:

`/v1/classrooms/:classroomId`


**Rest Request Parameters**


The `deleteClassroom` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| classroomId  | ID  | true | request.params?.["classroomId"] |
**classroomId** : This id paremeter is used to select the required data object that will be deleted


**REST Request**
To access the api you can use the **REST** controller with the path **DELETE  /v1/classrooms/:classroomId**
```js
  axios({
    method: 'DELETE',
    url: `/v1/classrooms/${classroomId}`,
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
	"dataName": "classroom",
	"method": "DELETE",
	"action": "delete",
	"appVersion": "Version",
	"rowCount": 1,
	"classroom": {
		"id": "ID",
		"description": "Text",
		"invitationCode": "String",
		"levelGroup": "String",
		"name": "String",
		"teacherId": "ID",
		"schoolId": "ID",
		"isActive": false,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Enroll Student` API
Enroll student in classroom, validates code/key/roster constraints, supports 'independent' mode if classroomId is omitted.


**Rest Route**

The `enrollStudent` API REST controller can be triggered via the following route:

`/v1/enrollstudent`


**Rest Request Parameters**


The `enrollStudent` api has got 3 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| classroomId  | ID  | true | request.body?.["classroomId"] |
| enrollmentType  | Enum  | true | request.body?.["enrollmentType"] |
| studentId  | ID  | true | request.body?.["studentId"] |
**classroomId** : References classroom being joined.
**enrollmentType** : How the student enrolled: invited (via teacher/code) or independent.
**studentId** : References student (auth:user).


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/enrollstudent**
```js
  axios({
    method: 'POST',
    url: '/v1/enrollstudent',
    data: {
            classroomId:"ID",  
            enrollmentType:"Enum",  
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
	"dataName": "classEnrollment",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"classEnrollment": {
		"id": "ID",
		"classroomId": "ID",
		"enrollmentType": "Enum",
		"enrollmentType_idx": "Integer",
		"joinedAt": "Date",
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
### `Get Assignment` API
Get assignment by ID. Returns associated class and teacher if requested via selectJoins.


**Rest Route**

The `getAssignment` API REST controller can be triggered via the following route:

`/v1/assignment/:classAssignmentAssignmentId`


**Rest Request Parameters**


The `getAssignment` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| classAssignmentAssignmentId  | ID  | true | request.params?.["classAssignmentAssignmentId"] |
**classAssignmentAssignmentId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/assignment/:classAssignmentAssignmentId**
```js
  axios({
    method: 'GET',
    url: `/v1/assignment/${classAssignmentAssignmentId}`,
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
	"dataName": "classAssignmentAssignment",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"classAssignmentAssignment": {
		"classroom": {
			"invitationCode": "String",
			"levelGroup": "String",
			"name": "String"
		},
		"isActive": true
	}
}
```
### `Get Classroom` API
Get classroom by ID, includes full roster and assignments if requested (via selectJoins).


**Rest Route**

The `getClassroom` API REST controller can be triggered via the following route:

`/v1/classrooms/:classroomId`


**Rest Request Parameters**


The `getClassroom` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| classroomId  | ID  | true | request.params?.["classroomId"] |
**classroomId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/classrooms/:classroomId**
```js
  axios({
    method: 'GET',
    url: `/v1/classrooms/${classroomId}`,
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
	"dataName": "classroom",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"classroom": {
		"roster": [
			{
				"enrollmentType": "Enum",
				"enrollmentType_idx": "Integer",
				"joinedAt": "Date",
				"studentId": "ID"
			},
			{},
			{}
		],
		"assignments": [
			{
				"contentId": "ID",
				"dueDate": "Date",
				"proficiencyLevel": "String",
				"skillType": "Enum",
				"skillType_idx": "Integer",
				"status": "Enum",
				"status_idx": "Integer",
				"targetStudentId": "ID"
			},
			{},
			{}
		],
		"isActive": true
	}
}
```
### `Get Enrollment` API
Get enrollment record by ID (within tenant/school context).


**Rest Route**

The `getEnrollment` API REST controller can be triggered via the following route:

`/v1/enrollment/:classEnrollmentId`


**Rest Request Parameters**


The `getEnrollment` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| classEnrollmentId  | ID  | true | request.params?.["classEnrollmentId"] |
**classEnrollmentId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/enrollment/:classEnrollmentId**
```js
  axios({
    method: 'GET',
    url: `/v1/enrollment/${classEnrollmentId}`,
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
	"dataName": "classEnrollment",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"classEnrollment": {
		"id": "ID",
		"classroomId": "ID",
		"enrollmentType": "Enum",
		"enrollmentType_idx": "Integer",
		"joinedAt": "Date",
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
### `List Assignments` API
List assignments; filter by classroom, status, skillType, proficiency, targetStudent. Used for teacher dashboard, student view, analytics.


**Rest Route**

The `listAssignments` API REST controller can be triggered via the following route:

`/v1/assignments`


**Rest Request Parameters**
The `listAssignments` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/assignments**
```js
  axios({
    method: 'GET',
    url: '/v1/assignments',
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
	"dataName": "classAssignmentAssignments",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"classAssignmentAssignments": [
		{
			"classroom": [
				{
					"levelGroup": "String",
					"name": "String"
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
### `List Classrooms` API
List all classrooms available for current teacher (owned or tenant admin), with filters for name, invitationCode, levelGroup.


**Rest Route**

The `listClassrooms` API REST controller can be triggered via the following route:

`/v1/classrooms`


**Rest Request Parameters**
The `listClassrooms` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/classrooms**
```js
  axios({
    method: 'GET',
    url: '/v1/classrooms',
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
	"dataName": "classrooms",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"classrooms": [
		{
			"studentCount": [
				null,
				null,
				null
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
### `List Enrollmentsbyclassroom` API
List class members (students) by classroomId, enables teacher to view/manage roster. Filter by classroom or studentId if needed.


**Rest Route**

The `listEnrollmentsByClassroom` API REST controller can be triggered via the following route:

`/v1/enrollmentsbyclassroom`


**Rest Request Parameters**
The `listEnrollmentsByClassroom` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/enrollmentsbyclassroom**
```js
  axios({
    method: 'GET',
    url: '/v1/enrollmentsbyclassroom',
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
	"dataName": "classEnrollments",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"classEnrollments": [
		{
			"studentProfile": [
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
### `Remove Enrollment` API
Removes a student's enrollment from a classroom (by either teacher or student/owner). Used for roster management and leaving classes.


**Rest Route**

The `removeEnrollment` API REST controller can be triggered via the following route:

`/v1/removeenrollment/:classEnrollmentId`


**Rest Request Parameters**


The `removeEnrollment` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| classEnrollmentId  | ID  | true | request.params?.["classEnrollmentId"] |
**classEnrollmentId** : This id paremeter is used to select the required data object that will be deleted


**REST Request**
To access the api you can use the **REST** controller with the path **DELETE  /v1/removeenrollment/:classEnrollmentId**
```js
  axios({
    method: 'DELETE',
    url: `/v1/removeenrollment/${classEnrollmentId}`,
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
	"dataName": "classEnrollment",
	"method": "DELETE",
	"action": "delete",
	"appVersion": "Version",
	"rowCount": 1,
	"classEnrollment": {
		"id": "ID",
		"classroomId": "ID",
		"enrollmentType": "Enum",
		"enrollmentType_idx": "Integer",
		"joinedAt": "Date",
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
### `Update Assignment` API
Teacher/owner (or tenant admin) can update details of an assignment (deadline, proficiency, status) unless already closed.


**Rest Route**

The `updateAssignment` API REST controller can be triggered via the following route:

`/v1/assignment/:classAssignmentAssignmentId`


**Rest Request Parameters**


The `updateAssignment` api has got 4 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| classAssignmentAssignmentId  | ID  | true | request.params?.["classAssignmentAssignmentId"] |
| dueDate  | Date  | false | request.body?.["dueDate"] |
| proficiencyLevel  | String  | false | request.body?.["proficiencyLevel"] |
| status  | Enum  | false | request.body?.["status"] |
**classAssignmentAssignmentId** : This id paremeter is used to select the required data object that will be updated
**dueDate** : Deadline for assignment completion.
**proficiencyLevel** : Targeted language proficiency (e.g., B1+, C1). Optional, for level grouping.
**status** : Workflow state: draft/active/closed.


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/assignment/:classAssignmentAssignmentId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/assignment/${classAssignmentAssignmentId}`,
    data: {
            dueDate:"Date",  
            proficiencyLevel:"String",  
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
	"dataName": "classAssignmentAssignment",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"classAssignmentAssignment": {
		"id": "ID",
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
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Update Classroom` API
Teacher edits class details (name, description, level group, invitation code) for owned classroom within the school.


**Rest Route**

The `updateClassroom` API REST controller can be triggered via the following route:

`/v1/classrooms/:classroomId`


**Rest Request Parameters**


The `updateClassroom` api has got 5 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| classroomId  | ID  | true | request.params?.["classroomId"] |
| description  | Text  | false | request.body?.["description"] |
| invitationCode  | String  | false | request.body?.["invitationCode"] |
| levelGroup  | String  | false | request.body?.["levelGroup"] |
| name  | String  | false | request.body?.["name"] |
**classroomId** : This id paremeter is used to select the required data object that will be updated
**description** : Optional longer description for class details/notes.
**invitationCode** : Unique code for student enrollment (per school).
**levelGroup** : Proficiency grouping label for differentiation; optional (e.g., A2, B1+).
**name** : Display name for the classroom, unique per school.


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/classrooms/:classroomId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/classrooms/${classroomId}`,
    data: {
            description:"Text",  
            invitationCode:"String",  
            levelGroup:"String",  
            name:"String",  
    
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
	"dataName": "classroom",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"classroom": {
		"id": "ID",
		"description": "Text",
		"invitationCode": "String",
		"levelGroup": "String",
		"name": "String",
		"teacherId": "ID",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `_fetch Listclassassignmentassignment` API
System API to fetch list of classAssignmentAssignment records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListClassAssignmentAssignment` API REST controller can be triggered via the following route:

`/v1/_fetchlistclassassignmentassignment`


**Rest Request Parameters**


**Filter Parameters**

The `_fetchListClassAssignmentAssignment` api supports 4 optional filter parameters for filtering list results:

**classroomId** (`ID`): Classroom receiving assignment. Nullable for independent student assignments.

- Single: `?classroomId=<value>`
- Multiple: `?classroomId=<value1>&classroomId=<value2>`
- Null: `?classroomId=null`


**proficiencyLevel** (`String`): Targeted language proficiency (e.g., B1+, C1). Optional, for level grouping.

- Single (partial match, case-insensitive): `?proficiencyLevel=<value>`
- Multiple: `?proficiencyLevel=<value1>&proficiencyLevel=<value2>`
- Null: `?proficiencyLevel=null`


**skillType** (`Enum`): Assignment type: writing, speaking, reading, listening.

- Single: `?skillType=<value>` (case-insensitive)
- Multiple: `?skillType=<value1>&skillType=<value2>`
- Null: `?skillType=null`


**status** (`Enum`): Workflow state: draft/active/closed.

- Single: `?status=<value>` (case-insensitive)
- Multiple: `?status=<value1>&status=<value2>`
- Null: `?status=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistclassassignmentassignment**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistclassassignmentassignment',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // classroomId: '<value>' // Filter by classroomId
        // proficiencyLevel: '<value>' // Filter by proficiencyLevel
        // skillType: '<value>' // Filter by skillType
        // status: '<value>' // Filter by status
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
	"dataName": "classAssignmentAssignments",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"classAssignmentAssignments": [
		{
			"id": "ID",
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
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"assignedBy": [
				{
					"fullname": "String"
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
			"targetStudent": [
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
### `_fetch Listclassenrollment` API
System API to fetch list of classEnrollment records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListClassEnrollment` API REST controller can be triggered via the following route:

`/v1/_fetchlistclassenrollment`


**Rest Request Parameters**


**Filter Parameters**

The `_fetchListClassEnrollment` api supports 2 optional filter parameters for filtering list results:

**classroomId** (`ID`): References classroom being joined.

- Single: `?classroomId=<value>`
- Multiple: `?classroomId=<value1>&classroomId=<value2>`
- Null: `?classroomId=null`


**studentId** (`ID`): References student (auth:user).

- Single: `?studentId=<value>`
- Multiple: `?studentId=<value1>&studentId=<value2>`
- Null: `?studentId=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistclassenrollment**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistclassenrollment',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // classroomId: '<value>' // Filter by classroomId
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
	"dataName": "classEnrollments",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"classEnrollments": [
		{
			"id": "ID",
			"classroomId": "ID",
			"enrollmentType": "Enum",
			"enrollmentType_idx": "Integer",
			"joinedAt": "Date",
			"studentId": "ID",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
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
### `_fetch Listclassroom` API
System API to fetch list of classroom records for frontend application. Auto-generated, not visible in design.


**Rest Route**

The `_fetchListClassroom` API REST controller can be triggered via the following route:

`/v1/_fetchlistclassroom`


**Rest Request Parameters**


**Filter Parameters**

The `_fetchListClassroom` api supports 3 optional filter parameters for filtering list results:

**invitationCode** (`String`): Unique code for student enrollment (per school).

- Single (partial match, case-insensitive): `?invitationCode=<value>`
- Multiple: `?invitationCode=<value1>&invitationCode=<value2>`
- Null: `?invitationCode=null`


**levelGroup** (`String`): Proficiency grouping label for differentiation; optional (e.g., A2, B1+).

- Single (partial match, case-insensitive): `?levelGroup=<value>`
- Multiple: `?levelGroup=<value1>&levelGroup=<value2>`
- Null: `?levelGroup=null`


**name** (`String`): Display name for the classroom, unique per school.

- Single (partial match, case-insensitive): `?name=<value>`
- Multiple: `?name=<value1>&name=<value2>`
- Null: `?name=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/_fetchlistclassroom**
```js
  axios({
    method: 'GET',
    url: '/v1/_fetchlistclassroom',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // invitationCode: '<value>' // Filter by invitationCode
        // levelGroup: '<value>' // Filter by levelGroup
        // name: '<value>' // Filter by name
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
	"dataName": "classrooms",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"classrooms": [
		{
			"id": "ID",
			"description": "Text",
			"invitationCode": "String",
			"levelGroup": "String",
			"name": "String",
			"teacherId": "ID",
			"schoolId": "ID",
			"isActive": true,
			"recordVersion": "Integer",
			"createdAt": "Date",
			"updatedAt": "Date",
			"_owner": "ID",
			"school": {
				"name": "String",
				"fullname": "String"
			},
			"teacher": [
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



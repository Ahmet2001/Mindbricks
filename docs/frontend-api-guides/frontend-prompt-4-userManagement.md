

# **SOLVIO**

**FRONTEND GUIDE FOR AI CODING AGENTS - PART 4 - User Management**

This document is the 2nd part of a REST API guide for the solvio project.
It is designed for AI agents that will generate frontend code to consume the project’s backend.

This document provides extensive instruction for administrative user management.

## Service Access

User management is handled through auth service again.

Auth service may be deployed to the preview server, staging server, or production server. Therefore,it has 3 access URLs.
The frontend application must support all deployment environments during development, and the user should be able to select the target API server on the login page (already handled in first part.).

For the auth service, the base URLs are:

* **Preview:** `https://solvio.prw.mindbricks.com/auth-api`
* **Staging:** `https://solvio-stage.mindbricks.co/auth-api`
* **Production:** `https://solvio.mindbricks.co/auth-api`

Please note that any feature in this document is open to admins only. When the user logins, the response includes a roleId field.

This roleId should one of these following admin roles. `superAdmin`, `saasAdmin`,   `tenantOwner`, `tenantAdmin`

## Scope

Auth service provides following feature for user management in solvio application.

These features are already handled in the previous part.
1. User Registration
2. User Authentication
3. Password Reset
3. Email (and/or) Mobile Verification
4. Profile Management

These features will be handled in this part.
- User Management
- User Groups Management
- Permission Manageemnt

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

## User Management

User management will be one of the main parts of the administrative manageemnts, so there will be a minimal but fancy `users` page in the admin dashboard.

### User Roles

- `superadmin` : The first creator of the backend, the owner of the application, root user, has got an absolute authroization on all actions. It can not be assgined any other user. It can't be unassigned. Super admin user can not be deleted in any way.
- `saasAdmin` : The role that can be assigned to any user by the super admin. This role includes most permissions that super admin have, but admins can't assign admin roles, can't unassign an admin role, can't delete other users who have admin role. In addition to these limitations, some critical actions in the business services may also be open to only super admin.
  
- `tenantOwner` : The first creator of the school tenant. This user is automatically gets this role when they first created the tenant. They have all authroization in the scope of their school tenant. This role can't be assigned or unassgined. Tenant owner user can not be deleted unless the tenant is deleted. 
- `tenantAdmin` : The role that can be assigned to any user by the tenant owner. This role includes most permissions that tenant owner have, but tenant admins can't assign tenant admin roles, can't unassign tenant admin roles, can't delete other users who have tenant admin role. 
- `tenantUser` : The standard role that is assgined to every user when first created or registered. This role doesnt have any privilages and can access to their own data or public data. 

    

The roles object is a hardcoded object in the generated code, and it contains the following roles:
```json
{
  "superAdmin": "'superAdmin'",
  "saasAdmin": "'saasAdmin'",
  "tenantOwner": "'tenantOwner'",
  "tenantAdmin": "'tenantAdmin'",
  "tenantUser": "'tenantUser'"
}
```

Each user may have only one role, and it is given in `/login` , `/currentuser` or `/users/:userId`  response as follows

```json
{
  // ...
  "roleId":"superAdmin",
  // ...
}
```
  

## Listing Users

You can list users using the `listUsers` api. 

### `List Users` API
The list of users is filtered by the tenantId.


**Rest Route**

The `listUsers` API REST controller can be triggered via the following route:

`/v1/users`


**Rest Request Parameters**


**Filter Parameters**

The `listUsers` api supports 3 optional filter parameters for filtering list results:

**email** (`String`):  A string value to represent the user's email.

- Single (partial match, case-insensitive): `?email=<value>`
- Multiple: `?email=<value1>&email=<value2>`
- Null: `?email=null`


**fullname** (`String`): A string value to represent the fullname of the user

- Single (partial match, case-insensitive): `?fullname=<value>`
- Multiple: `?fullname=<value1>&fullname=<value2>`
- Null: `?fullname=null`


**roleId** (`String`): A string value to represent the roleId of the user.

- Single (partial match, case-insensitive): `?roleId=<value>`
- Multiple: `?roleId=<value1>&roleId=<value2>`
- Null: `?roleId=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/users**
```js
  axios({
    method: 'GET',
    url: '/v1/users',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // email: '<value>' // Filter by email
        // fullname: '<value>' // Filter by fullname
        // roleId: '<value>' // Filter by roleId
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
	"dataName": "users",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"users": [
		{
			"id": "ID",
			"email": "String",
			"password": "String",
			"fullname": "String",
			"avatar": "String",
			"roleId": "String",
			"emailVerified": "Boolean",
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
## Searching Users
You may search users with their full names and emails. The search is done in elasticsearch index of the user table so a fast response is provided by the backend. You can send search request on each character update in the search box but start searching after 3 chars.
The keyword parameter that is used in the business logic of the api, is read from the keyword query parameter.

eg: `GET /v1/searchusers?keyword=Joe`

When the user deletes the search keyword, use the `listUsers` api to get the full list again.

### `Search Users` API
The list of users is filtered by the tenantId.


**Rest Route**

The `searchUsers` API REST controller can be triggered via the following route:

`/v1/searchusers`


**Rest Request Parameters**


The `searchUsers` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| keyword  | String  | true | request.query?.["keyword"] |
**keyword** : 

**Filter Parameters**

The `searchUsers` api supports 1 optional filter parameter for filtering list results:

**roleId** (`String`): A string value to represent the roleId of the user.

- Single (partial match, case-insensitive): `?roleId=<value>`
- Multiple: `?roleId=<value1>&roleId=<value2>`
- Null: `?roleId=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/searchusers**
```js
  axios({
    method: 'GET',
    url: '/v1/searchusers',
    data: {
    
    },
    params: {
             keyword:'"String"',  
    
        // Filter parameters (see Filter Parameters section above)
        // roleId: '<value>' // Filter by roleId
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
	"dataName": "users",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"users": [
		{
			"id": "ID",
			"email": "String",
			"password": "String",
			"fullname": "String",
			"avatar": "String",
			"roleId": "String",
			"emailVerified": "Boolean",
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
#### Pagination
When you list the users please use pagination. To be able to use pagination you should provide a `pageNumber` paramater in the query. The default row count for one page is 25, add an option for user to change it to 50 or 100. You can provide this value to the api through the `pageRowCount` parameter;

`GET /users?pageNumber=1&pageRowCount=50`

## Creatng Users

The user management console in the admin dashboard should provide UX components for user creating by admins. When creating users, it should also be possible to upload user avatar. Note that when creating, updating users , admins can not set emailVerified (or mobileVerified if exists) as true, since it is a logical mechanism and should be verified only through verification processes. 

### `Create User` API
This api is used by admin roles to create a new user manually from admin panels


**Rest Route**

The `createUser` API REST controller can be triggered via the following route:

`/v1/users`


**Rest Request Parameters**


The `createUser` api has got 4 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| avatar  | String  | false | request.body?.["avatar"] |
| email  | String  | true | request.body?.["email"] |
| password  | String  | true | request.body?.["password"] |
| fullname  | String  | true | request.body?.["fullname"] |
**avatar** : The avatar url of the user. If not sent, a default random one will be generated.
**email** :  A string value to represent the user's email.
**password** :  A string value to represent the user's password. It will be stored as hashed.
**fullname** : A string value to represent the fullname of the user


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/users**
```js
  axios({
    method: 'POST',
    url: '/v1/users',
    data: {
            avatar:"String",  
            email:"String",  
            password:"String",  
            fullname:"String",  
    
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
	"dataName": "user",
	"method": "POST",
	"action": "create",
	"appVersion": "Version",
	"rowCount": 1,
	"user": {
		"id": "ID",
		"email": "String",
		"password": "String",
		"fullname": "String",
		"avatar": "String",
		"roleId": "String",
		"emailVerified": "Boolean",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### Avatar Upload

Normally when user registers by his own, the avatar is uploaded to the logged in user's public bucket, however in this user admin panel, if any avatar upload is needed, it should be uploaded to the application public bucket. To access this application bucket, the `applicationBucketToken` should be used in the bearer header, and the bucketId in the payload should be given as 
`"solvio-public-common-bucket"` .


Note that since this application is mult-tenant the application bucket can only be used by saas-admins for the saas users. Tenant owners and tenant admins should use the tenant bucket with `tenantBucketToken`.
The tenant bucket id for a school is 
`"solvio-{tenantCodename}-public-tenant-bucket"`


Before the avatar upload, a specific componenet from `react-easy-crop` lib should be used for zoom, pan and crop. This component also requested in the PART 1 prompt for profile page, so ensure taht you reuse the previous code if exists.

## Updating Users

User update is possible by `updateUser`api. However since this update api is also called by teh user themselves it is lmited with name and avatar change (or any other user related property). 
For roleId and password updates seperate apis are used. So arrange the user update UI as to update the user info, as to set roleId and as to update password. 

### `Update User` API
This route is used by admins to update user profiles.


**Rest Route**

The `updateUser` API REST controller can be triggered via the following route:

`/v1/users/:userId`


**Rest Request Parameters**


The `updateUser` api has got 3 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| userId  | ID  | true | request.params?.["userId"] |
| fullname  | String  | false | request.body?.["fullname"] |
| avatar  | String  | false | request.body?.["avatar"] |
**userId** : This id paremeter is used to select the required data object that will be updated
**fullname** : A string value to represent the fullname of the user
**avatar** : The avatar url of the user. A random avatar will be generated if not provided


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/users/:userId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/users/${userId}`,
    data: {
            fullname:"String",  
            avatar:"String",  
    
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
	"dataName": "user",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"user": {
		"id": "ID",
		"email": "String",
		"password": "String",
		"fullname": "String",
		"avatar": "String",
		"roleId": "String",
		"emailVerified": "Boolean",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
For role updates there are some rules.
1. Superadmin role can not be unassigned even by superadmin.
2. Admin roles can be assgined or unassgined only by superadmin.
3. All other roles can be assigned and unassgined by admins and superadmin.

For password updates there are some rules.
1. Superadmin and admin passwords can be updated only by superadmin. 
2. Admins can update only non-admin passwords.

### `Update Userrole` API
This route is used by admin roles to update the user role.The default role is tenantUser when a tenant user is registered. A tenant user's role can be updated by tenantAdmin / tenantOwner, while saas user's role is updated by superAdmin or saasAdmin


**Rest Route**

The `updateUserRole` API REST controller can be triggered via the following route:

`/v1/userrole/:userId`


**Rest Request Parameters**


The `updateUserRole` api has got 2 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| userId  | ID  | true | request.params?.["userId"] |
| roleId  | String  | true | request.body?.["roleId"] |
**userId** : This id paremeter is used to select the required data object that will be updated
**roleId** : The new roleId of the user to be updated


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/userrole/:userId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/userrole/${userId}`,
    data: {
            roleId:"String",  
    
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
	"dataName": "user",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"user": {
		"id": "ID",
		"email": "String",
		"password": "String",
		"fullname": "String",
		"avatar": "String",
		"roleId": "String",
		"emailVerified": "Boolean",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### `Update Userpasswordbyadmin` API
This route is used to change any user password by admins only. Superadmin can chnage all passwords, admins can change only nonadmin passwords


**Rest Route**

The `updateUserPasswordByAdmin` API REST controller can be triggered via the following route:

`/v1/userpasswordbyadmin/:userId`


**Rest Request Parameters**


The `updateUserPasswordByAdmin` api has got 2 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| userId  | ID  | true | request.params?.["userId"] |
| password  | String  | true | request.body?.["password"] |
**userId** : This id paremeter is used to select the required data object that will be updated
**password** : The new password of the user to be updated


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/userpasswordbyadmin/:userId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/userpasswordbyadmin/${userId}`,
    data: {
            password:"String",  
    
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
	"dataName": "user",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"user": {
		"id": "ID",
		"email": "String",
		"password": "String",
		"fullname": "String",
		"avatar": "String",
		"roleId": "String",
		"emailVerified": "Boolean",
		"schoolId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
### Deleting Users

Deleting users is possible in certain conditions.

1. SuperAdmin can not be deleted.
2. Admins can be deleted by only superadmin.
3. Users can be deleted by admins or superadmin.

### `Delete User` API
This api is used by admins to delete user profiles.


**Rest Route**

The `deleteUser` API REST controller can be triggered via the following route:

`/v1/users/:userId`


**Rest Request Parameters**


The `deleteUser` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| userId  | ID  | true | request.params?.["userId"] |
**userId** : This id paremeter is used to select the required data object that will be deleted


**REST Request**
To access the api you can use the **REST** controller with the path **DELETE  /v1/users/:userId**
```js
  axios({
    method: 'DELETE',
    url: `/v1/users/${userId}`,
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
	"dataName": "user",
	"method": "DELETE",
	"action": "delete",
	"appVersion": "Version",
	"rowCount": 1,
	"user": {
		"id": "ID",
		"email": "String",
		"password": "String",
		"fullname": "String",
		"avatar": "String",
		"roleId": "String",
		"emailVerified": "Boolean",
		"schoolId": "ID",
		"isActive": false,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```
---


When you list user group members, a `user` object will also be inserted in each userGroupMember object, with fullname, avatar and email.

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

**After this prompt, the user may give you new instructions to update the output of this prompt or provide subsequent prompts about the project.**
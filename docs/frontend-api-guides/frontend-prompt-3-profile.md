

# **SOLVIO**

**FRONTEND GUIDE FOR AI CODING AGENTS - PART 3 - Profile Management**

This document is a part of a REST API guide for the solvio project.
It is designed for AI agents that will generate frontend code to consume the project’s backend.

This document includes information and api descriptions about building a **profile page** in the frontend using the auth service profile api calls, and also in this document the bucket service will be introduced to manage the avatar.

The project has 1 auth service, 1 notification service, 1 BFF service, and 8 business services, plus other helper services such as bucket and realtime. In this document you will use the auth service and bucket service.

Each service is a separate microservice application and listens for HTTP requests at different service URLs.

Services may be deployed to the preview server, staging server, or production server. Therefore, each service has 3 access URLs.
The frontend application must support all deployment environments during development, and the user should be able to select the target API server on the home page.


## Accessing the backend

Each backend service has its own URL for each deployment environment. Users may want to test the frontend in one of the three deployments—preview, staging, or production. Please ensure that the register and login pages include a deployment server selection option so that, as the frontend coding agent, you can set the base URL for all services.

The base URL of the application in each environment is as follows:

* **Preview:** `https://solvio.prw.mindbricks.com`
* **Staging:** `https://solvio-stage.mindbricks.co`
* **Production:** `https://solvio.mindbricks.co`

For the auth service, service urls are as follows:

* **Preview:** `https://solvio.prw.mindbricks.com/auth-api`
* **Staging:** `https://solvio-stage.mindbricks.co/auth-api`
* **Production:** `https://solvio.mindbricks.co/auth-api`

For each other service, the service URL will be given in the service sections.

Any request that requires login must include a valid token in the Bearer authorization header.


## Multi-Tenancy Management

**THIS APPLICATION IS MULTI-TENANT**

This application is mult-tanant, it means; as a SaaS application, it isolates each tenant-data from each other. The tenants are called `school` and a data object with the same name exist to store and manage the tenant information. The `school` data instances are referenced from other data objects or entities as `schoolId`. Any data object which is in tenant level (some data objects may still stay in SaaS level) has a `schoolId` property which attaches it to a `school` tenant. But this value is added to the data object instance in the time of creation by the system according to the current `school` user is navigating. 

For human readability each `school` has also got a `schoolCodename` which is a unique form of its name.
Frontend must forward tenant targeting with the tenant header:

```js
headers["mbx-school-codename"] = "babil";
```

When no `schoolCodename` is given in the related parameters, application will assume that the access targets the root target, the Saas level. The `schoolCodename` of SaaS level is always `root`. When no `schoolCodename` is specified, `root` is assumed as the current `schoolCodename`.

Note that, logins and registrations are all tenant scoped. If any a tenant-lvel api is login-required then it will check for a `school` specific token according to the target `school` defined in a related parameter with its codename. The application creates the cookies with `schoolCodename` prefixes but it is recommended for the frontend application to populate the bearer header with the user's `school` related token.

Not that all `school` tenants are managed in the same backend services, however a `school` tanant frontend should be specific to one `school`. Frontend should have a technical way to understand which `school` is targeted by the user, for production frontend application this should be managed by the subdomains that represents the codename of the school like,

````
https://babil.storeCreator.com
````

Using the subdomain, frontend will distinguish that the codename is `babil` and will atatch it to all tenant-level api calls.

The url may also be used for the SaaS directly with a more general wording like,

````
https://www.storeCreator.com
````

However, this subdomain management may not be handled easily in the AI frontend builders that they use their own preview urls, an other url structure should be handled to simulate the subdomain behaviour for tenant forwarding.

It may be like,

````
https://{somePreviewUrlOfABuilderPlatform}/babil/login
````

In some way, frontend should provide a simple and practical way to the user to target a specific tenant.

### Sample School Tenant

The applcation backend also includes a sample tenant created with a sample tenant owner, who has the same email and password of the superadmin. This sample is created in the backend to be able to test the multi-tenant behaviour of the frontend at the beginning.

The sample school has a codename `babil` and can be targetd by attaching this codename to the API calls. So whwn the front end home page is built, homepages both for the SaaS and tenant shoul be created and ready to be tested.



## Bucket Management

This application has a bucket service used to store user files and other object-related files. The bucket service is login-agnostic, so for write operations or private reads, include a bucket token (provided by services) in the request’s Authorization header as a Bearer token.

Please note that all other business services require the access token in the Bearer header, while the bucket service expects a bucket token because it is login-agnostic. Ensure you manage the required token injection properly; any auth interceptor should not replace the bucket token with the access token.

To access the bucket service in each environement use the bucket service api urls below:

* **Preview:** `https://solvio.prw.mindbricks.com/bucket`
* **Staging:** `https://solvio-stage.mindbricks.co/bucket`
* **Production:** `https://solvio.mindbricks.co/bucket`

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

`POST {bucketServiceUrl}/upload`

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


## Profile Page

Design a profile page to manage (view and edit) user information. The profile page should also be able to upload the user avatar to the user’s public bucket. For bucket information, see the Bucket Management section above.

On the profile page, you will need 4 business APIs: `getUser` , `updateProfile`, `updateUserPassword` and `archiveProfile`. Do not rely on the `/currentuser` response for profile data, because it contains session information. The most recent user data is in the user database and should be accessed via the `getUser` business API.

The `updateProfile`, `updateUserPassword` and `archiveProfile` api can only be called by the users themselves. They are designed specific to the profile page.

The avatar upload component should include an image-cropping component with zoom and pan capabilities. The frontend will send the image to the bucket after it is scaled and cropped.

Do not implement your own cropping component; instead, use the library component `react-easy-crop` by installing it.

**Note that the user cannot change/update their `email` or `roleId`.**

For password update you should make a separate block in the UI, so that user can enter old password, new password and confirm new password before calling the `updateUserPassword`.

Here are the 3 auth APIs—`getUser` , `updateProfile` and `updateUserPassword`— as follows:
You can access these APIs through the auth service base URL, `{appUrl}/auth-api`.


### `Get User` API
This api is used by admin roles or the users themselves to get the user profile information.


**Rest Route**

The `getUser` API REST controller can be triggered via the following route:

`/v1/users/:userId`


**Rest Request Parameters**


The `getUser` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| userId  | ID  | true | request.params?.["userId"] |
**userId** : This id paremeter is used to query the required data object.


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/users/:userId**
```js
  axios({
    method: 'GET',
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
	"method": "GET",
	"action": "get",
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



### `Update Profile` API
This route is used by users to update their profiles.


**Rest Route**

The `updateProfile` API REST controller can be triggered via the following route:

`/v1/profile/:userId`


**Rest Request Parameters**


The `updateProfile` api has got 3 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| userId  | ID  | true | request.params?.["userId"] |
| fullname  | String  | false | request.body?.["fullname"] |
| avatar  | String  | false | request.body?.["avatar"] |
**userId** : This id paremeter is used to select the required data object that will be updated
**fullname** : A string value to represent the fullname of the user
**avatar** : The avatar url of the user. A random avatar will be generated if not provided


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/profile/:userId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/profile/${userId}`,
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



### `Update Userpassword` API
This route is used to update the password of users in the profile page by users themselves


**Rest Route**

The `updateUserPassword` API REST controller can be triggered via the following route:

`/v1/userpassword/:userId`


**Rest Request Parameters**


The `updateUserPassword` api has got 3 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| userId  | ID  | true | request.params?.["userId"] |
| oldPassword  | String  | true | request.body?.["oldPassword"] |
| newPassword  | String  | true | request.body?.["newPassword"] |
**userId** : This id paremeter is used to select the required data object that will be updated
**oldPassword** : The old password of the user that will be overridden bu the new one. Send for double check.
**newPassword** : The new password of the user to be updated


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/userpassword/:userId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/userpassword/${userId}`,
    data: {
            oldPassword:"String",  
            newPassword:"String",  
    
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


### Archiving A Profile

A user may want to archive their profile. So the profile page should include an archive section for the users to archive their accounts.
When an account is archived, it is marked as archived and an aarchiveDate is atteched to the profile. All user data is kept in the database for 1 month after user archived.
If user tries to login or register with the same email, the account will be activated again. But if no login or register occures in 1 month after archiving, the profile and its related data will be deleted permanenetly.
So in the profile page,

1. The arcihve options should be accepted after user writes a text like ("ARCHİVE MY ACCOUNT") to a confirmation dialog, so that frontend UX can ensure this is not an unconscious request.
2. The user should be warned about the process, that his account will be available for a restore for 1 month.

The archive api, can only be called by the users themselves and its used as follows.


### `Archive Profile` API
This api is used by users to archive their profiles.


**Rest Route**

The `archiveProfile` API REST controller can be triggered via the following route:

`/v1/archiveprofile/:userId`


**Rest Request Parameters**


The `archiveProfile` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| userId  | ID  | true | request.params?.["userId"] |
**userId** : This id paremeter is used to select the required data object that will be deleted


**REST Request**
To access the api you can use the **REST** controller with the path **DELETE  /v1/archiveprofile/:userId**
```js
  axios({
    method: 'DELETE',
    url: `/v1/archiveprofile/${userId}`,
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



## Tenant Profile Page (Tenant Manager)

In multi-tenant projects, also build a tenant profile page for `tenantOwner` and `tenantAdmin` roles.
This page allows these roles to view/update tenant standard and custom properties.

Use tenant-scoped profile APIs:

- Read current tenant profile: `getSchoolProfile` (`/schoolprofile`)
- Update current tenant profile: `updateSchool` (send tenant header and use current tenant id as route param)

For SaaS-level tenant management pages (`superAdmin`, `saasAdmin`, `saasUser`), use:

- `getSchoolAccount`
- `listSchoolsAccounts`

Do not use deprecated tenant APIs such as `getSchoolByCodename` or `listRegisteredSchools`.


### `Get Schoolprofile` API
Get tenant profile information in tenant level. A private route for tenantOwner and tenantAdmin.


**Rest Route**

The `getSchoolProfile` API REST controller can be triggered via the following route:

`/v1/schoolprofile`


**Rest Request Parameters**
The `getSchoolProfile` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/schoolprofile**
```js
  axios({
    method: 'GET',
    url: '/v1/schoolprofile',
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
	"dataName": "school",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"school": {
		"id": "ID",
		"name": "String",
		"codename": "String",
		"fullname": "String",
		"avatar": "String",
		"ownerId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```


### `Update School` API
Update a school by id. An admin route which can be called by admins or tenant owners.


**Rest Route**

The `updateSchool` API REST controller can be triggered via the following route:

`/v1/schools/:schoolId`


**Rest Request Parameters**


The `updateSchool` api has got 4 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| schoolId  | ID  | true | request.params?.["schoolId"] |
| name  | String  | false | request.body?.["name"] |
| fullname  | String  | false | request.body?.["fullname"] |
| avatar  | String  | false | request.body?.["avatar"] |
**schoolId** : This id paremeter is used to select the required data object that will be updated
**name** : A string value to represent one word name of the school
**fullname** : A string value to represent the fullname of the school
**avatar** : A string value represent the url of the school avatar. Keep null for random avatar.


**REST Request**
To access the api you can use the **REST** controller with the path **PATCH  /v1/schools/:schoolId**
```js
  axios({
    method: 'PATCH',
    url: `/v1/schools/${schoolId}`,
    data: {
            name:"String",  
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
	"dataName": "school",
	"method": "PATCH",
	"action": "update",
	"appVersion": "Version",
	"rowCount": 1,
	"school": {
		"id": "ID",
		"name": "String",
		"codename": "String",
		"fullname": "String",
		"avatar": "String",
		"ownerId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```


### `Get Schoolaccount` API
Get tenant account information by id. A private SaaS-level route for superAdmin, saasAdmin and saasUser.


**Rest Route**

The `getSchoolAccount` API REST controller can be triggered via the following route:

`/v1/schoolaccounts/:schoolId`


**Rest Request Parameters**


The `getSchoolAccount` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| schoolId  | ID  | true | request.params?.["schoolId"] |
**schoolId** : The id of the school account to fetch


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/schoolaccounts/:schoolId**
```js
  axios({
    method: 'GET',
    url: `/v1/schoolaccounts/${schoolId}`,
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
	"dataName": "school",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"school": {
		"id": "ID",
		"name": "String",
		"codename": "String",
		"fullname": "String",
		"avatar": "String",
		"ownerId": "ID",
		"isActive": true,
		"recordVersion": "Integer",
		"createdAt": "Date",
		"updatedAt": "Date",
		"_owner": "ID"
	}
}
```


### `List Schoolsaccounts` API
List tenant accounts in SaaS level for superAdmin, saasAdmin and saasUser.


**Rest Route**

The `listSchoolsAccounts` API REST controller can be triggered via the following route:

`/v1/schoolaccounts`


**Rest Request Parameters**


**Filter Parameters**

The `listSchoolsAccounts` api supports 5 optional filter parameters for filtering list results:

**name** (`String`): A string value to represent one word name of the school

- Single (partial match, case-insensitive): `?name=<value>`
- Multiple: `?name=<value1>&name=<value2>`
- Null: `?name=null`


**codename** (`String`): A string value to represent a unique code name for the school which is generated automatically using name

- Single (partial match, case-insensitive): `?codename=<value>`
- Multiple: `?codename=<value1>&codename=<value2>`
- Null: `?codename=null`


**fullname** (`String`): A string value to represent the fullname of the school

- Single (partial match, case-insensitive): `?fullname=<value>`
- Multiple: `?fullname=<value1>&fullname=<value2>`
- Null: `?fullname=null`


**avatar** (`String`): A string value represent the url of the school avatar. Keep null for random avatar.

- Single (partial match, case-insensitive): `?avatar=<value>`
- Multiple: `?avatar=<value1>&avatar=<value2>`
- Null: `?avatar=null`


**ownerId** (`ID`): An ID value to represent the user id of school owner who created the tenant

- Single: `?ownerId=<value>`
- Multiple: `?ownerId=<value1>&ownerId=<value2>`
- Null: `?ownerId=null`



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/schoolaccounts**
```js
  axios({
    method: 'GET',
    url: '/v1/schoolaccounts',
    data: {
    
    },
    params: {
    
        // Filter parameters (see Filter Parameters section above)
        // name: '<value>' // Filter by name
        // codename: '<value>' // Filter by codename
        // fullname: '<value>' // Filter by fullname
        // avatar: '<value>' // Filter by avatar
        // ownerId: '<value>' // Filter by ownerId
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
	"dataName": "schools",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"schools": [
		{
			"id": "ID",
			"name": "String",
			"codename": "String",
			"fullname": "String",
			"avatar": "String",
			"ownerId": "ID",
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



---

After you complete this step, please ensure you have not made the following common mistakes:

1. The auth API and bucket API are different services, and both URLs should be set according to the selected environment (production, staging, preview).
2. Note that any api call to the application backend is based on a service base url, in this propmpt all auth apis should be called by `/auth-api` prefix after application's base url, and bucket apis should be called by `/bucket` prefix after base url.
3. The auth API and bucket API use different tokens. The auth API requires the `accessToken` in the Bearer header; the bucket API requires bucket-specific tokens such as `userBucketToken` or other application-specific bucket tokens. You may need two separate Axios clients: one for auth (always using the access token) and one for bucket operations (using the relevant bucket token).
4. On the profile page, fetch the latest user data from the service using `getUser`. The `/currentuser` API is session-stored data; the latest data is in the database.
5. When you upload the avatar image on the profile page, use the returned download URL as the user’s `avatar` property and update the user record when the Save button is clicked.

**After this prompt, the user may give you new instructions to update your first output or provide subsequent prompts about the project.**


# **SOLVIO**

**FRONTEND GUIDE FOR AI CODING AGENTS - PART 1 - Authentication Management**

This document is the first part of a REST API guide for the solvio project.
It is designed for AI agents that will generate frontend code to consume the project’s backend.

This first document includes general information about the project and its authentication management. Please read it carefully and implement all requirements described here.

The project has 1 auth service, 1 notification service, 1 BFF service, and 8 business services, plus other helper services such as bucket and realtime. In this document you will be informed only about the auth service. The initial frontend will be generated to use this service.

Each service is a separate microservice application and listens for HTTP requests at different service URLs.

Services may be deployed to the preview server, staging server, or production server. Therefore, each service has 3 access URLs.
The frontend application must support all deployment environments during development, and the user should be able to select the target API server on the home page.

## Project Introduction

Solvio is a comprehensive, AI-driven language learning ecosystem designed to modernize and personalize the process of learning English and other languages. Featuring advanced modules for writing, speaking, listening, and reading, it empowers both students and teachers with dynamic feedback, agentic AI coaching, and robust classroom management tools within fully isolated institutional environments.


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

## Accessing the backend

Each backend service has its own URL for each deployment environment. Users may want to test the frontend in one of the three deployments—preview, staging, or production. Please ensure that the home page includes a deployment server selection option so that, as the frontend coding agent, you can set the base URL for all services.

The base URL of the application in each environment is as follows:

* **Preview:** `https://solvio.prw.mindbricks.com`
* **Staging:** `https://solvio-stage.mindbricks.co`
* **Production:** `https://solvio.mindbricks.co`

For the auth service, the base URLs are:

* **Preview:** `https://solvio.prw.mindbricks.com/auth-api`
* **Staging:** `https://solvio-stage.mindbricks.co/auth-api`
* **Production:** `https://solvio.mindbricks.co/auth-api`

For each other service, the service base URL will be given in the service sections.

Any request that requires login must include a valid token in the Bearer authorization header.

Please note that for each service in the project (which will be introduced in following pages) will use a different address so it is a good practice to define a separate client for each service in the frontend application lib source. Not only the different base urls, some services even may need different access rules when shaping the request. 


## Multi-Tenancy Management

**THIS APPLICATION IS MULTI-TENANT**

This application is multi-tenant. Tenant data is isolated per `school`, and tenant-level records are attached to `schoolId`.
For frontend, tenant context is resolved from frontend routing context (URL prefix in preview/test, subdomain in production) and then forwarded to backend through header.

### Tenant Routing Contract (Required)

- SaaS pages: `/`
- Tenant pages: `/{tenantCodename}/...`
- Example: `/babil/login`
- All tenant-specific pages must keep `/{tenantCodename}` prefix.

In preview/test, URL prefix simulates tenant selection. In production, tenant is usually resolved from subdomain (e.g. `babil.appname...`).
In both modes, backend tenant targeting must always be done by header.

```js
headers["mbx-school-codename"] = tenantCodenameFromUrl;
```

URL/subdomain is only a frontend tenant selection mechanism. Backend API calls must always claim tenant with header.
If no tenant codename is sent, backend assumes SaaS/root tenant (`root`).

### Sample School Tenant

The applcation backend also includes a sample tenant created with a sample tenant owner, who has the same email and password of the superadmin. This sample is created in the backend to be able to test the multi-tenant behaviour of the frontend at the beginning.

The sample school has codename `babil`. Use `/babil/...` prefixed pages and send `mbx-school-codename: babil` in tenant-scoped requests for testing.


## Home page

First build a home page which shows some static content about the application, and has got login and registration (if is public) buttons. The home page shpuld be updated later according to the content that each service provides, as a frontend developer use best and common practices to reflect the service content to the home page. User may also give extra information for the home page content in addtion to this prompt.

Note that this page should include a deployment (environment) selection option to set the base URL. Set the default to `production`.

After user logs in, page header should show the current login state as in modern web pages, logged in user fullname, avatar, email and with a logout link, make a fancy current user component. The home page may have different views before and after login.


Since this is a multi-tenant application, SaaS home and tenant home should be different.

### SaaS Home (`/`)

Build a landing page with:
- Left area: project full name and project description
- Two primary buttons:
  - **Login To SaaS** (root tenant login entry)
  - **Register New School** (show only when tenant owner registration is public)
- Bottom small link: **See Schools**

When user clicks **See Schools**, open a left sliding drawer and fetch tenant list with `listBriefSchools`.
Clicking a tenant should navigate to `/{tenantCodename}` tenant homepage.

### Tenant Home (`/{tenantCodename}`)

Create a simple tenant homepage that shows tenant name/fullname/avatar and includes:
- Login button
- Register button only when tenant-user registration is public

Tenant homepage data should be fetched with tenant-level public API `getSchoolHome` while sending `mbx-school-codename` from URL context.

All tenant pages should keep tenant context in frontend routing. Regardless of routing method, all backend calls from tenant context must include `mbx-school-codename` header.

### Tenant API Contract (Current)

Use the following auth APIs for tenant information access:

- Public brief list for landing/tenant selection: `listBriefSchools`
- Public brief single tenant: `getBriefSchool` (`/briefschools/:codename`)
- Public tenant-home read in tenant scope: `getSchoolHome` (`/schoolhome/:codename`)
- Logged-in tenant-level read: `getSchool` (`/schools`, tenant id resolved from tenant context/session)
- Tenant profile read for tenant managers: `getSchoolProfile` (`/schoolprofile`, id resolved from tenant header/session)
- SaaS-level tenant account read/list: `getSchoolAccount` and `listSchoolsAccounts`

Do not use deprecated tenant APIs such as `getSchoolByCodename` or `listRegisteredSchools`.


### `List Briefschools` API
Get a list of schools, this route can be called by public, no login required


**Rest Route**

The `listBriefSchools` API REST controller can be triggered via the following route:

`/v1/briefschools`


**Rest Request Parameters**
The `listBriefSchools` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/briefschools**
```js
  axios({
    method: 'GET',
    url: '/v1/briefschools',
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
	"dataName": "schools",
	"method": "GET",
	"action": "list",
	"appVersion": "Version",
	"rowCount": "\"Number\"",
	"schools": [
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


### `Get School` API
Get a school in current tenant scope. A protected tenant-level route for logged-in users.


**Rest Route**

The `getSchool` API REST controller can be triggered via the following route:

`/v1/schools`


**Rest Request Parameters**
The `getSchool` api has got no request parameters.    



**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/schools**
```js
  axios({
    method: 'GET',
    url: '/v1/schools',
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


### `Get Schoolhome` API
Get public tenant-home information in tenant level.


**Rest Route**

The `getSchoolHome` API REST controller can be triggered via the following route:

`/v1/schoolhome/:codename`


**Rest Request Parameters**


The `getSchoolHome` api has got 1 regular request parameter  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| codename  | String  | true | request.params?.["codename"] |
**codename** : The codename of the school to fetch


**REST Request**
To access the api you can use the **REST** controller with the path **GET  /v1/schoolhome/:codename**
```js
  axios({
    method: 'GET',
    url: `/v1/schoolhome/${codename}`,
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
	"dataName": "school",
	"method": "GET",
	"action": "get",
	"appVersion": "Version",
	"rowCount": 1,
	"school": {
		"isActive": true
	}
}
```


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




## Registration Management


Since the application is multi-tenant, there will be two registration process. First one is the `school` register and the other one is `user` registration.

Users are either in SaaS level, like administrators, or in `school` tenant level like `school` owners, admins and users.

### SaaS Level User Registration

SaaS user registration is not public in the application, SaaS users can only be created through `createUser` api which can be called by the `superAdmin` or `saasAdmin` of the SaaS level. Creating a new SaaS user is handled through admin panel which will be described in the next prompt.

SaaS users belong to `root` tenant context and should login from the SaaS entry page. Tenant-end users should not use this login entry.

### Tenant -`school`- Registration

Tenant registraration, creating a new school, is always handled together with tenant owner registration.

Tenant and tenant owner registration are not public in the application, so creating a new school with its owner user is handled through admin panel which will be describe in the next prompt.

### Tenant -`school`- User Registration

User registration for  school tenants is public in the application, ensure that the register and login pages include a deployment server selection option so that you can set the base URL for all services. Start with a home page and set up the registration , verification, and login flow. 


Using the `registerschooluser` route of the auth API, send the required fields from your registration page. Please create a simple and polished registration page that includes only the necessary fields of the registration API. 

The `registerSchoolUser` API in the `auth` service is described with the request and response structure below.

This api should be called as targeting an existing `school`, so don't forget to attach the `school` codename to one of the `school` parameter of the related http request locations. 

Note that since the `registerSchoolUser` API is a business API, it is versioned; call it with the given version like `/v1/registerschooluser`.


### `Register Schooluser` API
This route is used by public users to register themselves to tenants that are created by tenant owners.


**Rest Route**

The `registerSchoolUser` API REST controller can be triggered via the following route:

`/v1/registerschooluser`


**Rest Request Parameters**


The `registerSchoolUser` api has got 5 regular request parameters  

| Parameter              | Type                   | Required | Population                   |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| socialCode  | String  | false | request.body?.["socialCode"] |
| password  | String  | true | request.body?.["password"] |
| email  | String  | true | request.body?.["email"] |
| fullname  | String  | true | request.body?.["fullname"] |
| avatar  | String  | false | request.body?.["avatar"] |
**socialCode** : Send this social code if it is sent to you after a social login authetication of an unregistred user. The users profile data will be complemented from the autheticated social profile using this code. If you provide the social code there is no need to give full profile data of the user, just give the ones that are not included in social profiles.
**password** : The password defined by the the user that is being registered.
**email** : The email defined by the the user that is being registered.
**fullname** : The full name defined by the the user that is being registered.
**avatar** : The avatar url of the user. A random avatar will be generated if not provided


**REST Request**
To access the api you can use the **REST** controller with the path **POST  /v1/registerschooluser**
```js
  axios({
    method: 'POST',
    url: '/v1/registerschooluser',
    data: {
            socialCode:"String",  
            password:"String",  
            email:"String",  
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


After a successful registration, the frontend code should handle verification requirements with the same flow style as single-tenant mode. Verification Management will be given in the next prompt. The registration response will include a `user` object in the root envelope; this object contains user information with an `id` field.


## Login Management

After successful registration and completing any required verifications, the user can log in. Please create a minimal, polished login page where the user can enter email and password. Note that this page should respect the deployment (environment) selection option made in the home page to set the base URL. If the user reaches this page directly skipping home page, the default `production`deployment will be used.

The login API returns a created session. This session can be retrieved later with the access token using the `/currentuser` system route.

Any request that requires login must include a valid token. When a user logs in successfully, the response JSON includes a JWT access token in the `accessToken` field. Under normal conditions, this token is also set as a cookie and consumed automatically. However, since AI coding agents’ preview options may fail to use cookies, ensure that each request includes the access token in the Bearer authorization header.

If the login fails due to verification requirements, the response JSON includes an `errCode`. If it is `EmailVerificationNeeded`, start the email verification flow; if it is `MobileVerificationNeeded`, start the mobile verification flow.

After a successful login, you can access session (user) information at any time with the `/currentuser` API. On inner pages, show brief profile information (avatar, name, etc.) using the session information from this API.

Note that the `currentuser` API returns a session object, so there is no `id` property; instead, the values for the user and session are exposed as `userId` and `sessionId`. The response combines user and session information.

The login, logout, and currentuser APIs are as follows. They are system routes and are not versioned.

### `POST /login` — User Login

**Purpose:**
Verifies user credentials and creates an authenticated session with a JWT access token.

**Access Routes:**

#### Request Parameters

| Parameter  | Type   | Required | Source                  |
| ---------- | ------ | -------- | ----------------------- |
| `username` | String | Yes      | `request.body.username` |
| `password` | String | Yes      | `request.body.password` |

#### Behavior

* Authenticates credentials and returns a session object.
* Sets cookie: `projectname-access-token[-tenantCodename]`
* Adds the same token in response headers.
* Accepts either `username` or `email` fields (if both exist, `username` is prioritized).

#### Example

```js
axios.post("/login", {
  username: "user@example.com",
  password: "securePassword"
});
```

#### Success Response

```json
{
  "sessionId": "e81c7d2b-4e95-9b1e-842e-3fb9c8c1df38",
  "userId": "d92b9d4c-9b1e-4e95-842e-3fb9c8c1df38",
  "email": "user@example.com",
  "fullname": "John Doe",
  //...
  "accessToken": "ey7....",
  "userBucketToken": "e56d...."
}
```

### Error Responses

* `401 Unauthorized`: Invalid credentials
* `403 Forbidden`: Email/mobile verification or 2FA pending
* `400 Bad Request`: Missing parameters

---

### `POST /logout` — User Logout

**Purpose:**
Terminates the current session and clears associated authentication tokens.

#### Behavior

* Invalidates the session (if it exists).
* Clears cookie `projectname-access-token[-tenantCodename]`.
* Returns a confirmation response (always `200 OK`).

#### Example

```js
axios.post("/logout", {}, {
  headers: { "Authorization": "Bearer your-jwt-token" }
});
```

#### Notes

* Can be called without a session (idempotent behavior).
* Works for both cookie-based and token-based sessions.

#### Success Response

```json
{ "status": "OK", "message": "User logged out successfully" }
```

### `GET /currentuser` — Current Session

**Purpose**
Returns the currently authenticated user’s session.

**Route Type**
`sessionInfo`

**Authentication**
Requires a valid access token (header or cookie).

#### Request

*No parameters.*

#### Example

```js
axios.get("/currentuser", {
  headers: { Authorization: "Bearer <jwt>" }
});
```

#### Success (200)

Returns the session object (identity, tenancy, token metadata):

```json
{
  "sessionId": "9cf23fa8-07d4-4e7c-80a6-ec6d6ac96bb9",
  "userId": "d92b9d4c-9b1e-4e95-842e-3fb9c8c1df38",
  "email": "user@example.com",
  "fullname": "John Doe",
  "roleId": "user",
  "tenantId": "abc123",
  "accessToken": "jwt-token-string",
  "...": "..."
}
```

Note that the `currentuser` API returns a session object, so there is no `id` property, instead, the values for the user and session are exposed as `userId` and `sessionId`. The response is a mix of user and session information.

#### Errors

* **401 Unauthorized** — No active session/token

  ```json
  { "status": "ERR", "message": "No login found" }
  ```

**Notes**

* Commonly called by web/mobile clients after login to hydrate session state.
* Includes key identity/tenant fields and a token reference (if applicable).
* Ensure a valid token is supplied to receive a 200 response.


After you complete this first step, please ensure you have not made the following common mistakes:

1. When the application starts, please ensure that the `baseUrl` is set to the production server URL, and that the environment selector dropdown has the **Production** option selected by default.
2. Note that any api call to the application backend is based on a service base url, in this propmpt all auth apis should be called by `/auth-api` prefix after application's base url.
3. The `/currentuser` API returns a mix of session and user data. There is no `id` property —use `userId` and `sessionId`.
4. Please note that, the deployemnt environment selector will only be used in the home page. If any page is called directly bypassign home page, the page will use the stored or default environment.

**After this prompt, the user may give you new instructions to update your first output or provide subsequent prompts about the project.**
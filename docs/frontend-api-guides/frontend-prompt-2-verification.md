

# **SOLVIO**

**FRONTEND GUIDE FOR AI CODING AGENTS - PART 2 - Verification Management**

This document is a part of a REST API guide for the solvio project.
It is designed for AI agents that will generate frontend code to consume the project’s backend.

This document includes the verification processes for the autheitcation flow. Please read it carefully and implement all requirements described here.

The project has 1 auth service, 1 notification service, 1 BFF service, and 8 business services, plus other helper services such as bucket and realtime. In this document you will be informed only about the auth service. 

Each service is a separate microservice application and listens for HTTP requests at different service URLs.

Services may be deployed to the preview server, staging server, or production server. Therefore, each service has 3 access URLs.
The frontend application must support all deployment environments during development, and the user should be able to select the target API server on the home page.

## Accessing the backend

Each backend service has its own URL for each deployment environment. Users may want to test the frontend in one of the three deployments—preview, staging, or production. Please ensure that the home page includes a deployment server selection option so that, as the frontend coding agent, you can set the base URL for all services.

For the auth service, the base URLs are:

* **Preview:** `https://solvio.prw.mindbricks.com/auth-api`
* **Staging:** `https://solvio-stage.mindbricks.co/auth-api`
* **Production:** `https://solvio.mindbricks.co/auth-api`

Any request that requires login must include a valid token in the Bearer authorization header.



## Multi-Tenancy Management

**THIS APPLICATION IS MULTI-TENANT**

This application is mult-tanant, it means; as a SaaS application, it isolates each tenant-data from each other. The tenants are called `school` and a data object with the same name exist to store and manage the tenant information. The `school` data instances are referenced from other data objects or entities as `schoolId`. Any data object which is in tenant level (some data objects may still stay in SaaS level) has a `schoolId` property which attaches it to a `school` tenant. But this value is added to the data object instance in the time of creation by the system according to the current `school` user is navigating. 

For the human readability each `school` has also got a `schoolCodename` which is a unique form of its name. Any api call to the application should claim its target `school` tenant, so it should provide `schoolCodename` parameter at one of the following request locations.

```js
// In header with special header name
headers["mbx-school-codename"] = "babil",

// or in query with ( _school ) parameter

const url = `${serviceUrl}/v1/users/${userId}?_school=babil`

// or in post body with ( _school ) parameter
const body = {
  //...
  _school: "babil",
  //...
}
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





## After User Registration

Frontend should also be aware of verification after any login attempt. 
The login request may return a 401 or 403 with the error codes that indicates the verification needs.

```json
{
  //...
  "errCode": "EmailVerificationNeeded",
  // or
  "errCode": "MobileVerificationNeeded",
}
```

## Email Verification

In the registration response, check the `emailVerificationNeeded` property in the response root. If it is `true`, start the email verification flow.

After the login process, if you receive an HTTP error and the response contains an `errCode` with the value `EmailVerificationNeeded`, start the email verification flow.

1. Call the email verification `start` route of the backend (described below) with the user’s email. The backend will send a secret code to the provided email address. **The backend can send the email if the architect has configured a real mail service or SMTP server. During development, the backend also returns the secret code to the frontend. You can read this code from the `secretCode` property of the response.**
2. The secret code in the email will be a 6-digit code. Provide an input page so the user can paste this code into the frontend application. Navigate to this input page after starting the verification process. **If the `secretCode` is sent to the frontend for testing, display it on the input page so the user can copy and paste it.**
3. The `start` response includes a `codeIndex` property. Display its value on the input page so the user can match the index in the message with the one on the screen.
4. When the user submits the code, complete the email verification using the `complete` route of the backend (described below) with the user’s email and the secret code.
5. After a successful email verification response, please check the response object to have the property 'mobileVerificationNeeded' as `true`, if so navigate to the mobile verification flow as described below. 
**If no mobile verification is needed then just navigate the login page.** 

Below are the `start` and `complete` routes for email verification. These are system routes and therefore are not versioned.

#### `POST /verification-services/email-verification/start`

**Purpose:**
Starts email verification by generating and sending a secret code.

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `email`   | String | Yes      | User’s email address to verify |

**Example Request**

```json
{ "email": "user@example.com" }
```

**Success Response**

```json
{
  "status": "OK", 
  "codeIndex": 1,
  // timeStamp : Milliseconds since Jan 1, 1970, 00:00:00.000 GMT
  "timeStamp": 1784578660000,
  "date": "Mon Jul 20 2026 23:17:40 GMT+0300 (GMT+03:00)",
  // expireTime: in seconds
  "expireTime": 86400,
  "verificationType": "byLink",

  // in testMode
  "secretCode": "123456",
  "userId": "user-uuid"
}
```

> ⚠️ In production, `secretCode` is **not** returned — it is only sent via email.

**Error Responses**

* `400 Bad Request`: Already verified
* `403 Forbidden`: Too many attempts (rate limit)

---

#### `POST /verification-services/email-verification/complete`

**Purpose:**
Completes verification using the received code.

| Parameter    | Type   | Required | Description       |
| ------------ | ------ | -------- | ----------------- |
| `email`      | String | Yes      | User’s email      |
| `secretCode` | String | Yes      | Verification code |

**Success Response**

```json
{
  "status": "OK", 
  "isVerified": true,
  "email": "user@email.com",
  // in testMode
  "userId": "user-uuid"
}
```

**Error Responses**

* `403 Forbidden`: Code expired or mismatched
* `404 Not Found`: No verification in progress

---


## Mobile Verification

In the registration response, check the `mobileVerificationNeeded` property in the response root. If it is `true`, start the mobile verification flow.

After the login process, if you receive a 403 error and the response contains an `errCode` with the value `MobileVerificationNeeded`, start the mobile verification flow.

1. Call the mobile verification `start` route of the backend (described below) with the user’s email. The backend will send a secret code to the user’s mobile number. **If a real texting service is configured, the backend sends the SMS. During development, the backend also returns the secret code to the frontend in the `secretCode` property.**
2. The secret code in the SMS will be a 6-digit code. Provide an input page so the user can paste this code. Navigate to this input page after starting the verification process. **If the `secretCode` is returned for testing, display it on the input page for easy copy/paste.**
3. When the user submits the code, complete mobile verification using the `complete` route of the backend (described below) with the user’s email and the secret code.
4. The `start` response includes a `codeIndex` property. Display its value on the input page so the user can match the index shown in the message with the one on the screen.
5. After a successful mobile verification response, navigate to the login page.

**Verification Order**
If both `emailVerificationNeeded` and `mobileVerificationNeeded` are `true`, handle both verification flows in order. First complete email verification, then mobile verification.


Below are the `start` and `complete` routes for mobile verification. These are system routes and therefore are not versioned.

#### `POST /verification-services/mobile-verification/start`

| Parameter | Type   | Required | Description                          |
| --------- | ------ | -------- | ------------------------------------ |
| `email`   | String | Yes      | User’s email to locate mobile record |

**Success Response**

```json
{
  "status": "OK", 
  "codeIndex": 1,
  // timeStamp : Milliseconds since Jan 1, 1970, 00:00:00.000 GMT
  "timeStamp": 1784578660000,
  "date": "Mon Jul 20 2026 23:17:40 GMT+0300 (GMT+03:00)",
  // expireTime: in seconds
  "expireTime": 180,
  "verificationType": "byCode",

  // in testMode
  "secretCode": "123456",
  "userId": "user-uuid"
}
```

> ⚠️ `secretCode` is returned only in development.

**Errors**

* `400 Bad Request`: Already verified
* `403 Forbidden`: Rate-limited

---

#### `POST /verification-services/mobile-verification/complete`

| Parameter    | Type   | Required | Description           |
| ------------ | ------ | -------- | --------------------- |
| `email`      | String | Yes      | Associated email      |
| `secretCode` | String | Yes      | Code received via SMS |

**Success Response**

```json
{
  "status": "OK", 
  "isVerified": true,
  "mobile": "+1 333 ...",
  // in testMode
  "userId": "user-uuid"
}
```
---

## Resetting Password

Users can reset their forgotten passwords without a login required, through email and mobile verification.
To be able to start a password reset flow, users will click on the "Reset Password" link in the login page.

Since there are two verification methods, by email or by mobile, for password reset, when the reset password link is clicked, frontend should ask user if they want to make the verification through email of mobile. According to the users selection the frontend shoudl start the related flow as explaned below step by step.

## Password Reset By Email Flow

1. Call the password reset by email verification `start` route of the backend (described below) with the user’s email. The backend will send a secret code to the provided email address. **The backend can send the email if the architect has configured a real mail service or SMTP server. During development, the backend also returns the secret code to the frontend. You can read this code from the `secretCode` property of the response.**
2. The secret code in the email will be a 6-digit code. Provide an input page so the user can paste this code into the frontend application. Navigate to this input page after starting the verification process. **If the `secretCode` is sent to the frontend for testing, display it on the input page so the user can copy and paste it.**
3. The `start` response includes a `codeIndex` property. Display its value on the input page so the user can match the index in the message with the one on the screen.
4. The input page should also include a double input area for the user to enter and confirm their new password.
5. When the user submits the code and the new password, complete the password reset by email using the `complete` route of the backend (described below) with the user’s email , the secret code and new password.
6. After a successful verification response, navigate to the login page.

Below are the `start` and `complete` routes for password reset by email verification. These are system routes and therefore are not versioned.

#### POST `/verification-services/password-reset-by-email/start`
  
  **Purpose**:  
  Starts the password reset process by generating and sending a secret verification code.
  
  #### Request Body
  
  | Parameter | Type   | Required | Description                         |
  |-----------|--------|----------|-------------------------------------|
  | email     | String | Yes      | The email address of the user       |
  
  ```json
  {
    "email": "user@example.com"
  }
  ```
  
  **Success Response**
  
  Returns secret code details (only in development environment) and confirmation that the verification step has been started.
  
  ```json
  {
    "userId": "user-uuid",
    "email": "user@example.com",
    "codeIndex": 1,
    "secretCode": "123456", 
    "timeStamp": 1765484354,
    "expireTime": 86400,
    "date": "2024-04-29T10:00:00.000Z",
    "verificationType": "byLink",
  }
  ```
  
  ⚠️ In production, the secret code is only sent via email and not exposed in the API response.
  
  **Error Responses**
  
  - `401 NotAuthenticated`: Email address not found or not associated with a user.
  - `403 Forbidden`: Sending a code too frequently (spam prevention).
  
  ---
  
  #### POST `/verification-services/password-reset-by-email/complete`
  
  **Purpose**:  
  Completes the password reset process by validating the secret code and updating the user's password.
  
  #### Request Body
  
  | Parameter   | Type   | Required | Description                                  |
  |-------------|--------|----------|----------------------------------------------|
  | email       | String | Yes      | The email address of the user                |
  | secretCode  | String | Yes      | The code received via email                  |
  | password    | String | Yes      | The new password the user wants to set       |
  
  ```json
  {
    "email": "user@example.com",
    "secretCode": "123456",
    "password": "newSecurePassword123"
  }
  ```
  
  **Success Response**
  
  ```json
  {
    "userId": "user-uuid",
    "email": "user@example.com",
    "isVerified": true
  }
  ```
  
  **Error Responses**
  
  - `403 Forbidden`:  
    - Secret code mismatch  
    - Secret code expired  
    - No ongoing verification found  
  
  ---

## Password Reset By Mobile Flow
1. Call the password reset by mobile verification `start` route of the backend (described below) with the user’s email. The backend will send a secret code to the user’s mobile number. **If a real texting service is configured, the backend sends the SMS. During development, the backend also returns the secret code to the frontend in the `secretCode` property.**
2. The secret code in the SMS will be a 6-digit code. Provide an input page so the user can paste this code. Navigate to this input page after starting the verification process. **If the `secretCode` is returned for testing, display it on the input page for easy copy/paste.**
3. The `start` response includes a `codeIndex` property. Display its value on the input page so the user can match the index in the message with the one on the screen. Also display the half masked `mobile`number that comes in the response, to tell the user that their code is sent to this number.
4. The input page should also include a double input area for the user to enter and confirm their new password.
5. When the user submits the code, complete mobile verification using the `complete` route of the backend (described below) with the user’s email and the secret code.
6. After a successful mobile verification response, navigate to the login page.

Below are the `start` and `complete` routes for password reset by mobile verification. These are system routes and therefore are not versioned.

#### POST `/verification-services/password-reset-by-mobile/start`
  
  **Purpose**:  
  Initiates the mobile-based password reset by sending a verification code to the user's mobile.
  
  #### Request Body
  
  | Parameter | Type   | Required | Description                  |
  |-----------|--------|----------|------------------------------|
  | email     | String | Yes      | The email of the user that resets the pssword  |
  
  ```json
  {
    "email": "user@user.com"
  }
  ```
  
  ### Success Response
  
  Returns the verification context (code returned only in development):
  
  ```json
  {
    "status": "OK",
    "codeIndex": 1,
    timeStamp: 133241255,
    "mobile": "+905.....67",
    "secretCode": "123456", 
    "expireTime": 86400,
    "date": "2024-04-29T10:00:00.000Z",
    verificationType: "byLink"
  }
  ```
  
  ⚠️ In production, the `secretCode` is not included in the response and is only sent via SMS.
  
  ### Error Responses
  
  - **400 Bad Request**: Mobile already verified
  - **403 Forbidden**: Rate-limited (code already sent recently)
  - **404 Not Found**: User with provided mobile not found
  
  ---
  
  #### POST `/verification-services/password-reset-by-mobile/complete`
  
  **Purpose**:  
  Finalizes the password reset process by validating the received verification code and updating the user’s password.
  
  #### Request Body
  
  | Parameter   | Type   | Required | Description                                     |
  |-------------|--------|----------|-------------------------------------------------|
  | email       | String | Yes      | The email address of the user                   |
  | secretCode  | String | Yes      | The code received via SMS                       |
  | password    | String | Yes      | The new password to assign                      |
  
  ```json
  {
    "email": "user@example.com",
    "secretCode": "123456",
    "password": "NewSecurePassword123!"
  }
  ```
  
  ### Success Response
  
  ```json
  {
    "userId": "user-uuid",
    "isVerified": true
  }
  ```
  ---



## Navigating the Login Page
Please note that since this application is multitenant, the login page that will be navigated to after a verification process, should be aware of the tenant school. 
If this login navigate is after a user registration (or after a post-registration verification) to a school, then keep the active school as the original and navigate user to the selected school.
If this login navigate is after a school registration (or after a tenant post-registration verification), 
then you have a new school other than the `root` one, so you should make this new tenant as the selected one and navigate to its login page.
If this login is after a post-login verification, then keep the original school that the previous login attempt is made to and navigate to the same school either it is the `root` or andy registered `school`.
 


** Please dont forget to arrange the code to be able to navigate to the verification pages both after registrations and login attempts if verification is needed.**
  

**After this prompt, the user may give you new instructions to update your first output or provide subsequent prompts about the project.**
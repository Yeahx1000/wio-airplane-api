# API Routes

This file is to keep a record of the API endpoints available in one place, can see them in readme, this is a focused list of the routes available.

## Table of Contents

- [API Routes](#api-routes)
  - [Table of Contents](#table-of-contents)
    - [Healh Check Endopoint](#healh-check-endopoint)
      - [`GET /health`](#get-health)
    - [Auth Endpoints](#auth-endpoints)
      - [`POST /auth/login`](#post-authlogin)
      - [`POST /auth/refresh`](#post-authrefresh)
      - [`GET /auth/me`](#get-authme)
    - [Airport Enpoints](#airport-enpoints)
      - [`GET /airports/:id`](#get-airportsid)
      - [`GET /airports/radius`](#get-airportsradius)
      - [`GET /airports/distance`](#get-airportsdistance)
      - [`GET /airports/countries`](#get-airportscountries)
      - [`GET /airports/route`](#get-airportsroute)

### Healh Check Endopoint

#### `GET /health`

No authentication required. Returns service health status.

```bash
curl http://localhost:3000/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "redis": "connected"
}
```

### Auth Endpoints

> [!WARNING]
You must authhenticate to use other routes in the API. This step is required

to use the API, you'll need to authenticate with Cognito.

Assuming you have a Cognito user pool set up, you can use the following credentials to login:

```json
{
    "usernameOrEmail":"your-username-string-or-email",
    "password":"whatever-your-password-is"
}
```

#### `POST /auth/login`

**Headers:**

```json
Content-Type: application/json
```

**Body:**

Please ensure you've recieved a username and password from your admin.

```json
{
  "usernameOrEmail": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "accessToken": "eyJraWQiOiJ...",
  "refreshToken": "eyJjdHkiOiJ...",
  "idToken": "eyJraWQiOiJ..."
}
```

#### `POST /auth/refresh`

**Headers:**

```json
Content-Type: application/json
```

**Body:**

```json
{
  "refreshToken": "eyJjdHkiOiJ..."
}
```

**Response:**

```json
{
  "accessToken": "eyJraWQiOiJ...",
  "idToken": "eyJraWQiOiJ..."
}
```

#### `GET /auth/me`

**Headers:**

```json
Authorization: Bearer <accessToken>
```

**Response:**

```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "username": "johndoe"
}
```

Take the access token returned from the login request and add it to the `Authorization` header of your requests.

No authentication required. Returns application metrics.

From here on, you can use the API endpoints as you would normally. There are 4 endpoints mainly for
testing:

### Airport Enpoints

#### `GET /airports/:id`

Get airport details by ID.

**Parameters:**

- `id` (path parameter, required): Airport ID (integer, minimum: 1)

**Example:**

```http
GET /airports/123
```

**Response:** Returns airport object with id, airportName, city, country, iataFaa, icao, latitude, longitude, altitude, and timezone.

---

#### `GET /airports/radius`

Find all airports within a specified radius of a coordinate point.

**Query Parameters:**

- `lat` (required): Latitude (-90 to 90)
- `lon` (required): Longitude (-180 to 180)
- `radius` (required): Radius in kilometers (number, minimum: 0)

**Example:**

```http
GET /airports/radius?lat=40.7128&lon=-74.0060&radius=100
```

**Response:** Returns an array of airports within the radius, each including a `distance` field showing the distance from the center point in kilometers.

---

#### `GET /airports/distance`

Calculate the distance between two airports in kilometers.

**Query Params:**

- `id1` (required): First airport ID (integer, minimum: 1)
- `id2` (required): Second airport ID (integer, minimum: 1)

**Example:**

```http
GET /airports/distance?id1=1&id2=2
```

**Response:** Returns an object with a `distance` field containing the distance in kilometers.

---

#### `GET /airports/countries`

Find the closest pair of airports between two countries.

**Query Params:**

- `country1` (required): First country name (string)
- `country2` (required): Second country name (string)

**Example:**

```http
GET /airports/countries?country1=United States&country2=Canada
```

**Response:** Returns an object containing:

- `airport1`: The airport from country1
- `airport2`: The airport from country2
- `distance`: The distance between them in kilometers

---

#### `GET /airports/route`

Find the shortest route between two airports. Routes are calculated with a maximum leg distance of 500 miles.

**Query Params:**

- `fromId` (required): Starting airport ID (integer, minimum: 1)
- `toId` (required): Destination airport ID (integer, minimum: 1)

**Example:**

```http
GET /airports/route?fromId=1&toId=100
```

**Response:** Returns a route object containing:

- `legs`: Array of route segments, each with fromId, toId, fromAirport, toAirport, and distance
- `totalDistance`: Total distance of the route in kilometers
- `totalStops`: Number of stops (legs - 1)

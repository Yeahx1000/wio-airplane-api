# Airplane API

An API that returns airports within a given radius of a specific coordinate.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Using Docker](#using-docker)
- [Using Redis](#using-redis)
- [How to use the API](#how-to-use-the-api)
- [How to use Swagger UI for testing](#how-to-use-swagger-ui-for-testing)
- [Authentication](#authentication)
- [Airport Endpoints](#airport-endpoints)

## Tech Stack

These weren't all used given the scope, but at scale they would be theoretically.

- Node.js (Typescript, ESM)
- Fastify (web framework)
- AWS
  - ~~S3 (store CSV)~~
  - RDS (Postgresql & PostGIS)
  - ECS (containerize API, Fargate, helping to scale horizontally)
  - ElastiCache (Redis, not needed at this scope but for the sake of it)
  - ~~CloudFront (CDN)~~
  - Cloudwatch (metrics, logs, naturally there when using other services on AWS)
  - Cognito (Auth & User management)
- Docker
- Zod (data validation)
- Swagger (API documentation)

## Misc Tools Used

### Internal "Testing" tools used

- pgAdmin
- Postman
- ?? (still deciding on in editor tools)

### Research tools (mainly for architectural decisions)

- Google
- chatGPT
- NotebookLLM

## Installation

To get started, you'll need to install the dependencies:

```bash
npm install
```

setup your env variables, the relevant ones should be in the `.env.example` file.

to run the server in dev mode:

```bash
npm run dev
```

to run the server in production mode:

first, build the server:

```bash
npm run build
```

then, run the server:

```bash
npm run start
```

That's mostly it. The app will be running on port 3000 by default.

## Using Docker

### Building and running your application

When you're ready to build and run your app, start by running:
`docker compose up --build`.

The app will be available at `http://localhost:3000`

### Deploying app to the cloud

First, build your image, e.g.: `docker build -t myapp .`.
If your cloud uses a different CPU architecture than your development
machine (e.g., you are on a Mac M1 and your cloud provider is amd64),
you'll want to build the image for that platform, e.g.:
`docker build --platform=linux/amd64 -t myapp .`.

Then, push it to your registry, e.g. `docker push myregistry.com/myapp`.

Consult Docker's [getting started](https://docs.docker.com/go/get-started-sharing/)
docs for more detail on building and pushing.

### References

- [Docker's Node.js guide](https://docs.docker.com/language/nodejs/)

## Using Redis

When running in production, Elasticache is intended to be used as a cache layer, but other services can be used. comment out the .env for `REDIS_HOST=localhost` and uncomment the following:

```bash
# REDIS_HOST=localhost # use this when running locally
REDIS_HOST=your-elasticache-or-other-enpoint # use this when running in production on VPC
```

the app should be able to infer whether to use TLS or not based on the endpoint (whether using a local redis instance or in production), but you can also set `REDIS_TLS=true` if needed.

## How to use the API

You will need to authenticate with Cognito to use the API.

1. You'll need a username and password to login.
2. Once established with a user, send a POST request to `/auth/login` endpoint with the following headers and body:

**Headers:**

```json
Content-Type: application/json
```

**Request Body:**

```json
{
    "usernameOrEmail": "your-username-or-email@example.com",
    "password": "your-password"
}
```

**Example using curl:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "your-username-or-email@example.com",
    "password": "your-password"
  }'
```

**Response:**

```json
{
    "accessToken": "eyJraWQiOiJ...",
    "refreshToken": "eyJjdHkiOiJ...",
    "idToken": "eyJraWQiOiJ..."
}
```

Use the `accessToken` from the response in the `Authorization` header for subsequent API requests:

```json
Authorization: Bearer <accessToken>
```

---

## How to use Swagger UI for testing

This is a quick guide on how to use Swagger to interact with the API endpoints for testing.

in dev mode, navigate to `localhost:3000/docs` to view the Swagger UI. If I get around to it, I may have a live api domain link, but for now, must use your local machine.

## Authentication

to use the API, you'll need to authenticate with Cognito.

1. Assuming you have a Cognito user pool set up, you can use the following credentials to login:

```json
{
    "usernameOrEmail":"your-username-string-or-email",
    "password":"whatever-your-password-is"
}
```

2. take the access token returned from the login request and add it to the `Authorization` header of your requests.

From here on, you can use the API endpoints as you would normally. There are 4 endpoints mainly for
testing:

## Airport Endpoints

### `GET /airports/:id`

Get airport details by ID.

**Parameters:**

- `id` (path parameter, required): Airport ID (integer, minimum: 1)

**Example:**

```http
GET /airports/123
```

**Response:** Returns airport object with id, airportName, city, country, iataFaa, icao, latitude, longitude, altitude, and timezone.

---

### `GET /airports/radius`

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

### `GET /airports/distance`

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

### `GET /airports/countries`

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

### `GET /airports/route`

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

> **Note:** If no route exists within the 500-mile leg distance constraint, a 404 error will be returned.

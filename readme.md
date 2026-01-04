# Airplane API
An API that returns airports within a given radius of a specific coordinate.

## Docs
To view the API documentation (Swagger UI), visit http://localhost:3000/docs

## Tech Stack 
These weren't all used given the scope, but at scale they could, they would be.

- Node.js (Typescript)
- Fastify
- AWS
  - ~~S3 (store CSV)~~
  - RDS (Postgresql & PostGIS)
  - ECS (containerize API, Fargate, helping to scale horizontally)
  - ElasticCache (Redis)
  - ~~CloudFront (CDN)~~
  - Cloudwatch (metrics, logs)
  - Cognito (Auth & User management)
- Docker
- Zod (validation)
- Swagger (API documentation)

## Installation
To get started, you'll need to install the dependencies:

```bash
npm install
```





# Airplan API
An API that returns airports within a given radius of a specific coordinate.

## Tech Stack
- Node.js (Typescript)
- Express
- AWS
  - S3 (store CSV)
  - RDS (Postgresql & PostGIS)
  - ECS (containerize API, Fargate, helping to scale horizontally)
  - ElasticCache (Redis)
  - CloudFront (CDN)
  - Cloudwatch?
- Docker
- Zod (validation)
- Swagger (API documentation)

## Installation
To get started, you'll need to install the following dependencies:

```bash
npm install
```


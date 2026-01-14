# TODOs

Mapped out TODOs prior to attempting implementation.
Will be working through the following steps in order (theoretically)

Quick completion Checklist:

- Auth
- Rate Limiting
- Logging
- Error Handling
- Validation
- Documentation
- Tests?

Prior - Phase 0: Setup

- [X] 0.1 - Create repo
- [X] 0.2 - Create .gitignore
- [X] 0.3 - Create .env.example
- [X] 0.4 - Create README
- [X] 0.5 - Setup AWS services
  - [ ] ECS + Fargate
  - [X] RDS
  - [X] CloudWatch
  - [ ] ~~CloudFront~~ (not needed, since we're not serving static files currently)
  - [ ] ~~S3~~ (not needed, migrated CSV in batches to RDS using terminal script already)
  - [X] ElastiCache
  - [X] Cognito
  - [X] Codebuild

## Phase 1: Foundation & Database

Why? getting a foundation set before doing anything else

- [X] 1.1 - Define environment configuration (env.ts with validation)
- [X] 1.2 - Install core dependencies (pg, postgis, zod, @fastify/swagger, etc.)
- [X] 1.3 - Design airport database schema (PostGIS geometry column, indexes)
- [X] 1.4 - connect db (Postgres/PostGIS client setup)
- [X] 1.5 - connect CSV to db (parse CSV → insert into Postgres with PostGIS)
- [X] 1.6 - Add spatial indexes (GIST index on geometry column for performance)
- [ ] ~~1.7 - Create verify-dataset script (validate data integrity after ingestion)~~ (decided not necessary)

## Phase 2: Core Logic

Why? For figuring out how to calculate distances, etc.

- [X] 2.1 - Haversine distance calculation (domain/geo/haversine.ts)
- [X] 2.2 - Unit conversion helpers (miles ↔ km)
- [X] 2.3 - BFS routing algorithm (domain/routing/bfs.ts - 500mi constraint)
- [X] 2.4 - path builder (domain/routing/path-builder.ts - leg distances)

## Phase 3: Repository & Service Layer

Why? Seperation of concerns with database queries

- [X] 3.1 - airport repository (PostGIS queries: radius, distance, lookup by country)
- [X] 3.2 - Create cache (Redis client setup and key management)
- [X] 3.3 - Airport service (handle repository + cache + business logic)
- [X] 3.4 - Route service (handle routing domain + repository)

## Phase 4: API Layer

Why? plugging things together.

- [X] 4.1 - Add request validation schemas (Zod schemas for all 5 endpoints)
- [X] 4.2 - Implement airport controller (handle all 5 endpoint requests)
- [X] 4.3 - Define API routes (Fastify route definitions with validation)
- [X] 4.35 - Refactor zod integration (using zod-to-json-schema for Fastify compatibility)
- [X] 4.4 - Add Swagger/OpenAPI documentation

## Phase 4.5: Authentication + Optimizations

Why? for security

- [X] 4.5 - Implement authentication (JWT)
- [X] 4.6 - Add authentication middleware (Cognito)
- [X] 4.65 - ensure user pool is configured correctly (Cognito)
- [X] 4.7 - plug in rate limiting middleware
- [ ] 4.8 - ~~CDN setup~~ (since we're not serving static files currently, not needed)
- [X] 4.9 - Fix whatever is wrong with Elasticache, crashing on startup (not necessary, but for the sake of it)
- [X] 4.10 - Containerize the API (Docker) and deploy to ECS
- [X] 4.11 - Complete Swagger UI examples
- [X] 4.12 - Fix airports/countries route crashing when requests sent.
- [X] 4.13 - Fix airports/routes route hang, algo issue, finishes, but takes way too long.
- [ ] ~~4.14 - swagger ui not in docker container (API works, just no ui), fix.~~ (will leave as is for now)

## Phase 5: Infra & Observability (optional)

Why? for monitoring, logging, etc.
Contemplating this one, time wise, might not make the cut, but will see.

- [X] 5.1 - Implement centralized error handling (Fastify error handler)
- [X] 5.2 - Add request logging middleware (with request IDs)
- [X] 5.3 - Add rate limiting middleware (protect against spikes)
- [X] 5.4 - Add metrics and monitoring hooks (request/DB/cache metrics)
- [ ] 5.5 - ~~Add request tracing setup~~

## Phase 6: Test & Documentation

Why? self explanatory

- [X] 6.1 - Document API endpoints (Swagger + README)
- [X] 6.2 - Verify performance (test 500 req/s capacity) - k6 load testing scripts created
- ~~[ ] 6.3 - General Testing (integration tests?)~~

## Phase 7: Delivery & Costs

- [X] 7.1 - Provide estimates on the scalability and monthly costs. Consider alternatives and tradeoffs.
- ~~[ ] 7.2 - Create a "full" potential Sys design, including E2E breakdown Client Layer, API Layer, Data Layer, Analytics, with cost analysis.~~ (overkill)
- [X] 7.3 - Clean up codebase, DRY up, remove unused code, yada yada.
- [ ] 7.4 - ~~add better docs for each setup step, maybe local dev too. (docker, redis, postgres)~~ (will leave as is for now)

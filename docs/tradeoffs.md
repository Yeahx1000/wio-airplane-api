## Tradeoffs
- Typescript vs JS - strongly typed language, forces to think about data validation during development
- Zod vs Yup - Typescript based API, better integration
- AWS vs other Cloud Providers - Costs more, but reliability at scale, for airport API’s, most trustworthy, services cover main needs under one roof
- Fastify vs Express or Nest - Newer and more experimental for now, quick for take-home needs, Nest may be better in production for organizational structure, but complicates with boilerplate for this scope
- Docker vs others - Commonly used, Stateless API, easy to scale horizontally using containers on ECS/Fargate
- Postgres/PostGIS vs other db types - allows for easier spatial queries, requires more setup and maintenance
- Swagger vs other API docs - Commonly used, easy to generate

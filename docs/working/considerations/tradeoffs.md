# Tradeoffs

Brain dump of tradeoffs for this project:

- **Typescript**, vs JS - strongly typed language, forces to think about data validation during development
- **Zod**, vs Yup - Typescript based API, better integration
- **AWS**, vs other Cloud Providers - Costs more, but reliability at scale, for airport API’s, most trustworthy, services cover main needs under one roof
- **Fastify**, vs Express or Nest - Newer and more experimental for now, quick for take-home needs, Nest may be better in production for organizational structure, but complicates with boilerplate for this scope
- **Docker**, vs others - Commonly used, Stateless API, easy to scale horizontally using containers on ECS/Fargate
- **Postgres/PostGIS**, vs other db types - allows for easier spatial queries, requires more setup and maintenance
- **Swagger**, vs other API docs - Commonly used, easy to generate
- interfaces vs type aliases - Initialized as Interfaces, will likely go back and change to types for more type safety, can avoid interface merging issues down the road.
- **Cognito**, vs custom auth or other providers - Keeping it in AWS ecosystem, 60%+ reduction in lines of code, easier to scale, secure, trustworthy.
- **BFS**, vs DFS - since looking for shortest path, BFS is more efficient.
- **K6**, vs autocannon or other testing tools - Well maintained K6 is good for realistic traffic sims vs speed optmizations or light performance testing like other tools, seemed more appropriate

## Estimates

a general range range of costs are about:

- **$500-800** for AWS, fairly reliable, more expensive, but more robust
- **$300-600** for GCP, cold start may come into play, possible learning curve for team if not familiar.
- **$200-500** for Digital Ocean, not as robust, but cheaper and does the job

can over-provision more resources on AWS resulting in about $1800 on the top end (lower on other providers) should spikes in traffic occur.

## Some thoughts

A downside of some of the tradeoffs made here is vender lock-in to AWS, which can also be more expensive than alternatives, but given the needs for reliability and scalability, it's a tradeoff worth making, in my opinion.

## Background

This repo is initialised with [Turborepo](https://turborepo.dev/) and yarn is set as the package manager.
Since the entire infra and code lives in local and this is a PoC, I have committed the .env files for quick setup.

## Pre-requisite

Have Docker and Node installed in your system

## Setup Backend

Step 1 : From the root dir of the repo, issue the following command to install npm packages from a terminal

```
yarn && docker-compose up -d
```

Step 2 : Navigate to `apps\api` and issue the below commands

```
yarn db:setup && yarn build && yarn start
```

This generates the prisma client, creates schema and pushes seed data
The backend api is now available at localhost:4000

## Setup Frontend

Step 3 : Navigate to `apps/web` and execute the below command

```
yarn build && yarn start
```

The frontend is now available at localhost:3000 and the setup is complete

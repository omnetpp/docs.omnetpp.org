---
layout: page
title: Step 1. prepare
tutorial: AWS
---

# Introduction

This tutorial will show you how to



## Docker Swarm

With version 1.12.0, Docker introduced **Swarm Mode**. It makes it possible to
connect multiple computers (called hosts or nodes) on a network, into a cluster - called swarm.

This new feature enables someting called "container orchestration". It makes the development, deployment,
and maintenance of distributed, multi-container applications easier. You can read
more about it [here](https://docs.docker.com/engine/swarm/).

One great advantage of this is that wherever a Docker Swarm is configured, any
application can be run, let it be on local machines, or any cloud computing platform.

# Deployment

Here we will only consider two of the many deployment options: On AWS (Amazon Web Services),
and on local computers you have access to.

## Deployment on AWS



## Deployment on Local Computers




### What you will need

- An AWS account
- AMI tokens
- SSH keypair
- python3, ssh client, docker (client), pip3
    - pip packages: aws, boto3


sudo apt install git python3-pip
pip3 install boto3


### Preparation

- create AMI app token
- aws configure


### Creating the swarm

Deploying the CloudFormation template cupplied by Docker, called Docker for AWS.



### Connecting to the swarm





# How it works

This is a distributed application, built on top of Docker Swarm[1]. It is composed of
7 different services.


[1] The new, integrated "Swarm Mode", not the legacy docker-swarm utility.

## Services

The application is made up of several Docker services. These are:

-  redis:
-  mongo:
-  builder:
-  runner:
-  visualizer:
-  dashboard:
-  distcc:

Let's discuss what each of them are there for, and what they do.

### Redis

This runs the official on the Manager. It is needed only to operate RQ,
and is not used directly at all.

### Mongo

### Builder

This is one of the two services running an RQ worker. It starts a single
container on the manager, and listens on the `build` queue for jobs.

It uses the distcc servers from the `distcc` service through the `buildnet`
network to distribute the compilation tasks across all nodes.

Once a build is done, it submits the results (concretely the libINET.so file) to the `Mongo` service,
so the runner containers can access it later.

### Runner

The other RQ worker, running as many containers in each host, as their respecrtive number
of cpu cores. Except the manager, because that needs some extra juice running the other services,
like redis and mongo. it is done by requesting a large number of containers (100), but reserving
95% of a core for each container, so they automatically "expand" to "fill" the available number
of (remaining) CPUs, like a liquid.

It gets the built libINET.so from the MongoDB server, and also submits the simulation results there.

### Visualizer

This service starts a single container on the manager, using
the official [docker-swarm-visualizer](https://github.com/dockersamples/docker-swarm-visualizer) image.
In that container, a web server runs that lets you quickly inspect
the state of the swarm, including its nodes, services and containers,
just using your web browser. It listens on port `8080`, so once
your swarm application is up and running (and you are connected to the swarm
if it is on AWS), you can check it out at [http://localhost:8080/].

[! insert screenshot here? ]

### Dashboard

Similarly to the `visualizer`, this is an auxiliary service, running a single
container on the manager, with a web server in it.
This one lets you see, and manage in a limited way, the RQ queues, workers, and jobs.
See: [http://localhost:9181/].

[! insert screenshot here? ]

### distcc

This service starts exactly one container on all nodes (workers and the manager alike).
They all run a distcc server, listening for incoming requests for compilation (completely
independent from RQ).
They are only attached to the `buildnet` network, and have deterministic IP addresses.

When the `builder` container starts a build in a `build` job, it will try
to connect to the `distcc` containers, and will use them to distribute
the compilation tasks to all nodes.

## Networks

The stack also contains two virtual networks. Each service is attached to
one or both of these networks. The networks are:

  - interlink
  - buildnet

Both of them use the `overlay` driver, meaning that these are entirely virtual
networks, not interfering with the underlying real one between the nodes.

### Interlink

This is the main network, all services except `distcc` are attached to it.

### Buildnet

The `buildnet` network connects the containers of the `distcc` service
with the `builder` service. It operates on a fixed subnet, The `builder`

This was only necessary to give the `distcc` containers deterministic and known
IP addresses. On `interlink` they didn't always get the same addresses, they
were randomly interleaved with the containers of all the other services.

This would not be necessary at all if multicast traffic worked on `overlay`
networks between nodes, because then we could just use the built-in zeroconf
service discovery capabilities of distcc (the software itself). However, until
[this issue](https://github.com/docker/libnetwork/issues/552) is resolved, we
have to resort to this solution.



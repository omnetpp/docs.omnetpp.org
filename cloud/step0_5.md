---
layout: page
title: Solution Architecture
---

We will create the following architecture for running simulations on AWS:

We want to use Docker images for easy deployment, so we will use an ECS cluster.
One container will run a Redis-based job queue, and others will be workers. The
workers will need to run simulations, so their image will have OMNeT++ installed
in addition to the RQ worker client. After the worker completes a simulation
run, the results will be stored in the Redis database.

We will provide a custom tool that submits jobs to the job queue from the user's
computer and downloads the results after simulation completion.

The final architecture will look like this:

![Architectural Graph](/images/architecture.svg)

In the following sections, we will show how to implement this architecture.
We will discuss how to create the Docker images, how to configure the cluster,
how to implement the worker and the end-user client and so on.

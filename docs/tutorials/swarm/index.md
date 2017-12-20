previous_page_disabled: true


## Introduction


This tutorial will show you how to accelerate INET simulation campaigns by
distributing the individual runs to several machines on AWS.

It will work with any INET fork (but not yet with other, independent projects),
so you can run your own code as well, not just the built-in examples.

We provide a client utility as a replacement of `opp_runall`.

It can speed up your simulation campaigns significantly.
It will have the best results if the campaign consists of many runs,
and each of them takes more than a couple seconds.


## Background

This is a Docker Swarm application, consisting of several services, using a couple
of "official" images, and three custom ones.

Additionally, a Python script is available to make the management of the Swarm on AWS
easier.

### Docker Swarm


With version 1.12.0, Docker introduced **Swarm Mode**. It makes it possible to
connect multiple computers (called hosts or nodes) on a network, into a cluster - called swarm.

This new feature enables someting called "container orchestration". It makes the development, deployment,
and maintenance of distributed, multi-container applications easier. You can read
more about it [here](https://docs.docker.com/engine/swarm/).

One great advantage of this is that wherever a Docker Swarm is configured, any
application can be run, let it be on local machines, or any cloud computing platform.

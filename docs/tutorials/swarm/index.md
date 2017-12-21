previous_page_disabled: true

## Introduction


This tutorial will show you how to run INET simulation campaigns on the AWS (Amazon Web Services,
a cloud computing service). The solution given here works with INET, and any INET fork published on GitHub.
It does not work with other, independent projects yet; work is underway to make the tool generic
enought to run any simulation. (The project needs to be published on GitHub, because the tool
retrieves the source code of the simulation model to the cloud nodes by checking it out from GitHub.)

You can out this solution for free, because AWS Free Tier is quite sufficient for running smaller 
simulation campaigns. For serious simulations, AWS usage is very affordable. (We are not affiliated
with Amazon.)

Running the simulation on a cloud service incurs some overhead (checking out the git repo of the
simulation, building it, distributing the binaries to all processors, and finally downloading
the results to your own computer), so your simulation campaign needs to be large enough to
benefit from cloud computing: it needs to consist of several simulation runs, and each 
run should be longer than at least a couple seconds.


## Background

This solution utilizes Docker Swarm, and a couple of other services and technologies.
In addition to scripts that manage the tasks closely associated with running simulations
remotely, we also provide a command-line tool make the management of the Swarm on AWS
easier.


### What is Docker Swarm?


With version 1.12.0, Docker introduced *Swarm Mode*. It makes it possible to
connect multiple computers (called hosts or nodes) on a network, into a cluster - called swarm.

This new feature enables someting called "container orchestration". It makes the development, deployment,
and maintenance of distributed, multi-container applications easier. You can read
more about it [here](https://docs.docker.com/engine/swarm/).

One great advantage of this is that wherever a Docker Swarm is configured, any
application can be run, let it be on local machines, or any cloud computing platform.

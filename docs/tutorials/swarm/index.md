previous_page_disabled: true

## Introduction


This tutorial will show you how to run INET simulation campaigns on the AWS (Amazon Web Services,
a cloud computing service). The solution given here works with INET, and any INET fork published on GitHub.
It does not work with other, independent projects yet; work is underway to make the tool generic
enough to run any simulation. (The simulation project needs to be published on GitHub, because the tool
retrieves the source code of the simulation model to the cloud nodes by checking it out from GitHub.)

Free Tier?

For serious simulations, AWS usage is very affordable. (We are not affiliated
with Amazon.)

Running the simulation on a cloud service incurs some overhead (retrieving the source of the
simulation on cloud nodes, building it, distributing the binaries to all processors, and finally downloading
the results to your own computer), so your simulation campaign needs to be large enough to
benefit from cloud computing: it needs to consist of several simulation runs, and each
run should be longer than at least a couple seconds.

This solution utilizes Docker Swarm, and a couple of other services and technologies.
In addition to scripts that manage the tasks closely associated with running simulations
remotely, we also provide a command-line tool to make the management of the Swarm on AWS
easier.


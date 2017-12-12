previous_page_disabled: true
next_page_disabled: true


## Introduction

This tutorial will show you how to accelerate INET simulation campaigns by
distributing the individual runs to several machines - either locally, or on AWS -,
using the new INET Swarm application.

It will work with any INET fork (but not with other, independent projects yet),
so you can run your own code as well, not just the built-in examples.

We provide a client utility as a replacement of `opp_runall`.

This is a Docker Swarm application, consisting of several services, using a couple
of "official" images, and three custom ones.

Additionally, a Python script is also available to make the management of the Swarm on AWS
easier.


### Docker Swarm


With version 1.12.0, Docker introduced **Swarm Mode**. It makes it possible to
connect multiple computers (called hosts or nodes) on a network, into a cluster - called swarm.

This new feature enables someting called "container orchestration". It makes the development, deployment,
and maintenance of distributed, multi-container applications easier. You can read
more about it [here](https://docs.docker.com/engine/swarm/).

One great advantage of this is that wherever a Docker Swarm is configured, any
application can be run, let it be on local machines, or any cloud computing platform.


## Deployment

In this section we consider two of the many deployment options: On AWS (Amazon Web Services),
and on local computers you have access to.


### Deployment on AWS


We will need:

- AWS Account
- AMI access key
- SSH keypair
- Software: python3, ssh client, docker (client), pip3
  - pip packages: awscli, boto3

sudo apt install git python3-pip
pip3 install boto3


#### Creating an AWS Account

To access any web service AWS offers, you must first create an AWS account at http://aws.amazon.com. An AWS account is simply an Amazon.com account that is enabled to use AWS products; you can use an existing Amazon.com account login and password when creating the AWS account. ([source](http://docs.aws.amazon.com/AmazonSimpleDB/latest/DeveloperGuide/AboutAWSAccounts.html))

If you already have one, just log in to the [AWS Management Console](console.aws.amazon.com) with it, and ignore the rest of this section.

Otherwise, follow the instructions here: [AWS registration](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html)

#### Creating the Access Policy

On the AWS Management Console, navigate to the IAM Service configuration page, and switch to **Policies**. Or just
click [this link](https://console.aws.amazon.com/iam/home#/policies), it will take you there.

Click the **Create policy** button. Switch over to the **JSON** tab. Paste the contents of [this file](docker-for-aws-policy.json) into the entry field.

This policy is the superset of the officially published one on the [Docker for AWS website](https://docs.docker.com/docker-for-aws/iam-permissions/). It had to be slightly altered to make it fit into the default size limit. This way it doesn't strictly adhere to the "principle of least privilege", because it grants full access to some services (namely: AutoScaling, CloudFormation, ElasticFileSystem, and ElasticLoadBalancing), but most of the permissions in those services were already granted one-by-one, so it isn't so bad.

Click **Review policy**. Enter a **Name** for the new policy, for example "inet-docker-swarm-policy", then click **Create policy**

#### Creating the User

Switch over to [**Users**](https://console.aws.amazon.com/iam/home#/users) and click **Add user**.

Enter a **User name**, for example "inet-swarm-cli", and tick the checkbox next to **Programmatic access**. Leave the other checkbox unchecked. Click **Next: Permissions**. Select **Attach existing policies directly**, search for the name of the policy we just created *(by typing in a part of it, like "inet")*, then check the checkboy next to it, and click **Next: Review** at the bottom. If everything looks alright, click **Create user**.

As the final step of user creation, save the **Access key ID** and the **Secret access key**, somewhere safe. It's a good idea that you do this by clicking **Download .csv**. This will let you download this information into a simple text file, so you won't make any mistakes while copy-pasting them.

Also, read the notice in the green area, particularly this part: "This is the last time these credentials will be available to download. However, you can create new credentials at any time.". This means that if you don't save the key ID and the secret key now, you will have to delete this user and create a new one.

**Important!** Keep these strings private, since these grant access to your account, without the need for your password or other credentials *(of course, only until you delete this user, or revoke its permissions)*. Treat them with similar caution as you do your passwords.

#### Configuring CLI Access

To let our computer manage and use our AWS account, we have to configure it with the credentials of the user we just created for it.
First we need to install the AWS CLI utility using `pip`:

`$ pip3 install --upgrade awscli`

Then start the configuration:

`$ aws configure`

*(If at first you get `aws: command not found`, or `The program 'aws' is currently not installed. ...`, try running `~/.local/bin/aws configure` instead.)*

When asked, enter the Access Key ID, then the Secret Access Key. These will be recorded into an INI file, which is by default at `~/.aws/credentials`.

For default region, choose the one closest to you geographically. You can find the list of region codes and their locations [here](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html#concepts-available-regions).
In my case the Frankfurt datacenter was closest, so I entered `eu-central-1`. This setting is recorded in the `~/.aws/config` file.

You can leave Default output format empty.

**Note:** Once all this information is entered correctly, any software you run on your computer has access to your AWS account, as permitted by the policy attached to the configured user. Remove (rename) the `credentials` file mentioned above to (temporarily) disable access. The proper way to completely and permanently revoke this access is to delete the IAM User we just created.

From this point on in this tutorial, we won't need the AWS Management Console to initiate any actions. However, if you wish, you can use it to observe and check for yourself what the `aws_swarm_tool.py` script does.

----

More info about Regions and Availability Zones:

- https://docs.aws.amazon.com/general/latest/gr/rande.html
- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html
- https://aws.amazon.com/about-aws/global-infrastructure/

#### Creating an SSH KeyPair

To be able to connect to the Swarm we are about to create, we must first create and SSH keypair.
The `aws_swarm_tool.py` can do this for us.


#### Creating the Swarm

aws_swarm_tool.py

Deploying the official CloudFormation template supplied by Docker, called Docker for AWS.

Using the default settings, the script creates 1 manager and 3 workers, each of them as a `c4.4xlarge` type Instance.

It also creates an alarm and an AutoScaling policy that makes sure that all machines are shut down after 1 hour of inactivity (precisely, if the maximum CPU utilization of the manager machine was below 10 percent for 4 consecutive 15 minute periods).
This is to reduce the chances that they are forgotten about, and left running indefinitely, generating unexpected expenditure.


#### Connecting to the Swarm

Connecting to the Swarm is essentially opening an SSH connection to the manager machine, and forwarding
a handful of ports through that tunnel from the local machine to the swarm.
There is no need to do it manually, the `aws_swarm_tool.py` script has a command for it:

`$ aws_swarm_tool.py connect`

In addition to bringing up the SSH connection, the script also saves the process ID (PID) of the SSH client process into a file (so called PID-file) in a temporary directory (most likely `/tmp`), called


### Deployment on Local Computers


## How it works

This is a distributed application, built on top of Docker Swarm[1]. It is composed of
7 different services.


[1] The new, integrated "Swarm Mode", not the legacy docker-swarm utility.


### Services


The application is made up of several Docker services. These are:

-  redis:
-  mongo:
-  builder:
-  runner:
-  visualizer:
-  dashboard:
-  distcc:

Let's discuss what each of them are there for, and what they do.

#### Redis

This runs the official on the Manager. It is needed only to operate RQ,
and is not used directly at all.

#### Mongo

#### Builder

This is one of the two services running an RQ worker. It starts a single
container on the manager, and listens on the `build` queue for jobs.

It uses the distcc servers from the `distcc` service through the `buildnet`
network to distribute the compilation tasks across all nodes.

Once a build is done, it submits the results (concretely the libINET.so file) to the `Mongo` service,
so the runner containers can access it later.

#### Runner

The other RQ worker, running as many containers in each host, as their respecrtive number
of cpu cores. Except the manager, because that needs some extra juice running the other services,
like redis and mongo. it is done by requesting a large number of containers (100), but reserving
95% of a core for each container, so they automatically "expand" to "fill" the available number
of (remaining) CPUs, like a liquid.

It gets the built libINET.so from the MongoDB server, and also submits the simulation results there.

#### Visualizer

This service starts a single container on the manager, using
the official [docker-swarm-visualizer](https://github.com/dockersamples/docker-swarm-visualizer) image.
In that container, a web server runs that lets you quickly inspect
the state of the swarm, including its nodes, services and containers,
just using your web browser. It listens on port `8080`, so once
your swarm application is up and running (and you are connected to the swarm
if it is on AWS), you can check it out at [http://localhost:8080/].

[! insert screenshot here? ]

#### Dashboard

Similarly to the `visualizer`, this is an auxiliary service, running a single
container on the manager, with a web server in it.
This one lets you see, and manage in a limited way, the RQ queues, workers, and jobs.
See: [http://localhost:9181/].

[! insert screenshot here? ]

#### distcc

This service starts exactly one container on all nodes (workers and the manager alike).
They all run a distcc server, listening for incoming requests for compilation (completely
independent from RQ).
They are only attached to the `buildnet` network, and have deterministic IP addresses.

When the `builder` container starts a build in a `build` job, it will try
to connect to the `distcc` containers, and will use them to distribute
the compilation tasks to all nodes.

### Networks

The stack also contains two virtual networks. Each service is attached to
one or both of these networks. The networks are:

  - interlink
  - buildnet

Both of them use the `overlay` driver, meaning that these are entirely virtual
networks, not interfering with the underlying real one between the nodes.

#### Interlink

This is the main network, all services except `distcc` are attached to it.

#### Buildnet

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



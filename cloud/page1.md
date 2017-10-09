---
layout: page
tutorial: Cloud
title: Concepts
generateToC: true
navbarIcon: cloud/images/opp_docker.png
---


## Computing Clouds


A computing cloud contains a large collection of multi-core computing nodes,
with a large amount of memory and storage. Nodes are connected with a high-speed
internal network and are attached to the internet also with a high-bandwidth
link. Users do not run their programs directly on the operating system of the
nodes, but rather over some virtualization technology (Xen, KVM, VMWare).
Virtualization isolates cloud users from each other, providing a confined
environment to them, where they can't do any harm to others or the cloud. It
also allows the cloud operator to freeze and resume the user's programs,
transparently migrate them to other nodes, and control their access to resources
like memory and CPU. This way the cloud operator can effectively treat the
computing cluster as a resource pool. This kind of resource sharing is what
allows the cloud services to be provided at a low cost.

Some properties of computing clouds:

 - on-demand or reserved allocation
 - billing based on metered usage
 - different configurations are available (CPU speed, memory size, storage type, network speed)
 - guest OS is typically Linux
 - SSH access is available
 - specialized higher level services are often also offered (machine learning, data mining, 3D rendering, etc.)

There are numerous cloud computing services; in this tutorial we will use AWS
which even offers a free trial period of one year.


## Docker


### About Docker

Docker is probably the most popular software container platform nowadays. A
container is similar in purpose to virtual machines and emulators, but is
much more lightweight. The overhead of running a container is much closer
to running an ordinary operating system process.
In fact, a Docker container is indeed an OS process, isolated from all other
processes in a variety of ways -- a different root file system, network stack,
resource limit group, etc. Linux kernel features that make Docker possible
include chroot, kernel namespaces, and control groups a.k.a. cgroups.

A Docker image is extremely portable: it can be run without changes on a
variety of systems, including any Linux distribution, macOS, Windows, and many
others. It is partly due to this portability that Docker images are extremely
convenient to use as a way for packaging up for applications for running
in the cloud.

A Docker image contains a file system to be mounted as root for the process,
additional settings and metadata such as environment variables to be set, and
an entry point (the program to be started on container launch.) Images
may be are based on each other like layers. Many standard and user-created
images are easily accessible from registries like Docker Hub.

A container is a running instance of an image, similar to how a process is a
running instance of a program. Containers interact with each other and the
outside world most commonly through a network connection, a terminal emulator,
or sometimes via directories mounted into their file systems as volumes.

### Running Containers

If you have Docker installed, you can try it out right away by typing the
following commands into a terminal:

```terminal
$ docker run -ti hello-world
```

`hello-world` is the name of a Docker image. Docker will first check if the
`hello-world` image is already available on your machine. If not, it will fetch
it from Docker Hub first. Then it starts the image as a container. The process
in the container will simply print a message, then terminate.

A bit more useful one is the `ubuntu` image, which packages the latest Ubuntu
LTS version without the graphical parts:

```terminal
$ docker run -ti ubuntu
```

After the image is downloaded and started, you will be presented with an Ubuntu
*bash* prompt, and you can start issuing commands in the isolation of the
container. It is important to note that running the `ubuntu` image does *not*
involve booting up a complete Linux system inside the container with its own
`init` process and all. Instead, only a plain `bash` process is started,
which will have the illusion (via the *chroot*'ed file system, kernel namespaces
and other mechanisms) that it is running on a separate Ubuntu system. The `-ti`
flag in the above command tells Docker to attach the container to the current
terminal, so we can interact with the *bash* shell.


### About Docker Hub

Docker Hub is an online service operated by Docker Inc. It is a registry and
storage space for Docker images. It can be used for free for accessing and
uploading public images.

To be able to submit you own image to Docker Hub, you need to create an account,
called Docker ID. For this, an e-mail address, a user name, and a password has
to be provided, just like with any other online account registration.

Images are identified by a hexadecimal ID (hash), and can have a name (or
several names) as well. There are three kinds of image names you will see:
  - `ubuntu`: If it is a single word, then it refers to an "official" image on Docker Hub.
  - `joe/foobar`: This is an image submitted by a user on to Docker Hub.
  - `repo1.company.com/foobar`: This is an image in a third-party repository.

Some image names end with a version like `:2.42`, or typically `:latest`.

*Note:  Docker Hub is now part of Docker Cloud, which offers Swarm management
service as well, but we use the old name here to reduce confusion with the
general term "cloud".*

### Creating Docker Images

The primary way of creating Docker images is using a Dockerfile.

A Dockerfile is a kind of a recipe. It's a line-oriented text file where each
line starts with an instruction, followed by arguments. Lines starting with a
hashmark (`#`) are comments, and a backslash (`\`) at the end of a line means
that the instruction is continued on the next line.

When building an image, Docker executes instructions sequentially, creating a
new image layer after each one. This way, subsequent builds can be incremental.
The image layer after the last instruction is the final image output.

Each Dockerfile must start with the `FROM` instruction, which determines the
base image we are starting from.

An example Dockerfile looks like this:

<pre><code data-language="Dockerfile"># starting with Ubuntu 16.04 as base image
FROM ubuntu:16.04

## update the package cache, and install a C compiler
RUN apt-get update -y && apt-get install build-essential -y

## set an environment variable
ENV LANG C.UTF-8

## copy a file into the image
COPY main.c /opt/

## change the working directory, for build- and runtime as well
WORKDIR /opt/
## compile the copied source file
RUN gcc main.c -o program

## set the newly built program to start in the containers created from this image
ENTRYPOINT ./program</code></pre>

The build process takes place within a build context. This is usually a
directory on the host machine, but it can be a URL as well. The context is where
the `main.c` file is taken from in the above example.

To build this image, save the example into a file named `Dockerfile` into an
empty directory, and a C program of your choice (a "Hello World" will be fine)
next to it, named `main.c`.

Then issue the following command:

```terminal
$ docker build . -t myimage
```

Here the `.` is the build context, the `Dockerfile` will be picked up by its
name, as this is the default, and the `-t myimage` will add the `myimage` tag
(an alternative name) to the image we are building.

You will see all the instructions being executed. Once it finishes, you can run
the new image with:

```terminal
$ docker run -ti myimage
```

To push this image to Docker Hub so it can be reused by anyone, first
log in to docker with you Docker ID:

```terminal
$ docker login
```

Then add another tag to this image, substituting `joe` with your Docker ID:

```terminal
$ docker tag myimage joe/myimage
```

And finally start the upload:

```terminal
$ docker push joe/myimage
```

Now anyone anywhere can run the C program in this image by typing `docker run
-ti joe/myimage`.

And logging in to Docker Hub on the web interface, you will also see a new
repository for this image has appeared in your account.

### Alternatives

Docker also offers a build service called Docker Cloud, where a Dockerfile
hosted in a source repository on GitHub or BitBucket is built on their servers
automatically after each commit in the repository.

A alternative way for creating images is constructing the desired result by
issuing commands manually inside a running container, then saving the final
state into an image using `docker commit`. This is not recommended, as the
resulting image is a lot less reproducible.


## AWS Services


AWS (Amazon Web Services) offers many services, the following two are important
for us: EC2 and ECS.

### EC2 (Elastic Compute Cloud)

EC2 is a classic cloud service, where one can run virtual machines (called
Instances) typically with a Linux installation, and access them via SSH.  They
can also be set up to accept connections from the Internet. They come in a
variety of configurations (Instance Types), each offering different
capabilities, like the number of CPU cores and available RAM size. One of them
is `t2.micro`, which is the only one eligible for use in the free trial. It is
among the smaller ones, but it is still perfectly suitable for our purposes.
Instances can reach each other on internal virtual networks.

### ECS (EC2 Container Service)

ECS is a service that is offered on top of EC2, and allows us to run Docker
containers on EC2 instances easily. The Docker images it runs can come from
Docker Hub, from repositories hosted in AWS (ECR), or from anywhere else. The
EC2 Instances used to run the containers are managed automatically by ECS.

### ECS Terminology

AWS services, including EC2 and ECS, can be configured using command-line tools
(AWS CLI), or a more comfortable web interface (AWS Management Console). We will
only use the latter in this tutorial, as it requires less setup.

On ECS, the managed EC2 Instances are grouped in Clusters. The number of
instances can be easily scaled just by adjusting a parameter of the Cluster.
There are ways to automate this based on system load using Auto Scaling Groups,
but we won't do this to keep things simple.

ECS Clusters run Tasks. Each Task consists of one or more Containers (Docker
containers). Tasks are launched from Task Definitions, which describe which
images will be used, what storage volumes will be attached, which network ports
need to be exposed to the network, and so forth.

Tasks can be launched and stopped manually, or by using Services. The job of a
Service is to start and manage a given number of Tasks. The properties of a
Service include: a Task Definition from which it will start its Tasks, the
number of Tasks it should keep running, and a placement rule describing how the
containers in the Tasks will be assigned to EC2 machines. Again, the number of
Tasks in a Service can be scaled easily just by adjusting a parameter. The
number of Tasks in a Service can also be set up to scale automatically based on
load, but we won't use this feature.


## Job Queues


An OMNeT++ simulation campaign typically consists of more runs than we have CPUs
available, so we will need a kind of job queue. Job queues are widely used in
applications where a large number of tasks need to be performed, using a bounded
number of workers. A job queue automates the starting of jobs on workers and
monitors their completions, thereby ensuring the optimal utilization of
computing resources.

### General Operation

Jobs are submitted to the queue by some producer, where they are stored together
with their parameters. The queue can be a simple FIFO, where jobs are executed
on a first-come, first-served basis, or they can be prioritized in a variety of
ways.

There are one or more workers connected to the job queue to perform the jobs.
Workers sit in a loop, and wait for new jobs. When a job becomes available, they
pop it off the queue and process it in the way appropriate for the job. Once it
is done, the result will either be put back into a different queue for further
processing, or simply stored somewhere. Then the worker starts the next job,
until there are no more pending jobs left.

### RQ

In this tutorial, we're going use the [RQ](http://python-rq.org/) library to
implement our job queue. We chose it because of its lightweightness and emphasis
on simplicity and ease of use.

RQ is backed by Redis, a high-performance in-memory key-value store. This means
that we will need to start a Redis server to operate the job queue, and have the
workers connect to it.

In RQ, each job is an invocation of an ordinary Python function. The parameters
of the job are the function's arguments, and the result is its return value. The
code itself is not passed through the queue, so the job function must be present
on the worker nodes.

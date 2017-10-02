---
layout: page
title: AWS Services
---

AWS (Amazon Web Services) offers many services, the following two are important
for us: EC2 and ECS.

## EC2 (Elastic Compute Cloud)

EC2 is a classic cloud service, where one can run virtual machines (called
Instances) typically with a Linux installation, and access them via SSH.  They
can also be set up to accept connections from the Internet. They come in a
variety of configurations (Instance Types), each offering different
capabilities, like the number of CPU cores and available RAM size. One of them
is `t2.micro`, which is the only one eligible for use in the free trial. It is
among the smaller ones, but it is still perfectly suitable for our purposes.
Instances can reach each other on internal virtual networks.

## ECS (EC2 Container Service)

ECS is a service that is offered on top of EC2, and allows us to run Docker
containers on EC2 instances easily. The Docker images it runs can come from
Docker Hub, from repositories hosted in AWS (ECR), or from anywhere else. The
EC2 Instances used to run the containers are managed automatically by ECS.

## ECS Terminology

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

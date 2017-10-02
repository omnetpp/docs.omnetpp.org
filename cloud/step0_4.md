---
layout: page
title: Job Queues
---

An OMNeT++ simulation campaign typically consists of more runs than we have CPUs
available, so we will need a kind of job queue. Job queues are widely used in
applications where a large number of tasks need to be performed, using a bounded
number of workers. A job queue automates the starting of jobs on workers and
monitors their completions, thereby ensuring the optimal utilization of
computing resources.

## General Operation

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

## RQ

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

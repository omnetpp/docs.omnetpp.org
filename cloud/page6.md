---
layout: page
tutorial: Cloud
title: Examining the Code
generateToC: true
navbarIcon: cloud/images/opp_docker.png
---


This page describes in detail the contents of each used code file.


## Utilities


There are a few things that both the workers and the client need. These are
factored out into a common module, `utils.py`. You can download the entire file
from <a href="code/utils.py">here</a>.

In the first half of it, there are the imports it will use, and a `QuietBytes`
helper class. We use this in place of its superclass, the built-in `bytes` type.
It only changes the string representation of the base type, to make it shorter
than the actual contents. There is a technical reason for using this: It reduces
the amount of data transferred to, and stored in, the Redis database.

<p><pre class="snippet" until="def unzip_bytes" src="code/utils.py"></pre></p>

There are also two functions in it to handle ZIP archives in memory. The first
is for extracting, and the second is for compressing, with the option to exclude
some directories.

<p><pre class="snippet" from="def unzip_bytes" src="code/utils.py"></pre></p>


## Worker code


And the code for the jobs, <a href="code/worker.py">worker.py</a>:

<p><pre class="snippet" src="code/opp_worker.py" until="def run_simulation"></pre></p>

With the actual job function:

<p><pre class="snippet" src="code/opp_worker.py" from="def run_simulation"></pre></p>

The comments make its operation pretty straightforward.

The model needs to be cleaned, then rebuilt inside the container, because the
version of some basic system libraries might not match that of those present on
the host system, which would lead to incompatibility problems, possibly
preventing the simulation from starting.


## Dockerfile


We select the base image to be `ubuntu:16.04`, then we install Python, pip, the
dependencies of OMNeT++, and wget.

<p><pre class="snippet" src="code/Dockerfile" until="RUN pip3 install"></pre></p>

We upgrade pip using itself, then install RQ with it. It will also install the
Redis client module as a dependency. Then a few environment variables need to be
set, to make RQ use the right character encoding.

<p><pre class="snippet" src="code/Dockerfile" from="RUN pip3 install" until="COPY"></pre></p>

Next, we copy the worker source code into the image, and set the working directory.

<p><pre class="snippet" src="code/Dockerfile" from="COPY" until="RUN wget"></pre></p>

Downloading the OMNeT++ 5.1.1 Core release archive from the official website,
extracting it, then deleting it. The referer URL has to be passed to `wget`,
otherwise the server denies access. The `--progress` flag is there just to
reduce the amount of textual output, which would overly pollute the build log.

<p><pre class="snippet" src="code/Dockerfile" from="RUN wget" until="ENV PATH"></pre></p>

The `bin` directory added to the `PATH` environment variable (which would be
done by `setenv` normally). Finally the standard building procedure is performed
by running `./configure` and `make`. Both graphical runtime environments and the
support for 3D rendering are disabled. The `-j $(nproc)` arguments to `make`
enable it to use all your local CPU cores when building OMNeT++ itself.

<p><pre class="snippet" src="code/Dockerfile" from="ENV PATH" until="speed up recompiling"></pre></p>

Installing `ccache` to make subsequent builds of the same model sources faster:
<p><pre class="snippet" src="code/Dockerfile" from="speed up recompiling" until="ENTRYPOINT"></pre></p>

And finally setting up the entry point to launch the rq worker, asking it to
keep the results only for one minute. This will be enough, because the client
will start downloading them right away, and it will reduce the amount of data
stored in the Redis database on average.

<p><pre class="snippet" src="code/Dockerfile" from="ENTRYPOINT"></pre></p>

Later, when we run containers from the image, we will be able to append
additional arguments to the entrypoint.


## Client Software


The following file, <a href="code/client.py">client.py</a>, implements the
command-line application for submitting jobs and getting the results.

First, the usual imports:
<p><pre class="snippet" src="code/client.py" until="def get_runs_from_filter"></pre></p>

Then a helper function to resolve the run filter in a given configuration by
invoking the `opp_run` tool locally, in "query" mode. This is not strictly
necessary, since using a run filter is optional, but it's a nice addition.

<p><pre class="snippet" src="code/client.py" from="def get_runs_from_filter" until="parser = argparse"></pre></p>

Defining the arguments of the tool and parsing their values:
<p><pre class="snippet" src="code/client.py" from="parser = argparse" until="Connecting to Redis at"></pre></p>

Setting up the connection to the job queue, then using the helper function to
get the actual list of run numbers. Finally pack the model source into a
compressed archive (ZIP) in memory. A few directories are excluded from this
archive, because they are not needed by the workers, and are usually very large.

<p><pre class="snippet" src="code/client.py" from="Connecting to Redis at" until="jobs = "></pre></p>

Submitting a job into the queue for each run, storing the jobs in a list.
The run number is also written into the `meta` field of each job, but that is
necessary only so we know later which run was performed by a particular job, and
we can print it when it is done. The job function itself doesn't use this, only
its parameters.

<p><pre class="snippet" src="code/client.py" from="jobs = " until="Waiting for results"></pre></p>

And finally poll for the results of each job, downloading and unpacking the
output (the results) of completed jobs, and removing them from the list:

<p><pre class="snippet" src="code/client.py" from="Waiting for results"></pre></p>

And exit when all jobs are completed.

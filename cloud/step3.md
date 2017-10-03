---
layout: page
title: Building the Docker Image
---

In this page we will show how to build the Docker image for the worker.

## Building

First we go through the `Dockerfile` used for the image. You can download it
from <a href="code/Dockerfile">here</a>.

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

Building the image is done by issuing the following command in the directory
where the above files can be found:

```terminal
$ docker build . -t worker
```

The `Dockerfile` is picked up automatically, the build context is the current
directory (`.`), and the resulting image will be named `worker`.

This will likely take a few minutes to complete. If you see a couple of warnings
written in red, but the process continues, don't worry, this is expected.

## Publishing

Now that we built our image for the worker nodes, we need to make it available
for our AWS Instances by uploading it to Docker Hub.

First authenticate yourself (in case you haven't already) by typing in your
Docker ID and password after running this command:

```terminal
$ docker login
```

Now tag the image "into your repo", substituting your user name (Docker ID), so
Docker knows where to push the image:

```terminal
$ docker tag worker username/worker
```

And finally issue the actual push:

```terminal
$ docker push username/worker
```

This will upload about 400-500 MB of data, so it can take a while. Once it's
done, your image is available worldwide. You can see it appeared on [Docker
Hub](https://hub.docker.com/). You may even get email notification if it was
successful.

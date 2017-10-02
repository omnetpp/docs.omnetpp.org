---
layout: page
title: Writing the Worker
---

This page describes the code for the simulation jobs, running on the workers.

## Utilities

There are a few things that both the workers and the client need. These are
factored out into a common module, `utils.py`. You can download the entire file
from <a href="../code/utils.py">here</a>.

In the first half of it, there are the imports it will use, and a `QuietBytes`
helper class. We use this in place of its superclass, the built-in `bytes` type.
It only changes the string representation of the base type, to make it shorter
than the actual contents. There is a technical reason for using this: It reduces
the amount of data transferred to, and stored in, the Redis database.

<p><pre class="snippet" until="def unzip_bytes" src="../code/utils.py"></pre></p>

There are also two functions in it to handle ZIP archives in memory. The first
is for extracting, and the second is for compressing, with the option to exclude
some directories.

<p><pre class="snippet" from="def unzip_bytes" src="../code/utils.py"></pre></p>

## Worker code

And the code for the jobs, <a href="../code/worker.py">worker.py</a>:

<p><pre class="snippet" src="../code/opp_worker.py" until="def run_simulation"></pre></p>

With the actual job function:

<p><pre class="snippet" src="../code/opp_worker.py" from="def run_simulation"></pre></p>

The comments make its operation pretty straightforward.

The model needs to be cleaned, then rebuilt inside the container, because the
version of some basic system libraries might not match that of those present on
the host system, which would lead to incompatibility problems, possibly
preventing the simulation from starting.

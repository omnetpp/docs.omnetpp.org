---
layout: page
title: Client Software
---

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
